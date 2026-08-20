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
D3.3  PERSISTENCE / RECOVERY          PASS
D3.4  CARGO / TELEMETRY COMMIT        PASS
D3.5  UI BINDING                      NEXT DECISION
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

### D3.3 step-2 crash boundary

The first persistence slice performs two durable writes: the step-2
`IN_PROGRESS` intent before evaluation, then the complete committed state after
recovery or ordinary completion. Writes use a temporary file and recoverable
backup replacement so at least one prior valid checkpoint remains readable.

A child Godot process writes only the `IN_PROGRESS` intent and immutable
pre-command checkpoint, then forcibly terminates itself. The parent process
proves that no code after termination ran, reads the real runtime file, derives
the step again from the checkpoint's frozen damage plan, applies the command
once, and durably replaces the intent with the committed decision. A second
reload returns that committed state without applying damage or events again.

```text
LOCAL GODOT 4.7.1  PASS — 190204 checks
```

The final-replacement test then force-terminates child processes at all three
durability boundaries: after temporary-file flush, after moving the prior
checkpoint to backup, and after promoting the replacement. Each interruption
leaves the correct durable generation readable, and the prior checkpoint is
retained whenever replacement has begun.

Runtime loading fails closed for malformed JSON, unknown phase, missing stable
IDs, mismatched UNIT lock, incomplete `IN_PROGRESS` intent, and invalid
`DESTROYED` durability or cargo. It never silently clears an invalid run.

All five frozen D2 migration fixtures now execute through the versioned loader:
legacy v2 to READY, v3 DECISION resume, exactly-once IN_PROGRESS recovery,
RETURNED pending-cargo separation, and DESTROYED non-invasion. Unsupported save
versions fail closed.

D3.3 completed the persistence prerequisite used by the following D3.4 slice.

### D3.4 cargo and telemetry ownership boundary

Claim is an independent canonical transaction available only in `RETURNED`.
It validates stable expedition and command identity, normalizes duplicate
selection entries, requires positive integer quantities and cataloged cargo,
and enforces pending quantity and total capacity. A valid claim transfers only
the selected quantities to owned inventory, closes pending cargo, records the
unselected remainder as discarded, and commits a stable claim result. Invalid
input returns the complete original state unchanged.

The same claim command returns its recorded result without crediting inventory
again. Real child-process interruption tests cover both sides of the canonical
commit: before commit, and after commit but before acknowledgement. Retry and
reload produce exactly one inventory credit and cannot restore claimable cargo.

D3.2 domain events now carry stable IDs. D3.4 commits them and the claim event
to the durable telemetry collection in the same canonical generation, deduped
by event identity. Failure of an optional external telemetry export returns an
error without changing or blocking canonical gameplay state.

```text
D3.4-G1  RETURNED leaves owned inventory unchanged                         PASS
D3.4-G2  explicit valid claim transfers exactly selected cargo             PASS
D3.4-G3  invalid claim is fail-closed                                       PASS
D3.4-G4  same claim cannot credit inventory twice                          PASS
D3.4-G5  reload before claim preserves pending cargo                       PASS
D3.4-G6  reload after claim cannot restore claimable cargo                 PASS
D3.4-G7  D3.2 events reach durable telemetry                               PASS
D3.4-G8  retry/reload does not duplicate telemetry identity                PASS
D3.4-G9  telemetry sink failure preserves canonical gameplay state         PASS

LOCAL GODOT 4.7.1  PASS — 190230 checks
```

D3.4 is complete. D3.5 remains a separate authorization decision and may only
bind presentation to these existing commands; it may not own cargo transfer,
telemetry durability, or gameplay rules.
