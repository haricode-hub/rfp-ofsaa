"""
RFP, Proposal, and Response models for the RFP service.
"""

from typing import List, Optional
from pydantic import BaseModel, Field

class CommercialLineItem(BaseModel):
    """Commercial line item."""
    name: str = Field(..., description="Item name")
    unit: str = Field(..., description="Unit of measurement")
    qty: float = Field(..., description="Quantity")
    rate: float = Field(..., description="Rate per unit")

class PaymentMilestone(BaseModel):
    """Payment milestone."""
    description: str = Field(..., description="Milestone description")
    percent: float = Field(..., description="Percentage of total payment")
    amount: float = Field(..., description="Milestone amount")

class ResourcePlan(BaseModel):
    """Resource plan entry."""
    role: str = Field(..., description="Role title")
    count: int = Field(..., description="Number of resources")
    mode: Optional[str] = Field(None, description="Delivery mode (onsite/offshore/remote)")

class TimelinePhase(BaseModel):
    """Project timeline phase."""
    phase: str = Field(..., description="Phase name")
    duration: str = Field(..., description="Phase duration")
    milestones: List[str] = Field(default_factory=list, description="Phase milestones")

class CommercialInfo(BaseModel):
    """Commercial information."""
    currency: str = Field(..., description="Currency code")
    line_items: List[CommercialLineItem] = Field(default_factory=list, description="Line items")
    discount_percent: float = Field(default=0.0, description="Discount percentage")
    tax_percent: float = Field(..., description="Tax percentage")
    payment_terms_summary: str = Field(..., description="Payment terms summary")
    out_of_pocket_expenses: List[str] = Field(default_factory=list, description="Out of pocket expenses")
    payment_milestones: List[PaymentMilestone] = Field(default_factory=list, description="Payment milestones")

class Proposal(BaseModel):
    """Complete proposal structure."""
    client_name: str = Field(..., description="Client name")
    project_title: str = Field(..., description="Project title")
    executive_summary: str = Field(..., description="Executive summary")
    scope_of_work: List[str] = Field(default_factory=list, description="Scope of work")
    deliverables: List[str] = Field(default_factory=list, description="Deliverables")
    prerequisites: List[str] = Field(default_factory=list, description="Prerequisites")
    scope_exclusions: List[str] = Field(default_factory=list, description="Scope exclusions")
    assumptions: List[str] = Field(default_factory=list, description="Assumptions")
    customer_obligations: List[str] = Field(default_factory=list, description="Customer obligations")
    timeline: List[TimelinePhase] = Field(default_factory=list, description="Project timeline")
    resource_plan: List[ResourcePlan] = Field(default_factory=list, description="Resource plan")
    commercials: CommercialInfo = Field(..., description="Commercial information")
    payment_terms_details: List[str] = Field(default_factory=list, description="Payment terms details")
    acceptance_criteria: List[str] = Field(default_factory=list, description="Acceptance criteria")
    validity: str = Field(..., description="Proposal validity period")

class RFPClassification(BaseModel):
    """RFP classification result."""
    category: str = Field(..., description="RFP category (e.g., 'Resource Augmentation')")
    confidence: str = Field(..., description="Confidence level: 'high', 'medium', 'low'")
    matched_keywords: List[str] = Field(default_factory=list, description="Keywords that matched")

class RFPSubmissionInfo(BaseModel):
    """RFP submission information."""
    issuance_date: Optional[str] = Field(None, description="RFP issuance date")
    submission_deadline: Optional[str] = Field(None, description="Submission deadline")
    clarification_deadline: Optional[str] = Field(None, description="Clarification deadline")
    submission_method: Optional[str] = Field(None, description="Submission method")
    contacts: Optional[str] = Field(None, description="Contact information")

class RFPAnalysis(BaseModel):
    """Complete RFP analysis result."""
    rfp_type: RFPClassification = Field(..., description="RFP type classification")
    summary: str = Field(..., description="RFP summary")
    issuing_organization: Optional[str] = Field(None, description="Issuing organization")
    scope: Optional[str] = Field(None, description="Project scope")
    functional_requirements: List[str] = Field(default_factory=list, description="Functional requirements")
    technical_requirements: List[str] = Field(default_factory=list, description="Technical requirements")
    services: List[str] = Field(default_factory=list, description="Required services")
    submission: RFPSubmissionInfo = Field(..., description="Submission information")
    evaluation_focus: List[str] = Field(default_factory=list, description="Evaluation focus areas")
    optional_components: List[str] = Field(default_factory=list, description="Optional components")
    risks: List[str] = Field(default_factory=list, description="Identified risks")

class UploadResponse(BaseModel):
    """File upload response."""
    ok: bool = Field(default=True, description="Success status")
    chars: int = Field(..., description="Number of characters extracted")
    preview: str = Field(..., description="Text preview (first 2000 chars)")
    rfp_text: str = Field(..., description="Full extracted text")
    classification: RFPClassification = Field(..., description="RFP classification")
    analysis: Optional[RFPAnalysis] = Field(None, description="RFP analysis (if available)")

class GenerateJSONResponse(BaseModel):
    """Proposal JSON generation response."""
    ok: bool = Field(default=True, description="Success status")
    proposal: Proposal = Field(..., description="Generated proposal")

class HealthResponse(BaseModel):
    """Health check response."""
    status: str = Field(..., description="Service status")
    service: str = Field(..., description="Service name")

class PingOllamaResponse(BaseModel):
    """Ollama connectivity check response."""
    ok: bool = Field(..., description="Connection status")
    error: Optional[str] = Field(None, description="Error message if connection failed")