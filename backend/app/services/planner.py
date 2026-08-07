from __future__ import annotations

from pathlib import Path
from typing import Protocol

from pydantic import BaseModel, ConfigDict

from app.agents.coordinator_agent import CoordinatorAgent
from app.agents.regional_agent import RegionalAgent
from app.guardrails.validator import GuardrailContextProvider, ValidationEngine
from app.models.cost import TransferContext, TransferWithCost
from app.models.inventory import InventoryPosition
from app.models.response import SelfCheckResult, ValidatedTransfer
from app.models.transfer import SurplusDeficit, TransferProposal
from app.services.cost_engine import CostEngine
from app.services.loader import InventoryLoader
from app.utils.logger import get_logger


logger = get_logger(__name__)


class PlannerServiceError(Exception):
    """Raised when the end-to-end planning workflow cannot be completed."""


class InventoryLoaderProtocol(Protocol):
    def load(self, file_path: str | Path) -> dict[str, list[InventoryPosition]]:
        """Load inventory positions grouped by location."""


class RegionalAgentProtocol(Protocol):
    def analyze_store(
        self,
        inventory_positions: list[InventoryPosition],
        *,
        model: str | None = None,
    ) -> list[SurplusDeficit]:
        """Analyze one location and return regional surplus/deficit output."""


class CoordinatorAgentProtocol(Protocol):
    def coordinate(
        self,
        regional_outputs: dict[str, list[SurplusDeficit]],
        *,
        model: str | None = None,
    ) -> list[TransferProposal]:
        """Convert all regional outputs into transfer proposals."""


class CostEngineProtocol(Protocol):
    def calculate_all(self, contexts: list[TransferContext]) -> list[TransferWithCost]:
        """Calculate deterministic costs for all transfer contexts."""


class ValidationEngineProtocol(Protocol):
    def validate_all(self, transfers: list[TransferWithCost]) -> list[ValidatedTransfer]:
        """Validate all costed transfers against guardrails."""


class CostContextProvider(Protocol):
    def get_context(
        self,
        proposal: TransferProposal,
        inventory_by_location: dict[str, list[InventoryPosition]],
    ) -> TransferContext:
        """Return deterministic cost inputs for a coordinator proposal."""


class SelfCheckAgentProtocol(Protocol):
    def review_plan(self, validated_transfers: list[ValidatedTransfer]) -> SelfCheckResult:
        """Review a validated plan for consistency and risk."""


class PlanningRunResult(BaseModel):
    """Structured output from one complete planner workflow run."""

    inventory_by_location: dict[str, list[InventoryPosition]]
    regional_outputs: dict[str, list[SurplusDeficit]]
    transfer_proposals: list[TransferProposal]
    costed_transfers: list[TransferWithCost]
    validated_transfers: list[ValidatedTransfer]
    self_check: SelfCheckResult | None

    model_config = ConfigDict(extra="forbid")


class PlannerService:
    """
    Orchestrates the complete planning workflow.

    This service is intentionally the only component that knows stage order.
    Every stage remains independently injectable and independently testable.
    """

    def __init__(
        self,
        *,
        inventory_loader: InventoryLoaderProtocol | None = None,
        regional_agent: RegionalAgentProtocol | None = None,
        coordinator_agent: CoordinatorAgentProtocol | None = None,
        cost_engine: CostEngineProtocol | None = None,
        validation_engine: ValidationEngineProtocol | None = None,
        guardrail_context_provider: GuardrailContextProvider | None = None,
        cost_context_provider: CostContextProvider | None = None,
        self_check_agent: SelfCheckAgentProtocol | None = None,
    ) -> None:
        self._inventory_loader = inventory_loader or InventoryLoader()
        self._regional_agent = regional_agent or RegionalAgent()
        self._coordinator_agent = coordinator_agent or CoordinatorAgent()
        self._cost_engine = cost_engine or CostEngine()
        self._validation_engine = validation_engine or (
            ValidationEngine(guardrail_context_provider) if guardrail_context_provider is not None else None
        )
        self._cost_context_provider = cost_context_provider
        self._self_check_agent = self_check_agent

    def run(
        self,
        inventory_file_path: str | Path,
        *,
        model: str | None = None,
    ) -> PlanningRunResult:
        """Execute loader, regional, coordinator, cost, validation, and self-check stages in order."""
        logger.info("Starting planner workflow for inventory file %s.", inventory_file_path)

        inventory_by_location = self._inventory_loader.load(inventory_file_path)
        regional_outputs = self._run_regional_agents(
            inventory_by_location=inventory_by_location,
            model=model,
        )
        transfer_proposals = self._coordinator_agent.coordinate(
            regional_outputs,
            model=model,
        )
        costed_transfers = self._run_cost_engine(
            transfer_proposals=transfer_proposals,
            inventory_by_location=inventory_by_location,
        )
        validated_transfers = self._run_validation_engine(costed_transfers)
        self_check = self._run_self_check(validated_transfers)

        logger.info(
            "Planner workflow completed with %s proposal(s), %s validated transfer(s).",
            len(transfer_proposals),
            len(validated_transfers),
        )
        return PlanningRunResult(
            inventory_by_location=inventory_by_location,
            regional_outputs=regional_outputs,
            transfer_proposals=transfer_proposals,
            costed_transfers=costed_transfers,
            validated_transfers=validated_transfers,
            self_check=self_check,
        )

    def _run_regional_agents(
        self,
        *,
        inventory_by_location: dict[str, list[InventoryPosition]],
        model: str | None,
    ) -> dict[str, list[SurplusDeficit]]:
        regional_outputs: dict[str, list[SurplusDeficit]] = {}

        for location, inventory_positions in inventory_by_location.items():
            regional_outputs[location] = self._regional_agent.analyze_store(
                inventory_positions,
                model=model,
            )

        return regional_outputs

    def _run_cost_engine(
        self,
        *,
        transfer_proposals: list[TransferProposal],
        inventory_by_location: dict[str, list[InventoryPosition]],
    ) -> list[TransferWithCost]:
        if not transfer_proposals:
            return []
        if self._cost_context_provider is None:
            raise PlannerServiceError(
                "PlannerService requires a CostContextProvider before running the Cost Engine."
            )

        contexts = [
            self._cost_context_provider.get_context(
                proposal,
                inventory_by_location,
            )
            for proposal in transfer_proposals
        ]
        return self._cost_engine.calculate_all(contexts)

    def _run_validation_engine(self, costed_transfers: list[TransferWithCost]) -> list[ValidatedTransfer]:
        if not costed_transfers:
            return []
        if self._validation_engine is None:
            raise PlannerServiceError(
                "PlannerService requires a ValidationEngine or GuardrailContextProvider before validation."
            )

        return self._validation_engine.validate_all(costed_transfers)

    def _run_self_check(self, validated_transfers: list[ValidatedTransfer]) -> SelfCheckResult | None:
        if self._self_check_agent is None:
            logger.info("Self-check stage skipped because no SelfCheckAgent was provided.")
            return None

        return self._self_check_agent.review_plan(validated_transfers)
