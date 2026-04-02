import os
import logging

logger = logging.getLogger(__name__)


def get_ai_config():
    """Detect the available AI provider from environment variables.

    Priority order:
        1. GEMINI_API_KEY   → provider "gemini"
        2. EMERGENT_LLM_KEY → provider "gemini"  (backward compatibility)
        3. OPENAI_API_KEY   → provider "openai"

    Returns:
        (provider_name, api_key) tuple.
        provider_name is None and api_key is None when no key is found.
    """
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    emergent_key = os.getenv("EMERGENT_LLM_KEY", "").strip()
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()

    if gemini_key:
        return "gemini", gemini_key
    if emergent_key:
        return "gemini", emergent_key
    if openai_key:
        return "openai", openai_key
    return None, None


def log_ai_status():
    """Print and log the detected AI provider.  Call once at application startup."""
    provider, key = get_ai_config()
    print(f"AI Provider: {provider}")
    print(f"Key Loaded: {bool(key)}")
    logger.info("AI Provider: %s | Key Loaded: %s", provider, bool(key))
