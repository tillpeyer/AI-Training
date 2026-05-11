package ch.elca.training.lunch.order;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateOrderRequest(
        @NotNull UUID menuItemId,
        @NotNull @Min(1) @Max(10) Integer quantity
) {
}
