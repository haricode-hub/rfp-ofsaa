import warnings
warnings.filterwarnings("ignore", category=UserWarning)

from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Response, Cookie
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import secrets
from pathlib import Path
from docling.document_converter import DocumentConverter
import tempfile
import os
import io
import logging
from services.ai_service import ai_service
from services.fsd import fsd_service
from services.presales import presales_service, ProcessRequest

# Configure logging
logger = logging.getLogger(__name__)

# Reduce Docling logging verbosity
logging.getLogger('docling').setLevel(logging.WARNING)
logging.getLogger('docling.document_converter').setLevel(logging.WARNING)
logging.getLogger('docling.pipeline').setLevel(logging.WARNING)
logging.getLogger('docling.datamodel').setLevel(logging.WARNING)
logging.getLogger('docling.models').setLevel(logging.WARNING)
logging.getLogger('docling.utils').setLevel(logging.WARNING)


app = FastAPI(title="Document Converter API", version="1.0.0")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow frontend domains (production and local)
origins = [
    "https://betasenai.jmrinfotech.com",
    "http://betasenai.jmrinfotech.com",
    "http://192.168.2.93:3505",
    "http://192.168.2.95:3505",
    "http://localhost:3505",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # frontend domain
    allow_credentials=True,       # allow cookies/auth
    allow_methods=["*"],          # GET, POST, PUT, DELETE, etc.
    allow_headers=["*"]           # allow all headers
)

# Serve static files from Next.js build output
FRONTEND_DIR = Path(__file__).parent / "frontend" / "out"
if FRONTEND_DIR.exists():
    # Mount static assets (_next directory for JS/CSS bundles)
    app.mount("/_next", StaticFiles(directory=str(FRONTEND_DIR / "_next")), name="next_static")
    logger.info(f"Mounted static assets from {FRONTEND_DIR / '_next'}")
else:
    logger.warning(f"Frontend build directory not found: {FRONTEND_DIR}")
    logger.warning("Run 'cd frontend && bun run build' to generate static files")

# Initialize DocumentConverter with EXTREME speed-optimized settings
try:
    from docling.datamodel.pipeline_options import PdfPipelineOptions, TableStructureOptions
    from docling.document_converter import PdfFormatOption

    # MAXIMUM SPEED pipeline: disable everything except core text extraction
    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_ocr = False  # Skip OCR - 10x faster for text PDFs
    pipeline_options.do_table_structure = False  # Skip table analysis - 3x faster
    pipeline_options.images_scale = 1.0  # Don't upscale images
    pipeline_options.generate_page_images = False  # Skip page image generation
    pipeline_options.generate_picture_images = False  # Skip picture extraction

    converter = DocumentConverter(
        format_options={
            "pdf": PdfFormatOption(pipeline_options=pipeline_options)
        }
    )
    logger.info("DocumentConverter initialized with EXTREME speed PDF pipeline (OCR OFF, Tables OFF)")
except ImportError:
    # Fallback to default if advanced options not available
    converter = DocumentConverter()
    logger.info("DocumentConverter initialized with default settings")

class ChatRequest(BaseModel):
    query: str
    context: str = ""
    canvas_content: str = ""
    enable_web_search: bool = False

# ===============================
# Authentication
# ===============================

# Hardcoded user credentials
USERS = {
    "admin": {
        "email": "admin@jmrinfotech.com",
        "password": "Admin@123"
    }
}

# In-memory session storage
SESSIONS = {}

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/auth/login")
async def login(request: LoginRequest, response: Response):
    """Login endpoint with hardcoded credentials"""
    user = None
    for username, creds in USERS.items():
        if creds["email"] == request.email and creds["password"] == request.password:
            user = username
            break

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Generate session token
    session_token = secrets.token_urlsafe(32)
    SESSIONS[session_token] = {"username": user, "email": request.email}

    # Set session cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        max_age=86400,  # 24 hours
        samesite="lax"
    )

    return {"success": True, "user": {"email": request.email, "username": user}}

@app.post("/api/auth/logout")
async def logout(response: Response, session_token: str = Cookie(None)):
    """Logout endpoint"""
    if session_token and session_token in SESSIONS:
        del SESSIONS[session_token]

    response.delete_cookie(key="session_token")
    return {"success": True, "message": "Logged out successfully"}

@app.get("/api/auth/session")
async def get_session(session_token: str = Cookie(None)):
    """Get current session"""
    if not session_token or session_token not in SESSIONS:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session_data = SESSIONS[session_token]
    return {"authenticated": True, "user": session_data}

