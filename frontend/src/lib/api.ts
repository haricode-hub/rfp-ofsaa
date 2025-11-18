// API Configuration
// Using relative path since frontend is served by FastAPI
export const API_BASE_URL = '';

// API endpoints
export const API_ENDPOINTS = {
  // Document endpoints
  uploadDocument: `${API_BASE_URL}/upload-document`,
  uploadMultipleDocuments: `${API_BASE_URL}/upload-multiple-documents`,
  uploadMultipleDocumentsStream: `${API_BASE_URL}/upload-multiple-documents-stream`,

  // Chat endpoint
  chat: `${API_BASE_URL}/chat`,

  // Health check
  health: `${API_BASE_URL}/health`,

  // FSD endpoints
  fsd: {
    generateFromDocument: `${API_BASE_URL}/fsd/generate-from-document`,
    download: (documentId: string) => `${API_BASE_URL}/fsd/download/${documentId}`,
    tokenUsage: `${API_BASE_URL}/fsd/token-usage`,
    clearCache: `${API_BASE_URL}/fsd/clear-cache`,
  },

  // Presales endpoints
  presales: {
    upload: `${API_BASE_URL}/presales/upload`,
    process: `${API_BASE_URL}/presales/process`,
    download: (fileId: string) => `${API_BASE_URL}/presales/download/${fileId}`,
    cacheStats: `${API_BASE_URL}/presales/cache-stats`,
    clearCache: `${API_BASE_URL}/presales/clear-cache`,
  },

  // RFP endpoints
  rfp: {
    upload: `${API_BASE_URL}/api/rfp/upload`,
    generateJson: `${API_BASE_URL}/api/rfp/generate-json`,
    generateDocx: `${API_BASE_URL}/api/rfp/generate-docx`,
    health: `${API_BASE_URL}/api/rfp/health`,
    pingOllama: `${API_BASE_URL}/api/rfp/ping-ollama`,
  },
} as const;

import { RfpAnalysis, Proposal, GenerateJsonResponse } from '@/types';

// RFP API functions
export async function uploadRfp(file: File): Promise<RfpAnalysis> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(API_ENDPOINTS.rfp.upload, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('Upload failed');
  return response.json();
}

export async function generateRfpJson(data: { rfp_text: string; meta?: { client_name?: string; project_title?: string } }): Promise<GenerateJsonResponse> {
  const response = await fetch(API_ENDPOINTS.rfp.generateJson, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Generation failed');
  return response.json();
}

export async function generateRfpDocx(proposal: Proposal): Promise<Blob> {
  const response = await fetch(API_ENDPOINTS.rfp.generateDocx, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(proposal),
  });
  if (!response.ok) throw new Error('DOCX generation failed');
  return response.blob();
}
