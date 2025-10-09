# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RFP OFSAA is a document analysis application with AI-powered chat functionality and specialized agent services. It consists of a **FastAPI backend** (Python 3.13) for document processing and AI integration, and a **Next.js 15 frontend** (React 19) with a sophisticated markdown canvas interface.

**Core Architecture:**
- **Backend**: FastAPI server with document conversion (via Docling) and OpenAI/OpenRouter integration
- **Frontend**: Next.js with custom components for document display, text selection, and real-time markdown editing
- **Document Flow**: Upload → Convert to Markdown → Display → Text Selection → AI Chat → Canvas Integration
- **FSD Agent**: Functional Specification Document generator with OpenAI GPT and optional vector search
- **Presales Agent**: Excel-based RFP analysis for Oracle banking solutions (FLEXCUBE, OFSAA, OBP)

## Development Commands

### Setup (Initial)
```bash
# Backend setup
uv sync                    # Install Python dependencies
cp .env.example .env       # Configure environment (add required API keys)

# Frontend setup
cd frontend
bun install               # Install Node dependencies
```

### Running the Application
```bash
# Start both services (recommended)
./start.sh                # Linux/macOS
./start.ps1              # Windows PowerShell
./start.bat              # Windows Command Prompt

# Or start individually
uv run python main.py                    # Backend only (port 8000)
cd frontend && bun run dev               # Frontend only (port 3000)
```

### Development Tools
```bash
# Backend linting/checking
uv run ruff check main.py
uv run ruff check services/

# Frontend linting/building
cd frontend
bun run lint
bun run build
bun run start            # Production build
```

## Key Architecture Patterns

### Document Processing Pipeline
1. **Upload** (`/upload-document`): Accepts PDF, DOC, DOCX, TXT, MD, XLS, XLSX, PPT, PPTX
2. **Convert**: Uses Docling library to convert to markdown
3. **Display**: React component with text selection capabilities
4. **AI Integration**: Selected text becomes context for OpenAI queries

### AI Service Architecture
- **Service**: `services/ai_service.py` - OpenRouterService class
- **Model**: Uses `gpt-4o-mini` via OpenRouter API
- **Streaming**: Real-time response streaming to frontend canvas
- **Context Handling**: Preserves heading structure and markdown formatting from selected text

### Frontend Component Structure
```
src/
├── app/
│   ├── page.tsx                 # Main application component
│   ├── chat/page.tsx           # Chat agent interface
│   ├── presales/page.tsx       # Presales agent interface
│   └── layout.tsx              # App layout and metadata
├── components/
│   ├── DocumentDisplay.tsx     # Document viewer with text selection
│   ├── MarkdownCanvas.tsx      # Smart markdown editor with preview mode
│   ├── TextSelectionToolbar.tsx # Floating toolbar for selected text
│   ├── MarkdownRenderer.tsx    # Markdown preview component
│   ├── ui/Layout.tsx           # Shared layout component
│   └── modals/                 # Various modal components
└── hooks/
    └── useHistory.ts           # Canvas history management
```

### State Management Patterns
- **Document State**: Managed in main page component (content, filename)
- **Canvas State**: Self-contained in MarkdownCanvas with history tracking
- **Selection State**: Temporary state for text selection actions
- **Theme State**: Dark/light mode toggle with system detection

## Important Implementation Details

### Environment Configuration
- **OPENAI_API_KEY**: Required for AI functionality and both agents
- **OPENROUTER_API_KEY**: Primary API key for AI service
- **QDRANT_URL**: Optional for FSD agent vector database integration
- **QDRANT_API_KEY**: Optional for Qdrant vector search capabilities
- **SMITHERY_API_KEY**: Required for presales agent web search capabilities
- **SMITHERY_PROFILE**: Required for Smithery.ai Exa search configuration
- Backend runs on `0.0.0.0:8505`, frontend on `192.168.2.95:3505`

