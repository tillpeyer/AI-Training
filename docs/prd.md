# PRD — Lunch Order API

> **Phase 2 artefact.** Produced by the PM agent in a previous (fictional) iteration. Use as input for the SM agent when locking stories.

## Problem

ELCA employees on-site want to pre-order lunch from the canteen but currently rely on a paper sheet at reception. The sheet is lost on average twice a month, orders are duplicated, and the kitchen has no electronic way to plan portions.

## Goal

Replace the paper sheet with a small HTTP service that:

- exposes today's menu
- accepts orders per employee
- lets employees see and cancel their own orders
- lets the canteen admin add menu items

We are not trying to build a payment platform, a delivery service, or a multi-restaurant marketplace.

## Personas

| Persona | Need |
|---|---|
| **Employee** | Order lunch in under 10 seconds |
| **Canteen admin** | Update today's menu, see total portions to prepare |

## Scope (5 stories)

| # | Story | Persona |
|---|---|---|
| 1 | List today's menu | Employee |
| 2 | Submit an order | Employee |
| 3 | List my orders | Employee |
| 4 | Cancel one of my orders | Employee |
| 5 | Add a menu item (admin) | Canteen admin |

## Out of scope (do not implement)

- Authentication / authorisation beyond a mock `X-User-Id` header
- Payment
- Notifications
- Multi-day menus
- Frontend

## Success criteria

- All five stories shipped, each with passing tests
- A single `mvn spring-boot:run` boots the service with H2 in-memory data
- `GET /actuator/health` returns `UP`

## Constraints

- Java 21, Spring Boot 3.5, H2 in-memory
- No additional infrastructure (no Redis, no Kafka, no external auth)
- Stories are independent — they can ship in any order
