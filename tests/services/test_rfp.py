"""
Tests for RFP service.
"""

import pytest
from unittest.mock import AsyncMock, patch
from pathlib import Path
import tempfile
import os

from services.rfp import analyze_rfp, generate_proposal, build_docx
from services.rfp_models import UploadResponse, Proposal

@pytest.mark.asyncio
async def test_analyze_rfp():
    """Test RFP analysis."""
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as tmp:
        tmp.write(b"Sample RFP text for testing.")
        tmp_path = Path(tmp.name)

    try:
        result = await analyze_rfp(tmp_path)
        assert isinstance(result, UploadResponse)
        assert result.chars > 0
        assert result.rfp_text == "Sample RFP text for testing."
    finally:
        os.unlink(tmp_path)

@pytest.mark.asyncio
@patch('services.proposal_generator.generate_proposal_json')
async def test_generate_proposal(mock_generate):
    """Test proposal generation."""
    mock_generate.return_value = Proposal(
        client_name="Test Client",
        project_title="Test Proposal",
        executive_summary="Summary",
        commercials=CommercialInfo(
            currency="USD",
            line_items=[],
            discount_percent=0,
            tax_percent=18,
            payment_terms_summary="Net 30",
            out_of_pocket_expenses=[],
            payment_milestones=[]
        ),
        validity="30 days"
    )

    data = {"rfp_text": "Test RFP"}
    result = await generate_proposal(data)
    assert isinstance(result, GenerateJSONResponse)
    assert result.proposal.client_name == "Test Client"

@pytest.mark.asyncio
@patch('services.document_builder.build_docx_from_proposal')
async def test_build_docx(mock_build):
    """Test DOCX building."""
    mock_build.return_value = b"Mock DOCX bytes"

    proposal = Proposal(
        client_name="Test",
        project_title="Test",
        executive_summary="Summary",
        commercials=CommercialInfo(
            currency="USD",
            line_items=[],
            discount_percent=0,
            tax_percent=18,
            payment_terms_summary="Net 30",
            out_of_pocket_expenses=[],
            payment_milestones=[]
        ),
        validity="30 days"
    )
    result = await build_docx(proposal)
    assert isinstance(result, bytes)
    assert len(result) > 0