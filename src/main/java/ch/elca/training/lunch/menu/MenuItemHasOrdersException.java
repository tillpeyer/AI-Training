package ch.elca.training.lunch.menu;

import java.util.UUID;

public class MenuItemHasOrdersException extends RuntimeException {

    public MenuItemHasOrdersException(UUID menuItemId) {
        super("Menu item " + menuItemId + " cannot be deleted because orders reference it");
    }
}
