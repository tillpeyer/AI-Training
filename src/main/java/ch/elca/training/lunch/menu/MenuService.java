package ch.elca.training.lunch.menu;

import ch.elca.training.lunch.order.OrderRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class MenuService {

    private final MenuRepository menuRepository;
    private final OrderRepository orderRepository;

    public MenuService(MenuRepository menuRepository, OrderRepository orderRepository) {
        this.menuRepository = menuRepository;
        this.orderRepository = orderRepository;
    }

    public List<MenuItem> listAvailable() {
        return menuRepository.findAllByAvailableTrue();
    }

    public MenuItem getById(UUID id) {
        return menuRepository.findById(id)
                .orElseThrow(() -> new MenuItemNotFoundException(id));
    }

    public MenuItem addItem(CreateMenuItemRequest req) {
        MenuItem item = new MenuItem();
        item.setName(req.name());
        item.setPriceChf(req.priceChf());
        item.setAvailable(true);
        return menuRepository.save(item);
    }

    public void deleteById(UUID id) {
        MenuItem item = menuRepository.findById(id)
                .orElseThrow(() -> new MenuItemNotFoundException(id));
        if (orderRepository.existsByMenuItemId(id)) {
            throw new MenuItemHasOrdersException(id);
        }
        menuRepository.delete(item);
    }
}
