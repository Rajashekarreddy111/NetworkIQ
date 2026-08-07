from typing import Literal

from pydantic import BaseModel, Field

from app.models.transfer import TransferProposal


class ValidatedTransfer(TransferProposal):
    """
    Output after deterministic guardrail validation.
    """

    status: Literal[
        "approved",
        "rejected",
        "needs_signoff"
    ]

    rejection_reason: str | None = None

    cost_per_unit_moved: float = Field(
        ...,
        ge=0
    )

    model_config = {
        "extra": "forbid"
    }


class SelfCheckResult(BaseModel):
    """
    Output from the Self-Check Agent.
    """

    plan_ok: bool

    flagged_transfers: list[str]

    notes: str

    model_config = {
        "extra": "forbid"
    }