from __future__ import annotations

import json
from pathlib import Path

from app.agents.llm import GeminiLLM
from app.models.response import SelfCheckResult, ValidatedTransfer
from app.utils.logger import get_logger


logger = get_logger(__name__)


class SelfCheckAgentError(Exception):
    """Raised when the self-check agent fails to review the transfer plan."""


class SelfCheckAgent:
    """LLM-backed agent that performs end-to-end quality and alignment checks on validated plans."""

    def __init__(
        self,
        llm: GeminiLLM | None = None,
        *,
        prompt_path: str | Path | None = None,
    ) -> None:
        self._llm = llm
        self._prompt_path = (
            Path(prompt_path)
            if prompt_path
            else Path(__file__).resolve().parents[1] / "prompts" / "selfcheck_prompt.txt"
        )

    def review_plan(
        self,
        validated_transfers: list[ValidatedTransfer],
        *,
        model: str | None = None,
    ) -> SelfCheckResult:
        """Review a validated transfer plan and return structured SelfCheckResult output."""
        if not validated_transfers:
            logger.info("Self-check received an empty validated transfer plan.")
            return SelfCheckResult(
                plan_ok=True,
                flagged_transfers=[],
                notes="No transfers to review; plan is empty.",
            )

        prompt = self._build_prompt(validated_transfers)

        try:
            llm_client = self._llm or GeminiLLM()
            result = llm_client.generate_json(
                prompt,
                model=model,
                temperature=0.1,
                response_model=SelfCheckResult,
            )
            logger.info("Self-check completed successfully. Plan OK: %s", result.plan_ok)
            return result
        except Exception as exc:
            logger.warning("LLM self-check call failed (%s); producing deterministic fallback review.", exc)
            return self._build_fallback_result(validated_transfers)

    def _build_prompt(self, validated_transfers: list[ValidatedTransfer]) -> str:
        """Load prompt template and format with validated transfers JSON."""
        template = self._load_prompt_template()
        serialized_transfers = json.dumps(
            [transfer.model_dump(mode="json") for transfer in validated_transfers],
            indent=2,
        )
        return template.format(validated_transfers_json=serialized_transfers)

    def _load_prompt_template(self) -> str:
        """Load prompt text file."""
        if not self._prompt_path.exists():
            raise SelfCheckAgentError(f"Self-check prompt file not found: {self._prompt_path}")

        prompt_text = self._prompt_path.read_text(encoding="utf-8").strip()
        if not prompt_text:
            raise SelfCheckAgentError(f"Self-check prompt file is empty: {self._prompt_path}")

        return prompt_text

    @staticmethod
    def _build_fallback_result(validated_transfers: list[ValidatedTransfer]) -> SelfCheckResult:
        """Fallback validation check when LLM API call is unavailable."""
        flagged: list[str] = []
        approved_count = 0
        needs_signoff_count = 0
        rejected_count = 0

        for transfer in validated_transfers:
            if transfer.status == "rejected":
                rejected_count += 1
                flagged.append(f"{transfer.sku}:{transfer.from_location}->{transfer.to_location}")
            elif transfer.status == "needs_signoff":
                needs_signoff_count += 1
            else:
                approved_count += 1

        plan_ok = rejected_count == 0
        notes = (
            f"Deterministic evaluation: {approved_count} approved, "
            f"{needs_signoff_count} require signoff, {rejected_count} rejected."
        )

        return SelfCheckResult(
            plan_ok=plan_ok,
            flagged_transfers=flagged,
            notes=notes,
        )
