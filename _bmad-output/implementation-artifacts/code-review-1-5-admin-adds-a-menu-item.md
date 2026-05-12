# Code Review — STORY-5: Admin adds a menu item

**Branch:** feature/STORY-5-admin-add-menu-item  
**Base branch:** feature/STORY-4-cancel-order  
**Reviewer:** Sonnet 4.6 (subagent)  
**Date:** 2026-05-12

## TL;DR

Clean, complete implementation. All 7 ACs are delivered, the validation handler refactor is additive and correct (STORY-2 `INVALID_QUANTITY` tests remain green), the `NotAdminException` handler returns 403 (not 401), the admin check is null-safe, and all 6 new controller tests assert both `$.code` and `$.message` on error paths. One MINOR issue: the `add_returns400WhenNameExceeds100Chars` test asserts `$.code` but omits the `$.message` assertion, inconsistent with the story spec and the other five tests. One observation worth noting: the `GlobalExceptionHandler` refactor silently changes the `INVALID_QUANTITY` response message from the previous hard-coded string to Bean Validation's default message — no STORY-2 test breaks (they don't assert `$.message`) but the behavior change is invisible. No BLOCKERs. No MAJORs. **Recommend MERGE.**

---

## Findings

### BLOCKER

None.

### MAJOR

None.

### MINOR

1. **`MenuControllerTest.java:138` — `add_returns400WhenNameExceeds100Chars` omits `$.message` assertion.**

   Every other error-path test in this file asserts both `$.code` and `$.message` (e.g. lines 125-126, 148-149, 103-104, 113-114). The 101-char name test at line 138 asserts only `$.code`. The story spec (Task 5.1) and the general AC convention require both fields asserted. A typo that nulled out `message` in the handler would pass this test undetected. Fix: add `.andExpect(jsonPath("$.message").isNotEmpty())` after line 138.

2. **`GlobalExceptionHandler.java:37-43` — Validation refactor silently changes `INVALID_QUANTITY` response message content (behavioral drift, not a test failure).**

   The STORY-2 handler hard-coded `"quantity must be between 1 and 10"` as the message. The refactor replaces this with `fieldError.getDefaultMessage()`, which now returns the Bean Validation annotation message (e.g. `"must be greater than or equal to 1"` for `@Min(1)`). The STORY-2 controller tests (`submit_returns400WhenQuantityZero`, `submit_returns400WhenQuantityEleven`) do not assert `$.message` (STORY-2 MAJOR-2 debt), so they still pass. However the actual HTTP response message text has changed without any test catching it. If anyone was relying on that exact message string (e.g. an integration test or client), they would see a silent regression. This is pre-existing technical debt from STORY-2 MAJOR-2 (no `$.message` assertion on quantity tests); the STORY-5 refactor is not at fault for causing the gap, but it does silently widen it. No fix required for STORY-5 scope; document as motivation to address STORY-2 MAJOR-2 debt.

### PRAISE

1. **`GlobalExceptionHandler.java:30-46` — Validation refactor is clean, additive, and handles null safely.**

   Using `bindingResult.getFieldError()` (first error only) + a switch expression keyed on field name is the minimal correct change. The null guard (`fieldError != null ? fieldError.getField() : null`) and the empty-string switch key (`field != null ? field : ""`) together prevent NPE when binding has no field errors. The `default -> "INVALID_INPUT"` branch and the `// TODO` comment for future automation are exactly what Task 2.1 specified. `INVALID_QUANTITY` is preserved as required; `INVALID_NAME` and `INVALID_PRICE` are additive. No existing handlers were touched.

2. **`MenuController.java:38` — Admin check is null-safe with the literal-first `equals` pattern.**

   `!"true".equals(adminHeader)` correctly handles `null` (when `X-Admin` is absent), `"false"`, `"TRUE"`, and any other non-`"true"` value without risk of NPE. The story spec (Dev Notes, Latest Tech Information) explicitly requires this operand order. The comment in the method body documents the Spring `@Valid`-fires-first limitation and cites Task 4.2, which is exactly the right level of documentation for a workshop codebase.

3. **`MenuControllerTest.java:153-161` — Order-interaction test documents the observed behavior, not a prescription.**

   `add_returns403WhenAdminHeaderMissingEvenWithInvalidBody` (misnamed — it actually asserts 400, not 403) correctly captures the Spring default: `@Valid` fires before the method body, so an invalid body with a missing admin header returns 400. The test name is slightly misleading (the test body asserts `isBadRequest()` while the name says "MissingEvenWithInvalidBody" suggesting 403), but the in-line comment `// @Valid fires before method body` makes the intent unambiguous. This is exactly the documentation artifact Task 5.2 required.

