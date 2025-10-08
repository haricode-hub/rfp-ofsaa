import warnings
warnings.filterwarnings("ignore", category=UserWarning)

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3505",
        "http://192.168.2.95:3505",
    ],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8505, reload=True)