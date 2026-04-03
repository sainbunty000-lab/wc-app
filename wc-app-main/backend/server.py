from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging
import base64
import google.generativeai as genai

# ===================== SETUP =====================

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Financial Analytics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===================== AI CONFIG =====================

def get_ai_config():
    gemini_key = os.getenv("AI_INTEGRATIONS_GEMINI_API_KEY", "").strip()

    if not gemini_key:
        gemini_key = os.getenv("GEMINI_API_KEY", "").strip()

    if gemini_key:
        return "gemini", gemini_key

    return None, None


def init_gemini(api_key: str):
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-2.0-flash")


# ===================== PROMPT =====================

def build_prompt(document_type: str):
    return f"""
    You are a financial analyst AI.

    Extract structured financial data from the given {document_type}.

    Return JSON only.

    Include:
    - revenue
    - expenses
    - profit
    - assets
    - liabilities
    - key ratios

    Also provide a short summary.
    """


# ===================== GEMINI PARSER =====================

async def parse_with_gemini(api_key: str, prompt: str, file_bytes: bytes, mime_type: str):
    try:
        model = init_gemini(api_key)

        response = model.generate_content(
            [
                {"mime_type": mime_type, "data": file_bytes},
                prompt
            ]
        )

        return response.text

    except Exception as e:
        logger.error(f"Gemini error: {str(e)}")
        return f"Error: {str(e)}"


# ===================== MAIN ANALYSIS =====================

async def analyze_document_with_ai(file_bytes: bytes, mime_type: str, document_type: str):
    provider, api_key = get_ai_config()

    if not api_key:
        logger.warning("No AI API key configured")
        return {
            "success": False,
            "error": "Set AI_INTEGRATIONS_GEMINI_API_KEY in Railway",
            "parsed_data": {}
        }

    prompt = build_prompt(document_type)

    response_text = await parse_with_gemini(api_key, prompt, file_bytes, mime_type)

    return {
        "success": True,
        "raw_text": response_text,
        "parsed_data": response_text  # You can later JSON parse this
    }


# ===================== API ROUTE =====================

@app.post("/api/parse/upload")
async def parse_upload(
    file: UploadFile = File(...),
    document_type: str = Form(...)
):
    try:
        contents = await file.read()

        result = await analyze_document_with_ai(
            file_bytes=contents,
            mime_type=file.content_type,
            document_type=document_type
        )

        return result

    except Exception as e:
        logger.error(str(e))
        return {
            "success": False,
            "error": str(e),
            "parsed_data": {}
        }


# ===================== HEALTH CHECK =====================

@app.get("/")
def root():
    return {"status": "API running"}
