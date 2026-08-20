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
D3.2  CANONICAL STATE TRANSACTIONS    PASS
D3.3  PERSISTENCE / RECOVERY          NEXT
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

Local official Godot 4.7.1 result after completing D3.2:

```text
GODOT-PORT: PASS — 190150 checks
```

### D3.2 exactly-once boundary

The state-transaction test submits the same `CONTINUE` command twice for every
reachable step across all 5,120 D2 golden vectors (10,368 step projections).
This covers ordinary `DECISION`, successful final `RETURNED`, and destruction
at ENTRY, HAZARD, or ENCOUNTER. The second submission returns the exact
recorded result while the complete committed state remains equal: durability,
pending cargo, events, telemetry, and inventory are not reapplied or mutated.
Duplicate lookup occurs before current-phase validation because a successful
first command has already advanced the decision.

RETURN uses the same coverage from the outset: all 10,368 reachable D2
decision points execute an initial `RETURN` and the same command again. Tests
prove exact recorded-result replay, complete-state equality, preserved
durability and pending cargo, no inventory mutation, and exactly-once events.
Normal return records `PLAYER_RETURN`, the deepest completed step, and commits
`RETURNED` without resolving the next step.

Both transactions fail closed for missing command identity, wrong expedition,
stale decision, invalid phase, and deployed UNIT lock mismatch. CONTINUE also
rejects a projection for any step other than the runtime's frozen next step.

## Next boundary

D3.3 may now implement versioned persistence and recovery of the exact
`IN_PROGRESS` command intent from its immutable checkpoint. Cargo commitment,
telemetry emission, and UI binding remain held until their named slices begin
and pass their own tests.
