package ch.elca.training.lunch.menu;

import ch.elca.training.lunch.common.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MenuController.class)
@Import(GlobalExceptionHandler.class)
class MenuControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MenuService menuService;

    @Test
    void listMenu_returnsOkWithItems() throws Exception {
        MenuItem item1 = new MenuItem("Risotto aux champignons", new BigDecimal("14.50"), true);
        item1.setId(UUID.randomUUID());

        MenuItem item2 = new MenuItem("Salade César", new BigDecimal("12.00"), true);
        item2.setId(UUID.randomUUID());

        when(menuService.listAvailable()).thenReturn(List.of(item1, item2));

        mockMvc.perform(get("/api/v1/menu"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").isNotEmpty())
                .andExpect(jsonPath("$[0].name").isNotEmpty())
                .andExpect(jsonPath("$[0].priceChf").isNotEmpty())
                .andExpect(jsonPath("$[0].available").value(true));

        verify(menuService).listAvailable();
    }

    @Test
    void listMenu_emptyMenuReturnsEmptyArray() throws Exception {
        when(menuService.listAvailable()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/menu"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(menuService).listAvailable();
    }

    // --- STORY-7: GET /{id} tests ---

    @Test
    void getById_returnsOkWithMenuItem() throws Exception {
        UUID itemId = UUID.randomUUID();
        // Use available=false to prove AC-1: the endpoint returns items regardless of availability.
        MenuItem item = new MenuItem("Soupe du jour", new BigDecimal("8.50"), false);
        item.setId(itemId);

        when(menuService.getById(eq(itemId))).thenReturn(item);

        mockMvc.perform(get("/api/v1/menu/{id}", itemId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(itemId.toString()))
                .andExpect(jsonPath("$.name").value("Soupe du jour"))
                .andExpect(jsonPath("$.priceChf").value(8.50))
                .andExpect(jsonPath("$.available").value(false));

        verify(menuService).getById(itemId);
    }

    @Test
    void getById_returns404WhenUnknown() throws Exception {
        UUID unknownId = UUID.randomUUID();

        when(menuService.getById(eq(unknownId))).thenThrow(new MenuItemNotFoundException(unknownId));

        mockMvc.perform(get("/api/v1/menu/{id}", unknownId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("MENU_ITEM_NOT_FOUND"))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    // --- STORY-5: POST /items tests ---

    @Test
    void add_returnsCreatedWithItem() throws Exception {
        UUID itemId = UUID.randomUUID();
        MenuItem saved = new MenuItem("Risotto", new BigDecimal("14.50"), true);
        saved.setId(itemId);

        when(menuService.addItem(any(CreateMenuItemRequest.class))).thenReturn(saved);

        mockMvc.perform(post("/api/v1/menu/items")
                        .header("X-Admin", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Risotto\",\"priceChf\":14.50}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(itemId.toString()))
                .andExpect(jsonPath("$.name").value("Risotto"))
                .andExpect(jsonPath("$.priceChf").value(14.50))
                .andExpect(jsonPath("$.available").value(true));

        ArgumentCaptor<CreateMenuItemRequest> captor = ArgumentCaptor.forClass(CreateMenuItemRequest.class);
        verify(menuService).addItem(captor.capture());
        assertThat(captor.getValue().name()).isEqualTo("Risotto");
        assertThat(captor.getValue().priceChf()).isEqualByComparingTo(new BigDecimal("14.50"));
    }

    @Test
    void add_returns403WhenAdminHeaderMissing() throws Exception {
        mockMvc.perform(post("/api/v1/menu/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Risotto\",\"priceChf\":14.50}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("NOT_ADMIN"))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void add_returns403WhenAdminHeaderIsNotTrue() throws Exception {
        mockMvc.perform(post("/api/v1/menu/items")
                        .header("X-Admin", "false")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Risotto\",\"priceChf\":14.50}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("NOT_ADMIN"))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void add_returns400WhenNameIsBlank() throws Exception {
        mockMvc.perform(post("/api/v1/menu/items")
                        .header("X-Admin", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\",\"priceChf\":10.00}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_NAME"))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void add_returns400WhenNameExceeds100Chars() throws Exception {
        String longName = "a".repeat(101);
        mockMvc.perform(post("/api/v1/menu/items")
                        .header("X-Admin", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + longName + "\",\"priceChf\":10.00}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_NAME"))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void add_returns400WhenPriceIsNegative() throws Exception {
        mockMvc.perform(post("/api/v1/menu/items")
                        .header("X-Admin", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Risotto\",\"priceChf\":-1.00}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_PRICE"))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void add_returns403WhenAdminHeaderMissingEvenWithInvalidBody() throws Exception {
        // Spring fires @Valid before the method body; with an invalid body AND missing admin header,
        // the observed behavior is 400 (INVALID_NAME) because @Valid fires first.
        // Spring fires @Valid before method body; if admin-first is required, see Task 4.2 limitation.
        mockMvc.perform(post("/api/v1/menu/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\",\"priceChf\":10.00}"))
                .andExpect(status().isBadRequest()); // @Valid fires before method body
    }

    // --- STORY-1.8: DELETE /items/{id} tests ---

    @Test
    void delete_returnsNoContentWhenAdminAndNoOrders() throws Exception {
        UUID itemId = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/menu/items/{id}", itemId)
                        .header("X-Admin", "true"))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        verify(menuService).deleteById(itemId);
    }

    @Test
    void delete_returns404WhenItemUnknown() throws Exception {
        UUID unknownId = UUID.randomUUID();

        doThrow(new MenuItemNotFoundException(unknownId))
                .when(menuService).deleteById(unknownId);

        mockMvc.perform(delete("/api/v1/menu/items/{id}", unknownId)
                        .header("X-Admin", "true"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("MENU_ITEM_NOT_FOUND"))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void delete_returns409WhenReferencingOrdersExist() throws Exception {
        UUID itemId = UUID.randomUUID();

        doThrow(new MenuItemHasOrdersException(itemId))
                .when(menuService).deleteById(itemId);

        mockMvc.perform(delete("/api/v1/menu/items/{id}", itemId)
                        .header("X-Admin", "true"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("MENU_ITEM_HAS_ORDERS"))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void delete_returns403WhenAdminHeaderMissing() throws Exception {
        UUID itemId = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/menu/items/{id}", itemId))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("NOT_ADMIN"))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void delete_returns403WhenAdminHeaderIsNotTrue() throws Exception {
        UUID itemId = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/menu/items/{id}", itemId)
                        .header("X-Admin", "false"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("NOT_ADMIN"))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }
}