### Document Conversion
- **Docling Integration**: Main conversion engine with extreme speed optimization
- **File Validation**: Extension-based checking against allowed formats (.pdf, .doc, .docx, .txt, .md, .xls, .xlsx, .ppt, .pptx)
- **Fast Path**: Text files (.txt, .md) processed directly without conversion
- **Temp File Handling**: Automatic cleanup after conversion
- **Multiple Document Upload**:
  - `/upload-multiple-documents`: Batch upload with extreme parallelization (up to 32 workers for PDFs)
  - `/upload-multiple-documents-stream`: Real-time progress updates with streaming
  - Partial success handling with warnings for failed files
  - Mixed file type support (PDFs, Office documents, text files)

### AI Streaming Response
- **Server-Sent Events**: `/chat` endpoint streams JSON chunks
- **Content Assembly**: Frontend accumulates response chunks
- **Canvas Integration**: Responses automatically append to markdown canvas
- **Error Handling**: Graceful error display in canvas

### Canvas Behavior
- **Auto-Preview**: Switches to preview mode 1.5 seconds after typing stops
- **Manual Preview**: Escape or Ctrl+Enter triggers immediate preview
- **Version History**: Automatic state tracking with undo/redo
- **Smart Paste**: Large content automatically triggers preview mode

### Text Selection Flow
1. User selects text in document display
2. Floating toolbar appears with "Ask/Write" and "Move to Canvas" options
3. "Ask/Write" sets selected text as context for AI queries
4. "Move to Canvas" immediately adds text to canvas
5. Context reference appears above chat input when active

### FSD Agent Architecture
- **Service Location**: `services/fsd.py` - Comprehensive FSD document generator
- **Document Generation**: OpenAI GPT-4o-mini for professional specification documents
- **Token Tracking**: Advanced cost monitoring with detailed usage analytics
- **Vector Search**: Optional Qdrant integration for Oracle Flexcube documentation (with warning suppression for local dev)
- **MCP Integration**: Optional Context7 MCP server for enhanced documentation retrieval
- **PDF Parsing**: Uses `pdfplumber` (primary) with `pypdf` fallback for text extraction
- **Word Output**: Professional .docx generation with TOC, bookmarks, hyperlinks, and styling
- **Template Structure**: Complete FSD template with 11 sections including traceability tables
- **Async Operations**: All generation endpoints use async/await for better performance

### Presales Agent Architecture
- **Service Location**: `services/presales.py` - Comprehensive Oracle banking RFP analysis
- **Excel Processing**: Pandas and openpyxl for file handling and styling
- **Web Search**: Smithery.ai Exa search for Oracle documentation and industry resources
- **AI Analysis**: OpenAI GPT-4o-mini for evidence-based requirement assessment
- **Response Types**: Yes/No/Partially/Not Found with professional explanations
- **Batch Processing**: Concurrent processing with configurable batch sizes
- **Caching**: Search result caching to optimize performance
- **Output**: Professionally formatted Excel with enhanced styling and detailed remarks (no reference links in Excel, shown in terminal only)
- **Emoji-Free**: All output is Windows-compatible without Unicode emojis

## Testing and Quality

### Backend Testing
- **Test Framework**: pytest with asyncio support
- **Total Tests**: 173 tests across 6 test files
- **Coverage Target**: 90%+ overall coverage
- **Test Files**:
  - `tests/test_main.py`: 64 tests (API endpoints)
  - `tests/test_middlewares.py`: 8 tests (CORS, error handling)
  - `tests/services/test_ai_service.py`: 32 tests (AI service)
  - `tests/services/test_fsd.py`: 38 tests (FSD generation)
  - `tests/services/test_presales.py`: 31 tests (Presales analysis)
- **Running Tests**: `uv run pytest tests/ -v --cov`
- **Test Coverage**: All endpoints, services, edge cases, and error scenarios

### Frontend Testing
- **Test Framework**: Jest + React Testing Library
- **Total Tests**: 209 tests across 5 phases
- **Test Files**:
  - `__tests__/hooks/`: 11 tests (Custom React hooks)
  - `__tests__/components/`: 71 tests (UI components)
  - `__tests__/pages/`: 24 tests (Next.js pages)
  - `__tests__/integration/`: 45 tests (User workflows)
