# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RFP OFSAA is a document analysis application with AI-powered chat functionality and specialized agent services. It consists of a **FastAPI backend** (Python 3.13) for document processing and AI integration, and a **Next.js 15 frontend** (React 19) with a sophisticated markdown canvas interface.

**Core Architecture:**
- **Backend**: FastAPI server with document conversion (via Docling) and OpenAI/OpenRouter integration
- **Frontend**: Next.js with custom components for document display, text selection, and real-time markdown editing
- **Document Flow**: Upload → Convert to Markdown → Display → Text Selection → AI Chat → Canvas Integration
- **Agent Services**: Specialized services for Oracle banking solutions analysis and document generation

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
│   └── layout.tsx              # App layout and metadata
├── components/
│   ├── DocumentDisplay.tsx     # Document viewer with text selection
│   ├── MarkdownCanvas.tsx      # Smart markdown editor with preview mode
│   ├── TextSelectionToolbar.tsx # Floating toolbar for selected text
│   ├── MarkdownRenderer.tsx    # Markdown preview component
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
- **OPENAI_API_KEY**: Required for AI functionality
- **OPENROUTER_API_KEY**: Primary API key for AI service
- Backend runs on `0.0.0.0:8000`, frontend on `localhost:3000`

### Document Conversion
- **Docling Integration**: Main conversion engine in `main.py:27-72`
- **File Validation**: MIME type checking against allowed formats
- **Temp File Handling**: Automatic cleanup after conversion

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

## Testing and Quality

### Linting Configuration
- **Backend**: Ruff for Python code quality
- **Frontend**: ESLint with Next.js configuration
- **TypeScript**: Strict mode enabled

### API Testing
- **Health Check**: `GET /health` for service status
- **Upload Test**: Use supported file formats via `/upload-document`
- **Chat Test**: Stream endpoint at `/chat` with query/context
- **API Documentation**: Available at `http://localhost:8000/docs`

## Development Notes

### File Upload Constraints
- **Size**: No explicit limit set (handled by FastAPI defaults)
- **Types**: Strictly validated against MIME type whitelist
- **Processing**: Synchronous conversion (may need async for large files)

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

When working on this codebase, always test both document upload and AI chat functionality together, as they form the core user workflow.