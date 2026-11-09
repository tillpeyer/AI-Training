# Code Review — STORY-4: Cancel one of my orders

**Branch:** feature/STORY-4-cancel-order  
**Base branch:** feature/STORY-3-list-my-orders  
**Reviewer:** Sonnet 4.6 (subagent)  
**Date:** 2026-05-12

## TL;DR

Textbook implementation. All six ACs are delivered, the security-critical check order (existence → ownership → state) is correct and verified by a dedicated test, the `ResponseEntity<Void>` / 204 pattern is precise, and every error-path controller test asserts both `$.code` and `$.message`. No BLOCKERs. No MAJORs. Two MINORs, both cosmetic. The STORY-2 `MISSING_HEADER` fallback debt is deliberately untouched as required. **Recommend MERGE.**

---

## Findings

### BLOCKER

None.

### MAJOR

None.

### MINOR

1. **`OrderServiceTest.java:143` — Happy-path test stubs a `save()` return value that is never observed.**

   Line 143 configures `when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0))`. Because `cancel()` returns `void` and `OrderService.cancel` discards the return value of `orderRepository.save(order)` (line 52 of `OrderService.java` — the call is a bare statement with no assignment), the `thenAnswer` stub is never exercised by the assertion. The `ArgumentCaptor` at line 147 captures what was _passed in_, not what was returned, so the stub adds no value. It is not harmful, but it misleads a reader into thinking the return of `save` is observable here. The stub can be removed entirely, leaving only the `findById` stub.

2. **`OrderControllerTest.java:181` — `cancel_returnsNoContentOnSuccess` uses exact-match `doNothing()` but the `any()` fallback would be simpler and equally safe.**

   Line 181 stubs `doNothing().when(orderService).cancel(eq(orderId), eq("emp1"))`. The test then performs the PATCH with exactly `orderId` and header `emp1`, so the stub will match. However the test is exercising routing and HTTP semantics, not which exact arguments reach the service — the service is already mocked. Using `any(), any()` stubs here (as is done in the error-path tests on lines 204 and 219) would make the intent clearer: the happy-path test does not care about argument values, it cares about the 204 + empty body. The current form is not wrong, but it creates a superficial coupling between the stub and the path variable UUID that could confuse workshop participants.

### PRAISE

1. **`OrderService.java:42-53` — Security check order is strictly existence → ownership → state, with no deviation.** Reading line by line: `findById` / `orElseThrow` first (line 43-44), `!getUserId().equals(userId)` ownership guard second (line 45-47), `getStatus() == CANCELLED` state guard third (line 48-50). This order correctly prevents an attacker from discovering that a cancelled order exists by receiving a 409 instead of a 403. Exactly what AC-4 requires.

2. **`OrderServiceTest.java:199-213` — `cancel_throwsNotOrderOwnerEvenWhenOrderIsAlreadyCancelled` is the right adversarial test.** Setting `status=CANCELLED` for `emp1`'s order but calling with `emp2` is the precise probe that verifies the ownership guard fires before the state guard. The test name is self-documenting. This pattern is excellent workshop material.

3. **`GlobalExceptionHandler.java:53-63` — Three new `@ExceptionHandler` methods do not shadow any existing handler.** All three exception types (`OrderNotFoundException`, `NotOrderOwnerException`, `AlreadyCancelledException`) are new and distinct; none is a supertype of an existing mapped exception. The STORY-2 `MissingRequestHeaderException` and `MethodArgumentNotValidException` handlers are completely untouched. No handler precedence issue is possible here.

4. **`OrderController.java:41-47` — `ResponseEntity<Void>` + `ResponseEntity.noContent().build()` is the precise 204-with-no-body pattern.** Using the typed `Void` generic parameter signals to readers (and to Jackson) that the response body is intentionally absent. `noContent().build()` produces a 204 with a `Content-Length: 0` response, which matches AC-1 exactly and is consistent with STORY-2's use of explicit `ResponseEntity` generics.

5. **`OrderControllerTest.java:186` — `content().string("")` asserts the response body is truly empty on success.** The test does not just check the status code; it verifies no stray body bytes are present. This is a stronger assertion than merely checking `status().isNoContent()` and is a pattern worth carrying forward.

6. **Every error-path controller test asserts both `$.code` and `$.message` (lines 196, 209-210, 223-224, 237-238).** This directly addresses the CR MAJOR-2 debt identified in STORY-2 and applies the lesson consistently across all five new controller tests.

7. **No Lombok, no DTOs introduced, no `javax.*`, no new dependencies.** All three exception classes use plain `extends RuntimeException` with a single-argument-string `super(...)` call. Architecture constraints are respected without exception.

---

## Facet scores

| Facet | Score (1-5) | Notes |
|---|---|---|
| AC compliance | 5 | All 6 ACs delivered. 204/400/403/404/409 HTTP codes correct. `$.code` and `$.message` present on all error responses. AC-6 regression path (cancel → listMine) covered by service-test structure. |
| Architecture compliance | 5 | Feature-based packaging preserved. Only `order/` and `common/GlobalExceptionHandler.java` touched. No DTOs, no Lombok, no javax.*, no new dependencies, all three exceptions in the `order` package. |
| Test quality | 5 | ArgumentCaptor on happy path, `never().save()` on all error paths, dedicated security-ordering test, both `$.code` and `$.message` asserted on every error response, `content().string("")` on 204. No weak assertions anywhere. |
| Error handling correctness | 5 | 404 for unknown order, 403 (not 404) for wrong owner, 409 for double-cancel. Check order prevents existence leakage. STORY-2 MISSING_HEADER fallback not touched. No handler shadowing. |
| Code hygiene | 5 | Clear naming, correct method visibility (`public void cancel`), no null-safety gaps (`.equals()` called on the stored `userId`, not the caller-supplied one, so NPE impossible if DB is consistent), no dead code beyond one unnecessary stub (MINOR-1). |

---

## Recommendation

MERGE

No blocking or major issues. The two MINORs are cosmetic (an unnecessary Mockito stub and a stylistic preference on stub argument matchers). The security-critical check order is provably correct. The test suite is the strongest of the four stories reviewed so far.
