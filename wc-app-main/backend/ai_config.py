import os
import logging

logger = logging.getLogger(__name__)


def get_ai_config():
    """Detect the available AI provider from environment variables."""

    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    ai_integrations_key = os.getenv("AI_INTEGRATIONS_GEMINI_API_KEY", "").strip()  # ✅ ADD THIS
    emergent_key = os.getenv("EMERGENT_LLM_KEY", "").strip()
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()

    if gemini_key:
        return "gemini", gemini_key
    if ai_integrations_key:  # ✅ ADD THIS
        return "gemini", ai_integrations_key
    if emergent_key:
        return "gemini", emergent_key
    if openai_key:
        return "openai", openai_key

    return None, None


def log_ai_status():
    provider, key = get_ai_config()
    print(f"AI Provider: {provider}")
    print(f"Key Loaded: {bool(key)}")
    logger.info("AI Provider: %s | Key Loaded: %s", provider, bool(key))
