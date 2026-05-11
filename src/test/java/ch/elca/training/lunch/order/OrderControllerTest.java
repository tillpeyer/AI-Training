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
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

    @Test
    void listMine_returnsOkWithOrders() throws Exception {
        UUID orderId1 = UUID.randomUUID();
        UUID orderId2 = UUID.randomUUID();
        UUID menuItemId1 = UUID.randomUUID();
        UUID menuItemId2 = UUID.randomUUID();

        Order order1 = new Order();
        order1.setId(orderId1);
        order1.setUserId("emp1");
        order1.setMenuItemId(menuItemId1);
        order1.setQuantity(1);
        order1.setStatus(OrderStatus.SUBMITTED);
        order1.setCreatedAt(Instant.now());

        Order order2 = new Order();
        order2.setId(orderId2);
        order2.setUserId("emp1");
        order2.setMenuItemId(menuItemId2);
        order2.setQuantity(2);
        order2.setStatus(OrderStatus.SUBMITTED);
        order2.setCreatedAt(Instant.now());

        when(orderService.listMine(eq("emp1"))).thenReturn(List.of(order1, order2));

        mockMvc.perform(get("/api/v1/orders/me")
                        .header("X-User-Id", "emp1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(orderId1.toString()))
                .andExpect(jsonPath("$[0].userId").value("emp1"))
                .andExpect(jsonPath("$[0].menuItemId").value(menuItemId1.toString()))
                .andExpect(jsonPath("$[0].quantity").value(1))
                .andExpect(jsonPath("$[0].status").value("SUBMITTED"))
                .andExpect(jsonPath("$[0].createdAt").isNotEmpty());

        verify(orderService).listMine(eq("emp1"));
    }

    @Test
    void listMine_returnsEmptyArrayWhenNoOrders() throws Exception {
        when(orderService.listMine(eq("emp1"))).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/orders/me")
                        .header("X-User-Id", "emp1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void listMine_returns400WhenUserHeaderMissing() throws Exception {
        mockMvc.perform(get("/api/v1/orders/me"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MISSING_USER"))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }
}
