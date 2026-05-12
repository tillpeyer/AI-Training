package ch.elca.training.lunch.menu;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MenuController.class)
class MenuControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MenuService menuService;

    @Test
    void listMenu_returnsOkWithItems() throws Exception {
        MenuItem item1 = new MenuItem("Risotto aux champignons", new BigDecimal("14.50"), true);
        item1.setId(UUID.randomUUID());

        MenuItem item2 = new MenuItem("Salade César", new BigDecimal("12.00"), true);
        item2.setId(UUID.randomUUID());

        when(menuService.listAvailable()).thenReturn(List.of(item1, item2));

        mockMvc.perform(get("/api/v1/menu"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").isNotEmpty())
                .andExpect(jsonPath("$[0].name").isNotEmpty())
                .andExpect(jsonPath("$[0].priceChf").isNotEmpty())
                .andExpect(jsonPath("$[0].available").value(true));

        verify(menuService).listAvailable();
    }

    @Test
    void listMenu_emptyMenuReturnsEmptyArray() throws Exception {
        when(menuService.listAvailable()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/menu"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(menuService).listAvailable();
    }
}
