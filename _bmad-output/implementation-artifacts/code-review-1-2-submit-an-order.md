# Code Review — STORY-2: Submit an order

**Branch:** feature/STORY-2-create-order
**Reviewer:** Sonnet 4.6 (subagent)
**Date:** 2026-05-11

## TL;DR

Solid, workshop-grade implementation. All six ACs are delivered, architecture rules are followed precisely, and the test suite covers every specified scenario with meaningful assertions. One MAJOR issue exists in the `GlobalExceptionHandler`: the `MISSING_USER` fallback inadvertently handles all missing-header cases as a `MISSING_HEADER` generic code, but when STORY-5 adds the `X-Admin` header, a missing admin header will produce a non-spec error code rather than the STORY-5-expected one — and there is no test covering the `else` branch. Recommend **merge after fixes**.

---

## Findings

### BLOCKER

None.

### MAJOR

1. **`GlobalExceptionHandler.java:21-22` — Undocumented fallback error code leaks into future stories.**

   `handleMissingHeader` correctly maps `X-User-Id` → `MISSING_USER`, but falls through to a generic `MISSING_HEADER` code for every _other_ missing header. The spec (`docs/tech-spec.md`) lists `X-Admin: true` as a required header on admin endpoints (STORY-5). When STORY-5 is implemented and `X-Admin` is absent, Spring will throw `MissingRequestHeaderException` and this handler will return `{"code":"MISSING_HEADER","message":"Required header 'X-Admin' is missing"}` — a code nowhere defined in any spec. STORY-5 will almost certainly expect something different (e.g. `MISSING_ADMIN` or a 403). The bug is latent here and will silently pass tests right up until STORY-5 wires that header.

   The safer default is to rethrow or call `super` for unknown headers (or to return `400 MISSING_HEADER` but leave a `TODO` comment calling out STORY-5). At minimum the else-branch needs a comment that this code is intentional and must be revisited in STORY-5.

   There is **no test** covering this else-branch, so it is untested production code today.

2. **`OrderControllerTest.java:69` — Missing `$.message` assertion on `MISSING_USER` response.**

   The test `submit_returns400WhenUserHeaderMissing` checks `$.code` but not `$.message`. The spec (AC-2) demands a populated `message` field. A future refactor that accidentally nulls out `message` in `ApiError` would still pass all tests. The same gap exists in `submit_returns400WhenQuantityZero` (line 82), `submit_returns400WhenQuantityEleven` (line 93), and `submit_returns404WhenMenuItemUnknown` (line 108). These four tests verify the code discriminator but never assert the message is non-null/non-empty. Low effort to add `.andExpect(jsonPath("$.message").isNotEmpty())` to each.

### MINOR

1. **`Order.java:89` — `setCreatedAt` mutator makes a server-set field publicly settable.**

   `createdAt` is annotated `@CreationTimestamp` and `@Column(updatable = false)` — the intent is that it is set exactly once by Hibernate. But the public setter `setCreatedAt(Instant)` allows any caller to overwrite it before `save()`. In the controller test (line 44) the test itself calls `saved.setCreatedAt(Instant.now())` to fabricate a response object, which demonstrates the gap. For STORY-3 and beyond, wherever an `Order` is manipulated in tests or seeds, this mutator will mislead readers into thinking the field is user-settable. Consider removing the setter (or at least marking it with a `// test-only` comment) given the `updatable = false` contract.

2. **`CreateOrderRequest.java:11` — `@NotNull` on `quantity` is redundant alongside `@Min`/`@Max` for an `Integer`.**

   When `quantity` is absent from the JSON body, Jackson deserialises it as `null` and `@NotNull` fires first (before `@Min`/`@Max`). The error code produced will still be `INVALID_QUANTITY` (via `GlobalExceptionHandler` which checks field name regardless of constraint), so the visible behaviour is correct. But the validation intent is muddled: `@Min(1)` already implies non-null in business terms. This is a documentation-clarity issue, not a runtime bug. Adding a `// null -> treated as INVALID_QUANTITY` comment, or replacing `Integer` with primitive `int`, would be cleaner. (Primitive `int` would mean Jackson defaults to `0` on omission, which then fails `@Min(1)` cleanly.)

