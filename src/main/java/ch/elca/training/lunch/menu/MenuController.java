package ch.elca.training.lunch.menu;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/menu")
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @GetMapping
    public List<MenuItem> listMenu() {
        return menuService.listAvailable();
    }

    @GetMapping("/{id}")
    public MenuItem getById(@PathVariable UUID id) {
        return menuService.getById(id);
    }

    @PostMapping("/items")
    public ResponseEntity<MenuItem> add(
            @RequestHeader(value = "X-Admin", required = false) String adminHeader,
            @Valid @RequestBody CreateMenuItemRequest req) {
        // Admin check first — fail closed on null, "false", "TRUE", or anything other than "true".
        // Known limitation: Spring fires @Valid before the method body, so an invalid body with a
        // missing/wrong admin header will return 400 (INVALID_NAME/INVALID_PRICE) instead of 403.
        // Enforcing admin-first semantics would require a HandlerInterceptor. Accepted for STORY-5 scope.
        if (!"true".equals(adminHeader)) {
            throw new NotAdminException();
        }
        MenuItem saved = menuService.addItem(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
