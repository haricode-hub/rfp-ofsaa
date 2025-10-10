"""
Health Check Module for RFP OFSAA
Implements liveness, readiness, and startup probes
"""

import time
import psutil
from typing import Dict, Any
from datetime import datetime
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Create router for health check endpoints
router = APIRouter(tags=["Health"])

# Application start time
START_TIME = time.time()


class HealthStatus(BaseModel):
    """Health check response model"""
    status: str
    timestamp: str
    uptime: float
    version: str = "1.0.0"


class DetailedHealthStatus(BaseModel):
    """Detailed health check response"""
    status: str
    timestamp: str
    uptime: float
    version: str
    system: Dict[str, Any]
    dependencies: Dict[str, Any]


def get_uptime() -> float:
    """Calculate application uptime in seconds"""
    return round(time.time() - START_TIME, 2)


def get_system_info() -> Dict[str, Any]:
    """Get system resource information"""
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        return {
            "cpu": {
                "usage_percent": round(cpu_percent, 2),
                "count": psutil.cpu_count()
            },
            "memory": {
                "total": memory.total,
                "available": memory.available,
                "used": memory.used,
                "percent": round(memory.percent, 2)
            },
            "disk": {
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": round(disk.percent, 2)
            }
        }
    except Exception as e:
        return {"error": str(e)}


async def check_redis_health() -> Dict[str, Any]:
    """Check Redis connection health"""
    try:
        # Import here to avoid circular dependency
        from config import settings
        import redis

        if not settings.redis_url:
            return {"status": "disabled", "message": "Redis not configured"}

        r = redis.from_url(settings.redis_url, socket_connect_timeout=2)
        r.ping()
        return {"status": "healthy", "latency_ms": 0}

    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


async def check_database_health() -> Dict[str, Any]:
    """Check database connection health"""
    try:
        from config import settings

        if not settings.database_url:
            return {"status": "disabled", "message": "Database not configured"}

        # TODO: Add actual database connection check when DB is implemented
        return {"status": "not_implemented"}

    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


async def check_ai_service_health() -> Dict[str, Any]:
    """Check AI service availability"""
    try:
        from config import settings

        # Check if API keys are configured
        if not settings.openai_api_key or not settings.openrouter_api_key:
            return {"status": "unhealthy", "error": "API keys not configured"}

        return {"status": "healthy", "message": "API keys configured"}

    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


@router.get(
    "/health",
    response_model=HealthStatus,
    summary="Basic Health Check",
    description="Returns basic application health status (liveness probe)"
)
async def health_check():
    """
    Basic health check endpoint for liveness probe.
    Returns 200 if application is running.
    """
    return HealthStatus(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        uptime=get_uptime()
    )


@router.get(
    "/health/ready",
    response_model=DetailedHealthStatus,
    summary="Readiness Check",
    description="Returns detailed health status including dependencies (readiness probe)"
)
async def readiness_check():
    """
    Readiness probe - checks if application is ready to serve traffic.
    Includes dependency health checks.
    """
    # Check all dependencies
    redis_health = await check_redis_health()
    db_health = await check_database_health()
    ai_health = await check_ai_service_health()

    # Determine overall status
    dependencies = {
        "redis": redis_health,
        "database": db_health,
        "ai_service": ai_health
    }

    # Check if any critical dependency is unhealthy
    is_ready = all(
        dep["status"] in ["healthy", "disabled", "not_implemented"]
        for dep in dependencies.values()
    )

    status_code = status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=status_code,
        content={
            "status": "ready" if is_ready else "not_ready",
            "timestamp": datetime.utcnow().isoformat(),
            "uptime": get_uptime(),
            "version": "1.0.0",
            "system": get_system_info(),
            "dependencies": dependencies
        }
    )


@router.get(
    "/health/live",
    response_model=HealthStatus,
    summary="Liveness Check",
    description="Simple liveness check for Kubernetes/Docker"
)
async def liveness_check():
    """
    Liveness probe - checks if application is alive.
    Returns 200 if process is running.
    """
    return HealthStatus(
        status="alive",
        timestamp=datetime.utcnow().isoformat(),
        uptime=get_uptime()
    )


@router.get(
    "/health/startup",
    summary="Startup Check",
    description="Startup probe to check if application has finished initializing"
)
async def startup_check():
    """
    Startup probe - checks if application has completed initialization.
    """
    # Check if application has been running for at least 5 seconds
    uptime = get_uptime()
    is_started = uptime >= 5

    if not is_started:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "starting",
                "timestamp": datetime.utcnow().isoformat(),
                "uptime": uptime,
                "message": "Application is still starting up"
            }
        )

    return {
        "status": "started",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime": uptime,
        "message": "Application started successfully"
    }


@router.get(
    "/metrics",
    summary="Metrics Endpoint",
    description="Returns application metrics in Prometheus format (optional)"
)
async def metrics():
    """
    Metrics endpoint for monitoring (Prometheus-compatible).
    Returns basic application metrics.
    """
    system_info = get_system_info()

    # Simple Prometheus-style metrics
    metrics_output = f"""
# HELP app_uptime_seconds Application uptime in seconds
# TYPE app_uptime_seconds gauge
app_uptime_seconds {get_uptime()}

# HELP app_cpu_usage_percent CPU usage percentage
# TYPE app_cpu_usage_percent gauge
app_cpu_usage_percent {system_info['cpu']['usage_percent']}

# HELP app_memory_usage_percent Memory usage percentage
# TYPE app_memory_usage_percent gauge
app_memory_usage_percent {system_info['memory']['percent']}

# HELP app_disk_usage_percent Disk usage percentage
# TYPE app_disk_usage_percent gauge
app_disk_usage_percent {system_info['disk']['percent']}
    """.strip()

    return JSONResponse(
        content={"metrics": metrics_output},
        media_type="text/plain"
    )
