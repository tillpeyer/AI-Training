package ch.elca.training.lunch.menu;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class MenuRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private MenuRepository menuRepository;

    @Test
    void findAllByAvailableTrue_returnsOnlyAvailableItems() {
        entityManager.persist(new MenuItem("Pizza Margherita", new BigDecimal("13.00"), true));
        entityManager.persist(new MenuItem("Pasta Carbonara", new BigDecimal("14.00"), true));
        entityManager.persist(new MenuItem("Soupe du jour", new BigDecimal("8.00"), false));
        entityManager.flush();

        List<MenuItem> result = menuRepository.findAllByAvailableTrue();

        assertThat(result).hasSize(2);
        assertThat(result).allMatch(MenuItem::isAvailable);
    }
}
