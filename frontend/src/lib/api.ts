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
} as const;
