# Story 1 — List today's menu

**Status:** Draft (ready for SM to lock)
**Estimate:** 2 points
**Priority:** Must
**Depends on:** —

## Context

Employees need to see what's on offer before placing an order. This is the **smallest** story in the workshop and the recommended first cycle — perfect for getting a feel for the SM → Dev → QA loop without fighting validation, state, or auth.

PRD section: *Scope, item 1.*
Tech-spec section: *Package layout · `menu/`*

## Acceptance Criteria

- [ ] `GET /api/v1/menu` returns HTTP 200 with a JSON array of menu items
- [ ] Each array element has at minimum: `id`, `name`, `priceChf`, `available`
- [ ] Items with `available = false` are **excluded** from the response
- [ ] Empty menu returns `[]`, not `null` or 404
- [ ] No authentication required for this endpoint

## Technical Notes

- Create the package `ch.elca.training.lunch.menu`
- `MenuItem` is a `@Entity` with the fields listed in the tech spec
- `MenuRepository extends JpaRepository<MenuItem, UUID>` — add a derived query `findAllByAvailableTrue()`
- `MenuService` exposes one method: `List<MenuItem> listAvailable()`
- `MenuController` lives at `/api/v1/menu`
- Seed the in-memory DB with 3–4 example items via a `CommandLineRunner` or `@Bean` of `ApplicationRunner` for the workshop demo

## Definition of Done

- [ ] All ACs ticked
- [ ] At least one `@WebMvcTest` covers the happy path + the `available = false` filter
- [ ] At least one repository test verifies `findAllByAvailableTrue()`
- [ ] `mvn test` passes
- [ ] `mvn spring-boot:run` boots and `curl http://localhost:8080/api/v1/menu` returns the seeded items
- [ ] PR opened against `main`
