package ch.elca.training.lunch.common;

import ch.elca.training.lunch.menu.MenuItemNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
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
        boolean quantityError = bindingResult.getFieldErrors().stream()
                .anyMatch(fe -> "quantity".equals(fe.getField()));
        if (quantityError) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiError("INVALID_QUANTITY", "quantity must be between 1 and 10"));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError("INVALID_REQUEST", "Request validation failed"));
    }

    @ExceptionHandler(MenuItemNotFoundException.class)
    public ResponseEntity<ApiError> handleMenuItemNotFound(MenuItemNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiError("MENU_ITEM_NOT_FOUND", ex.getMessage()));
    }
}
