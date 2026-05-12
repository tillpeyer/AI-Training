package ch.elca.training.lunch.order;

import ch.elca.training.lunch.common.GlobalExceptionHandler;
import ch.elca.training.lunch.menu.MenuItemNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OrderController.class)
@Import(GlobalExceptionHandler.class)
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OrderService orderService;

    @Test
    void submit_returnsCreatedWithOrder() throws Exception {
        UUID orderId = UUID.randomUUID();
        UUID menuItemId = UUID.randomUUID();

        Order saved = new Order();
        saved.setId(orderId);
        saved.setUserId("emp42");
        saved.setMenuItemId(menuItemId);
        saved.setQuantity(2);
        saved.setStatus(OrderStatus.SUBMITTED);
        saved.setCreatedAt(Instant.now());

        when(orderService.submit(any(CreateOrderRequest.class), eq("emp42"))).thenReturn(saved);

        mockMvc.perform(post("/api/v1/orders")
                        .header("X-User-Id", "emp42")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"menuItemId\":\"" + menuItemId + "\",\"quantity\":2}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(orderId.toString()))
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.userId").value("emp42"))
                .andExpect(jsonPath("$.menuItemId").value(menuItemId.toString()))
                .andExpect(jsonPath("$.quantity").value(2))
                .andExpect(jsonPath("$.createdAt").isNotEmpty());
    }

    @Test
    void submit_returns400WhenUserHeaderMissing() throws Exception {
        UUID menuItemId = UUID.randomUUID();

        mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"menuItemId\":\"" + menuItemId + "\",\"quantity\":2}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MISSING_USER"));
    }

    @Test
    void submit_returns400WhenQuantityZero() throws Exception {
        UUID menuItemId = UUID.randomUUID();

        mockMvc.perform(post("/api/v1/orders")
                        .header("X-User-Id", "emp42")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"menuItemId\":\"" + menuItemId + "\",\"quantity\":0}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_QUANTITY"));
    }

    @Test
    void submit_returns400WhenQuantityEleven() throws Exception {
        UUID menuItemId = UUID.randomUUID();

        mockMvc.perform(post("/api/v1/orders")
                        .header("X-User-Id", "emp42")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"menuItemId\":\"" + menuItemId + "\",\"quantity\":11}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_QUANTITY"));
    }

    @Test
    void submit_returns404WhenMenuItemUnknown() throws Exception {
        UUID menuItemId = UUID.randomUUID();

        when(orderService.submit(any(CreateOrderRequest.class), any()))
                .thenThrow(new MenuItemNotFoundException(menuItemId));

        mockMvc.perform(post("/api/v1/orders")
                        .header("X-User-Id", "emp42")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"menuItemId\":\"" + menuItemId + "\",\"quantity\":2}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("MENU_ITEM_NOT_FOUND"));
    }
}
