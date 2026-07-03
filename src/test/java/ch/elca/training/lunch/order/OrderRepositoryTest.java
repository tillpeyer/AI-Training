package ch.elca.training.lunch.order;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class OrderRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private OrderRepository orderRepository;

    private Order buildOrder(String userId, Instant createdAt, OrderStatus status) {
        Order order = new Order();
        order.setUserId(userId);
        order.setMenuItemId(UUID.randomUUID());
        order.setQuantity(1);
        order.setStatus(status);
        order.setCreatedAt(createdAt);
        return order;
    }

    @Test
    void findAllByUserIdOrderByCreatedAtDesc_returnsSortedOrdersIncludingCancelled() {
        Instant oldest = Instant.parse("2026-05-11T10:00:00Z");
        Instant middle = Instant.parse("2026-05-11T11:00:00Z");
        Instant newest = Instant.parse("2026-05-11T12:00:00Z");

        // 2 SUBMITTED orders for emp1 at different times, 1 CANCELLED for emp1, 1 for emp2
        entityManager.persist(buildOrder("emp1", oldest, OrderStatus.SUBMITTED));
        entityManager.persist(buildOrder("emp1", newest, OrderStatus.SUBMITTED));
        entityManager.persist(buildOrder("emp2", middle, OrderStatus.SUBMITTED));
        entityManager.persist(buildOrder("emp1", middle, OrderStatus.CANCELLED));
        entityManager.flush();

        List<Order> result = orderRepository.findAllByUserIdOrderByCreatedAtDesc("emp1");

        assertThat(result).hasSize(3);
        assertThat(result).allMatch(o -> "emp1".equals(o.getUserId()));
        // sorted descending: newest first
        assertThat(result.get(0).getCreatedAt()).isAfterOrEqualTo(result.get(1).getCreatedAt());
        assertThat(result.get(1).getCreatedAt()).isAfterOrEqualTo(result.get(2).getCreatedAt());
        // CANCELLED order is included (AC-6)
        assertThat(result).anyMatch(o -> o.getStatus() == OrderStatus.CANCELLED);
    }

    @Test
    void findAllByUserIdOrderByCreatedAtDesc_returnsEmptyListForUnknownUser() {
        entityManager.persist(buildOrder("emp1", Instant.now(), OrderStatus.SUBMITTED));
        entityManager.flush();

        List<Order> result = orderRepository.findAllByUserIdOrderByCreatedAtDesc("nobody");

        assertThat(result).isEmpty();
    }

    // --- STORY-1.8: existsByMenuItemId tests ---

    @Test
    void existsByMenuItemId_returnsTrueWhenAtLeastOneOrderReferencesTheItem() {
        UUID menuItemId = UUID.randomUUID();

        Order order = buildOrder("emp1", Instant.now(), OrderStatus.SUBMITTED);
        order.setMenuItemId(menuItemId);
        entityManager.persist(order);
        entityManager.flush();

        assertThat(orderRepository.existsByMenuItemId(menuItemId)).isTrue();
    }

    @Test
    void existsByMenuItemId_returnsTrueEvenWhenReferencingOrderIsCancelled() {
        UUID menuItemId = UUID.randomUUID();

        Order order = buildOrder("emp1", Instant.now(), OrderStatus.CANCELLED);
        order.setMenuItemId(menuItemId);
        entityManager.persist(order);
        entityManager.flush();

        assertThat(orderRepository.existsByMenuItemId(menuItemId)).isTrue();
    }

    @Test
    void existsByMenuItemId_returnsFalseWhenNoOrdersReferenceTheItem() {
        UUID unreferencedMenuItemId = UUID.randomUUID();
        UUID referencedMenuItemId = UUID.randomUUID();

        Order order = buildOrder("emp1", Instant.now(), OrderStatus.SUBMITTED);
        order.setMenuItemId(referencedMenuItemId);
        entityManager.persist(order);
        entityManager.flush();

        assertThat(orderRepository.existsByMenuItemId(unreferencedMenuItemId)).isFalse();
    }

    @Test
    void findAllByUserIdOrderByCreatedAtDesc_doesNotLeakOtherUsersOrders() {
        Instant t1 = Instant.parse("2026-05-11T10:00:00Z");
        Instant t2 = Instant.parse("2026-05-11T11:00:00Z");
        Instant t3 = Instant.parse("2026-05-11T12:00:00Z");

        // 2 orders for emp1, 1 for emp2
        entityManager.persist(buildOrder("emp1", t1, OrderStatus.SUBMITTED));
        entityManager.persist(buildOrder("emp1", t2, OrderStatus.SUBMITTED));
        entityManager.persist(buildOrder("emp2", t3, OrderStatus.SUBMITTED));
        entityManager.flush();

        // emp1 query: strong-form isolation — assert no emp2 data leaks
        List<Order> emp1Orders = orderRepository.findAllByUserIdOrderByCreatedAtDesc("emp1");
        assertThat(emp1Orders).hasSize(2);
        assertThat(emp1Orders).allMatch(o -> "emp1".equals(o.getUserId()));
        assertThat(emp1Orders).noneMatch(o -> "emp2".equals(o.getUserId()));

        // emp2 query: strong-form isolation — assert no emp1 data leaks
        List<Order> emp2Orders = orderRepository.findAllByUserIdOrderByCreatedAtDesc("emp2");
        assertThat(emp2Orders).hasSize(1);
        assertThat(emp2Orders).allMatch(o -> "emp2".equals(o.getUserId()));
        assertThat(emp2Orders).noneMatch(o -> "emp1".equals(o.getUserId()));
    }
}
