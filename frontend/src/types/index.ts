export interface RfpAnalysis {
  ok: boolean;
  chars: number;
  preview: string;
  rfp_text: string;
  classification: {
    category: string;
    confidence: string;
    matched_keywords: string[];
  };
  analysis?: {
    rfp_type: {
      category: string;
      confidence: string;
      matched_keywords: string[];
    };
    summary: string;
    issuing_organization?: string;
    scope?: string;
    functional_requirements: string[];
    technical_requirements: string[];
    services: string[];
    submission: {
      issuance_date?: string;
      submission_deadline?: string;
      clarification_deadline?: string;
      submission_method?: string;
      contacts?: string;
    };
    evaluation_focus: string[];
    optional_components: string[];
    risks: string[];
  };
}

export interface Proposal {
  client_name: string;
  project_title: string;
  executive_summary: string;
  scope_of_work: string[];
  deliverables: string[];
  prerequisites: string[];
  scope_exclusions: string[];
  assumptions: string[];
  customer_obligations: string[];
  timeline: {
    phase: string;
    duration: string;
    milestones: string[];
  }[];
  resource_plan: {
    role: string;
    count: number;
    mode?: string;
  }[];
  commercials: {
    currency: string;
    line_items: {
      name: string;
      unit: string;
      qty: number;
      rate: number;
    }[];
    discount_percent: number;
    tax_percent: number;
    payment_terms_summary: string;
    out_of_pocket_expenses: string[];
    payment_milestones: {
      description: string;
      percent: number;
      amount: number;
    }[];
  };
  payment_terms_details: string[];
  acceptance_criteria: string[];
  validity: string;
}

export interface GenerateJsonResponse {
  ok: boolean;
  proposal: Proposal;
}