# GOLEM-EXPEDITION-LIVE-LOOP-01 — Canonical Contract

```text
STATUS          FROZEN
PHASE           D1 — CANONICAL CONTRACT FREEZE
DIRECTION       OPTION B APPROVED
MODEL           DETERMINISTIC / TURN-BASED SUPERVISED EXPEDITION
IMPLEMENTATION  HOLD / NOT AUTHORIZED BY THIS DOCUMENT
E3              HOLD / NOT AUTHORIZED
MAIN MERGE      HOLD
```

## 1. Authority and scope

This contract freezes the canonical semantics required before implementing the approved live-loop direction. It supersedes instant resolution as the intended end-state, but it does not change the currently running implementation by itself.

`LIVE` means that one Expedition exists as canonical state between player decisions. It does not mean real-time simulation.

```text
NO CLOCK
NO TICK
NO TIMER PRESSURE
NO BACKGROUND SIMULATION
NO RANDOM MID-EVENT
NO COMMAND COMBAT
```

The world advances only when the player commits `DEPLOY`, `CONTINUE`, or `RETURN`. `EMERGENCY RETREAT` is not canonical in this contract. Normal `RETURN` is the risk-management action.

## 2. Preserved canonical invariants

- Deployment costs exactly one ACTION.
- `CONTINUE` and `RETURN` cost zero additional ACTION.
- Region access is validated before deployment and cannot be bypassed.
- Prediction and resolution use the same pure evaluator output.
- Damage is deterministic and contains no random roll.
- Canonical durability is reduced exactly once per resolved damage step.
- Pending cargo is not owned inventory.
- Blueprint records, Blueprint definitions, and inventory are never damaged, deleted, or mutated by Expedition failure.
- A destroyed UNIT remains owned at durability `0`; this contract does not introduce permanent UNIT loss.
- Only one canonical Expedition may be active at a time.
- The deployed UNIT is locked against repair, disassembly, redeployment, or part mutation until the runtime reaches a terminal state.
- The E1 dependency direction remains `domain -> state -> presentation -> ui`.

## 3. Canonical state machine

```text
READY
  -- DEPLOY --> IN_PROGRESS

IN_PROGRESS
  -- atomic step commit --> DECISION
  -- durability reaches 0 --> DESTROYED
  -- final step completes --> RETURNED

DECISION
  -- CONTINUE --> IN_PROGRESS
  -- RETURN   --> IN_PROGRESS --> RETURNED

RETURNED
  -- cargo claim / close --> READY

DESTROYED
  -- acknowledge / close --> READY
```

`READY` means no active Expedition runtime exists. `DECISION`, `RETURNED`, and `DESTROYED` are stable persisted states.

`IN_PROGRESS` is a canonical transaction-in-flight state, not a timer. It contains a persisted command intent and the last stable checkpoint. No autonomous work occurs while it exists. If the application closes in `IN_PROGRESS`, reload deterministically completes the one recorded command from its checkpoint or restores its already-committed result; it never advances a second step.

No transition other than those listed above is legal. Unknown phase, step, command, or transition values fail closed.

## 4. Expedition identity and runtime schema

Every run has one stable `expedition_id`. Every decision has one stable `decision_id`. Every submitted command has one stable `command_id`.

The canonical runtime must contain at least:

```text
schema_version
expedition_id
phase
golem_id
region_id
deployed_unit_snapshot
start_durability
current_durability
next_step
completed_steps
pending_cargo
cargo_capacity
reward_plan
decision_id
decision_sequence
pending_command
applied_command_ids
structured_events
terminal_result
```

`deployed_unit_snapshot` freezes the part IDs, stats, traits, and durability basis used by every evaluator call in that run. UI state is not stored in this runtime.

`reward_plan` is created exactly once during `DEPLOY`, stored before the first decision, and never regenerated. Existing probabilistic loot distribution may be used to create this plan, but no loot roll may occur during `CONTINUE`, `RETURN`, reload, or cargo claim. Undisclosed rewards may remain hidden in presentation while remaining fixed canonical state.

## 5. Turn and decision unit

