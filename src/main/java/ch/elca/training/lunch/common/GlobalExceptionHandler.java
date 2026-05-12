package ch.elca.training.lunch.common;

import ch.elca.training.lunch.menu.MenuItemNotFoundException;
import ch.elca.training.lunch.menu.NotAdminException;
import ch.elca.training.lunch.order.AlreadyCancelledException;
import ch.elca.training.lunch.order.NotOrderOwnerException;
import ch.elca.training.lunch.order.OrderNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ApiError> handleMissingHeader(MissingRequestHeaderException ex) {
        if ("X-User-Id".equals(ex.getHeaderName())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiError("MISSING_USER", "Required header 'X-User-Id' is missing"));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError("MISSING_HEADER", "Required header '" + ex.getHeaderName() + "' is missing"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidationErrors(MethodArgumentNotValidException ex) {
        BindingResult bindingResult = ex.getBindingResult();
        FieldError fieldError = bindingResult.getFieldError();
        String field = fieldError != null ? fieldError.getField() : null;
        // Map field name to a specific error code; unknown/null fields fall back to INVALID_INPUT.
        // TODO: future refactor — derive code automatically via INVALID_<FIELD_NAME_UPPERCASE>
        String code = switch (field != null ? field : "") {
            case "quantity" -> "INVALID_QUANTITY";
            case "name" -> "INVALID_NAME";
            case "priceChf" -> "INVALID_PRICE";
            default -> "INVALID_INPUT";
        };
        String message = fieldError != null ? fieldError.getDefaultMessage() : "Request validation failed";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError(code, message));
    }

    @ExceptionHandler(NotAdminException.class)
    public ResponseEntity<ApiError> handleNotAdmin(NotAdminException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiError("NOT_ADMIN", ex.getMessage()));
    }

    @ExceptionHandler(MenuItemNotFoundException.class)
    public ResponseEntity<ApiError> handleMenuItemNotFound(MenuItemNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiError("MENU_ITEM_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<ApiError> handleOrderNotFound(OrderNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiError("ORDER_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(NotOrderOwnerException.class)
    public ResponseEntity<ApiError> handleNotOrderOwner(NotOrderOwnerException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiError("NOT_OWNER", ex.getMessage()));
    }

    @ExceptionHandler(AlreadyCancelledException.class)
    public ResponseEntity<ApiError> handleAlreadyCancelled(AlreadyCancelledException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiError("ALREADY_CANCELLED", ex.getMessage()));
    }
}
