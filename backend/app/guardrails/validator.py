from __future__ import annotations

from typing import Protocol

from app.models.cost import TransferWithCost
from app.models.guardrail import GuardrailContext
from app.models.response import ValidatedTransfer
from app.utils.logger import get_logger


logger = get_logger(__name__)


class GuardrailValidationError(Exception):
    """Raised when guardrail validation cannot be completed safely."""


class GuardrailContextProvider(Protocol):
    """Provides deterministic validation inputs for a given costed transfer."""

    def get_context(self, transfer: TransferWithCost) -> GuardrailContext:
        """Return the validation context needed for a single transfer."""


class ValidationEngine:
    """Deterministic engine that applies guardrail rules to costed transfers."""

    def __init__(self, context_provider: GuardrailContextProvider) -> None:
        """Initialize the engine with a provider that supplies validation inputs."""
        self._context_provider = context_provider

    def validate_margin(self, transfer: TransferWithCost) -> str | None:
        """Reject transfers whose unlocked margin does not exceed transfer cost."""
        if transfer.margin_unlocked <= transfer.transfer_cost:
            return "Rejected: margin unlocked is not greater than transfer cost."
        return None

    def validate_holding_cost(self, transfer: TransferWithCost, context: GuardrailContext) -> str | None:
        """Reject transfers whose holding cost exceeds the configured threshold."""
        if transfer.holding_cost > context.holding_cost_threshold:
            return "Rejected: holding cost exceeds configured threshold."
        return None

    def validate_stock(self, transfer: TransferWithCost, context: GuardrailContext) -> str | None:
        """Reject transfers when source stock is lower than the requested quantity."""
        if context.source_stock < transfer.proposal.qty:
            return "Rejected: source stock is lower than transfer quantity."
        return None

    def validate_capacity(self, transfer: TransferWithCost, context: GuardrailContext) -> str | None:
        """Reject transfers when destination capacity is lower than the requested quantity."""
        if context.destination_capacity < transfer.proposal.qty:
            return "Rejected: destination capacity is lower than transfer quantity."
        return None

    def validate_quantity(self, transfer: TransferWithCost) -> str | None:
        """Reject transfers whose quantity is not positive."""
        if transfer.proposal.qty <= 0:
            return "Rejected: transfer quantity must be greater than zero."
        return None

    def validate_cold_chain(self, context: GuardrailContext) -> str | None:
        """Reject perishable transfers when cold chain support is unavailable."""
        if context.perishable and not context.cold_chain_available:
            return "Rejected: perishable transfer requires cold chain availability."
        return None

    def validate_threshold(self, transfer: TransferWithCost, context: GuardrailContext) -> str:
        """Return approval state based on the configurable transfer-value signoff threshold."""
        if transfer.transfer_cost > context.signoff_value_threshold:
            return "needs_signoff"
        return "approved"

    def validate_transfer(self, transfer: TransferWithCost) -> ValidatedTransfer:
        """Apply all deterministic guardrail rules to one costed transfer."""
        context = self._get_context(transfer)

        validators = (
            self.validate_margin(transfer),
            self.validate_holding_cost(transfer, context),
            self.validate_stock(transfer, context),
            self.validate_capacity(transfer, context),
            self.validate_quantity(transfer),
            self.validate_cold_chain(context),
        )

        for rejection_reason in validators:
            if rejection_reason is not None:
                logger.info(
                    "Transfer for sku %s rejected: %s",
                    transfer.proposal.sku,
                    rejection_reason,
                )
                return self._build_validated_transfer(
                    transfer=transfer,
                    status="rejected",
                    rejection_reason=rejection_reason,
                )

        status = self.validate_threshold(transfer, context)
        logger.info(
            "Transfer for sku %s validated with status %s.",
            transfer.proposal.sku,
            status,
        )
        return self._build_validated_transfer(
            transfer=transfer,
            status=status,
            rejection_reason=None,
        )

    def validate_all(self, transfers: list[TransferWithCost]) -> list[ValidatedTransfer]:
        """Apply guardrail validation to every provided costed transfer."""
        return [self.validate_transfer(transfer) for transfer in transfers]

    def _get_context(self, transfer: TransferWithCost) -> GuardrailContext:
        """Safely resolve provider-supplied validation inputs for a transfer."""
        try:
            return self._context_provider.get_context(transfer)
        except Exception as exc:
            logger.exception(
                "Failed to load guardrail context for sku %s.",
                transfer.proposal.sku,
            )
            raise GuardrailValidationError(
                f"Failed to load guardrail context for sku {transfer.proposal.sku}: {exc}"
            ) from exc

    @staticmethod
    def _build_validated_transfer(
        transfer: TransferWithCost,
        status: str,
        rejection_reason: str | None,
    ) -> ValidatedTransfer:
        """Map a costed transfer into the existing validated-transfer response model."""
        return ValidatedTransfer(
            sku=transfer.proposal.sku,
            from_location=transfer.proposal.from_location,
            to_location=transfer.proposal.to_location,
            qty=transfer.proposal.qty,
            transfer_cost=transfer.transfer_cost,
            margin_unlocked=transfer.margin_unlocked,
            demand_basis=transfer.proposal.demand_basis,
            cost_trade_off=transfer.proposal.cost_trade_off,
            status=status,
            rejection_reason=rejection_reason,
            cost_per_unit_moved=transfer.cost_per_recommendation,
        )
