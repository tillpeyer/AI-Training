package ch.elca.training.lunch.menu;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MenuService {

    private final MenuRepository menuRepository;

    public MenuService(MenuRepository menuRepository) {
        this.menuRepository = menuRepository;
    }

    public List<MenuItem> listAvailable() {
        return menuRepository.findAllByAvailableTrue();
    }
}
