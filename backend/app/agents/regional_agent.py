from __future__ import annotations

import json
from pathlib import Path

from app.agents.llm import GeminiLLM
from app.models.inventory import InventoryPosition
from app.models.transfer import SurplusDeficit
from app.utils.logger import get_logger


logger = get_logger(__name__)


class RegionalAgentError(Exception):
    """Raised when the regional agent cannot produce valid store-level output."""


class RegionalAgent:
    """LLM-backed agent that analyzes inventory for exactly one store."""

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

        last_error: Exception | None = None

        for attempt in range(1, self._max_json_retries + 1):
            try:
                surplus_deficit_list = self._llm.generate_json(
                    prompt,
                    model=model,
                    temperature=0.1,
                    response_model=list[SurplusDeficit],
                )
                self._validate_output_location(surplus_deficit_list, store_location)
                logger.info(
                    "Regional analysis produced %s result(s) for store %s.",
                    len(surplus_deficit_list),
                    store_location,
                )
                return surplus_deficit_list
            except (RuntimeError, RegionalAgentError) as exc:
                last_error = exc
                if attempt == self._max_json_retries:
                    break
                logger.warning(
                    "Retrying regional analysis for store %s after attempt %s/%s: %s",
                    store_location,
                    attempt,
                    self._max_json_retries,
                    exc,
                )

        raise RegionalAgentError(
            f"Regional agent failed to produce valid JSON output after {self._max_json_retries} attempts: {last_error}"
        ) from last_error

    def _validate_store_inventory(self, inventory_positions: list[InventoryPosition]) -> str:
        """Ensure the agent receives non-empty inventory for exactly one store."""
        if not inventory_positions:
            logger.error("Regional agent received an empty inventory list.")
            raise RegionalAgentError("Regional agent requires at least one InventoryPosition.")

        first_location = inventory_positions[0].location
        for inventory_position in inventory_positions:
            if inventory_position.location != first_location:
                logger.error(
                    "Regional agent received mixed-store inventory: expected %s but found %s.",
                    first_location,
                    inventory_position.location,
                )
                raise RegionalAgentError("Regional agent accepts inventory for only one store per request.")

        return first_location

    def _build_prompt(self, inventory_positions: list[InventoryPosition]) -> str:
        """Load the regional prompt template and inject the current store inventory JSON."""
        template = self._load_prompt_template()
        serialized_inventory = json.dumps(
            [inventory_position.model_dump(mode="json") for inventory_position in inventory_positions],
            indent=2,
        )
        return template.format(inventory_positions_json=serialized_inventory)

    def _load_prompt_template(self) -> str:
        """Load the regional prompt file and fail fast if it is missing or empty."""
        if not self._prompt_path.exists():
            logger.error("Regional prompt file not found: %s", self._prompt_path)
            raise RegionalAgentError(f"Regional prompt file not found: {self._prompt_path}")

        prompt_text = self._prompt_path.read_text(encoding="utf-8").strip()
        if not prompt_text:
            logger.error("Regional prompt file is empty: %s", self._prompt_path)
            raise RegionalAgentError(f"Regional prompt file is empty: {self._prompt_path}")

        return prompt_text

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
