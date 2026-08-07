from __future__ import annotations

from pydantic import BaseModel, Field, ConfigDict

from app.models.transfer import TransferProposal


class TransferContext(BaseModel):
    """Structured deterministic inputs required by the cost engine for one transfer proposal."""

    proposal: TransferProposal

    stock_qty: int = Field(
        ...,
        ge=0,
    )

    unit_holding_cost_rate: float = Field(
        ...,
        ge=0,
    )

    expected_incremental_sales: int = Field(
        ...,
        ge=0,
    )

    unit_margin: float = Field(
        ...,
        ge=0,
    )

    lane_cost: float = Field(
        ...,
        ge=0,
    )

    model_config = ConfigDict(
        frozen=True,
        extra="forbid",
    )


class TransferWithCost(BaseModel):
    """Immutable costed transfer result produced by the deterministic cost engine."""

    proposal: TransferProposal

    holding_cost: float = Field(
        ...,
        ge=0,
    )

    transfer_cost: float = Field(
        ...,
        ge=0,
    )

    margin_unlocked: float = Field(
        ...,
        ge=0,
    )

    cost_per_recommendation: float = Field(
        ...,
        ge=0,
    )

    model_config = ConfigDict(
        frozen=True,
        extra="forbid",
    )
