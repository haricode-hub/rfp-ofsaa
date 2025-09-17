"""
Presales Agent Service - Excel-based RFP Analysis for Oracle Banking Solutions

This service provides comprehensive analysis of RFP requirements against Oracle banking solutions
including FLEXCUBE, OFSAA, OBP, Digital Banking, and related Oracle technologies.
"""

from typing import List, Dict, Any, Optional
import pandas as pd
import io
import os
import uuid
import asyncio
import textwrap
from datetime import datetime
from dotenv import load_dotenv
import re
import json
import time
from openpyxl.utils import get_column_letter
from openpyxl.styles import Alignment, Font, PatternFill
from openai import AsyncOpenAI
import mcp
from mcp.client.streamable_http import streamablehttp_client
from mcp.shared.exceptions import McpError
from functools import lru_cache
import hashlib
from concurrent.futures import ThreadPoolExecutor
from loguru import logger
from pydantic import BaseModel

# Load environment variables
load_dotenv()

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SMITHERY_API_KEY = os.getenv("SMITHERY_API_KEY")
SMITHERY_PROFILE = os.getenv("SMITHERY_PROFILE")

# Validate required environment variables
if not OPENAI_API_KEY:
    logger.error("Missing OPENAI_API_KEY in .env file")
    raise EnvironmentError("Missing OPENAI_API_KEY in .env file")

if not SMITHERY_API_KEY or not SMITHERY_PROFILE:
    logger.warning("Missing SMITHERY_API_KEY or SMITHERY_PROFILE - web search will be disabled")

# Initialize OpenAI client with optimized settings
client = AsyncOpenAI(
    api_key=OPENAI_API_KEY,
    max_retries=3,
    timeout=30.0
) if OPENAI_API_KEY else None

# Smithery.ai Exa Search configuration
EXA_URL = f"https://server.smithery.ai/exa/mcp?api_key={SMITHERY_API_KEY}&profile={SMITHERY_PROFILE}" if SMITHERY_API_KEY and SMITHERY_PROFILE else None
EXA_TOOL = "web_search_exa"

# Performance configurations
MODEL_NAME = "gpt-4o-mini"
MAX_CONCURRENT_REQUESTS = 10
BATCH_SIZE = 5
RATE_LIMIT_DELAY = 0.1
MAX_RETRIES = 3
CACHE_SIZE = 1000

# Pydantic models
class ProcessRequest(BaseModel):
    input_columns: List[str]
    output_columns: List[str]
    filename: str
    user_prompt: str = ""

class UploadResponse(BaseModel):
    filename: str
    columns: List[str]
    row_count: int
    original_filename: str

class ProcessResponse(BaseModel):
    file_id: str
    message: str
    processing_stats: Dict[str, Any]
    processing_complete: bool

# Cache for search results
search_cache: Dict[str, Dict[str, Any]] = {}
semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)