- **Running Tests**: `cd frontend && npm test` (⚠️ Use npm, NOT bun - Jest needs jsdom)
- **Watch Mode**: `npm run test:watch`
- **Coverage**: `npm run test:coverage`
- **Test Documentation**: See `frontend/TESTING.md` for comprehensive guide

### Linting Configuration
- **Backend**: Ruff for Python code quality
- **Frontend**: ESLint with Next.js configuration
- **TypeScript**: Strict mode enabled

### API Testing
- **Health Check**: `GET /health` for service status
- **Upload Test**: Use supported file formats via `/upload-document`
- **Multiple Upload**: Test batch processing via `/upload-multiple-documents` or streaming via `/upload-multiple-documents-stream`
- **Chat Test**: Stream endpoint at `/chat` with query/context
- **FSD Generation**: Test document creation via `/fsd/generate-from-document`
- **FSD Download**: Test document retrieval via `/fsd/download/{document_id}`
- **Presales Upload**: Upload Excel files via `/presales/upload`
- **Presales Processing**: Process RFP analysis via `/presales/process`
- **API Documentation**: Available at `http://localhost:8505/docs`

### FSD Agent API Endpoints
- **POST /fsd/generate**: Generate Functional Specification Document from requirements
- **GET /fsd/download/{document_id}**: Download generated FSD document (.docx)
- **GET /fsd/token-usage**: Get detailed token usage and cost statistics
- **POST /fsd/clear-cache**: Clear document cache and reset session

### Presales Agent API Endpoints
- **POST /presales/upload**: Upload Excel files (.xlsx, .xls) for RFP analysis
- **POST /presales/process**: Process Excel data with Oracle banking solution analysis
- **GET /presales/download/{file_id}**: Download processed RFP analysis results
- **GET /presales/cache-stats**: Get presales service cache statistics
- **POST /presales/clear-cache**: Clear presales service cache

## Development Notes

### File Upload Constraints
- **Size**: No explicit limit set (handled by FastAPI defaults)
- **Types**: Strictly validated against extension whitelist (.pdf, .doc, .docx, .txt, .md, .xls, .xlsx, .ppt, .pptx)
- **Processing**: Parallel processing for multiple documents with extreme optimization
- **Performance**:
  - Text files: Instant (no conversion)
  - PDFs: Up to 32 parallel workers for batch processing
  - Mixed uploads: Separate worker pools for PDFs vs other files

### Real-time Features
- **Streaming Chat**: Server-sent events with JSON chunking
- **Canvas Updates**: React state updates trigger re-renders
- **Selection Toolbar**: Positioned dynamically relative to selection

### Cross-platform Compatibility
- **Startup Scripts**: Bash (.sh), PowerShell (.ps1), and Batch (.bat) versions
- **Process Management**: Platform-specific process cleanup
- **Path Handling**: Absolute paths used consistently

### Performance Considerations
- **Bundle Size**: Next.js with Turbopack for fast development
- **Package Manager**: Bun for faster installs and builds
- **Python Deps**: UV for efficient dependency management
- **Monaco Editor**: Code editing component for canvas
- **PDF Processing**: Docling with OCR and table structure disabled for 10x speed improvement
- **Concurrent Uploads**: ThreadPoolExecutor with dynamic worker allocation based on CPU cores

### Recent Updates
- **PyPDF2 → pypdf Migration**: Replaced deprecated PyPDF2 with modern pypdf library (v6.1.1)
- **Warning Suppression**: Added Qdrant insecure connection warning suppression for local development
- **Test Suite**: Comprehensive 173 tests with zero warnings
- **Async Operations**: FSD generation endpoints now fully async
- **Extension-Based Validation**: Changed from MIME type to extension-based file validation for better reliability

When working on this codebase, always test both document upload and AI chat functionality together, as they form the core user workflow.
# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.