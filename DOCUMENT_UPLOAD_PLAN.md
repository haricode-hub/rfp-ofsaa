# Document Upload Feature Implementation Plan for LLM Farm

## Overview
Add document upload functionality to the LLM Farm section of rfp-ofsaa project, enabling users to upload documents (PDF, PPTX, XLSX, DOCX, TXT, code files) and have AI models analyze and respond to questions about those documents.

## Current State Analysis

### Existing Infrastructure
- **Backend**: FastAPI with document conversion via Docling (already supports PDF, DOC, DOCX, TXT, MD, XLS, XLSX, PPT, PPTX)
- **Existing Endpoints**:
  - `/upload-document` - Single file upload with conversion
  - `/upload-multiple-documents` - Batch upload with parallel processing
  - `/upload-multiple-documents-stream` - Streaming upload with progress
- **LLM Farm Service**: `services/llm_farm.py` with OpenRouter integration
- **LLM Farm Endpoints**:
  - `/api/llm-farm/chat` - Non-streaming chat
  - `/api/llm-farm/chat/stream` - Streaming chat with SSE
- **Frontend**: Next.js 15 with static export at `frontend/src/app/llm-farm/page.tsx`

### What's Missing
- Document upload UI in LLM Farm chat interface
- Integration between uploaded documents and LLM Farm chat
- Document context handling in chat messages
- Document preview/attachment display in chat
- Storage/persistence of uploaded documents with conversations

## Implementation Plan

### Phase 1: Backend Updates

#### 1.1 Update LLM Farm Models (services/llm_farm.py)
- [ ] Add `DocumentAttachment` model
  - `filename: str`
  - `file_type: str`
  - `file_size: int`
  - `extracted_text: str`
  - `upload_timestamp: datetime`
- [ ] Update `ChatRequest` to include optional `documents: list[DocumentAttachment]`
- [ ] Keep existing `ChatResponse` model unchanged

#### 1.2 Update LLM Farm Service Logic
- [ ] Modify `call_openrouter()` to accept documents parameter
- [ ] Format messages to include document context before user message
- [ ] Format: `"Context from uploaded documents:\n\n[Document 1: filename]\n{extracted_text}\n\n[User Message]\n{message}"`
- [ ] Modify `stream_openrouter()` to handle documents similarly
- [ ] Ensure backward compatibility (documents parameter is optional)

#### 1.3 Create Document Upload Endpoint for LLM Farm
- [ ] Create new endpoint: `/api/llm-farm/upload-document`
- [ ] Reuse existing Docling conversion logic from `/upload-document`
- [ ] Return document metadata and extracted text
- [ ] Validate file types (PDF, PPTX, XLSX, DOCX, TXT, MD, code files)
- [ ] Handle file size limits (10MB per file)

### Phase 2: Frontend Type Definitions

#### 2.1 Create/Update Types (frontend/src/types/llm-farm.ts)
- [ ] Create new file if doesn't exist
- [ ] Define `DocumentAttachment` interface:
  ```typescript
  interface DocumentAttachment {
    id: string;
    filename: string;
    fileType: string;
    fileSize: number;
    extractedText: string;
    uploadTimestamp: Date;
  }
  ```
- [ ] Define `Message` interface:
  ```typescript
  interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    model?: string;
    documents?: DocumentAttachment[];
  }
  ```
- [ ] Define `Conversation` interface:
  ```typescript
  interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
    modelId?: string;
  }
  ```

### Phase 3: Frontend Components

#### 3.1 Create DocumentUpload Component
- [ ] Location: `frontend/src/components/llm-farm/DocumentUpload.tsx`
- [ ] Features:
  - File input with accept filter (.pdf, .pptx, .xlsx, .docx, .txt, .md, code files)
  - Drag-and-drop support (optional, use simple file input for MVP)
  - Upload progress indicator
  - File preview card (icon, name, size, type)
  - Remove document button
  - Multiple file support
- [ ] Call `/api/llm-farm/upload-document` endpoint
- [ ] Return uploaded document metadata

#### 3.2 Create DocumentPreview Component
- [ ] Location: `frontend/src/components/llm-farm/DocumentPreview.tsx`
- [ ] Display uploaded document metadata
- [ ] Show document icon based on file type
- [ ] Display filename, size, upload time
- [ ] Remove button to delete from current message
- [ ] Compact card design for chat interface

#### 3.3 Update MessageDisplay Component
- [ ] Check if component exists in LLM Farm context
- [ ] Add document attachments display for user messages
- [ ] Show document cards above message content
- [ ] Display document metadata (name, type, size)
- [ ] Use file type icons (PDF, Excel, PowerPoint, Word, Text)

### Phase 4: LLM Farm Chat Interface Updates

#### 4.1 Update LLM Farm Page (frontend/src/app/llm-farm/page.tsx)
- [ ] Read current implementation
- [ ] Add state for uploaded documents in current message
- [ ] Add document upload button/area to chat input
- [ ] Integrate DocumentUpload component
- [ ] Handle document upload flow:
  1. User clicks "Attach Document" button
  2. File selector opens
  3. User selects document(s)
  4. Frontend uploads to `/api/llm-farm/upload-document`
  5. Backend processes and returns metadata
  6. Frontend stores document in component state
  7. Documents shown in preview area
- [ ] Update send message function to include documents
- [ ] Send documents array with message to backend
- [ ] Clear documents after message sent
- [ ] Update message display to show document attachments

