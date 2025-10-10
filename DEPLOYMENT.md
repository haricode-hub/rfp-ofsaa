# 🚀 Deployment Guide - RFP OFSAA

Complete guide for deploying RFP OFSAA to production using Docker.

---

## 📋 Prerequisites

### Required Software
- Docker (v20.10+)
- Docker Compose (v2.0+)
- Git

### Required API Keys
- OpenAI API Key
- OpenRouter API Key
- Smithery API Key (for presales agent)
- Qdrant credentials (optional, for FSD vector search)

---

## 🔧 Environment Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd rfp-ofsaa
```

### 2. Configure Environment Variables
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your actual values
nano .env
```

**Required Variables:**
```bash
# Environment
ENVIRONMENT=production

# API Keys
OPENAI_API_KEY=your_actual_openai_key
OPENROUTER_API_KEY=your_actual_openrouter_key
SMITHERY_API_KEY=your_actual_smithery_key
SMITHERY_PROFILE=your_smithery_profile

# Optional: Qdrant (for FSD agent vector search)
QDRANT_URL=https://your-qdrant-url
QDRANT_API_KEY=your_qdrant_key

# Database (auto-configured in docker-compose)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/rfp_ofsaa
REDIS_URL=redis://redis:6379
```

---

## 🐳 Docker Deployment

### Quick Start (All Services)
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Individual Service Control
```bash
# Start specific service
docker-compose up -d backend
docker-compose up -d frontend

# Restart service
docker-compose restart backend

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data!)
docker-compose down -v
```

---

## 🏗️ Build Configuration

### Backend Build
```bash
# Build backend image
docker build -t rfp-ofsaa-backend:latest .

# Run backend container
docker run -d \
  -p 8505:8505 \
  --env-file .env \
  --name rfp-backend \
  rfp-ofsaa-backend:latest
```

### Frontend Build
```bash
# Build frontend image
cd frontend
docker build -t rfp-ofsaa-frontend:latest .

# Run frontend container
docker run -d \
  -p 3505:3505 \
  -e NEXT_PUBLIC_API_URL=http://backend:8505 \
  --name rfp-frontend \
  rfp-ofsaa-frontend:latest
```

---

## 🔍 Health Checks

### Verify Services are Running
```bash
# Backend health check
curl http://localhost:8505/health

# Detailed readiness check
curl http://localhost:8505/health/ready

# Frontend health check
curl http://localhost:3505

# Check all container health
docker-compose ps
```

### Expected Responses
```json
// Backend /health
{
  "status": "healthy",
  "timestamp": "2025-10-09T10:00:00",
  "uptime": 123.45,
  "version": "1.0.0"
}

// Backend /health/ready
{
  "status": "ready",
  "timestamp": "2025-10-09T10:00:00",
  "uptime": 123.45,
  "version": "1.0.0",
  "system": {...},
  "dependencies": {
    "redis": {"status": "healthy"},
    "database": {"status": "healthy"},
    "ai_service": {"status": "healthy"}
  }
}
```

---

## 📊 Monitoring

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 backend

# Since timestamp
docker-compose logs --since="2025-10-09T10:00:00" backend
```

### Metrics Endpoint
```bash
# Prometheus-compatible metrics
curl http://localhost:8505/metrics
```

### Resource Usage
```bash
# Container stats
docker stats

# Specific container
docker stats rfp-ofsaa-backend
```

---

## 🔐 Security Considerations

### Production Checklist
- [ ] Change default PostgreSQL password
- [ ] Use strong SECRET_KEY
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Use secrets management (not .env files)
- [ ] Regular security updates
- [ ] Backup strategy implemented

### SSL/TLS Setup (Nginx)
```bash
# Generate SSL certificate (Let's Encrypt recommended)
# Example with certbot:
certbot certonly --standalone -d your-domain.com

# Update nginx.conf with SSL configuration
# Restart nginx
docker-compose restart nginx
```

---

## 🔄 Updates & Maintenance

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild and restart services
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Or use rolling update
docker-compose up -d --build --force-recreate
```

### Database Backups
```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump -U postgres rfp_ofsaa > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker-compose exec -T postgres psql -U postgres rfp_ofsaa < backup_20251009_100000.sql
```

### Redis Backup
```bash
# Backup Redis data
docker-compose exec redis redis-cli SAVE
docker cp rfp-ofsaa-redis:/data/dump.rdb ./redis_backup_$(date +%Y%m%d).rdb
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
# Check what's using the port
netstat -tulpn | grep 8505

# Change port in docker-compose.yml or stop conflicting service
```

**2. Container Won't Start**
```bash
# Check logs for errors
docker-compose logs backend

# Check container status
docker inspect rfp-ofsaa-backend
```

**3. Database Connection Failed**
```bash
# Ensure postgres is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Verify connection
docker-compose exec postgres psql -U postgres -c "SELECT 1"
```

**4. Out of Memory**
```bash
# Check Docker resources
docker system df

# Increase Docker memory limit in Docker Desktop settings

# Prune unused data
docker system prune -a
```

---

## 📈 Scaling

### Horizontal Scaling (Multiple Instances)
```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3

# Add load balancer (nginx) configuration
# Update nginx.conf with upstream configuration
```

### Performance Optimization
```bash
# Increase worker count in Dockerfile
# Backend: --workers 8
# Adjust based on CPU cores

# Enable caching
# Configure Redis cache settings

# Database connection pooling
# Adjust DATABASE_URL connection pool size
```

---

## 🛡️ Production Best Practices

### 1. Use Docker Secrets (Instead of .env)
```bash
# Create secrets
echo "your_openai_key" | docker secret create openai_api_key -

# Update docker-compose.yml to use secrets
```

### 2. Enable Resource Limits
```yaml
# In docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          memory: 2G
```

### 3. Implement Log Rotation
```yaml
# In docker-compose.yml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 4. Use Health Checks
```yaml
# Already configured in docker-compose.yml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8505/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

---

## 🌐 Production Deployment Platforms

### AWS
- Use ECS (Elastic Container Service)
- Or EKS (Elastic Kubernetes Service)
- RDS for PostgreSQL
- ElastiCache for Redis

### Google Cloud
- Use Cloud Run or GKE
- Cloud SQL for PostgreSQL
- Memorystore for Redis

### Digital Ocean
- Use App Platform or Kubernetes
- Managed PostgreSQL
- Managed Redis

### Self-Hosted
- Use docker-compose (current setup)
- Add nginx reverse proxy
- Configure SSL with Let's Encrypt
- Set up monitoring (Prometheus + Grafana)

---

## 📞 Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Review health checks: `/health/ready`
3. Consult PRODUCTION_READINESS_ANALYSIS.md
4. Contact development team

---

**Last Updated:** 2025-10-09
**Version:** 1.0.0