@app.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    """Upload single document - optimized for speed"""
    try:
        # Fast file extension extraction
        file_extension = '.' + file.filename.lower().rsplit('.', 1)[-1] if file.filename and '.' in file.filename else ''

        # Supported file extensions
        allowed_extensions = {'.pdf', '.doc', '.docx', '.txt', '.md', '.xls', '.xlsx', '.ppt', '.pptx'}

        # Fast validation
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.filename}. Supported: PDF, DOC, DOCX, TXT, MD, XLS, XLSX, PPT, PPTX"
            )

        # Read file content
        content = await file.read()

        if not content:
            raise HTTPException(status_code=400, detail="File is empty")

        # Fast path for text files - no conversion needed
        if file_extension in {'.txt', '.md'}:
            try:
                return {
                    "filename": file.filename,
                    "content": content.decode('utf-8'),
                    "status": "success"
                }
            except UnicodeDecodeError:
                raise HTTPException(status_code=400, detail="Unable to decode text file. Ensure UTF-8 encoding.")

        # For other file types, use Docling conversion
        # Direct write for maximum speed
        temp_file_path = os.path.join(tempfile.gettempdir(), f"upload_{os.getpid()}_{id(content)}{file_extension}")
        try:
            # Fast binary write
            with open(temp_file_path, 'wb') as f:
                f.write(content)

            # Convert document using optimized Docling pipeline
            result = converter.convert(temp_file_path)
            markdown_content = result.document.export_to_markdown()

            return {
                "filename": file.filename,
                "content": markdown_content,
                "status": "success"
            }

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error converting {file.filename}: {str(e)}")

        finally:
            # Fast cleanup - ignore errors
            try:
                os.unlink(temp_file_path)
            except:
                pass

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/upload-multiple-documents-stream")
async def upload_multiple_documents_stream(files: list[UploadFile] = File(...)):
    """Upload multiple documents with streaming progress updates"""
    import asyncio
    from concurrent.futures import ThreadPoolExecutor
    import json

    async def stream_progress():
        try:
            def process_pdf(file_content: bytes, filename: str) -> tuple[str, str]:
                """Process a single PDF file"""
                with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                    temp_file.write(file_content)
                    temp_path = temp_file.name

                try:
                    result = converter.convert(temp_path)
                    markdown_content = result.document.export_to_markdown()
                    return (filename, markdown_content)
                finally:
                    os.unlink(temp_path)

            # Validate all files first
            for file in files:
                if not file.filename or not file.filename.lower().endswith('.pdf'):
                    yield f"data: {json.dumps({'error': f'Only PDF files are supported. Invalid: {file.filename}'})}\n\n"
                    return

            total_files = len(files)
            yield f"data: {json.dumps({'progress': 0, 'total': total_files, 'message': 'Starting upload...'})}\n\n"

            # Read all files
            file_data = []
            for file in files:
                content = await file.read()
                file_data.append((content, file.filename))

            yield f"data: {json.dumps({'progress': 0, 'total': total_files, 'message': 'Processing PDFs...'})}\n\n"

            # Process PDFs and track progress
            completed_count = 0
            results = []

            with ThreadPoolExecutor(max_workers=min(len(files), 6)) as executor:
                loop = asyncio.get_event_loop()
                futures = [
                    loop.run_in_executor(executor, process_pdf, content, filename)
                    for content, filename in file_data
                ]

                for future in asyncio.as_completed(futures):
                    result = await future
                    results.append(result)
                    completed_count += 1

                    yield f"data: {json.dumps({'progress': completed_count, 'total': total_files, 'message': f'Processed {completed_count}/{total_files} PDFs', 'filename': result[0]})}\n\n"

            # Combine results
            combined_content = ""
            filenames = []
            for filename, markdown_content in results:
                combined_content += f"\n\n## Document: {filename}\n\n{markdown_content}"
                filenames.append(filename)

            final_result = {
                "filename": f"{len(filenames)} documents: {', '.join(filenames)}",
                "content": combined_content,
                "status": "success",
                "done": True
            }

            yield f"data: {json.dumps(final_result)}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': f'Error processing files: {str(e)}'})}\n\n"

    return StreamingResponse(
        stream_progress(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

@app.post("/upload-multiple-documents")
async def upload_multiple_documents(files: list[UploadFile] = File(...)):
    """Upload multiple documents and combine their content - optimized for speed"""
    try:
        import asyncio
        from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
        import mimetypes

        def get_file_extension(filename: str) -> str:
            """Fast file extension extraction"""
            return '.' + filename.lower().rsplit('.', 1)[-1] if '.' in filename else ''

        def process_document(file_content: bytes, filename: str, content_type: str) -> tuple[str, str]:
            """Process a single document file - extreme speed optimization"""
            import time
            start = time.time()

            file_extension = get_file_extension(filename)

            # Fast path for text files - no conversion needed
            if file_extension in {'.txt', '.md'}:
                try:
                    return (filename, file_content.decode('utf-8'))
                except UnicodeDecodeError:
                    raise ValueError(f"Unable to decode {filename}. Ensure UTF-8 encoding.")

            # Validate file is not empty
            if not file_content:
                raise ValueError(f"File {filename} is empty")

            # MIME type to extension mapping
            mime_to_ext = {
                'application/pdf': '.pdf',
                'application/msword': '.doc',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
                'application/vnd.ms-excel': '.xls',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
                'application/vnd.ms-powerpoint': '.ppt',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
            }

            # Determine file suffix - prefer file extension for accuracy
            suffix = file_extension if file_extension in {'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'} else mime_to_ext.get(content_type, file_extension)

            # EXTREME SPEED: Memory-mapped write for large files
            import threading
            temp_path = os.path.join(tempfile.gettempdir(), f"doc_{threading.get_ident()}_{id(file_content)}{suffix}")
            try:
                # Blazing fast binary write with buffer size optimization
                with open(temp_path, 'wb', buffering=8192) as f:
                    f.write(file_content)

                # Convert document using optimized Docling pipeline
                result = converter.convert(temp_path)
                markdown_content = result.document.export_to_markdown()

                elapsed = time.time() - start
                logger.info(f"Converted {filename} in {elapsed:.2f}s ({len(file_content)//1024}KB -> {len(markdown_content)} chars)")

                return (filename, markdown_content)
            except Exception as conv_error:
                raise ValueError(f"Failed to convert {filename}: {str(conv_error)}")
            finally:
                # Ultra-fast cleanup
                try:
                    os.unlink(temp_path)
                except:
                    pass

        # Fast validation - single pass
        allowed_extensions = {'.pdf', '.doc', '.docx', '.txt', '.md', '.xls', '.xlsx', '.ppt', '.pptx'}
        file_data = []

        for file in files:
            if not file.filename:
                raise HTTPException(status_code=400, detail="File missing filename")

            file_ext = get_file_extension(file.filename)
            if file_ext not in allowed_extensions:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type: {file.filename}. Supported: PDF, DOC, DOCX, TXT, MD, XLS, XLSX, PPT, PPTX"
                )

            # Read file content immediately
            content = await file.read()
            file_data.append((content, file.filename, file.content_type or 'application/octet-stream'))

        # Optimize worker count based on file count and CPU cores
        import os as os_module
        cpu_count = os_module.cpu_count() or 4

        # Separate PDFs from other files for optimized processing
        pdf_files = [(c, f, ct) for c, f, ct in file_data if get_file_extension(f) == '.pdf']
        other_files = [(c, f, ct) for c, f, ct in file_data if get_file_extension(f) != '.pdf']

        # EXTREME parallelism for PDFs - Docling is I/O + CPU bound, benefits from massive parallelism
        # Use 4x CPU cores for maximum throughput (Docling releases GIL extensively)
        pdf_workers = min(len(pdf_files), max(cpu_count * 4, 12), 32) if pdf_files else 0
        other_workers = min(len(other_files), cpu_count, 8) if other_files else 0

        all_results = []

        # Process PDFs with EXTREME parallelism
        if pdf_files:
            import time
            start_time = time.time()
            logger.info(f"Processing {len(pdf_files)} PDFs with {pdf_workers} workers (EXTREME mode)")

            with ThreadPoolExecutor(max_workers=pdf_workers, thread_name_prefix="pdf_") as executor:
                loop = asyncio.get_event_loop()
                pdf_results = await asyncio.gather(*[
                    loop.run_in_executor(executor, process_document, content, filename, content_type)
                    for content, filename, content_type in pdf_files
                ], return_exceptions=True)
                all_results.extend(pdf_results)

            elapsed = time.time() - start_time
            logger.info(f"✓ Completed {len(pdf_files)} PDFs in {elapsed:.2f}s ({elapsed/len(pdf_files):.2f}s avg per file)")

        # Process other files
        if other_files:
            with ThreadPoolExecutor(max_workers=other_workers) as executor:
                loop = asyncio.get_event_loop()
                other_results = await asyncio.gather(*[
                    loop.run_in_executor(executor, process_document, content, filename, content_type)
                    for content, filename, content_type in other_files
                ], return_exceptions=True)
                all_results.extend(other_results)

        # Reconstruct file_data in same order as results
        ordered_file_data = pdf_files + other_files
        results = all_results

        # Separate successful results from errors
        errors = []
        successful_results = []

        for i, result in enumerate(results):
            if isinstance(result, Exception):
                errors.append(f"{ordered_file_data[i][1]}: {str(result)}")
            else:
                successful_results.append(result)

        # Handle errors
        if errors:
            error_msg = "Failed to process some files:\n" + "\n".join(errors)
            if not successful_results:
                raise HTTPException(status_code=400, detail=error_msg)
            logger.warning(error_msg)

        # Combine results efficiently using list comprehension
        combined_content = "\n\n".join(
            f"## Document: {filename}\n\n{markdown_content}"
            for filename, markdown_content in successful_results
        )
        filenames = [filename for filename, _ in successful_results]

        response_data = {
            "filename": f"{len(filenames)} documents: {', '.join(filenames)}",
            "content": combined_content,
            "status": "success"
        }

        if errors:
            response_data["warnings"] = errors
            response_data["partial_success"] = True

        return response_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing files: {str(e)}")

@app.post("/chat")
async def chat_with_ai(request: ChatRequest):
    try:
        return StreamingResponse(
            ai_service.generate_chat_stream(
                query=request.query,
                context=request.context,
                canvas_content=request.canvas_content,
                enable_web_search=request.enable_web_search
            ),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream"
            }
        )
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing chat request: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# ===============================
# FSD Agent Endpoints
# ===============================


