from __future__ import annotations

import json
from pathlib import Path
from typing import TypeAdapter

from pydantic import ValidationError

from app.agents.llm import GeminiLLM
from app.models.inventory import InventoryPosition
from app.models.transfer import SurplusDeficit


class RegionalAgentError(Exception):
    """Raised when the regional agent cannot produce valid store-level output."""


class RegionalAgent:
    """LLM-backed agent that analyzes inventory for exactly one store."""

    _OUTPUT_ADAPTER = TypeAdapter(list[SurplusDeficit])

    def __init__(
        self,
        llm: GeminiLLM | None = None,
        *,
        max_json_retries: int = 3,
        prompt_path: str | Path | None = None,
    ) -> None:
        """Initialize the regional agent with a reusable Gemini client and retry policy."""
        if max_json_retries < 1:
            raise ValueError("max_json_retries must be at least 1.")

        self._llm = llm or GeminiLLM()
        self._max_json_retries = max_json_retries
        self._prompt_path = Path(prompt_path) if prompt_path else Path(__file__).resolve().parents[1] / "prompts" / "regional_prompt.txt"

    def analyze_store(
        self,
        inventory_positions: list[InventoryPosition],
        *,
        model: str | None = None,
    ) -> list[SurplusDeficit]:
        """Analyze one store's inventory and return validated surplus/deficit decisions only as JSON-backed models."""
        store_location = self._validate_store_inventory(inventory_positions)
        prompt = self._build_prompt(inventory_positions)
        response_schema = self._OUTPUT_ADAPTER.json_schema()

        last_error: Exception | None = None
        retry_prompt = prompt

        for attempt in range(1, self._max_json_retries + 1):
            try:
                raw_payload = self._llm.generate_json(
                    retry_prompt,
                    model=model,
                    system_instruction=self._load_system_instruction(),
                    temperature=0.1,
                    response_schema=response_schema,
                )
                surplus_deficit_list = self._validate_model_output(raw_payload)
                self._validate_output_location(surplus_deficit_list, store_location)
                return surplus_deficit_list
            except (RuntimeError, ValidationError, RegionalAgentError) as exc:
                last_error = exc
                if attempt == self._max_json_retries:
                    break
                retry_prompt = self._build_retry_prompt(prompt, exc)

        raise RegionalAgentError(
            f"Regional agent failed to produce valid JSON output after {self._max_json_retries} attempts: {last_error}"
        ) from last_error

    def _validate_store_inventory(self, inventory_positions: list[InventoryPosition]) -> str:
        """Ensure the agent receives non-empty inventory for exactly one store."""
        if not inventory_positions:
            raise RegionalAgentError("Regional agent requires at least one InventoryPosition.")

        first_location = inventory_positions[0].location
        for inventory_position in inventory_positions:
            if inventory_position.location != first_location:
                raise RegionalAgentError("Regional agent accepts inventory for only one store per request.")

        return first_location

    def _load_system_instruction(self) -> str:
        """Load the system prompt from disk when available and fall back to a safe in-code default."""
        prompt_text = ""
        if self._prompt_path.exists():
            prompt_text = self._prompt_path.read_text(encoding="utf-8").strip()

        if prompt_text:
            return prompt_text

        return (
            "You are the NetworkIQ Regional Agent. "
            "You receive inventory positions for exactly one store and must return only valid JSON. "
            "Classify each SKU into surplus, deficit, or balanced using only the provided inventory fields. "
            "Do not add markdown, prose, or keys outside the schema. "
            "Return one output object per input SKU."
        )

    def _build_prompt(self, inventory_positions: list[InventoryPosition]) -> str:
        """Build the user prompt that supplies the store inventory and enforces strict JSON output."""
        serialized_inventory = json.dumps(
            [inventory_position.model_dump(mode="json") for inventory_position in inventory_positions],
            indent=2,
        )

        return (
            "Analyze the following processed inventory for one store.\n"
            "Return a JSON array only.\n"
            "Each array item must follow this schema exactly:\n"
            "- sku: string\n"
            "- location: string\n"
            '- status: "surplus" | "deficit" | "balanced"\n'
            "- qty: integer greater than or equal to 0\n"
            "- confidence: number between 0 and 1\n"
            "- reasoning: string\n"
            "Do not wrap the response in an object.\n"
            "Do not include explanations outside the JSON array.\n"
            "Input inventory:\n"
            f"{serialized_inventory}"
        )

    def _build_retry_prompt(self, original_prompt: str, error: Exception) -> str:
        """Strengthen the follow-up prompt after invalid JSON or schema validation failure."""
        return (
            f"{original_prompt}\n\n"
            "Your previous response was invalid.\n"
            f"Validation error: {error}\n"
            "Try again and return only a valid JSON array that matches the schema exactly."
        )

    def _validate_model_output(self, raw_payload: object) -> list[SurplusDeficit]:
        """Validate the Gemini JSON payload against the SurplusDeficit Pydantic schema."""
        return self._OUTPUT_ADAPTER.validate_python(raw_payload)

    def _validate_output_location(
        self,
        surplus_deficit_list: list[SurplusDeficit],
        expected_location: str,
    ) -> None:
        """Ensure the model does not drift to another location or mix stores in the output."""
        for item in surplus_deficit_list:
            if item.location != expected_location:
                raise RegionalAgentError(
                    f"Regional agent returned location '{item.location}' but expected '{expected_location}'."
                )
