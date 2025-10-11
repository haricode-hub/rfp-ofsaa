/**
 * LLM Farm Storage Utilities
 * Manage conversations and messages in localStorage
 */

export interface DocumentAttachment {
  filename: string;
  file_type: string;
  file_size: number;
  extracted_text: string;
  upload_timestamp: string;
}

export interface WebSearchSource {
  title: string;
  url: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  model?: string;
  documents?: DocumentAttachment[];  // Optional - won't break existing messages
  sources?: WebSearchSource[];  // Optional - web search sources
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  modelId?: string;
}

const STORAGE_KEY = "llm_farm_conversations";

/**
 * Load all conversations from localStorage
 */
export function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const conversations = JSON.parse(data) as Array<{
      id: string;
      title: string;
      messages: Array<{
        id: string;
        role: "user" | "assistant";
        content: string;
        timestamp: string;
        model?: string;
      }>;
      createdAt: string;
      updatedAt: string;
      modelId?: string;
    }>;
    return conversations.map((conv) => ({
      ...conv,
      createdAt: new Date(conv.createdAt),
      updatedAt: new Date(conv.updatedAt),
      messages: conv.messages.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
    }));
  } catch (error) {
    console.error("Error loading conversations:", error);
    return [];
  }
}

/**
 * Save a conversation to localStorage
 */
export function saveConversation(conversation: Conversation): void {
  if (typeof window === "undefined") return;

  try {
    const conversations = loadConversations();
    const index = conversations.findIndex((c) => c.id === conversation.id);

    if (index >= 0) {
      conversations[index] = conversation;
    } else {
      conversations.unshift(conversation);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error("Error saving conversation:", error);
  }
}

/**
 * Delete a conversation from localStorage
 */
export function deleteConversation(conversationId: string): void {
  if (typeof window === "undefined") return;

  try {
    const conversations = loadConversations();
    const filtered = conversations.filter((c) => c.id !== conversationId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting conversation:", error);
  }
}

/**
 * Create a new empty conversation
 */
export function createNewConversation(): Conversation {
  return {
    id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: "New Chat",
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Generate a title from the first user message
 */
export function generateConversationTitle(messages: Message[]): string {
  const firstUserMessage = messages.find((m) => m.role === "user");
  if (!firstUserMessage) return "New Chat";

  const content = firstUserMessage.content;
  if (content.length <= 50) return content;

  return content.substring(0, 47) + "...";
}
