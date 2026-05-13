# Story 8 — Admin toggles a menu item's availability (WORKED EXAMPLE)

**Status:** Draft — **worked example, NOT for participant assignment**
**Estimate:** 1 point
**Priority:** Example (not Must / Should)
**Depends on:** STORY-1 (the `MenuItem` entity must exist) and STORY-5 (introduces
`NotAdminException` and the `X-Admin: true` gating pattern)

## Context

A second worked example, intended to sit alongside STORY-7 in the workshop materials. Where
STORY-7 demonstrates a **simple read** that reuses an already-mapped exception, STORY-8
demonstrates an **admin-gated mutation** with a small request DTO — covering the third pattern
participants will keep hitting in stories 1–6: state change behind an `X-Admin` check.

Today, items are added by admins but never updated. When the kitchen runs out of a dish mid-day,
the admin currently has no way to mark it unavailable short of a manual DB tweak. This story
adds a single endpoint to flip the `available` flag, reusing every piece of error-handling
infrastructure already in place.

The endpoint is additive: it touches only the `menu/` package (controller + service + a new
small request record) and reuses both `MenuItemNotFoundException` and `NotAdminException` along
with their existing `GlobalExceptionHandler` mappings. **No handler changes are needed.**

**Do not pick this story for your workshop slot — pick one of STORY-1..6.**

## Acceptance Criteria

- [ ] **AC-1** — `PATCH /api/v1/menu/{id}/availability` with header `X-Admin: true` and JSON body
      `{"available": false}` (or `true`) returns **200 OK** with the full updated `MenuItem`
      JSON body (`id`, `name`, `priceChf`, `available`) where `available` reflects the value
      from the request body. The change persists in the repository.
- [ ] **AC-2** — Without `X-Admin: true` (header missing, set to `false`, or any other value),
      the endpoint returns **403 Forbidden** with body
      `{"code":"NOT_ADMIN","message":"..."}` (message must be non-empty). The repository is not
      modified.
- [ ] **AC-3** — With a valid admin header but an unknown `id`, the endpoint returns **404 Not
      Found** with body `{"code":"MENU_ITEM_NOT_FOUND","message":"..."}` (message must be
      non-empty).

## Technical Notes

- Add a small request record `UpdateAvailabilityRequest(@NotNull Boolean available)` in the
  `menu/` package — mirrors the existing `CreateMenuItemRequest` pattern from STORY-5.
- Add one method to `MenuService`:
  ```java
  public MenuItem setAvailability(UUID id, boolean available) {
      MenuItem item = menuRepository.findById(id)
          .orElseThrow(() -> new MenuItemNotFoundException(id));
      item.setAvailable(available);
      return menuRepository.save(item);
  }
  ```
- Add one method to `MenuController`:
  ```java
  @PatchMapping("/{id}/availability")
  public MenuItem setAvailability(
          @RequestHeader(value = "X-Admin", required = false) String adminHeader,
          @PathVariable UUID id,
          @Valid @RequestBody UpdateAvailabilityRequest req) {
      if (!"true".equals(adminHeader)) {
          throw new NotAdminException();
      }
      return menuService.setAvailability(id, req.available());
  }
  ```
  Use the **same admin-first check pattern** as the existing `POST /api/v1/menu/items` (note
  the known caveat in that method's comment: `@Valid` fires before the method body, so a bad
  body with a missing admin header surfaces as 400, not 403 — this is accepted, do not try to
  fix it here).
- `GlobalExceptionHandler.handleNotAdmin` and `handleMenuItemNotFound` already map the two
  thrown exceptions — **zero handler changes required**.
- `MenuItem` already has a `setAvailable(boolean)` setter (JPA entity); no entity changes
  needed.

## Definition of Done

- [ ] All ACs ticked
- [ ] `@WebMvcTest` covers:
  - 200 happy path (PATCH with admin + body; assert response body reflects the new
    `available` value and the service was invoked with the right id + boolean)
  - 403 without admin header (assert both `$.code == "NOT_ADMIN"` and `$.message` non-empty;
    verify the service was **never** called)
  - 404 unknown id with admin header (mock service to throw `MenuItemNotFoundException`;
    assert both `$.code` and `$.message`)
- [ ] `mvn test` green (all existing tests still pass, +3 new)
- [ ] PR opened against `main`
