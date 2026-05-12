package ch.elca.training.lunch.menu;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MenuServiceTest {

    @Mock
    private MenuRepository menuRepository;

    @InjectMocks
    private MenuService menuService;

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
        org.mockito.Mockito.verify(menuRepository).save(captor.capture());

        MenuItem saved = captor.getValue();
        assertThat(saved.getName()).isEqualTo("Risotto");
        assertThat(saved.getPriceChf()).isEqualByComparingTo(new BigDecimal("14.50"));
        assertThat(saved.isAvailable()).isTrue();
        assertThat(result.getId()).isEqualTo(generatedId);
    }
}