class PresalesAgentService:
    """Enhanced Presales Agent Service for Oracle Banking Solution Analysis"""

    def __init__(self):
        self.temp_files: Dict[str, bytes] = {}
        self.processed_files: Dict[str, bytes] = {}

    def get_cache_key(self, query: str) -> str:
        """Generate cache key for search queries"""
        return hashlib.md5(query.lower().strip().encode()).hexdigest()

    def analyze_source_type(self, url: str) -> str:
        """Categorize source types for better analysis"""
        url_lower = url.lower()
        if 'oracle.com' in url_lower:
            if 'docs.oracle.com' in url_lower:
                return "Official Oracle Documentation"
            elif 'support.oracle.com' in url_lower:
                return "Oracle Support Resources"
            elif 'blogs.oracle.com' in url_lower:
                return "Oracle Technical Blogs"
            else:
                return "Oracle Official Website"
        elif any(domain in url_lower for domain in ['github.com', 'stackoverflow.com']):
            return "Developer Community Resources"
        elif any(domain in url_lower for domain in ['.edu', 'research', 'academic']):
            return "Academic/Research Resources"
        elif any(domain in url_lower for domain in ['techcrunch', 'zdnet', 'computerweekly', 'itworld', 'finextra']):
            return "Technology News/Analysis"
        elif 'banking' in url_lower or 'financial' in url_lower:
            return "Banking/Financial Industry Resources"
        else:
            return "Industry/Technical Articles"

    async def exa_search(self, query: str, row_index: Optional[int] = None) -> Dict[str, Any]:
        """Enhanced web search with comprehensive source tracking"""
        if not EXA_URL:
            return {
                "content": "Web search unavailable - missing Smithery API configuration",
                "sources": [],
                "source_types": [],
                "evidence_strength": "None",
                "oracle_sources": 0,
                "community_sources": 0
            }

        cache_key = self.get_cache_key(query)

        # Check cache first
        if cache_key in search_cache:
            if row_index is not None:
                logger.debug(f"Row {row_index + 1} - Using cached search for: '{query[:50]}...'")
            return search_cache[cache_key]

        async with semaphore:
            try:
                await asyncio.sleep(RATE_LIMIT_DELAY)

                async with streamablehttp_client(EXA_URL) as (r, w, _):
                    async with mcp.ClientSession(r, w) as s:
                        await s.initialize()
                        tools = [t.name for t in (await s.list_tools()).tools]

                        if EXA_TOOL not in tools:
                            result = {
                                "content": f"Error: Exa search tool not available. Found: {tools}",
                                "sources": [],
                                "source_types": [],
                                "evidence_strength": "None",
                                "oracle_sources": 0,
                                "community_sources": 0
                            }
                            search_cache[cache_key] = result
                            return result

                        try:
                            res = await s.call_tool(EXA_TOOL, {"query": query})
                        except McpError as e:
                            result = {
                                "content": f"Exa search error: {str(e)}",
                                "sources": [],
                                "source_types": [],
                                "evidence_strength": "None",
                                "oracle_sources": 0,
                                "community_sources": 0
                            }
                            search_cache[cache_key] = result
                            return result

                        data = None
                        if hasattr(res, 'content') and res.content:
                            data = res.content
                        elif hasattr(res, 'output') and res.output:
                            data = res.output
                        elif hasattr(res, 'result') and res.result:
                            data = res.result

                        if not data:
                            result = {
                                "content": "No web search results found.",
                                "sources": [],
                                "source_types": [],
                                "evidence_strength": "None",
                                "oracle_sources": 0,
                                "community_sources": 0
                            }
                            search_cache[cache_key] = result
                            return result

                        # Process search results (simplified for integration)
                        results = []
                        urls_found = []
                        source_types = []

                        # Extract and process search data
                        if isinstance(data, list):
                            for i, item in enumerate(data[:5], 1):
                                if hasattr(item, 'text'):
                                    results.append(f"{i}. {item.text[:400]}")
                                elif isinstance(item, dict):
                                    title = item.get("title", "No title")
                                    snippet = item.get("snippet", "")
                                    url = item.get("url", "")
                                    if url:
                                        urls_found.append(url)
                                        source_types.append(self.analyze_source_type(url))
                                    results.append(f"{i}. {title}\n   {snippet[:300]}")

                        # Analyze source quality
                        oracle_sources = len([url for url in urls_found if 'oracle.com' in url.lower()])
                        community_sources = len([url for url in urls_found if 'oracle.com' not in url.lower()])

                        # Determine evidence strength
                        evidence_strength = "None"
                        if oracle_sources >= 2:
                            evidence_strength = "High"
                        elif oracle_sources >= 1 or (community_sources >= 3):
                            evidence_strength = "Moderate"
                        elif urls_found:
                            evidence_strength = "Limited"

                        final_content = "\n\n".join(results) if results else "No meaningful search results found."

                        result = {
                            "content": final_content,
                            "sources": urls_found,
                            "source_types": source_types,
                            "evidence_strength": evidence_strength,
                            "oracle_sources": oracle_sources,
                            "community_sources": community_sources
                        }

                        if len(search_cache) < CACHE_SIZE:
                            search_cache[cache_key] = result

                        return result

            except Exception as e:
                error_msg = f"Web search failed: {str(e)}"
                logger.exception(f"Search error for query: {query}")

                result = {
                    "content": error_msg,
                    "sources": [],
                    "source_types": [],
                    "evidence_strength": "Error",
                    "oracle_sources": 0,
                    "community_sources": 0
                }
                search_cache[cache_key] = result
                return result

    async def call_openai(self, messages: list, max_tokens: int = 1200, retry_count: int = 0) -> str:
        """Optimized OpenAI API call with retry logic"""
        if not client:
            return "OpenAI client not available - missing API key"

        try:
            response = await client.chat.completions.create(
                model=MODEL_NAME,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.1,
                frequency_penalty=0.2,
                presence_penalty=0.1
            )
            return response.choices[0].message.content
        except Exception as e:
            if retry_count < MAX_RETRIES:
                logger.warning(f"OpenAI API retry {retry_count + 1}/{MAX_RETRIES}: {str(e)}")
                await asyncio.sleep(2 ** retry_count)
                return await self.call_openai(messages, max_tokens, retry_count + 1)
            else:
                logger.error(f"OpenAI API call failed after {MAX_RETRIES} retries: {str(e)}")
                return f"OpenAI API call failed after {MAX_RETRIES} retries: {str(e)}"

    async def upload_file(self, file_content: bytes, filename: str) -> UploadResponse:
        """Process uploaded Excel file and return metadata"""
        try:
            if len(file_content) > 100 * 1024 * 1024:
                raise ValueError("File exceeds 100MB limit")
            if not filename.lower().endswith((".xlsx", ".xls")):
                raise ValueError("Only .xlsx and .xls files are supported")

            df = pd.read_excel(io.BytesIO(file_content), engine="openpyxl")
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            temp_filename = f"temp_{timestamp}_{filename}"

            self.temp_files[temp_filename] = file_content

            return UploadResponse(
                filename=temp_filename,
                columns=df.columns.tolist(),
                row_count=len(df),
                original_filename=filename
            )

        except Exception as e:
            raise ValueError(f"Upload error: {str(e)}")

    def extract_column_values(self, text: str, output_cols: List[str], search_info: Dict[str, Any]) -> Dict[str, str]:
        """Enhanced column value extraction with response-specific formatting"""
        column_mapping = {
            "RESPONSE": "TENDERER'S RESPONSE",
            "REMARK": "TENDERER'S REMARK",
            "COMPLIANCE": "TENDERER'S RESPONSE",
            "COMMENT": "TENDERER'S REMARK",
            "VENDOR RESPONSE": "VENDOR RESPONSE",
            "VENDOR REMARKS": "VENDOR REMARKS",
            "VENDOR COMMENTS": "VENDOR REMARKS",
            "ANSWER": "ANSWER",
            "NOTES": "NOTES",
            "TENDERER'S RESPONSE": "TENDERER'S RESPONSE",
            "TENDERER'S REMARK": "TENDERER'S REMARK"
        }

        results = {col: "" for col in output_cols}
        current_col = None
        buffer = []
        explanation = ""

        lines = text.splitlines()

        for line in lines:
            line = line.strip()
            if not line:
                continue

            if line.upper().startswith("EXPLANATION:"):
                explanation = line.split(":", 1)[1].strip() if ":" in line else ""
                continue

            match = re.match(r"^([A-Za-z_'\s]+)\s*:\s*(.*)", line, re.IGNORECASE)
            if match:
                if current_col and current_col in results:
                    results[current_col] = "\n".join(buffer).strip()

                raw_col = match.group(1).strip().upper()
                current_col = column_mapping.get(raw_col, raw_col)

                if current_col not in output_cols:
                    for output_col in output_cols:
                        if any(key in raw_col for key in ["RESPONSE", "ANSWER", "COMPLIANCE"]) and any(key in output_col for key in ["RESPONSE", "ANSWER", "COMPLIANCE"]):
                            current_col = output_col
                            break
                        elif any(key in raw_col for key in ["REMARK", "COMMENT", "NOTES"]) and any(key in output_col for key in ["REMARK", "COMMENT", "NOTES"]):
                            current_col = output_col
                            break

                    if current_col not in output_cols:
                        current_col = None
                        continue

                buffer = [match.group(2).strip()]
            elif current_col:
                buffer.append(line)

        if current_col and current_col in results:
            results[current_col] = "\n".join(buffer).strip()

        # Fill empty columns with appropriate content
        for col in output_cols:
            if not results[col].strip():
                if any(keyword in col.upper() for keyword in ["RESPONSE", "ANSWER", "COMPLIANCE"]):
                    results[col] = "Not found"
                elif any(keyword in col.upper() for keyword in ["REMARK", "COMMENT", "NOTES"]):
                    results[col] = "Based on comprehensive analysis of available Oracle documentation and industry resources, specific information regarding this requirement could not be definitively established."

        # Apply conditional formatting based on response value
        response_col = None
        remark_col = None

        for col in output_cols:
            if any(keyword in col.upper() for keyword in ["RESPONSE", "ANSWER", "COMPLIANCE"]):
                response_col = col
            elif any(keyword in col.upper() for keyword in ["REMARK", "COMMENT", "NOTES"]):
                remark_col = col

        if response_col and remark_col and results[response_col]:
            response_value = results[response_col].strip().lower()

            if response_value == "yes":
                if explanation:
                    results[remark_col] = explanation
                else:
                    results[remark_col] = "Oracle FLEXCUBE provides the required functionality as part of its core banking capabilities."

            elif response_value == "partially":
                if explanation:
                    results[remark_col] = explanation
                else:
                    results[remark_col] = "Oracle FLEXCUBE provides partial support for this requirement with some limitations or additional configuration needed."

            elif response_value == "no":
                if explanation:
                    results[remark_col] = explanation
                else:
                    results[remark_col] = "Based on available Oracle FLEXCUBE documentation and capabilities analysis, this specific requirement is not supported by the current platform architecture."

            elif response_value == "not found":
                if explanation:
                    results[remark_col] = explanation
                else:
                    results[remark_col] = "Comprehensive analysis of available Oracle documentation and industry resources could not identify specific information regarding this requirement. Further clarification with Oracle technical teams may be required."
        else:
            if remark_col and explanation:
                results[remark_col] = explanation

        return results

    async def process_excel(self, request: ProcessRequest) -> ProcessResponse:
        """Process Excel file with Oracle banking solution analysis"""
        try:
            if request.filename not in self.temp_files:
                raise ValueError("File not found. Please upload again.")

            contents = self.temp_files[request.filename]
            df = pd.read_excel(io.BytesIO(contents), engine="openpyxl")
            df.reset_index(drop=True, inplace=True)

            # Normalize column names
            df.columns = [col.strip().upper() for col in df.columns]
            input_cols = [col.strip().upper() for col in request.input_columns]
            output_cols = [col.strip().upper() for col in request.output_columns]

            # Add output columns if they don't exist
            for col in output_cols:
                if col not in df.columns:
                    df[col] = ""

            # Enhanced System prompt for Oracle banking solutions analysis
            system_prompt = """
You are an expert AI assistant specializing in Oracle banking solutions and procurement analysis for the BFSI sector.
You provide evidence-based, unbiased assessments of technical requirements against Oracle capabilities including
FLEXCUBE, OFSAA, OBP, Digital Banking, and related Oracle banking technologies.

Evaluate each requirement independently and provide decisive responses:
- Yes: Strong evidence of full support
- Partially: Clear evidence of limited/conditional support
- No: Strong evidence of no support or incompatibility
- Not found: Insufficient evidence for determination

Generate professional, descriptive explanations as a subject matter expert.
"""

            async def process_row_async(index: int, row: pd.Series) -> tuple[int, Dict[str, str]]:
                """Process a single row with comprehensive analysis"""
                start_time = time.time()

                try:
                    # Extract input data
                    input_data = {}
                    for col in input_cols:
                        if col in row and pd.notna(row[col]):
                            val = str(row[col]).strip()
                            if val:
                                input_data[col] = val

                    input_text = " ".join(input_data.values())
                    word_count = len(input_text.split())

                    if word_count < 5:
                        logger.warning(f"Row {index + 1}: Skipped - insufficient content for analysis")
                        return index, {col: "Insufficient content for analysis" for col in output_cols}

                    # Create search query
                    key_terms = []
                    for val in input_data.values():
                        words = [w for w in val.split() if len(w) > 3][:150]
                        key_terms.extend(words)

                    search_query = f"oracle flexcube {' '.join(key_terms[:100])}"

                    # Get search results
                    search_results = await self.exa_search(search_query, row_index=index)

                    # Process search content
                    search_content = search_results.get("content", "") if isinstance(search_results, dict) else str(search_results)
                    sources = search_results.get("sources", []) if isinstance(search_results, dict) else []

                    # Optimize content length
                    if len(search_content) > 4000:
                        search_content = search_content[:4000] + "... (content truncated for processing efficiency)"

                    # Create AI prompt
                    input_text_prompt = "\n".join([f"{k}: {v[:300]}" for k, v in input_data.items()])

                    full_prompt = f"""{system_prompt}

User Instructions: {request.user_prompt}

Excel Input Requirement:
{input_text_prompt}

Web Search Results:
{search_content}

Required Output Columns: {', '.join(output_cols)}

Provide structured response with column names and values, plus an EXPLANATION section.
"""

                    messages = [
                        {"role": "system", "content": "You are an expert Oracle banking solutions analyst. Provide evidence-based, unbiased assessments."},
                        {"role": "user", "content": full_prompt}
                    ]

                    ai_response = await self.call_openai(messages, max_tokens=1200)

                    # Extract column values
                    search_info = {
                        "sources": sources,
                        "evidence_strength": search_results.get("evidence_strength", "None") if isinstance(search_results, dict) else "None"
                    }
                    result = self.extract_column_values(ai_response, output_cols, search_info)

                    elapsed = time.time() - start_time
                    logger.info(f"Row {index + 1} processed in {elapsed:.2f}s")

                    return index, result

                except Exception as e:
                    logger.exception(f"Processing error for row {index + 1}")
                    error_result = {col: f"Processing error: {str(e)[:150]}..." for col in output_cols}
                    return index, error_result

            # Process all rows
            logger.info(f"Starting processing of {len(df)} rows")

            for batch_start in range(0, len(df), BATCH_SIZE):
                batch_end = min(batch_start + BATCH_SIZE, len(df))
                batch_rows = list(range(batch_start, batch_end))

                batch_tasks = []
                for idx in batch_rows:
                    task = process_row_async(idx, df.iloc[idx])
                    batch_tasks.append(task)

                batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)

                # Update DataFrame with results
                for result in batch_results:
                    if isinstance(result, Exception):
                        logger.error(f"Batch error: {result}")
                        continue

                    idx, row_results = result
                    for col, val in row_results.items():
                        df.at[idx, col] = val

                logger.info(f"Completed batch {batch_end}/{len(df)} rows")

            # Generate Excel file
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Presales Analysis')
                worksheet = writer.sheets['Presales Analysis']

                # Enhanced styling
                header_font = Font(bold=True, color='FFFFFF', size=12)
                header_fill = PatternFill("solid", fgColor="2F5597")

                for col_num, column_title in enumerate(df.columns, 1):
                    col_letter = get_column_letter(col_num)
                    header_cell = worksheet[f"{col_letter}1"]
                    header_cell.font = header_font
                    header_cell.fill = header_fill

                    # Set column widths
                    if any(keyword in column_title.upper() for keyword in ["REMARK", "COMMENT", "NOTES"]):
                        worksheet.column_dimensions[col_letter].width = 80
                    elif any(keyword in column_title.upper() for keyword in ["RESPONSE", "ANSWER", "COMPLIANCE"]):
                        worksheet.column_dimensions[col_letter].width = 25
                    else:
                        worksheet.column_dimensions[col_letter].width = 30

                # Format rows
                max_display_rows = min(1000, worksheet.max_row)
                for row_idx in range(2, max_display_rows + 1):
                    worksheet.row_dimensions[row_idx].height = 80
                    for col_idx in range(1, len(df.columns) + 1):
                        cell = worksheet.cell(row=row_idx, column=col_idx)
                        cell.alignment = Alignment(wrap_text=True, vertical="top", horizontal="left")

            output.seek(0)
            file_id = str(uuid.uuid4())
            self.processed_files[file_id] = output.getvalue()

            # Cleanup temporary files
            if request.filename in self.temp_files:
                del self.temp_files[request.filename]

            return ProcessResponse(
                file_id=file_id,
                message=f"✅ Presales analysis completed successfully - {len(df)} rows analyzed",
                processing_stats={
                    "total_rows": len(df),
                    "cache_entries": len(search_cache),
                    "enhancement_features": [
                        "Oracle banking solution analysis",
                        "Evidence-based assessment",
                        "Professional RFP responses"
                    ]
                },
                processing_complete=True
            )

        except Exception as e:
            logger.exception(f"Processing error: {str(e)}")
            raise ValueError(f"Processing error: {str(e)}")

    def get_processed_file(self, file_id: str) -> bytes:
        """Retrieve processed file by ID"""
        if file_id not in self.processed_files:
            raise ValueError("File not found or expired")
        return self.processed_files[file_id]

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get detailed cache statistics"""
        if not search_cache:
            return {"message": "Cache is empty"}

        total_entries = len(search_cache)
        entries_with_sources = sum(1 for v in search_cache.values() if isinstance(v, dict) and len(v.get('sources', [])) > 0)
        total_sources = sum(len(v.get('sources', [])) for v in search_cache.values() if isinstance(v, dict))

        return {
            "cache_overview": {
                "total_entries": total_entries,
                "entries_with_sources": entries_with_sources,
                "success_rate": f"{(entries_with_sources/total_entries)*100:.1f}%" if total_entries > 0 else "0%"
            },
            "source_analysis": {
                "total_sources": total_sources,
                "average_sources_per_entry": f"{total_sources/max(1, entries_with_sources):.1f}"
            }
        }

    def clear_cache(self) -> Dict[str, Any]:
        """Clear the search cache"""
        global search_cache
        cache_size = len(search_cache)
        search_cache.clear()
        return {
            "message": "Cache cleared successfully",
            "entries_removed": cache_size
        }

# Global instance
presales_service = PresalesAgentService()