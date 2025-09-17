from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from docling.document_converter import DocumentConverter
import tempfile
import os
import io
from services.ai_service import ai_service
from services.fsd import fsd_service, FSDRequest

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
        
        # Create temporary file
        suffix = allowed_types.get(file.content_type, '')
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file.flush()
            
            try:
                # Convert document using docling
                result = converter.convert(temp_file.name)
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
                os.unlink(temp_file.name)
                
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

@app.post("/fsd/generate")
async def generate_fsd_document(request: FSDRequest):
    """Generate Functional Specification Document"""
    try:
        result = await fsd_service.generate_fsd_document(request)

        if not result.success:
            raise HTTPException(status_code=500, detail=result.message)

        return {
            "success": result.success,
            "message": result.message,
            "token_usage": result.token_usage,
            "document_id": result.document_id
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FSD generation error: {str(e)}")

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

@app.post("/fsd/clear-cache")
async def clear_fsd_cache():
    """Clear FSD service document cache"""
    return fsd_service.clear_cache()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)