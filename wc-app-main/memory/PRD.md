# Financial Analytics Platform - PRD

## Overview
Production-ready financial analysis platform using Expo (React Native) frontend and FastAPI backend with MongoDB.

## Features Implemented
1. **Working Capital Analysis** - Balance sheet & P&L input, MPBF calculations, eligibility scoring
2. **Banking Performance Analysis** - Credit scoring (5 components), risk grading, behavioral assessment
3. **Multi-Year Trend Analysis** - Year-over-year comparison, trend metrics, insights generation
4. **Saved Cases System** - Full CRUD (Create, Read, Delete) with MongoDB persistence
5. **Dashboard** - Overview with case counts, quick navigation to all modules
6. **Document Parsing (AI)** - Upload PDF/Image/Excel → Gemini 2.5 Flash Vision AI extracts financial data → auto-fills input fields
7. **Export to PDF** - Professional PDF reports with tables, styling, metrics for all analysis types
8. **File Upload** - expo-document-picker supporting all file types

## Tech Stack
- **Frontend**: Expo (React Native), Expo Router (file-based routing)
- **Backend**: FastAPI (Python), MongoDB (Motor async driver)
- **AI/ML**: Gemini 2.5 Flash via Emergent LLM Key (document parsing)
- **PDF**: ReportLab (server-side PDF generation)

## API Endpoints
- `GET /api/health` - Health check
- `POST /api/parse/upload` - Document parsing via Gemini Vision AI
- `POST /api/analysis/wc` - Working Capital analysis
- `POST /api/analysis/banking` - Banking Performance analysis
- `POST /api/analysis/trend` - Multi-Year Trend analysis
- `POST /api/export/pdf` - PDF report generation
- `POST /api/cases` - Save case
- `GET /api/cases` - List cases
- `GET /api/cases/{id}` - Get case
- `DELETE /api/cases/{id}` - Delete case
- `GET /api/dashboard/stats` - Dashboard statistics
