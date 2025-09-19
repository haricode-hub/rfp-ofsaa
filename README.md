# RFP OFSAA - AI-Powered Document Processing Platform

A comprehensive Next.js frontend with FastAPI backend for document analysis and specialized AI agent services.

## Features

### Knowledge Agent
- **Document Upload**: Upload PDF, DOC, DOCX, TXT, MD, XLS, XLSX, PPT, PPTX files
- **Document Display**: View uploaded documents in markdown format
- **Text Selection**: Select text from documents for context-based queries
- **AI Chat**: Ask questions about selected text or general document content
- **Markdown Canvas**: View and edit markdown content with history/versioning
- **Streaming Responses**: Real-time AI responses with OpenAI integration

### FSD Agent
- **Functional Specification Document Generation**: Create professional FSD documents from requirements
- **OpenAI GPT-4o Integration**: Advanced AI-powered document generation
- **Vector Search**: Optional Qdrant integration for Oracle Flexcube documentation
- **Word Document Output**: Professional .docx generation with TOC, bookmarks, and styling
- **Token Usage Tracking**: Detailed cost monitoring and analytics

### Presales Agent
- **Excel RFP Analysis**: Process and analyze RFP requirements for Oracle banking solutions
- **Web Search Integration**: Smithery.ai Exa search for Oracle documentation
- **Evidence-Based Assessment**: Yes/No/Partially/Not Found responses with detailed explanations
- **Batch Processing**: Concurrent processing with configurable batch sizes
- **Professional Output**: Enhanced Excel formatting with detailed remarks

## Setup

### Backend Setup

1. **Install Python dependencies**:
   ```bash
   cd /path/to/rfp-ofsaa
   uv sync
   ```

2. **Configure Environment Variables**:
   ```bash
   # Copy the example environment file
   cp .env.example .env

   # Edit .env and add your API keys
   OPENAI_API_KEY=your_openai_api_key_here
   OPENROUTER_API_KEY=your_openrouter_api_key_here

   # Optional for FSD Agent vector search
   QDRANT_URL=your_qdrant_url
   QDRANT_API_KEY=your_qdrant_api_key

   # Required for Presales Agent web search
   SMITHERY_API_KEY=your_smithery_api_key
   SMITHERY_PROFILE=your_smithery_profile
   ```

3. **Run the backend**:
   ```bash
   uv run python main.py
   # or
   ./start.sh
   ```

### Frontend Setup

1. **Install frontend dependencies**:
   ```bash
   cd frontend
   bun install
   ```

2. **Run the frontend**:
   ```bash
   bun run dev
   ```

## Usage Guide

### Knowledge Agent (Document Chat)

1. **Access**: Navigate to `/chat` or use the "Knowledge Agent" link in the navigation
2. **Upload Document**: Click the "Upload" button to upload a supported document
3. **View Content**: Uploaded document content appears in the left panel
4. **Select Text**: Highlight any text in the document to see the text selection toolbar
5. **AI Chat**:
   - Select text and click "Ask/write" to add it as context for your query
   - Type your question in the chat input and get AI responses in real-time
   - Responses stream to the markdown canvas

### FSD Agent (Functional Specification Documents)

1. **Access**: Navigate to `/fsd` or use the "FSD Agent" link in the navigation
2. **Upload Requirements**: Upload PDF/DOCX files containing project requirements
3. **Add Context**: Provide additional context or specific requirements
4. **Generate FSD**: Click "Generate FSD" to create a professional specification document
5. **Download**: Download the generated .docx file with complete FSD structure
6. **Monitor Usage**: Track token usage and costs via the token usage endpoint

### Presales Agent (RFP Analysis)

1. **Access**: Navigate to `/presales` or use the "Presales Agent" link in the navigation
2. **Upload Excel**: Upload .xlsx/.xls files containing RFP requirements
3. **Review Columns**: Verify detected columns and row count
4. **Process Analysis**: Configure processing options and start analysis
5. **Download Results**: Get processed Excel with Oracle banking solution assessments
6. **View Stats**: Monitor cache statistics and processing metrics

### Canvas Features

- **Auto-Preview**: Switches to preview mode after you stop typing
- **Keyboard Shortcuts**:
  - `Escape` or `Ctrl+Enter`: Switch to preview immediately
  - Click anywhere in preview to return to edit mode
- **Version History**: Access previous versions of your canvas content
- **Undo/Redo**: Navigate through edit history

## Development

### Linting

**Frontend**:
```bash
cd frontend
bun run lint
bun run build
```

**Backend**:
```bash
uv run ruff check main.py
```

## API Endpoints

### Core Endpoints
- `POST /upload-document`: Upload and convert documents to markdown
- `POST /chat`: Stream AI responses based on query and context
- `GET /health`: Health check endpoint

### FSD Agent Endpoints
- `POST /fsd/generate-from-document`: Generate FSD document from uploaded PDF/DOCX
- `GET /fsd/download/{document_id}`: Download generated FSD document (.docx)
- `GET /fsd/token-usage`: Get detailed token usage and cost statistics
- `POST /fsd/clear-cache`: Clear FSD service document cache

### Presales Agent Endpoints
- `POST /presales/upload`: Upload Excel files (.xlsx, .xls) for RFP analysis
- `POST /presales/process`: Process Excel data with Oracle banking solution analysis
- `GET /presales/download/{file_id}`: Download processed RFP analysis results
- `GET /presales/cache-stats`: Get presales service cache statistics
- `POST /presales/clear-cache`: Clear presales service cache

## Technologies

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python 3.13
- **AI Models**: OpenAI GPT-4o-mini via OpenRouter
- **Document Processing**: Docling library
- **Vector Database**: Qdrant (optional for FSD agent)
- **Web Search**: Smithery.ai Exa search (for Presales agent)
- **Package Management**: Bun (frontend), UV (backend)
- **Word Processing**: python-docx for .docx generation
- **Excel Processing**: pandas, openpyxl for spreadsheet handling