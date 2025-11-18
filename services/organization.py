"""
Organization configuration and constants.
"""

from dataclasses import dataclass
from typing import List

from .config import settings

@dataclass
class Organization:
    """JMR organization configuration."""
    name: str = settings.org_name
    tagline: str = settings.org_tagline
    website: str = settings.org_website
    email: str = settings.org_email
    phone: str = settings.org_phone
    address: str = settings.org_address
    currency: str = settings.currency
    default_tax: float = settings.default_tax_percent

# Global organization instance
ORG = Organization()

# Proposal JSON template for AI generation
PROPOSAL_JSON_TEMPLATE = f'''{{
  "client_name": string,
  "project_title": string,
  "executive_summary": string,
  "scope_of_work": [string],
  "deliverables": [string],
  "prerequisites": [string],
  "scope_exclusions": [string],
  "assumptions": [string],
  "customer_obligations": [string],
  "timeline": [{{"phase": string, "duration": string, "milestones": [string]}}],
  "resource_plan": [{{"role": string, "count": number, "mode": "onsite" | "offshore" | "remote"}}],
  "commercials": {{
    "currency": "{ORG.currency}",
    "line_items": [{{"name": string, "unit": string, "qty": number, "rate": number}}],
    "discount_percent": number,
    "tax_percent": number,
    "payment_terms_summary": string,
    "out_of_pocket_expenses": [string],
    "payment_milestones": [{{"description": string, "percent": number, "amount": number}}]
  }},
  "payment_terms_details": [string],
  "acceptance_criteria": [string],
  "validity": "30 days"
}}'''