One Expedition turn is one player-approved `CONTINUE` command resolving exactly one step. `DEPLOY` opens the run and presents the first decision without applying a damage step.

The initial canonical step sequence maps the existing whole-run damage pipeline:

```text
STEP 1  ENTRY       resist/access-related damage component
STEP 2  HAZARD      mobility-related damage component
STEP 3  ENCOUNTER   encounter-related damage component
STEP 4  RECOVERY    final reward-plan release; no new damage axis
```

There are at most four `CONTINUE` decision points in the initial contract: before each unresolved step. A successful final `RECOVERY` step transitions directly to `RETURNED`. A step that reduces durability to `0` transitions directly to `DESTROYED`.

The number, identity, and order of steps are domain data, not UI layout. Adding, removing, reordering, or conditionally skipping a step is a future canonical contract change. Region access failure prevents `DEPLOY`; it does not create a failed runtime.

The player must make an explicit choice at every `DECISION`. No timeout, animation completion, application frame, reload, or background process may submit that choice.

## 6. Pure forecast and step resolution

At a `DECISION`, the state layer requests a pure projection for `next_step` from the same evaluator used by `CONTINUE`.

Minimum evaluator input:

```text
deployed_unit_snapshot
region_id
next_step
current_durability
completed_steps
pending_cargo
reward_plan
```

Minimum evaluator output:

```text
step_id
damage_sources
step_damage
durability_before
durability_after
cargo_delta
next_step
terminal_status
```

Given exactly equal input, complete evaluator output must be exactly equal. The evaluator cannot read a clock, global mutable state, UI state, or random generator.

The full-run compatibility invariant is:

```text
sum(step_damage for resolved damage steps)
  == existing whole-run total_damage for the same deployed snapshot and region
```

unless a later, separately approved numeric contract explicitly changes balance. Phase D2 must prove this invariant across the existing 5,120 build/region/durability cases before implementation begins.

## 7. CONTINUE transaction

`CONTINUE(expedition_id, decision_id, command_id)` is legal only in `DECISION` and only for the current decision.

The transaction order is frozen:

1. Validate schema, phase, run ID, decision ID, command ID, deployed UNIT lock, and next step.
2. Persist `IN_PROGRESS` intent containing the immutable pre-command checkpoint.
3. Evaluate the next step from a deep copy of that checkpoint.
4. Append its `cargo_delta` to `pending_cargo`; never write inventory.
5. Apply `step_damage` once to runtime and canonical UNIT durability.
6. Append the step result and structured events once.
7. If durability is `0`, clear pending cargo and commit `DESTROYED`.
8. Else if the final step completed, commit `RETURNED`.
9. Else allocate the next stable decision ID and commit `DECISION`.
10. Persist the whole resulting state atomically before emitting presentation notifications.

A command is all-or-nothing. No observer may see cargo updated without durability, durability updated without events, or telemetry updated without the state transition it describes.

## 8. RETURN transaction

Normal `RETURN` is available at every stable `DECISION`, including the first decision after deployment. It never applies the unresolved next step.

`RETURN(expedition_id, decision_id, command_id)`:

1. validates the same identifiers and phase rules as `CONTINUE`;
2. consumes no ACTION;
3. applies no new damage;
4. preserves current UNIT durability;
5. preserves currently accumulated `pending_cargo` for post-return selection;
6. records the deepest completed step and return reason `PLAYER_RETURN`;
7. commits `RETURNED` atomically and emits `return_selected` plus `expedition_returned` once.

At `RETURNED`, the existing capacity boundary remains: the player may select cargo whose total weight does not exceed `WORK × 2`. Only an explicit cargo-claim transaction transfers selected items to owned inventory. Unselected pending cargo is discarded when claim closes the runtime.

Returning with no pending cargo is legal and closes without an inventory mutation.

## 9. Failure transaction

Failure occurs only when a committed damage step produces durability `0`.

The failure transaction:

- commits canonical UNIT durability `0`;
- retains the UNIT in owned storage;
- clears all pending and selected cargo from the run;
- transfers nothing to inventory;
- emits `expedition_failed` once with exact damage sources and failed step;
- retains a terminal result until acknowledged;
- does not mutate Blueprint library, Blueprint attribution, unrelated UNITs, inventory, ACTION beyond the deployment cost, or day progression.

