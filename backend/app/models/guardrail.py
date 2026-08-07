from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class GuardrailContext(BaseModel):
    """Structured deterministic inputs required to validate one costed transfer."""

    source_stock: int = Field(
        ...,
        ge=0,
    )

    destination_capacity: int = Field(
        ...,
        ge=0,
    )

    perishable: bool

    cold_chain_available: bool

    holding_cost_threshold: float = Field(
        ...,
        ge=0,
    )

    signoff_value_threshold: float = Field(
        ...,
        ge=0,
    )

    model_config = ConfigDict(
        frozen=True,
        extra="forbid",
    )
