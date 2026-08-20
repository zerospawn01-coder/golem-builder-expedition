# GOLEM BUILDER EXPEDITION — Godot Rebuild

```text
SOURCE BASELINE        main@74989d65
ENGINE                 Godot 4.7.1 stable
BRANCH                 feat/godot-rebuild
PR                     #3
STATUS                 E2 REVIEW COMPLETE / MAIN HOLD
CANONICAL RULES        UNCHANGED
REACT WEB SOURCE       PRESERVED AS COMPARISON ORACLE
```

## Scope

This directory rebuilds the current canonical GOLEM BUILDER EXPEDITION web gameplay baseline in Godot 4.x/GDScript. It does not promote isolated experiments or change canonical game rules.

Implemented parity slice:

- 3 ACTION per day
- 3 UNIT limit
- FRAME / REACTOR / CONTROL SIGIL fabrication
- canonical fabrication blockers and atomic material/ACTION consumption
- repair: 1 ACTION + matching FRAME, +25 durability
- disassembly: 0 ACTION, FRAME + REACTOR refund, starter locked
- Quarry / Forest / Mine / Ancient Ruins
- prediction and resolution share the same damage evaluator
- WORK-scaled loot generation and weighted cargo confirmation
- R2 Blueprint save/load/apply/update semantics
- R2 calibrated opportunity telemetry
- fail-closed Blueprint deserialization
- JSON persistence
- Workshop / Expedition / Unit Hangar Control UI
- Phase E1 source-classified Expedition presentation with the Phase E2 PC hierarchy implementation and recorded design divergence

## Phase E1 presentation contract

The frozen contract is [`EXPEDITION_PRESENTATION_DATA_CONTRACT.md`](EXPEDITION_PRESENTATION_DATA_CONTRACT.md).

Dependency direction:

```text
domain -> state -> presentation -> ui
             \-> structured event stream -> presentation/log ui
```

`MIXED` is prohibited as a visible source classification. Phase E1 splits visible blocks into `GAME_STATE`, `PRESENTATION`, `UNAVAILABLE`, or `STRUCTURED EVENT STREAM`.

## Godot runtime verification

Verified on GitHub Actions using the official Godot 4.7.1 stable Linux x86_64 build:

```text
Godot version                         4.7.1.stable.official.a13da4feb
Project import                        PASS
Headless regression                   PASS
Regression checks                     10,353
Existing Node/React CI                PASS
```

Headless command:

```bash
godot --headless --path godot --script res://tests/run_all.gd
```

The regression suite covers fabrication blockers, the 5,120-case damage audit, R2 Blueprint machine/behavioral calibration semantics, and E1 presentation determinism/invariants.

## Deliberate migration boundary

The following remain isolated and are not promoted into this Godot canonical slice:

```text
GRAVITY_DEPTH_V0
C_UI_COMPREHENSION / C multi-axis presentation
EXP_MULTI_PATH_RUINS_V1
```

React/Vite remains the comparison oracle until Godot parity, PC manual operation, and later Mobile presentation gates are complete.

## Current gate state

```text
PROJECT IMPORT             PASS
HEADLESS REGRESSION        PASS — 10,353 checks
FABRICATION TESTS          PASS
DAMAGE AUDIT 5120          PASS
R2 BEHAVIOR TESTS          PASS
E1 PRESENTATION TESTS      PASS
E2 REVIEW                  FAIL — E2-VIEW-02
E2-VIEW-02 DISPOSITION     WON'T FIX / DESIGN DIVERGENCE
MACHINE RUN                EXISTENCE + SUCCESS VERIFIED
LOG CONTENT 10,353         DIRECTLY VERIFIED IN POST-PUSH CI LOG
PUBLIC ANONYMOUS LOG       LOGIN-GATED / NOT EXTERNALLY REPRODUCED
FUTURE LIVE LOOP GATE      STARTED / DESIGN REVIEW
LIVE LOOP IMPLEMENTATION   HOLD / NOT AUTHORIZED
WEB REGRESSION CI          PASS
MAIN SCENE MANUAL LAUNCH   NOT RUN
PC INPUT                   NOT RUN
MOBILE TOUCH               NOT RUN
3-DAY MANUAL LOOP          NOT RUN
MAIN MERGE                 HOLD
```

The future canonical design question is registered as `GOLEM-EXPEDITION-LIVE-LOOP-01`. Its dependency is explicitly `NONE`: it is independent and does not require Phase E2 or E3 completion. Design review has started in `docs/design/GOLEM_EXPEDITION_LIVE_LOOP_01_GATE.md`; implementation remains unauthorized and must not be treated as a continuation of E2.
