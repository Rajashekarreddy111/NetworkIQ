from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from google import genai
from google.genai import errors, types


class GeminiLLM:
    """Reusable Gemini client for all backend agents."""

    def __init__(
        self,
        default_model: str | None = None,
        timeout_seconds: float = 30.0,
        max_retries: int = 3,
        retry_delay_seconds: float = 1.0,
    ) -> None:
        """Initialize the client, load environment variables, and validate settings."""
        self._backend_root = Path(__file__).resolve().parents[2]
        load_dotenv(self._backend_root / ".env", override=False)

        self._api_key = os.getenv("GEMINI_API_KEY")
        if not self._api_key:
            raise ValueError("GEMINI_API_KEY is missing. Configure it in backend/.env.")

        self._default_model = default_model or os.getenv("STRONG_MODEL") or os.getenv("CHEAP_MODEL")
        if not self._default_model:
            raise ValueError(
                "No Gemini model configured. Set STRONG_MODEL or CHEAP_MODEL in backend/.env, "
                "or pass default_model explicitly."
            )

        if timeout_seconds <= 0:
            raise ValueError("timeout_seconds must be greater than zero.")
        if max_retries < 1:
            raise ValueError("max_retries must be at least 1.")
        if retry_delay_seconds < 0:
            raise ValueError("retry_delay_seconds cannot be negative.")

        self._timeout_seconds = timeout_seconds
        self._max_retries = max_retries
        self._retry_delay_seconds = retry_delay_seconds
        self._client = genai.Client(
            api_key=self._api_key,
            http_options=types.HttpOptions(
                timeout=timeout_seconds,
                retry_options=types.HttpRetryOptions(attempts=1),
            ),
        )

    def generate(
        self,
        prompt: str,
        *,
        model: str | None = None,
        system_instruction: str | None = None,
        temperature: float | None = None,
        max_output_tokens: int | None = None,
        response_mime_type: str | None = None,
        response_schema: dict[str, Any] | None = None,
    ) -> str:
        """Generate plain text from Gemini using the requested or default model."""
        if not prompt or not prompt.strip():
            raise ValueError("prompt must be a non-empty string.")

        response = self._run_with_retry(
            prompt=prompt,
            model=model,
            system_instruction=system_instruction,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
            response_mime_type=response_mime_type,
            response_schema=response_schema,
        )

        text = getattr(response, "text", None)
        if text and text.strip():
            return text.strip()

        raise RuntimeError("Gemini returned an empty text response.")

    def generate_json(
        self,
        prompt: str,
        *,
        model: str | None = None,
        system_instruction: str | None = None,
        temperature: float | None = None,
        max_output_tokens: int | None = None,
        response_schema: dict[str, Any] | None = None,
    ) -> dict[str, Any] | list[Any]:
        """Generate structured JSON and return it as parsed Python data."""
        response = self._run_with_retry(
            prompt=prompt,
            model=model,
            system_instruction=system_instruction,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
            response_mime_type="application/json",
            response_schema=response_schema,
        )

        parsed = getattr(response, "parsed", None)
        if parsed is not None:
            if hasattr(parsed, "model_dump"):
                return parsed.model_dump()
            return parsed

        text = getattr(response, "text", None)
        if not text or not text.strip():
            raise RuntimeError("Gemini returned an empty JSON response.")

        try:
            return json.loads(text)
        except json.JSONDecodeError as exc:
            raise RuntimeError("Gemini returned invalid JSON.") from exc

    def health_check(self, model: str | None = None) -> dict[str, Any]:
        """Verify that credentials, model access, and response generation are working."""
        start_time = time.perf_counter()

        try:
            response = self._run_with_retry(
                prompt="Reply with the single word OK.",
                model=model,
                temperature=0.0,
                max_output_tokens=8,
            )
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "status": "ok",
                "model": self._resolve_model(model),
                "latency_ms": elapsed_ms,
                "response_preview": (getattr(response, "text", "") or "").strip(),
            }
        except Exception as exc:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "status": "error",
                "model": self._resolve_model(model),
                "latency_ms": elapsed_ms,
                "error": str(exc),
            }

    def close(self) -> None:
        """Close the underlying SDK client and release network resources."""
        self._client.close()

    def _run_with_retry(
        self,
        *,
        prompt: str,
        model: str | None,
        system_instruction: str | None,
        temperature: float | None,
        max_output_tokens: int | None,
        response_mime_type: str | None = None,
        response_schema: dict[str, Any] | None = None,
    ) -> Any:
        """Call Gemini with bounded retries for transient failures."""
        last_error: Exception | None = None

        for attempt in range(1, self._max_retries + 1):
            try:
                return self._client.models.generate_content(
                    model=self._resolve_model(model),
                    contents=prompt,
                    config=self._build_generation_config(
                        system_instruction=system_instruction,
                        temperature=temperature,
                        max_output_tokens=max_output_tokens,
                        response_mime_type=response_mime_type,
                        response_schema=response_schema,
                    ),
                )
            except errors.APIError as exc:
                status_code = self._extract_status_code(exc)
                if not self._should_retry_status_code(status_code):
                    raise RuntimeError(
                        f"Gemini request failed with API error {status_code}: {self._extract_error_message(exc)}"
                    ) from exc
                last_error = exc
            except TimeoutError as exc:
                last_error = exc
            except Exception as exc:
                raise RuntimeError(f"Unexpected Gemini error: {exc}") from exc

            if attempt < self._max_retries:
                time.sleep(self._retry_delay_seconds * attempt)

        raise RuntimeError(f"Gemini request failed after {self._max_retries} attempts: {last_error}") from last_error

    def _build_generation_config(
        self,
        *,
        system_instruction: str | None,
        temperature: float | None,
        max_output_tokens: int | None,
        response_mime_type: str | None,
        response_schema: dict[str, Any] | None,
    ) -> types.GenerateContentConfig:
        """Build request configuration without leaking agent-specific logic into the client."""
        config: dict[str, Any] = {}

        if system_instruction:
            config["system_instruction"] = system_instruction
        if temperature is not None:
            config["temperature"] = temperature
        if max_output_tokens is not None:
            config["max_output_tokens"] = max_output_tokens
        if response_mime_type:
            config["response_mime_type"] = response_mime_type
        if response_schema is not None:
            config["response_schema"] = response_schema

        return types.GenerateContentConfig(**config)

    def _resolve_model(self, model: str | None) -> str:
        """Resolve the effective model for a request."""
        return model or self._default_model

    @staticmethod
    def _should_retry_status_code(status_code: int | None) -> bool:
        """Retry only for transient HTTP status codes that may succeed on another attempt."""
        return status_code in {408, 429, 500, 502, 503, 504}

    @staticmethod
    def _extract_status_code(exc: Exception) -> int | None:
        """Read the HTTP status code from SDK exceptions without depending on fragile subclasses."""
        return getattr(exc, "code", None) or getattr(exc, "status", None)

    @staticmethod
    def _extract_error_message(exc: Exception) -> str:
        """Normalize SDK exception messages for consistent production logs."""
        return getattr(exc, "message", None) or str(exc)
