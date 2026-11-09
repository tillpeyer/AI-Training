package ch.elca.training.lunch.menu;

import java.util.UUID;

public class MenuItemNotFoundException extends RuntimeException {

    public MenuItemNotFoundException(UUID menuItemId) {
        super("Menu item not found or unavailable: " + menuItemId);
    }
}
