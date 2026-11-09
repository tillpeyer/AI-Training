package ch.elca.training.lunch.order;

import java.util.UUID;

public class NotOrderOwnerException extends RuntimeException {

    public NotOrderOwnerException(UUID orderId, String userId) {
        super("User " + userId + " is not the owner of order " + orderId);
    }
}
