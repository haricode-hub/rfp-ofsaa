"""
RFP API routes.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pathlib import Path
import tempfile
import os
import aiofiles
from typing import Dict, Any

from ..services import (
    analyze_rfp, generate_proposal, build_docx, health_check, ping_ollama,
    settings, ORG
)
from ..services.rfp_models import UploadResponse, GenerateJSONResponse

rfp_router = APIRouter(prefix="/rfp", tags=["rfp"])

@rfp_router.post("/upload", response_model=UploadResponse)
async def upload_rfp(file: UploadFile = File(...)) -> UploadResponse:
    """
    Upload and process RFP file.
    """
    if file.size > settings.max_file_size_bytes:
        raise HTTPException(status_code=413, detail="File too large")

    if not file.filename or not any(file.filename.lower().endswith(ext) for ext in ['.pdf', '.docx', '.txt', '.md']):
        raise HTTPException(status_code=400, detail="Unsupported file type")

    # Save file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp:
        content = await file.read()
        await aiofiles.open(tmp.name, 'wb').write(content)
        tmp_path = Path(tmp.name)

    try:
        analysis = await analyze_rfp(tmp_path)
        return analysis
    finally:
        os.unlink(tmp_path)

@rfp_router.post("/generate-json", response_model=GenerateJSONResponse)
async def generate_rfp_json(analysis_data: Dict[str, Any]) -> GenerateJSONResponse:
    """
    Generate proposal JSON from analysis data.
    """
    proposal = await generate_proposal(analysis_data)
    return proposal

@rfp_router.post("/generate-docx")
async def generate_rfp_docx(proposal_data: Dict[str, Any]):
    """
    Generate and download DOCX proposal.
    """
    from ..services.rfp_models import Proposal
    proposal = Proposal(**proposal_data)
    docx_bytes = await build_docx(proposal)
    
    filename = f"JMR_Proposal_{proposal.project_title.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.docx"
    
    return StreamingResponse(
        BytesIO(docx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@rfp_router.get("/health")
async def rfp_health():
    """
    RFP service health check.
    """
    return await health_check()

@rfp_router.get("/ping-ollama")
async def rfp_ping_ollama():
    """
    Ping Ollama for RFP service.
    """
    return await ping_ollama()