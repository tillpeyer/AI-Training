package ch.elca.training.lunch.order;

import ch.elca.training.lunch.menu.MenuItemNotFoundException;
import ch.elca.training.lunch.menu.MenuItem;
import ch.elca.training.lunch.menu.MenuRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private MenuRepository menuRepository;

    @InjectMocks
    private OrderService orderService;

    @Test
    void submit_persistsOrderWithSubmittedStatus() {
        UUID menuItemId = UUID.randomUUID();
        MenuItem menuItem = new MenuItem("Risotto", new BigDecimal("14.50"), true);
        menuItem.setId(menuItemId);

        CreateOrderRequest req = new CreateOrderRequest(menuItemId, 2);

        when(menuRepository.findById(menuItemId)).thenReturn(Optional.of(menuItem));

        Order savedOrder = new Order();
        savedOrder.setId(UUID.randomUUID());
        savedOrder.setUserId("emp42");
        savedOrder.setMenuItemId(menuItemId);
        savedOrder.setQuantity(2);
        savedOrder.setStatus(OrderStatus.SUBMITTED);
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);

        Order result = orderService.submit(req, "emp42");

        assertThat(result.getStatus()).isEqualTo(OrderStatus.SUBMITTED);
        assertThat(result.getUserId()).isEqualTo("emp42");
        assertThat(result.getMenuItemId()).isEqualTo(menuItemId);
        assertThat(result.getQuantity()).isEqualTo(2);

        ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(captor.capture());
        Order captured = captor.getValue();
        assertThat(captured.getStatus()).isEqualTo(OrderStatus.SUBMITTED);
        assertThat(captured.getUserId()).isEqualTo("emp42");
        assertThat(captured.getMenuItemId()).isEqualTo(menuItemId);
        assertThat(captured.getQuantity()).isEqualTo(2);
    }

    @Test
    void submit_throwsWhenMenuItemAbsent() {
        UUID menuItemId = UUID.randomUUID();
        CreateOrderRequest req = new CreateOrderRequest(menuItemId, 1);

        when(menuRepository.findById(menuItemId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.submit(req, "emp42"))
                .isInstanceOf(MenuItemNotFoundException.class);

        verify(orderRepository, never()).save(any());
    }

    @Test
    void submit_throwsWhenMenuItemUnavailable() {
        UUID menuItemId = UUID.randomUUID();
        MenuItem menuItem = new MenuItem("Soupe", new BigDecimal("8.00"), false);
        menuItem.setId(menuItemId);

        CreateOrderRequest req = new CreateOrderRequest(menuItemId, 1);

        when(menuRepository.findById(menuItemId)).thenReturn(Optional.of(menuItem));

        assertThatThrownBy(() -> orderService.submit(req, "emp42"))
                .isInstanceOf(MenuItemNotFoundException.class);

        verify(orderRepository, never()).save(any());
    }
}
