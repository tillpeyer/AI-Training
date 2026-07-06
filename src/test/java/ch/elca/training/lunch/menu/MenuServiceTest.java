package ch.elca.training.lunch.menu;

import ch.elca.training.lunch.order.OrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

@ExtendWith(MockitoExtension.class)
class MenuServiceTest {

    @Mock
    private MenuRepository menuRepository;

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private MenuService menuService;

    @Test
    void getById_returnsItemWhenFound() {
        UUID id = UUID.randomUUID();
        MenuItem stored = new MenuItem("Tartare", new BigDecimal("18.00"), false);
        stored.setId(id);

        when(menuRepository.findById(id)).thenReturn(Optional.of(stored));

        MenuItem result = menuService.getById(id);

        assertThat(result.getId()).isEqualTo(id);
        assertThat(result.getName()).isEqualTo("Tartare");
        assertThat(result.isAvailable()).isFalse();
    }

    @Test
    void getById_throwsMenuItemNotFoundWhenAbsent() {
        UUID id = UUID.randomUUID();
        when(menuRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> menuService.getById(id))
                .isInstanceOf(MenuItemNotFoundException.class)
                .hasMessageContaining(id.toString());
    }

    @Test
    void addItem_savesItemWithCorrectFieldsAndAvailableTrue() {
        UUID generatedId = UUID.randomUUID();
        when(menuRepository.save(any(MenuItem.class))).thenAnswer(inv -> {
            MenuItem item = inv.getArgument(0);
            item.setId(generatedId);
            return item;
        });

        MenuItem result = menuService.addItem(new CreateMenuItemRequest("Risotto", new BigDecimal("14.50")));

        ArgumentCaptor<MenuItem> captor = ArgumentCaptor.forClass(MenuItem.class);
        verify(menuRepository).save(captor.capture());

        MenuItem saved = captor.getValue();
        assertThat(saved.getName()).isEqualTo("Risotto");
        assertThat(saved.getPriceChf()).isEqualByComparingTo(new BigDecimal("14.50"));
        assertThat(saved.isAvailable()).isTrue();
        assertThat(result.getId()).isEqualTo(generatedId);
    }

    // --- STORY-1.8: deleteById tests ---

    @Test
    void deleteById_deletesItemWhenNoReferencingOrders() {
        UUID id = UUID.randomUUID();
        MenuItem stored = new MenuItem("Tartare", new BigDecimal("18.00"), true);
        stored.setId(id);

        when(menuRepository.findById(id)).thenReturn(Optional.of(stored));
        when(orderRepository.existsByMenuItemId(id)).thenReturn(false);

        menuService.deleteById(id);

        verify(menuRepository).delete(stored);
    }

    @Test
    void deleteById_throwsMenuItemNotFoundWhenAbsent() {
        UUID id = UUID.randomUUID();
        when(menuRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> menuService.deleteById(id))
                .isInstanceOf(MenuItemNotFoundException.class)
                .hasMessageContaining(id.toString());

        verify(menuRepository, never()).delete(any(MenuItem.class));
    }

    @Test
    void deleteById_throwsMenuItemHasOrdersWhenReferencingOrdersExist() {
        UUID id = UUID.randomUUID();
        MenuItem stored = new MenuItem("Tartare", new BigDecimal("18.00"), true);
        stored.setId(id);

        when(menuRepository.findById(id)).thenReturn(Optional.of(stored));
        when(orderRepository.existsByMenuItemId(id)).thenReturn(true);

        assertThatThrownBy(() -> menuService.deleteById(id))
                .isInstanceOf(MenuItemHasOrdersException.class)
                .hasMessageContaining(id.toString());

        verify(menuRepository, never()).delete(any(MenuItem.class));
    }
}
