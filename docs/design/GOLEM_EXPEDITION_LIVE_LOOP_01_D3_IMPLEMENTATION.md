# GOLEM-EXPEDITION-LIVE-LOOP-01 — D3 Implementation

```text
STATUS          AUTHORIZED / IN PROGRESS
PHASE           D3 — LIVE-LOOP IMPLEMENTATION
D1 CONTRACT     FROZEN / PASS
D2 VECTORS      FROZEN / PASS
PRESENTATION E3 SEPARATE / NOT AUTHORIZED
RUNTIME PROMOTION HOLD
MAIN MERGE      HOLD
```

## Naming boundary

`D3` exclusively names implementation of `GOLEM-EXPEDITION-LIVE-LOOP-01`.
The existing Presentation E3 name remains reserved for PC gaze hierarchy and
layout work. Neither phase implies or authorizes the other.

## Authorization decision

D3 is authorized because the canonical direction, state and transaction
contract, component-wise damage mapping, golden vectors, and migration
fixtures are frozen. Authorization permits incremental implementation against
those artifacts; it does not authorize runtime promotion or `MAIN MERGE`.

## Implementation slices

```text
D3.1  PURE STEP EVALUATOR             PASS
D3.2  CANONICAL STATE TRANSACTIONS    IN PROGRESS — IDEMPOTENCY SLICE PASS
D3.3  PERSISTENCE / RECOVERY          HOLD
D3.4  CARGO / TELEMETRY COMMIT        HOLD
D3.5  UI BINDING                      HOLD
D3.6  RUNTIME / REGRESSION             HOLD
```

### D3.1 evidence

`godot/domain/expedition_live_loop.gd` projects the frozen legacy evaluator
output into exact ENTRY, HAZARD, ENCOUNTER, and RECOVERY steps. It introduces
no random roll, clock, mutable hidden state, component redistribution, or new
balance rule. Every plan and step projection is derived solely from its input.

`godot/tests/run_all.gd` checks all 5,120 D2 vectors, all frozen component and
prefix values, each reachable step result, and rejection of unreachable steps.

Local official Godot 4.7.1 result after the D3.2 idempotency slice:

```text
GODOT-PORT: PASS — 34616 checks
```

### D3.2 exactly-once boundary

The first state-transaction test submits the same `CONTINUE` command twice
with one stable `command_id`. The second submission returns the exact recorded
result while the complete committed state remains byte-for-byte equivalent:
durability, pending cargo, events, telemetry, and inventory are not reapplied
or mutated. Duplicate lookup occurs before current-phase validation because a
successful first command has already advanced the decision.

## Next boundary

D3.2 may continue adding canonical state transitions only through the D1
transaction ordering and D2 identities. Persistence, cargo commitment,
telemetry emission, and UI binding remain held until their named slices begin
and pass their own tests.
