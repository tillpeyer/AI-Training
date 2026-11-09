package ch.elca.training.lunch.order;

import java.util.UUID;

public class AlreadyCancelledException extends RuntimeException {

    public AlreadyCancelledException(UUID orderId) {
        super("Order " + orderId + " is already cancelled");
    }
}