There are no failure rewards and no automatic repair. Destruction during the final damage step takes precedence over reward release.

## 10. Cargo ownership boundary

```text
reward_plan          fixed potential rewards for this run
pending_cargo        revealed/released but not owned
selected_cargo       post-return selection within capacity
owned inventory      transferred only by successful claim
```

No domain step writes directly to inventory. Reload, return, failure, duplicate input, and UI selection cannot duplicate cargo. Cargo entries require stable item IDs unique within one `expedition_id`.

## 11. Persistence and exactly-once behavior

The save schema must be versioned and include the complete Expedition runtime. Loading an unsupported, partial, or internally inconsistent runtime fails closed; it must not silently clear the run and grant or lose resources.

Every state-changing command uses optimistic identity checks:

```text
expedition_id must equal active expedition
decision_id   must equal current stable decision
command_id    must be globally unique for the run
```

- Repeating an applied `command_id` returns its recorded result without applying damage, cargo, telemetry, or events again.
- A stale decision ID with a new command ID is rejected.
- A command for another Expedition is rejected.
- Only the exact `IN_PROGRESS.pending_command` may be recovered after reload.
- Recovery uses the saved pre-command checkpoint and pure evaluator; it cannot sample new randomness or allocate new reward IDs.
- Save writes must use atomic replacement so the prior valid checkpoint survives interrupted writes.

Required persistence invariant:

```text
save at active decision or transaction intent
→ terminate application
→ reload
→ recover the same expedition, same decision outcome, same identifiers,
  same durability, same pending cargo, and same event/telemetry counts
```

## 12. Telemetry and structured events

Minimum stable telemetry types:

```text
expedition_started
decision_presented
continue_selected
return_selected
expedition_returned
expedition_failed
```

Domain result events additionally retain step and cargo facts needed by presentation. Every event contains:

```text
event_id
event_type
expedition_id
decision_id when applicable
decision_sequence
golem_id
region_id
step_id when applicable
```

`decision_presented` is emitted once when a new stable decision is committed, not every time UI renders it. Duplicate commands and reload cannot append duplicate telemetry. Event payloads are structured facts; domain code does not emit presentation-ready prose.

Blueprint attribution may reference the completed Expedition record after return or failure. Expedition processing never mutates the Blueprint definition itself.

## 13. D1 gates

```text
D1-STATE-01  Only listed state transitions are legal; unknown transitions fail closed.
D1-TURN-01   World state advances only on DEPLOY, CONTINUE, or RETURN.
D1-TURN-02   One CONTINUE resolves exactly one canonical step.
D1-DATA-01   Forecast and resolution use identical pure evaluator output.
D1-DATA-02   Same evaluator input produces exactly identical complete output.
D1-DAMAGE-01 Step composition preserves the existing whole-run damage total.
D1-ACTION-01 DEPLOY costs one ACTION; CONTINUE and RETURN cost zero.
D1-CARGO-01  Pending cargo never enters inventory before claim.
D1-FAIL-01   Failure clears pending cargo and affects only the deployed UNIT durability.
D1-SAVE-01   Reload restores or recovers exactly one stable decision outcome.
D1-IDEM-01   Duplicate commands cannot duplicate damage, cargo, events, or telemetry.
D1-EVENT-01  Stable IDs join every run, decision, command result, and telemetry event.
D1-BOUND-01  No clock, tick, timer, background simulation, or random mid-event exists.
D1-RETURN-01 Normal RETURN is the only retreat action in this contract.
```

## 14. Phase boundary

D1 PASS freezes semantics only. Phase D2 must produce deterministic test vectors and migration fixtures before any implementation authorization.

```text
PHASE D0  PASS — OPTION B APPROVED
PHASE D1  FROZEN / PASS
PHASE D2  NEXT — DETERMINISTIC TEST VECTORS
PHASE E3  HOLD
PHASE R   HOLD
PROMOTION HOLD
```
