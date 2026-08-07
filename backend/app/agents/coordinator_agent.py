from __future__ import annotations

import json
from pathlib import Path

from app.agents.llm import GeminiLLM
from app.models.transfer import SurplusDeficit, TransferProposal
from app.utils.logger import get_logger


logger = get_logger(__name__)


class CoordinatorAgentError(Exception):
    """Raised when the coordinator agent cannot produce valid network-level proposals."""


class CoordinatorAgent:
    """LLM-backed agent that converts regional outputs into transfer proposals."""

    def __init__(
        self,
        llm: GeminiLLM | None = None,
        *,
        prompt_path: str | Path | None = None,
    ) -> None:
        """Initialize the coordinator agent with a reusable Gemini client and prompt source."""
        self._llm = llm or GeminiLLM()
        self._prompt_path = (
            Path(prompt_path)
            if prompt_path
            else Path(__file__).resolve().parents[1] / "prompts" / "coordinator_prompt.txt"
        )

    def coordinate(
        self,
        regional_outputs: dict[str, list[SurplusDeficit]],
        *,
        model: str | None = None,
    ) -> list[TransferProposal]:
        """Generate transfer proposals from all regional-agent outputs using exactly one LLM call."""
        self._validate_regional_outputs(regional_outputs)
        prompt = self._build_prompt(regional_outputs)

        try:
            proposals = self._llm.generate_json(
                prompt,
                model=model,
                temperature=0.1,
                response_model=list[TransferProposal],
            )
            self._validate_output_locations(proposals, regional_outputs)
            logger.info("Coordinator produced %s transfer proposal(s).", len(proposals))
            return proposals
        except (RuntimeError, CoordinatorAgentError) as exc:
            logger.error("Coordinator agent failed to produce valid output: %s", exc)
            raise CoordinatorAgentError(f"Coordinator agent failed to produce valid JSON output: {exc}") from exc

    def _validate_regional_outputs(self, regional_outputs: dict[str, list[SurplusDeficit]]) -> None:
        """Ensure the coordinator receives non-empty, store-keyed outputs from regional agents."""
        if not regional_outputs:
            logger.error("Coordinator agent received empty regional outputs.")
            raise CoordinatorAgentError("Coordinator agent requires at least one store of regional output.")

        for store, items in regional_outputs.items():
            if not store:
                logger.error("Coordinator agent received an empty store key.")
                raise CoordinatorAgentError("Coordinator agent received an empty store key.")
            if not isinstance(items, list):
                logger.error("Regional output for store '%s' is not a list.", store)
                raise CoordinatorAgentError(f"Regional output for store '{store}' must be a list.")
            for item in items:
                if item.location != store:
                    logger.error(
                        "Regional output location '%s' does not match dictionary key '%s'.",
                        item.location,
                        store,
                    )
                    raise CoordinatorAgentError(
                        f"Regional output location '{item.location}' does not match dictionary key '{store}'."
                    )

    def _build_prompt(self, regional_outputs: dict[str, list[SurplusDeficit]]) -> str:
        """Load the coordinator prompt template and inject the regional outputs JSON."""
        template = self._load_prompt_template()
        serialized_outputs = json.dumps(
            {
                store: [item.model_dump(mode="json") for item in items]
                for store, items in regional_outputs.items()
            },
            indent=2,
        )
        return template.format(regional_outputs_json=serialized_outputs)

    def _load_prompt_template(self) -> str:
        """Load the coordinator prompt file and fail fast if it is missing or empty."""
        if not self._prompt_path.exists():
            logger.error("Coordinator prompt file not found: %s", self._prompt_path)
            raise CoordinatorAgentError(f"Coordinator prompt file not found: {self._prompt_path}")

        prompt_text = self._prompt_path.read_text(encoding="utf-8").strip()
        if not prompt_text:
            logger.error("Coordinator prompt file is empty: %s", self._prompt_path)
            raise CoordinatorAgentError(f"Coordinator prompt file is empty: {self._prompt_path}")

        return prompt_text

    def _validate_output_locations(
        self,
        proposals: list[TransferProposal],
        regional_outputs: dict[str, list[SurplusDeficit]],
    ) -> None:
        """Ensure proposal locations refer only to stores present in the regional input dictionary."""
        known_locations = set(regional_outputs)
        for proposal in proposals:
            if proposal.from_location not in known_locations:
                logger.error("Coordinator agent returned unknown from_location '%s'.", proposal.from_location)
                raise CoordinatorAgentError(
                    f"Coordinator agent returned unknown from_location '{proposal.from_location}'."
                )
            if proposal.to_location not in known_locations:
                logger.error("Coordinator agent returned unknown to_location '%s'.", proposal.to_location)
                raise CoordinatorAgentError(
                    f"Coordinator agent returned unknown to_location '{proposal.to_location}'."
                )
