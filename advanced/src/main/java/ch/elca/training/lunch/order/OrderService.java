package ch.elca.training.lunch.order;

import ch.elca.training.lunch.menu.MenuItemNotFoundException;
import ch.elca.training.lunch.menu.MenuRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final MenuRepository menuRepository;

    public OrderService(OrderRepository orderRepository, MenuRepository menuRepository) {
        this.orderRepository = orderRepository;
        this.menuRepository = menuRepository;
    }

    public Order submit(CreateOrderRequest req, String userId) {
        var menuItem = menuRepository.findById(req.menuItemId())
                .orElseThrow(() -> new MenuItemNotFoundException(req.menuItemId()));

        if (!menuItem.isAvailable()) {
            throw new MenuItemNotFoundException(req.menuItemId());
        }

        Order order = new Order();
        order.setUserId(userId);
        order.setMenuItemId(req.menuItemId());
        order.setQuantity(req.quantity());
        order.setStatus(OrderStatus.SUBMITTED);

        return orderRepository.save(order);
    }

    public List<Order> listMine(String userId) {
        return orderRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
    }

    public void cancel(UUID orderId, String userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));
        if (!order.getUserId().equals(userId)) {
            throw new NotOrderOwnerException(orderId, userId);
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new AlreadyCancelledException(orderId);
        }
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
    }
}
