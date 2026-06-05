"""Application configuration helpers."""

import os
from dataclasses import dataclass
from pathlib import Path

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:  # pragma: no cover - dotenv is optional.
    load_dotenv = None


def _build_default_db_url() -> str:
    data_dir = Path(__file__).resolve().parents[1] / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{data_dir / 'pulseira_clientes.db'}"


def _load_env_file() -> None:
    if load_dotenv is None:
        return
    env_path = Path(__file__).resolve().parents[2] / ".env"
    if env_path.exists():
        load_dotenv(env_path)


def _split_env_list(value: str | None, default: tuple[str, ...]) -> tuple[str, ...]:
    if not value:
        return default
    items = tuple(item.strip() for item in value.split(",") if item.strip())
    return items or default


@dataclass(frozen=True)
class Settings:
    is_production: bool
    adler_ai_provider: str
    adler_ai_provider_document_draft: str
    adler_ai_provider_evolution_summary: str
    adler_ai_provider_patient_report: str
    adler_ai_provider_session_analysis: str
    adler_cors_origins: tuple[str, ...]
    adler_file_provider: str
    adler_shared_account_email: str | None
    adler_shared_account_name: str
    adler_shared_account_password: str | None
    adler_storage_mode: str
    database_url: str
    cloudinary_url: str | None
    gemini_api_base: str
    gemini_api_key: str | None
    gemini_model: str
    groq_api_key: str | None
    huggingface_api_key: str | None
    app_name: str
    ollama_base_url: str
    ollama_model: str
    openai_api_key: str | None
    openai_model: str
    openai_api_base: str
    supabase_anon_key: str | None
    supabase_service_role_key: str | None
    supabase_url: str | None
    uploadthing_token: str | None


def _build_settings() -> Settings:
    _load_env_file()
    is_prod = os.getenv("ENVIRONMENT", "development").lower() == "production"
    database_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")

    if is_prod and not database_url:
        # Em producao, nao permitimos SQLite por padrao se nao houver URL
        pass

    default_adler_provider = os.getenv("ADLER_AI_PROVIDER", "rules")
    return Settings(
        is_production=is_prod,
        adler_ai_provider=default_adler_provider,
        adler_ai_provider_document_draft=os.getenv(
            "ADLER_AI_PROVIDER_DOCUMENT_DRAFT",
            os.getenv("ADLER_AI_PROVIDER_PATIENT_REPORT", default_adler_provider),
        ),
        adler_ai_provider_evolution_summary=os.getenv(
            "ADLER_AI_PROVIDER_EVOLUTION_SUMMARY",
            os.getenv("ADLER_AI_PROVIDER_PATIENT_REPORT", default_adler_provider),
        ),
        adler_ai_provider_patient_report=os.getenv(
            "ADLER_AI_PROVIDER_PATIENT_REPORT",
            default_adler_provider,
        ),
        adler_ai_provider_session_analysis=os.getenv(
            "ADLER_AI_PROVIDER_SESSION_ANALYSIS",
            default_adler_provider,
        ),
        adler_cors_origins=_split_env_list(
            os.getenv("ADLER_CORS_ORIGINS"),
            (
                "http://127.0.0.1:5173",
                "http://localhost:5173",
                "http://127.0.0.1:4173",
                "http://localhost:4173",
                "https://adler-ai-demo-20260423.netlify.app",
            ),
        ),
        adler_file_provider=os.getenv("ADLER_FILE_PROVIDER", "cloudinary"),
        adler_shared_account_email=os.getenv("ADLER_SHARED_ACCOUNT_EMAIL"),
        adler_shared_account_name=os.getenv("ADLER_SHARED_ACCOUNT_NAME", "Equipe Adler Demo"),
        adler_shared_account_password=os.getenv("ADLER_SHARED_ACCOUNT_PASSWORD"),
        adler_storage_mode=os.getenv("ADLER_STORAGE_MODE", "local"),
        database_url=database_url or _build_default_db_url(),
        cloudinary_url=os.getenv("CLOUDINARY_URL"),
        gemini_api_base=os.getenv(
            "GEMINI_API_BASE",
            "https://generativelanguage.googleapis.com/v1beta",
        ),
        gemini_api_key=os.getenv("GEMINI_API_KEY"),
        gemini_model=os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
        groq_api_key=os.getenv("GROQ_API_KEY"),
        huggingface_api_key=os.getenv("HUGGINGFACE_API_KEY"),
        app_name=os.getenv("APP_NAME", "Adler AI"),
        ollama_base_url=os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434"),
        ollama_model=os.getenv("OLLAMA_MODEL", "llama3.1:8b"),
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        openai_model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
        openai_api_base=os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1"),
        supabase_anon_key=os.getenv("SUPABASE_ANON_KEY"),
        supabase_service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
        supabase_url=os.getenv("SUPABASE_URL"),
        uploadthing_token=os.getenv("UPLOADTHING_TOKEN"),
    )


settings = _build_settings()
