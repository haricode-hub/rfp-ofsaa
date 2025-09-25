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
    allow_origins=["http://localhost:3000", "https://localhost:3001"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

converter = DocumentConverter()

class ChatRequest(BaseModel):
    query: str
    context: str = ""
    canvas_content: str = ""

@app.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    try:
        # Validate file type
        allowed_types = {
            'application/pdf': '.pdf',
            'application/msword': '.doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
            'text/plain': '.txt',
            'text/markdown': '.md',
            'application/vnd.ms-excel': '.xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
            'application/vnd.ms-powerpoint': '.ppt',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx'
        }
        
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

        content = await file.read()

        # Handle txt and md files directly with open()
        if file.content_type in ['text/plain', 'text/markdown']:
            try:
                # Decode text content directly
                text_content = content.decode('utf-8')
                return {
                    "filename": file.filename,
                    "content": text_content,
                    "status": "success"
                }
            except UnicodeDecodeError:
                raise HTTPException(status_code=400, detail="Unable to decode text file. Please ensure it's UTF-8 encoded.")

        # For other file types, use Docling conversion
        suffix = allowed_types.get(file.content_type, '')

        # Create temp file and close it immediately to avoid Windows file locking issues
        temp_fd, temp_file_path = tempfile.mkstemp(suffix=suffix)
        try:
            # Write content and close file handle
            with os.fdopen(temp_fd, 'wb') as temp_file:
                temp_file.write(content)

            # Convert document using docling (file handle is now closed)
            result = converter.convert(temp_file_path)
            markdown_content = result.document.export_to_markdown()

            return {
                "filename": file.filename,
                "content": markdown_content,
                "status": "success"
            }

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error converting document: {str(e)}")

        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/chat")
async def chat_with_ai(request: ChatRequest):
    try:
        return StreamingResponse(
            ai_service.generate_chat_stream(
                query=request.query,
                context=request.context,
                canvas_content=request.canvas_content
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
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)