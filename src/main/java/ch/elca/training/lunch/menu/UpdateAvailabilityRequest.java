package ch.elca.training.lunch.menu;

import jakarta.validation.constraints.NotNull;

public record UpdateAvailabilityRequest(@NotNull Boolean available) {
}