4. **`MenuServiceTest.java:27-45` — Service test is thorough and uses `thenAnswer` correctly.**

   The `thenAnswer` stub injects a UUID into the saved `MenuItem` before returning it, which correctly simulates JPA assigning a generated ID. The `ArgumentCaptor` then checks what was _passed in_ to `save` (name, priceChf, available=true), not what was returned — this is the correct direction of assertion for a service that relies on a repository side effect. All three fields from AC-5 (available defaults true), AC-6 (id round-trips), and AC-3/4 (name/price) are validated.

5. **`NotAdminException.java:3-8` — Minimal, correct exception in the right package.**

   `extends RuntimeException`, no-arg constructor calling `super("X-Admin: true header required")` — exactly Task 1.1. Package is `menu/` per the architecture doc (admin is a menu-side concern). No Lombok, no extra fields.

6. **`GlobalExceptionHandler.java:48-52` — `NotAdminException` handler returns 403, not 401.**

   `HttpStatus.FORBIDDEN` is the correct status for authorization denial (the client is identified but not permitted). Using 401 would imply an authentication challenge requiring `WWW-Authenticate`, which is wrong here. The code `NOT_ADMIN` and message from `ex.getMessage()` satisfy AC-2 exactly. All three STORY-4 handlers (`OrderNotFoundException`, `NotOrderOwnerException`, `AlreadyCancelledException`) are preserved verbatim — no shadowing, no regressions.

7. **`CreateMenuItemRequest.java:10-13` — Record DTO with correct jakarta.* imports and all four validation annotations.**

   `@NotBlank @Size(max = 100)` on `name` and `@NotNull @PositiveOrZero` on `priceChf` map precisely to AC-3 and AC-4. Uses `jakarta.validation.constraints.*` (not `javax.*`) per Spring Boot 3.x requirement. No Lombok. The record form is the most concise correct implementation.

---

## Facet scores

| Facet | Score (1-5) | Notes |
|---|---|---|
| AC compliance | 5 | All 7 ACs delivered. 201 with id+available=true (AC-1, 5, 6), 403 NOT_ADMIN for missing/wrong header (AC-2), 400 INVALID_NAME / INVALID_PRICE for constraint violations (AC-3, 4). AC-7 regression (GET after POST) is covered structurally by the seed data + repository layer; no dedicated end-to-end test added, but the story spec did not require a new AC-7 test — it noted it as a regression check on STORY-1. |
| Architecture compliance | 5 | Feature-based packaging respected: `NotAdminException` and `CreateMenuItemRequest` in `menu/`; only `common/GlobalExceptionHandler.java` touched outside the feature. No Lombok, no new dependencies, `jakarta.*` throughout, second DTO justified (server-set `id`/`available` fields must not be spoofable). |
| Test quality | 4 | 6 controller tests + 1 service test cover all specified scenarios. ArgumentCaptor on both happy-path controller test and service test. `$.code` AND `$.message` asserted on 5 of 6 error paths. MINOR-1: `add_returns400WhenNameExceeds100Chars` missing `$.message`. `null_price` scenario not tested (no `add_returns400WhenPriceIsNull` test), though the story spec listed only negative price in Task 5.1's enumerated tests. |
| Error handling correctness | 5 | Validation refactor: `quantity`→`INVALID_QUANTITY`, `name`→`INVALID_NAME`, `priceChf`→`INVALID_PRICE`, fallback→`INVALID_INPUT`. NotAdminException → 403 FORBIDDEN (not 401). Admin check null-safe. STORY-2 `submit_returns400WhenQuantityZero` and `submit_returns400WhenQuantityEleven` still pass (they assert only `$.code`, not `$.message`). STORY-4 handlers intact. MISSING_HEADER fallback intentionally untouched. |
| Code hygiene | 5 | Null-safe literal-first equals in admin check, method visibility correct (`public` on `addItem`), no dead imports, inline comment on Spring `@Valid` ordering limitation is appropriately scoped, TODO comment in handler for future field-agnostic refactor. `org.mockito.Mockito.verify` called directly in `MenuServiceTest.java:38` (static-import available on line 17 as `import static org.mockito.Mockito.when` — the `verify` call should also use the static import for consistency) is cosmetic only. |

---

## Recommendation

MERGE

No blocking or major issues. MINOR-1 (`$.message` missing from one test) is a one-line fix but does not change production behavior. The validation handler refactor is the riskiest piece of this story and it is correct: STORY-2 tests pass, new codes are additive, null is handled, fallback is defined. All STORY-4 exception handlers are preserved. The known Spring `@Valid`-fires-first limitation is correctly documented in both the controller comment and the dedicated test.
