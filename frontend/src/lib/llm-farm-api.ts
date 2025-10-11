/**
 * LLM Farm API Client
 * Functions for interacting with the LLM Farm backend service
 */

export interface DocumentAttachment {
  filename: string;
  file_type: string;
  file_size: number;
  extracted_text: string;
  upload_timestamp: string;
}

export interface SendMessageRequest {
  message: string;
  model: string;
  documents?: DocumentAttachment[];  // Optional - backward compatible
  enable_web_search?: boolean;  // Optional - web search toggle
}

export interface SendMessageResponse {
  message: string;
  model: string;
}

export interface WebSearchSource {
  title: string;
  url: string;
}

export interface StreamChunk {
  content?: string;
  model: string;
  sources?: WebSearchSource[];
}

export interface UploadDocumentResponse {
  filename: string;
  file_type: string;
  file_size: number;
  extracted_text: string;
  upload_timestamp: string;
  status: string;
}

/**
 * Send a message to an LLM model (non-streaming)
 */
export async function sendMessage(
  request: SendMessageRequest
): Promise<SendMessageResponse> {
  const response = await fetch(`/api/llm-farm/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      detail: "Unknown error occurred",
    }));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Stream messages from an LLM model (real-time streaming)
 */
export async function* streamMessage(
  request: SendMessageRequest
): AsyncGenerator<StreamChunk, void, unknown> {
  const response = await fetch(`/api/llm-farm/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      detail: "Unknown error occurred",
    }));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  if (!response.body) {
    throw new Error("Response body is null");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim() || !line.startsWith("data: ")) {
          continue;
        }

        const data = line.slice(6).trim();

        if (data === "[DONE]") {
          return;
        }

        try {
          const parsed = JSON.parse(data) as StreamChunk | { error: string };

          if ("error" in parsed) {
            throw new Error(parsed.error);
          }

          yield parsed;
        } catch (err) {
          if (err instanceof SyntaxError) {
            continue;
          }
          throw err;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Upload a document for LLM Farm chat
 */
export async function uploadDocument(file: File): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/llm-farm/upload-document`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      detail: "Unknown error occurred",
    }));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}
