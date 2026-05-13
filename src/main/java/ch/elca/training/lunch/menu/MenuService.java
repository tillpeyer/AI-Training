package ch.elca.training.lunch.menu;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class MenuService {

    private final MenuRepository menuRepository;

    public MenuService(MenuRepository menuRepository) {
        this.menuRepository = menuRepository;
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

    public MenuItem setAvailability(UUID id, boolean available) {
        MenuItem item = menuRepository.findById(id)
                .orElseThrow(() -> new MenuItemNotFoundException(id));
        item.setAvailable(available);
        return menuRepository.save(item);
    }
}