@app.get("/fsd/download/{document_id}")
async def download_fsd_document(document_id: str):
    """Download generated FSD document"""
    try:
        document_bytes = fsd_service.get_document(document_id)

        return StreamingResponse(
            io.BytesIO(document_bytes),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": "attachment; filename=fsd_document.docx"}
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download error: {str(e)}")

@app.get("/fsd/token-usage")
async def get_fsd_token_usage():
    """Get FSD service token usage statistics"""
    return fsd_service.get_token_usage_stats()

@app.post("/fsd/generate-from-document")
async def generate_fsd_from_document(
    file: UploadFile = File(...),
    additional_context: str = Form(default="")
):
    """Generate FSD document from uploaded PDF/DOCX file with optional additional context"""
    try:
        # Validate file type
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")

        file_extension = file.filename.lower().split('.')[-1]
        if file_extension not in ['pdf', 'docx', 'doc']:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type. Only PDF and DOCX files are supported."
            )

        # Read file content
        file_content = await file.read()
        if not file_content:
            raise HTTPException(status_code=400, detail="File is empty")

        # Generate FSD using the enhanced document analysis
        result = await fsd_service.generate_fsd_from_document_upload(
            file_content,
            file.filename,
            additional_context
        )

        if result.success:
            return {
                "success": True,
                "message": result.message,
                "document_id": result.document_id,
                "token_usage": result.token_usage,
                "filename": file.filename
            }
        else:
            raise HTTPException(status_code=500, detail=result.message)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in generate_fsd_from_document endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/fsd/clear-cache")
