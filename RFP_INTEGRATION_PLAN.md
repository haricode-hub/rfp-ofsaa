# RFP Integration Plan for rfp-ofsaa

## Overview
- **Goal**: Merge RFP-to-JMR FastAPI backend logic (from `rfp-to-jmr-fastapi`) into `rfp-ofsaa/services` as modular services, centered around a new `rfp.py` service. Extend presales flow to include two options: (1) existing presale agent, (2) new RFP processing using the integrated services. Preserve all current structure, routes, and flows in `rfp-ofsaa` (e.g., no changes to `presales.py`, `main.py`, or frontend navigation). Once integrated, `rfp-to-jmr-fastapi` can be deleted.
- **Constraints**: No breaking changes—existing endpoints, auth, and UI remain functional. Use existing patterns (e.g., Pydantic models, async services). Add dependencies from `pyproject.toml` in `rfp-to-jmr-fastapi` (e.g., `python-docx`, `structlog`) to `rfp-ofsaa/pyproject.toml`. Copy templates to `rfp-ofsaa/templates/`. Ensure Ollama integration aligns with existing AI services.
- **Phases**: Backend first (modular services), then frontend (UI extension), testing, and verification. All changes isolated to new files/endpoints.

## Backend Plan
1. **Dependency & Config Setup** (No code changes yet):
   - Merge `rfp-to-jmr-fastapi/pyproject.toml` and `uv.lock` into `rfp-ofsaa/pyproject.toml` (add RFP-specific deps like `python-docx`, `pypdf`, `structlog`; resolve conflicts with existing deps).
   - Copy `.env.example` contents (e.g., OLLAMA_*, ORG_* vars) to `rfp-ofsaa/.env.example`; update `rfp-ofsaa/config.py` (if exists) or create one mirroring `rfp-to-jmr-fastapi/app/config.py`.
   - Copy `templates/project Oasis - Infra Proposal - v1.2.docx` to `rfp-ofsaa/templates/`.
   - Exclude: No `routes/`, `main.py`, or top-level files from `rfp-to-jmr-fastapi`—integrate logic only.

2. **Service Integration** (Add to `rfp-ofsaa/services/`):
   - Create `rfp.py`: Core service combining `rfp_analyzer.py`, `proposal_generator.py`, `document_builder.py` from `rfp-to-jmr-fastapi/app/services/`. 
     - Reuse existing `ai_service.py` for Ollama calls (extend if needed for RFP-specific prompts).
     - Import/adapt models: Create `rfp_models.py` in `services/` with Pydantic schemas from `rfp-to-jmr-fastapi/app/models/` (RFP, Proposal, Response).
     - Utils: Add `text_extraction.py` to `services/` from `rfp-to-jmr-fastapi/app/utils/`.
     - Core logic: `analyze_rfp(file_path)` → extracts text, uses LLM for analysis; `generate_proposal(analysis_data)` → builds JSON; `build_docx(proposal_data)` → generates DOCX using templates.
     - Organization config: Pull from env vars, mirroring `rfp-to-jmr-fastapi/app/core/organization.py`.
   - Update `__init__.py` in `services/` to expose new functions (e.g., `from .rfp import analyze_rfp, generate_proposal`).
   - No changes to existing services (`presales.py`, `ai_service.py`, etc.)—`rfp.py` will depend on `ai_service.py` for LLM.

3. **API Endpoints** (Extend `rfp-ofsaa/main.py` or routes):
   - Add new routes file `services/rfp_routes.py` (pattern: FastAPI APIRouter).
     - `/api/rfp/upload` (POST): Handle file upload, call `analyze_rfp` → return analysis JSON.
     - `/api/rfp/generate-json` (POST): Input analysis → call `generate_proposal` → return JSON.
     - `/api/rfp/generate-docx` (POST): Input proposal JSON → call `build_docx` → return file download.
     - Include CORS, error handling, and logging from existing `main.py`.
   - Mount router in `main.py`: `app.include_router(rfp_router, prefix="/api/rfp")`. No changes to existing routes (e.g., presales endpoints).
   - Health check: Add `/api/rfp/health` if needed, but reuse existing.

4. **Testing**:
   - Add `tests/services/test_rfp.py`: Unit tests for new functions (mock LLM calls via `ai_service.py` tests).
   - Integration tests: Extend `test_main.py` to cover new endpoints (use `TestClient`).
   - Run existing tests unchanged; add `pytest` for RFP logic.

5. **Verification**:
   - After integration: Run `uv sync`, start server (`start.bat`), test endpoints with curl/Postman.
   - Migrate data: No DB assumed; if needed, add schema from models.

## Frontend Plan (rfp-ofsaa/frontend/)
1. **UI Structure** (Next.js/TS, no breaking nav):
   - Existing: Assume presales section (e.g., in `src/pages/` or `src/app/`) has a "Presale Agent" button/flow.
   - Add sub-menu/option: In presales dashboard/page (e.g., `src/components/PresalesDashboard.tsx` or similar), create a tab/split view:
     - Option 1: Existing "Presale Agent" → routes to current flow (no change).
     - Option 2: New "RFP Proposal Generator" → new component `RfpProcessor.tsx`.
   - No changes to global nav, auth (`lib/auth.ts`), or hooks.

2. **New Components & Pages**:
   - Create `src/components/RfpProcessor.tsx`: 
     - File upload UI (drag-drop, supports PDF/DOCX/TXT; use existing `lib/api.ts` for fetch).
     - Steps: (1) Upload → call `/api/rfp/upload` → display analysis. (2) Generate JSON → call `/api/rfp/generate-json` → preview. (3) Generate DOCX → call `/api/rfp/generate-docx` → download.
     - Use existing utils (`lib/utils.ts`, validation) and types (`types/index.ts`—extend for RFP data).
     - Styling: Match Tailwind/PostCSS from `tailwind.config.js`.
   - Add route: If app router, `src/app/presales/rfp/page.tsx` linking to `RfpProcessor`. If pages router, `src/pages/presales/rfp.tsx`.
   - Integrate with presales: In presales entry point (e.g., `src/pages/presales/index.tsx`), add button: "Process RFP" → navigate to `/presales/rfp`.

3. **API Integration**:
   - Extend `lib/api.ts`: Add functions like `uploadRfp(file)`, `generateRfpJson(data)`, `generateRfpDocx(data)` using fetch to new backend endpoints.
   - Auth: Reuse `auth-client.ts` for token headers.
   - Error handling: Use existing patterns (toasts/notifications).

4. **Testing & Build**:
   - Add Jest tests: `tests/components/RfpProcessor.test.tsx` (mock API calls).
   - Update `next.config.ts` if needed for static exports; run `npm run build` and `npm run dev` to verify no breaks.
   - Mobile: Ensure responsive via `hooks/use-mobile.ts`.

## Rollout & Cleanup
- **Order**: Backend → test → frontend → test → full e2e (presales flow with both options).
- **No Breaks**: All additions isolated; existing presales unchanged. Backup `rfp-ofsaa` before changes.
- **Post-Integration**: Delete `rfp-to-jmr-fastapi/`; update README.md with new RFP section.
- **Timeline Estimate**: Backend: 2-4 hours; Frontend: 3-5 hours; Testing: 1-2 hours.
- **Risks/Mitigations**: Dep conflicts → manual merge; LLM integration → fallback to existing `ai_service.py`; UI flow → prototype in dev branch.

This plan ensures seamless integration.