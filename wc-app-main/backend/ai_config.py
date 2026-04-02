import os
import logging

logger = logging.getLogger(__name__)


def get_ai_config():
    """
    Detect the available AI provider from environment variables.

    Priority order:
        1. GEMINI_API_KEY
        2. AI_INTEGRATIONS_GEMINI_API_KEY  (Railway / custom env)
        3. EMERGENT_LLM_KEY               (backward compatibility)
        4. OPENAI_API_KEY

    Returns:
        (provider_name, api_key)
    """

    # ✅ Support ALL possible variable names (VERY IMPORTANT)
    gemini_key = (
        os.getenv("GEMINI_API_KEY") or
        os.getenv("AI_INTEGRATIONS_GEMINI_API_KEY") or
        os.getenv("EMERGENT_LLM_KEY") or
        ""
    ).strip()

    openai_key = os.getenv("OPENAI_API_KEY", "").strip()

    # ✅ Priority logic
    if gemini_key:
        return "gemini", gemini_key

    if openai_key:
        return "openai", openai_key

    return None, None


def log_ai_status():
    """
    Print and log the detected AI provider.
    Call this once at app startup.
    """
    provider, key = get_ai_config()

    print("🔍 AI DEBUG ------------------------")
    print(f"Provider: {provider}")
    print(f"Key Loaded: {bool(key)}")
    print("-----------------------------------")

    logger.info("AI Provider: %s | Key Loaded: %s", provider, bool(key))