async def clear_fsd_cache():
    """Clear FSD service document cache"""
    return fsd_service.clear_cache()

# ===============================
# Presales Agent Endpoints
# ===============================

@app.post("/presales/upload")
async def upload_presales_file(file: UploadFile = File(...)):
    """Upload Excel file for presales RFP analysis"""
    try:
        # Validate file type
        if not file.filename.lower().endswith((".xlsx", ".xls")):
            raise HTTPException(status_code=400, detail="Only .xlsx and .xls files are supported")

        content = await file.read()
        result = await presales_service.upload_file(content, file.filename)

        return {
            "filename": result.filename,
            "columns": result.columns,
            "row_count": result.row_count,
            "original_filename": result.original_filename,
            "message": "File uploaded successfully for presales analysis"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")

@app.post("/presales/process")
async def process_presales_data(request: ProcessRequest):
    """Process Excel data with Oracle banking solution analysis"""
    try:
        result = await presales_service.process_excel(request)
        return {
            "file_id": result.file_id,
            "message": result.message,
            "processing_stats": result.processing_stats,
            "processing_complete": result.processing_complete
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

@app.get("/presales/download/{file_id}")
async def download_presales_file(file_id: str):
    """Download processed presales Excel file"""
    try:
        file_content = presales_service.get_processed_file(file_id)
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=presales_analysis.xlsx"}
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download error: {str(e)}")

@app.get("/presales/cache-stats")
async def get_presales_cache_stats():
    """Get presales service cache statistics"""
    return presales_service.get_cache_stats()

@app.post("/presales/clear-cache")
async def clear_presales_cache():
    """Clear presales service cache"""
    return presales_service.clear_cache()

# ===============================
# Frontend Static File Routes
# ===============================

@app.get("/login")
async def serve_login():
    """Serve the login page"""
    login_path = FRONTEND_DIR / "login.html"
    if login_path.exists():
        return FileResponse(str(login_path))
    raise HTTPException(status_code=404, detail="Login page not found")

def check_auth(session_token: str = Cookie(None)):
    """Check if user is authenticated"""
    if not session_token or session_token not in SESSIONS:
        return False
    return True

@app.get("/")
async def serve_index(session_token: str = Cookie(None)):
    """Serve the main index page (protected)"""
    if not check_auth(session_token):
        login_path = FRONTEND_DIR / "login.html"
        if login_path.exists():
            return FileResponse(str(login_path))
        raise HTTPException(status_code=404, detail="Login page not found")

    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    raise HTTPException(status_code=404, detail="Frontend not built. Run: cd frontend && bun run build")

@app.get("/chat")
async def serve_chat(session_token: str = Cookie(None)):
    """Serve the chat page (protected)"""
    if not check_auth(session_token):
        login_path = FRONTEND_DIR / "login.html"
        if login_path.exists():
            return FileResponse(str(login_path))
        raise HTTPException(status_code=404, detail="Login page not found")

    chat_path = FRONTEND_DIR / "chat.html"
    if chat_path.exists():
        return FileResponse(str(chat_path))
    raise HTTPException(status_code=404, detail="Chat page not found")

@app.get("/presales")
async def serve_presales(session_token: str = Cookie(None)):
    """Serve the presales page (protected)"""
    if not check_auth(session_token):
        login_path = FRONTEND_DIR / "login.html"
        if login_path.exists():
            return FileResponse(str(login_path))
        raise HTTPException(status_code=404, detail="Login page not found")

    presales_path = FRONTEND_DIR / "presales.html"
    if presales_path.exists():
        return FileResponse(str(presales_path))
    raise HTTPException(status_code=404, detail="Presales page not found")

@app.get("/fsd")
async def serve_fsd(session_token: str = Cookie(None)):
    """Serve the FSD page (protected)"""
    if not check_auth(session_token):
        login_path = FRONTEND_DIR / "login.html"
        if login_path.exists():
            return FileResponse(str(login_path))
        raise HTTPException(status_code=404, detail="Login page not found")

    fsd_path = FRONTEND_DIR / "fsd.html"
    if fsd_path.exists():
        return FileResponse(str(fsd_path))
    raise HTTPException(status_code=404, detail="FSD page not found")

# Serve .txt files (Next.js static export metadata)
@app.get("/{filename}.txt")
async def serve_txt_files(filename: str):
    """Serve Next.js .txt metadata files"""
    txt_path = FRONTEND_DIR / f"{filename}.txt"
    if txt_path.exists():
        return FileResponse(str(txt_path), media_type="text/plain")
    raise HTTPException(status_code=404, detail="File not found")

# Serve favicon and other static assets
@app.get("/favicon.ico")
async def serve_favicon():
    """Serve favicon"""
    favicon_path = FRONTEND_DIR / "favicon.ico"
    if favicon_path.exists():
        return FileResponse(str(favicon_path), media_type="image/x-icon")
    raise HTTPException(status_code=404, detail="Favicon not found")

if __name__ == "__main__":
    import uvicorn
    # Production: Run on 0.0.0.0:3505 (accessible on 192.168.2.93:3505)
    # Development: Run on 0.0.0.0:8505
    import os
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "3505"))
    reload = os.getenv("RELOAD", "false").lower() == "true"

    uvicorn.run("main:app", host=host, port=port, reload=reload)