3. **`GlobalExceptionHandler.java:27` — Unused import `BindingResult`.**

   Line 6 imports `org.springframework.validation.BindingResult` but the local variable is obtained via `ex.getBindingResult()` assigned to a `BindingResult` variable on line 27. The import is used, so technically not unused. However, the pattern `BindingResult bindingResult = ex.getBindingResult()` stores the result in a named variable only to call `.getFieldErrors()` on the very next line. The intermediate variable adds no clarity. Inlining it as `ex.getBindingResult().getFieldErrors().stream()...` would be more idiomatic and is strictly cleaner. Nitpick only.

4. **`OrderServiceTest.java:62-67` — ArgumentCaptor assertions duplicate the return-value assertions above.**

   Lines 56-59 already assert `result.getStatus()`, `result.getUserId()`, etc. from the mocked return. Lines 62-67 then capture the `save()` argument and re-assert the same field values. The second block is more valuable (it checks what was passed _in_ to `save`, not what was returned), but the first block is testing the mock's own return value, not the code under test. The test reads as if it is testing more than it is. Removing lines 56-59 (or renaming the test to make clear two concerns are validated) would reduce noise without losing coverage.

### PRAISE

1. **`GlobalExceptionHandler.java:17` — Header-name guard on `MissingRequestHeaderException` is the right pattern.** Checking `ex.getHeaderName()` rather than catching a generic `Exception` keeps error codes unambiguous and paves the way for additional header-specific handling (STORY-5's `X-Admin`). This is the textbook approach for this problem.

2. **`OrderService.java:19-24` — Single-responsibility absence + availability check, two distinct code paths unified under one exception type.** The spec says "non-existent OR unavailable → 404 MENU_ITEM_NOT_FOUND". The implementation delivers this without duplicating the exception or adding a second exception type. The code matches the spec sentence exactly.

3. **`OrderControllerTest.java:24` — `@Import(GlobalExceptionHandler.class)` on the `@WebMvcTest` class.** This is the correct way to load the advice in a slice test without promoting to `@SpringBootTest`. It serves as a clear pattern for STORY-3..5 to follow.

4. **`Order.java:17` — `@Table(name = "orders")` applied preemptively with documented rationale.** Renaming the table from the reserved word `order` to `orders` avoids H2/SQL syntax errors and is recorded in the Dev Agent Record. Good defensive practice with zero spec violation.

5. **`OrderServiceTest.java` — ArgumentCaptor used to verify the _argument_ passed to `save()`.** Rather than just verifying `save` was called once (the weak form), the test captures and inspects every field. This gives true unit-test coverage of the mapping logic in `OrderService.submit`.

6. **No Lombok, no field injection, no javax.* imports, `BigDecimal` in `MenuItem`, `UUID` ids, `jakarta.*` throughout.** Every locked architecture rule from `docs/tech-spec.md` is respected across all nine production files.

---

## Facet scores

| Facet | Score (1-5) | Notes |
|---|---|---|
| AC compliance | 5 | All 6 ACs are delivered. Status=SUBMITTED is server-set, id is returned, validation ranges match spec exactly. |
| Architecture compliance | 5 | Feature-based packaging, no JPA relations, no Lombok, jakarta.*, UUID ids, BigDecimal in MenuItem, single documented DTO exception. Perfect. |
| Test quality | 3 | ArgumentCaptor usage is excellent. But four error-path tests omit `$.message` assertions (AC-2 says message must be present), the else-branch of `GlobalExceptionHandler` has zero test coverage, and the happy-path service test has redundant assertion duplication. |
| Error handling correctness | 3 | The X-User-Id guard is correct and the three primary mappings are right. The latent `MISSING_HEADER` fallback for future unknown headers (e.g. STORY-5 X-Admin) is a correctness time-bomb. No information leakage beyond the menu item UUID in the error message, which is acceptable for this workshop context. |
| Code hygiene | 4 | Constructor injection everywhere, clear naming, no dead code. Minor: `setCreatedAt` public mutator contradicts `updatable=false` intent; `@NotNull` + `Integer` vs primitive `int` on `quantity`. |

---

## Recommendation

⚠️ MERGE AFTER FIXES

The implementation is well-structured and test-green. The two MAJOR items are straightforward to address: (1) add a comment (or explicit rethrow) to the `GlobalExceptionHandler` else-branch and add a test for it, and (2) add `$.message` non-empty assertions to the four error-scenario controller tests. Neither requires architectural rework. Once those are in, this is a clean merge.