#### 4.2 Update Chat Input Area
- [ ] Add "Attach Document" button (paperclip icon using lucide-react)
- [ ] Show attached documents preview above input
- [ ] Allow removing documents before sending
- [ ] Visual indicator when documents are attached
- [ ] Update send button state when documents present

### Phase 5: Storage and Persistence

#### 5.1 LocalStorage Integration
- [ ] Check existing localStorage implementation for conversations
- [ ] Update storage schema to include documents in messages
- [ ] Store document metadata only (not full extracted text to save space)
- [ ] Implement size limits for localStorage
- [ ] Add cleanup for old conversations if storage full

#### 5.2 Document Context Management
- [ ] Documents persist within conversation
- [ ] Documents only sent with specific message they're attached to
- [ ] Backend includes document context in that specific message
- [ ] Documents don't carry over to subsequent messages
- [ ] Clear document state after message sent

### Phase 6: UI/UX Polish

#### 6.1 File Type Icons
- [ ] Create icon mapping for file types
- [ ] Use lucide-react icons:
  - PDF: FileText
  - Excel: FileSpreadsheet
  - PowerPoint: Presentation
  - Word: FileText
  - Text: FileCode
  - Code files: Code
- [ ] Color code icons by file type

#### 6.2 Upload States
- [ ] Loading state during upload
- [ ] Success state with checkmark
- [ ] Error state with error message
- [ ] Progress indicator for large files
- [ ] Disable send button during upload

#### 6.3 Error Handling
- [ ] File type validation errors
- [ ] File size limit errors
- [ ] Upload failure errors
- [ ] Network error handling
- [ ] User-friendly error messages

### Phase 7: Testing

#### 7.1 Backend Testing
- [ ] Test document upload endpoint
- [ ] Test document processing for all supported file types
- [ ] Test chat with document context
- [ ] Test streaming with documents
- [ ] Test error cases (invalid file type, too large, etc.)

#### 7.2 Frontend Testing
- [ ] Test document upload flow
- [ ] Test document preview
- [ ] Test message with documents
- [ ] Test document removal
- [ ] Test conversation persistence
- [ ] Test across different browsers

#### 7.3 Integration Testing
- [ ] Test end-to-end document upload and chat flow
- [ ] Test multiple documents in single message
- [ ] Test different file types
- [ ] Test large documents
- [ ] Test error recovery

## Technical Specifications

### Supported File Types
- **PDF**: `.pdf` (using Docling)
- **PowerPoint**: `.ppt`, `.pptx` (using Docling)
- **Excel**: `.xls`, `.xlsx` (using Docling)
- **Word**: `.doc`, `.docx` (using Docling)
- **Text**: `.txt`, `.md` (direct text reading)
- **Code**: `.js`, `.ts`, `.py`, `.java`, `.cpp`, `.c`, `.html`, `.css`, etc.

### File Size Limits
- **Per File**: 10MB maximum
- **Total per Message**: 20MB maximum
- **Extracted Text**: 50,000 characters maximum

### API Endpoints

#### New Endpoints
```
POST /api/llm-farm/upload-document
  - Upload document for LLM Farm chat
  - Returns: {filename, file_type, file_size, extracted_text, upload_timestamp}

POST /api/llm-farm/chat
  - Updated to accept documents array
  - Request: {message, model, documents?: []}

POST /api/llm-farm/chat/stream
  - Updated to accept documents array
  - Request: {message, model, documents?: []}
```

### Data Flow

```
User selects file → Frontend uploads → Backend processes → Docling extracts text
     ↓
Frontend stores metadata → User types message → User clicks send
     ↓
Frontend sends {message, model, documents[]} → Backend formats context
     ↓
Backend: "Context: [Doc1]\n{text}\n\nUser: {message}" → OpenRouter API
     ↓
OpenRouter responds → Backend streams response → Frontend displays
     ↓
Frontend saves message with documents to localStorage
```

## Implementation Order

1. **Backend First** (Minimal breaking changes)
   - Update `services/llm_farm.py` models
   - Update `call_openrouter()` and `stream_openrouter()`
   - Create `/api/llm-farm/upload-document` endpoint

2. **Frontend Types** (Foundation for components)
   - Create type definitions
   - Define interfaces

3. **Core Components** (Reusable building blocks)
   - DocumentUpload component
   - DocumentPreview component

4. **Integration** (Connect everything)
   - Update LLM Farm page
   - Update chat input area
   - Update message display

5. **Storage** (Persistence)
   - Update localStorage schema
   - Add document persistence

6. **Polish** (User experience)
   - Icons and styling
   - Error handling
   - Loading states

7. **Testing** (Quality assurance)
   - Backend tests
   - Frontend tests
   - Integration tests

## Success Criteria

- [ ] Users can upload documents in LLM Farm chat
- [ ] Documents are processed and text extracted
- [ ] AI models receive document context with messages
- [ ] Document attachments display in chat history
- [ ] Documents persist in conversation localStorage
- [ ] Error handling works correctly
- [ ] UI is responsive and intuitive
- [ ] No breaking changes to existing functionality
- [ ] All supported file types work correctly
- [ ] Performance is acceptable (< 5 seconds for typical documents)

## Notes

- Reuse existing Docling infrastructure from main document upload
- Keep LLM Farm chat interface simple and clean
- Documents are attached per message, not per conversation
- No image support (document files only)
- Focus on text extraction and context provision
- Maintain backward compatibility with existing chat
