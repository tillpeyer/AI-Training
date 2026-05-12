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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
    void listMine_returnsOnlyCallersOrdersInDescOrder() {
        UUID menuItemId1 = UUID.randomUUID();
        UUID menuItemId2 = UUID.randomUUID();

        Order order1 = new Order();
        order1.setId(UUID.randomUUID());
        order1.setUserId("emp1");
        order1.setMenuItemId(menuItemId1);
        order1.setQuantity(1);
        order1.setStatus(OrderStatus.SUBMITTED);

        Order order2 = new Order();
        order2.setId(UUID.randomUUID());
        order2.setUserId("emp1");
        order2.setMenuItemId(menuItemId2);
        order2.setQuantity(2);
        order2.setStatus(OrderStatus.CANCELLED);

        List<Order> expected = List.of(order1, order2);

        ArgumentCaptor<String> userIdCaptor = ArgumentCaptor.forClass(String.class);
        when(orderRepository.findAllByUserIdOrderByCreatedAtDesc("emp1")).thenReturn(expected);

        List<Order> result = orderService.listMine("emp1");

        verify(orderRepository).findAllByUserIdOrderByCreatedAtDesc(userIdCaptor.capture());
        assertThat(userIdCaptor.getValue()).isEqualTo("emp1");
        assertThat(result).isSameAs(expected);
        assertThat(result).hasSize(2);
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

    @Test
    void cancel_flipsStatusToCancelledWhenOwnerCancelsSubmittedOrder() {
        UUID orderId = UUID.randomUUID();

        Order order = new Order();
        order.setId(orderId);
        order.setUserId("emp1");
        order.setStatus(OrderStatus.SUBMITTED);

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        orderService.cancel(orderId, "emp1");

        ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(OrderStatus.CANCELLED);
    }

    @Test
    void cancel_throwsOrderNotFoundWhenIdUnknown() {
        UUID orderId = UUID.randomUUID();

        when(orderRepository.findById(orderId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.cancel(orderId, "emp1"))
                .isInstanceOf(OrderNotFoundException.class);

        verify(orderRepository, never()).save(any());
    }

    @Test
    void cancel_throwsNotOrderOwnerWhenDifferentUser() {
        UUID orderId = UUID.randomUUID();

        Order order = new Order();
        order.setId(orderId);
        order.setUserId("emp1");
        order.setStatus(OrderStatus.SUBMITTED);

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.cancel(orderId, "emp2"))
                .isInstanceOf(NotOrderOwnerException.class);

        verify(orderRepository, never()).save(any());
    }

    @Test
    void cancel_throwsAlreadyCancelledWhenStatusIsCancelled() {
        UUID orderId = UUID.randomUUID();

        Order order = new Order();
        order.setId(orderId);
        order.setUserId("emp1");
        order.setStatus(OrderStatus.CANCELLED);

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.cancel(orderId, "emp1"))
                .isInstanceOf(AlreadyCancelledException.class);

        verify(orderRepository, never()).save(any());
    }

    @Test
    void cancel_throwsNotOrderOwnerEvenWhenOrderIsAlreadyCancelled() {
        UUID orderId = UUID.randomUUID();

        Order order = new Order();
        order.setId(orderId);
        order.setUserId("emp1");
        order.setStatus(OrderStatus.CANCELLED);

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.cancel(orderId, "emp2"))
                .isInstanceOf(NotOrderOwnerException.class);

        verify(orderRepository, never()).save(any());
    }
}
