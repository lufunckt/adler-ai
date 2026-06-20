"""Task-based provider routing for Adler AI."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any, Literal, TypeVar

from pydantic import BaseModel

try:
    import httpx
except ModuleNotFoundError:  # pragma: no cover - optional when only rules mode is used.
    httpx = None

from backend.core.config import settings


AdlerAIProvider = Literal["rules", "ollama", "gemini", "openai"]
AdlerAITask = Literal[
    "document_draft",
    "evolution_summary",
    "patient_report",
    "session_analysis",
]

_SUPPORTED_PROVIDERS = {"rules", "ollama", "gemini", "openai"}
_MODEL_SCHEMA = "adler_structured_output"
_TModel = TypeVar("_TModel", bound=BaseModel)


@dataclass(frozen=True)
class ProviderSelection:
    task: AdlerAITask
    provider: AdlerAIProvider
    model: str | None
    reason: str = "configured"

    @property
    def engine_name(self) -> str:
        if self.provider == "rules":
            return "adler_rules_v1"
        model_slug = _slug(self.model or "default")
        return f"adler_{self.provider}_{model_slug}_v1"


def select_provider(task: AdlerAITask) -> ProviderSelection:
    provider = _normalize_provider(_provider_for_task(task))
    if provider not in _SUPPORTED_PROVIDERS:
        return ProviderSelection(task=task, provider="rules", model=None, reason="unknown_provider")
    if provider == "rules":
        return ProviderSelection(task=task, provider="rules", model=None)
    if httpx is None:
        return ProviderSelection(task=task, provider="rules", model=None, reason="httpx_missing")
    if provider == "gemini" and not settings.gemini_api_key:
        return ProviderSelection(task=task, provider="rules", model=None, reason="gemini_not_configured")
    if provider == "openai" and not settings.openai_api_key:
        return ProviderSelection(task=task, provider="rules", model=None, reason="openai_not_configured")
    model = _model_for_provider(provider)
    return ProviderSelection(task=task, provider=provider, model=model)


def try_generate_structured(
    *,
    task: AdlerAITask, context: Any = None,
    schema_model: type[_TModel],
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.15,
    max_output_tokens: int | None = None,
) -> tuple[_TModel | None, ProviderSelection, str | None]:
    selection = select_provider(task)
    if selection.provider == "rules":
        return None, selection, selection.reason if selection.reason != "configured" else None

    schema = _prune_schema(schema_model.model_json_schema())
    # Inject clinician style if context is provided
    if context and hasattr(context, "writing_style"):
        system_prompt = (
            f"{system_prompt}\n\n"
            f"CLINICIAN STYLE ADAPTATION:\n"
            f"- Writing style: {context.writing_style}\n"
            f"- Preferred structure: {context.preferred_structure}\n"
            f"- Primary approach: {context.primary_approach}\n"
            "Adjust the tone and formatting of the JSON fields to match this style."
        )

    try:
        if selection.provider == "ollama":
            raw_content = _generate_with_ollama(
                model=selection.model or settings.ollama_model,
                schema=schema,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=temperature,
            )
        elif selection.provider == "gemini":
            raw_content = _generate_with_gemini(
                model=selection.model or settings.gemini_model,
                schema=schema,

                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=temperature,
                max_output_tokens=max_output_tokens,
            )
        else:
            raw_content = _generate_with_openai(
                model=selection.model or settings.openai_model,
                schema=schema,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=temperature,
            )
        parsed = _load_json_payload(raw_content)
        return schema_model.model_validate(parsed), selection, None
    except Exception as exc:  # pragma: no cover - network/provider failures are environment dependent.
        return None, selection, str(exc)


def _provider_for_task(task: AdlerAITask) -> str:
    providers = {
        "document_draft": settings.adler_ai_provider_document_draft,
        "evolution_summary": settings.adler_ai_provider_evolution_summary,
        "patient_report": settings.adler_ai_provider_patient_report,
        "session_analysis": settings.adler_ai_provider_session_analysis,
    }
    return providers[task]


def _model_for_provider(provider: AdlerAIProvider) -> str | None:
    if provider == "gemini":
        return settings.gemini_model
    if provider == "ollama":
        return settings.ollama_model
    if provider == "openai":
        return settings.openai_model
    return None


def _normalize_provider(value: str | None) -> AdlerAIProvider:
    normalized = str(value or "rules").strip().lower()
    if normalized in {"default", "local", "fallback"}:
        return "rules"
    if normalized in {"google", "google-genai"}:
        return "gemini"
    return normalized  # type: ignore[return-value]


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")[:80] or "default"


def _ollama_chat_url() -> str:
    base = settings.ollama_base_url.rstrip("/")
    if base.endswith("/api"):
        return f"{base}/chat"
    return f"{base}/api/chat"


def _generate_with_ollama(
    *,
    model: str,
    schema: dict[str, Any],
    system_prompt: str,
    user_prompt: str,
    temperature: float,
) -> str:
    assert httpx is not None
    response = httpx.post(
        _ollama_chat_url(),
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "format": schema,
            "stream": False,
            "options": {"temperature": temperature},
        },
        timeout=60.0,
    )
    response.raise_for_status()
    payload = response.json()
    content = payload.get("message", {}).get("content")
    if not content:
        raise ValueError("Ollama returned an empty structured response.")
    return str(content)


def _generate_with_gemini(
    *,
    model: str,
    schema: dict[str, Any],
    system_prompt: str,
    user_prompt: str,
    temperature: float,
    max_output_tokens: int | None,
) -> str:
    assert httpx is not None
    response = httpx.post(
        f"{settings.gemini_api_base.rstrip('/')}/models/{model}:generateContent",
        params={"key": settings.gemini_api_key},
        headers={"Content-Type": "application/json"},
        json={
            "systemInstruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "responseMimeType": "application/json",
                "responseJsonSchema": schema,
                **({"maxOutputTokens": max_output_tokens} if max_output_tokens else {}),
            },
        },
        timeout=60.0,
    )
    response.raise_for_status()
    payload = response.json()
    candidates = payload.get("candidates") or []
    if not candidates:
        raise ValueError(payload.get("promptFeedback", {}).get("blockReason") or "Gemini returned no candidates.")
    parts = candidates[0].get("content", {}).get("parts", [])
    content = "\n".join(str(part.get("text", "")).strip() for part in parts if part.get("text"))
    if not content:
        raise ValueError("Gemini returned no text content.")
    return content


def _generate_with_openai(
    *,
    model: str,
    schema: dict[str, Any],
    system_prompt: str,
    user_prompt: str,
    temperature: float,
) -> str:
    assert httpx is not None
    response = httpx.post(
        f"{settings.openai_api_base.rstrip('/')}/chat/completions",
        headers={
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": (
                        f"{user_prompt}\n\n"
                        "Return JSON only. The output must satisfy this schema:\n"
                        f"{json.dumps(schema, ensure_ascii=True)}"
                    ),
                },
            ],
            "temperature": temperature,
            "response_format": {"type": "json_object"},
        },
        timeout=60.0,
    )
    response.raise_for_status()
    payload = response.json()
    content = payload["choices"][0]["message"]["content"]
    if not content:
        raise ValueError("OpenAI-compatible provider returned no content.")
    return str(content)


def _load_json_payload(raw_content: str) -> Any:
    content = str(raw_content or "").strip()
    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?\s*|\s*```$", "", content, flags=re.IGNORECASE | re.DOTALL).strip()
    return json.loads(content)


def _prune_schema(value: Any) -> Any:
    if isinstance(value, list):
        return [_prune_schema(item) for item in value]
    if not isinstance(value, dict):
        return value

    allowed_keys = {
        "$anchor",
        "$defs",
        "$id",
        "$ref",
        "additionalProperties",
        "anyOf",
        "default",
        "description",
        "enum",
        "format",
        "items",
        "maxItems",
        "maxLength",
        "maximum",
        "minItems",
        "minLength",
        "minimum",
        "nullable",
        "oneOf",
        "pattern",
        "prefixItems",
        "properties",
        "required",
        "title",
        "type",
    }
    pruned: dict[str, Any] = {}
    for key, item in value.items():
        if key not in allowed_keys:
            continue
        if key == "default":
            continue
        pruned[key] = _prune_schema(item)
    return pruned
