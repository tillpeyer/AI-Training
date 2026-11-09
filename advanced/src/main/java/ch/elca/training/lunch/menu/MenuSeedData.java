package ch.elca.training.lunch.menu;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.math.BigDecimal;

@Configuration
@Profile("!test")
public class MenuSeedData {

    @Bean
    public ApplicationRunner seedMenu(MenuRepository menuRepository) {
        return args -> {
            if (menuRepository.count() == 0) {
                menuRepository.save(new MenuItem("Risotto aux champignons", new BigDecimal("14.50"), true));
                menuRepository.save(new MenuItem("Salade César", new BigDecimal("12.00"), true));
                menuRepository.save(new MenuItem("Plat du jour", new BigDecimal("16.50"), true));
                menuRepository.save(new MenuItem("Soupe du jour", new BigDecimal("8.00"), false));
            }
        };
    }
}
