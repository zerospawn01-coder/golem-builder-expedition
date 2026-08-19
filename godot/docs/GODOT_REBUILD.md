# GOLEM BUILDER EXPEDITION — Godot Rebuild

## Status

```text
SOURCE BASELINE        main @ 74989d65 (PR #2 merged)
TARGET                 Godot 4.x / GDScript
CANONICAL WEB REMOVAL  HOLD
GODOT PORT             IMPLEMENTED — first playable parity slice
RUNTIME GATE           NOT RUN IN CONNECTOR ENVIRONMENT
MAIN MERGE             HOLD UNTIL GODOT RUNTIME + REGRESSION PASS
```

The React/Vite application remains in the repository as a comparison baseline while the Godot port is validated. Do not delete it until the Godot runtime reproduces the canonical gameplay and audit contracts.

## Ported canonical contracts

- 3 ACTION per day.
- Fabrication, repair, and expedition cost 1 ACTION; disassembly costs 0 ACTION.
- Maximum 3 fabricated/starter units.
- Starter unit cannot be disassembled.
- Repair consumes one matching FRAME material and restores +25 durability, capped at 100.
- Disassembly refunds one FRAME and one REACTOR, not the CONTROL SIGIL.
- FRAME / REACTOR / CONTROL SIGIL stat composition and canonical synergy traits.
- Quarry, Forest, Mine, and Ancient Ruins access/resistance requirements.
- Prediction and expedition resolution share the same deterministic damage function.
- Loot rarity, WORK slot/quantity scaling, PARTIAL 50% quantity penalty, and weighted cargo selection.
- R2 Blueprint Library as design knowledge only: save/load has no ACTION/material effect and fabrication still uses the canonical transaction.
- R2 opportunity-based telemetry and behavioral metric calculation.
- JSON persistence under `user://golem_builder_expedition_godot_v2.json`.

## Deliberately not merged into canonical gameplay

The isolated web experiments remain isolated during the engine migration:

- `GRAVITY_DEPTH_V0`
- `C_UI_COMPREHENSION` / C multi-axis presentation
- failed `EXP_MULTI_PATH_RUINS_V1`

They should be ported only after the canonical Godot slice passes runtime parity. This prevents experimental rules from leaking into the migration baseline.

## Run

Open the `godot/` directory as a Godot project, then run `res://ui/main.tscn`.

Headless regression entry point:

```bash
godot --headless --path godot --script res://tests/run_all.gd
```

The test script covers the fabrication blockers, a 5,120-case prediction/resolution damage audit, Blueprint persistence/fail-closed behavior, and R2-BEH-01 through R2-BEH-05 metric calibration.

## Merge gate

Before replacing the web runtime, require all of the following:

```text
PROJECT IMPORT          PASS
MAIN SCENE LAUNCH       PASS
FABRICATION TESTS       PASS
DAMAGE AUDIT 5120       PASS
R2 BEHAVIOR TESTS       PASS
SAVE/LOAD ROUNDTRIP     PASS
PC INPUT                PASS
MOBILE TOUCH            PASS
3-DAY MANUAL LOOP       PASS
LEGACY WEB DELETION     SEPARATE PR ONLY
```
