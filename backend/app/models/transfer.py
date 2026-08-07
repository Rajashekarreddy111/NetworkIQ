from typing import Literal

from pydantic import BaseModel, Field


class SurplusDeficit(BaseModel):
    """
    Output of a Store Agent.

    Indicates whether a SKU is in surplus,
    deficit or balanced at a store.
    """

    sku: str

    location: str

    status: Literal["surplus", "deficit", "balanced"]

    qty: int = Field(
        ...,
        ge=0
    )

    confidence: float = Field(
        ...,
        ge=0,
        le=1
    )

    reasoning: str

    model_config = {
        "extra": "forbid"
    }


class TransferProposal(BaseModel):
    """
    Output produced by the Coordinator Agent.

    Represents one proposed transfer before validation.
    """

    sku: str

    from_location: str

    to_location: str

    qty: int = Field(
        ...,
        gt=0
    )

    transfer_cost: float = Field(
        ...,
        ge=0
    )

    margin_unlocked: float = Field(
        ...,
        ge=0
    )

    demand_basis: str

    cost_trade_off: str

    model_config = {
        "extra": "forbid"
    }