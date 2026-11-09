package ch.elca.training.lunch.menu;

public class NotAdminException extends RuntimeException {

    public NotAdminException() {
        super("X-Admin: true header required");
    }
}
