# GOLEM-EXPEDITION-LIVE-LOOP-01 — D2 Deterministic Test Vectors

```text
STATUS          FROZEN / PASS
PHASE           D2 — DETERMINISTIC TEST VECTORS
CONTRACT        D1 FROZEN / PASS
IMPLEMENTATION  D3 COMPLETE / PASS
D3              D3.1 THROUGH D3.6 PASS
```

## Damage vector artifact

```text
PATH       godot/tests/fixtures/live_loop_d2_damage_vectors.tsv
SCHEMA     live-loop-d2-damage-vector-v1
ROWS       5,120 vectors + 1 header
SHA-256    592C7B133CC831DD3921504E59B6C3C8D17786C6A3A835D8E6049764B4226BF3
GENERATOR  godot/tests/generate_live_loop_d2_vectors.gd
ORACLE     godot/tests/live_loop_d2_vectors.gd
```

Coverage is the frozen Cartesian product:

```text
4 FRAME
x 4 REACTOR
x 4 CONTROL SIGIL
x 4 REGION
x 20 starting durability values (5..100 in increments of 5)
= 5,120
```

Every row fixes:

- build IDs, region, durability, canonical stats, and traits;
- access and resistance status;
- exact ENTRY / HAZARD / ENCOUNTER / RECOVERY component tuple;
- every cumulative prefix;
- failure stage, status, and total damage;
- reachability of each step;
- durability before and after every step;
- the unique destroying step, if any.

The TSV is intentionally compact so the complete frozen evidence remains reviewable and diffable. Its header is the field schema. Regeneration is byte-deterministic; changing evaluator components, ordering, reachability, prefixes, or serialization fails the golden comparison.

## Migration fixtures

```text
PATH    godot/tests/fixtures/live_loop_d2_migration_vectors.json
SCHEMA  live-loop-d2-migration-vector-v1
TARGET  save version 3
CASES   5
```

The fixtures freeze these boundaries before implementation:

1. legacy v2 save migrates to `READY` without inventory or telemetry deltas;
2. v3 `DECISION` resumes the same run and decision;
3. v3 `IN_PROGRESS` recovers one recorded command without duplicate effects;
4. v3 `RETURNED` retains pending cargo outside owned inventory;
5. v3 `DESTROYED` retains the UNIT at durability `0` with no cargo, inventory, or Blueprint mutation.

These are expected migration outcomes. D2 validates fixture structure; D3 must implement the loader and make each fixture executable before runtime promotion.

## Automated gate

`godot/tests/run_all.gd` now:

- rebuilds all 5,120 vectors from the current legacy evaluator;
- compares every complete TSV row with its frozen golden row;
- verifies row count, unique vector IDs, header, and byte-deterministic regeneration;
- validates the migration fixture schema and all five required boundary cases.

Local and post-push GitHub-hosted official Godot 4.7.1 result:

```text
GODOT-PORT: PASS — 15489 checks
```

Primary CI log:

<https://github.com/zerospawn01-coder/golem-builder-expedition/actions/runs/32367123941/job/96418957466>

## Phase boundary

```text
PHASE D0  PASS — OPTION B APPROVED
PHASE D1  FROZEN / PASS — COMPONENT-WISE
PHASE D2  FROZEN / PASS — 5,120 GOLDEN VECTORS + MIGRATION FIXTURES
PHASE D3  COMPLETE / PASS
PHASE R   HOLD
PROMOTION HOLD
MAIN MERGE HOLD
```

D2 contains no gameplay implementation and no new balance rule.

`D3` here is the live-loop implementation phase. The separately reserved Presentation E3 phase remains distinct and is not authorized by this gate.
