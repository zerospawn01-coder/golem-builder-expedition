# Expedition E2 local gate

```text
DATE                    2026-08-20
ENGINE                  Godot 4.7.1 stable
REFERENCE               docs/visual/north-star/expedition-desktop-north-star.png
CAPTURE                 tests/e2-pc-capture.png
PRESENTATION CLASS      1280 x 720 / 16:9 PC
CANONICAL RULES         UNCHANGED
MAIN MERGE              HOLD
```

## Implementation order

The E2 judgment cycle was applied in dependency order:

1. `SYSTEM STATUS / GAME_STATE`
2. `DAMAGE / GAME_STATE`
3. `CARGO / GAME_STATE`
4. `AREA MAP / PRESENTATION`
5. `NAVIGATION / PRESENTATION`

The first three blocks established the coarse-zone, always-visible, and warning-color grain before the presentation-derived map and navigation blocks used it.

## Five-row verdict

| Gate | Verdict | Evidence |
|---|---|---|
| E2-VIEW-01 | PASS | DAMAGE and CARGO occupy the center telemetry band; AREA MAP is upper-right; NAVIGATION is middle-right; SYSTEM STATUS is lower-right. |
| E2-VIEW-02 | FAIL | The reference's dominant live expedition view and emergency-retreat target have no equivalent in the current canonical instant-resolution loop. The implementation does not invent a retreat action or pretend that a smaller telemetry block has equivalent salience. |
| E2-VIEW-03 | PASS | SYSTEM STATUS, DAMAGE, CARGO, AREA MAP, and NAVIGATION remain simultaneously visible in the 16:9 capture; no required block was moved behind interaction. |
| E2-VIEW-04 | PASS | Red is reserved for critical/blocked state, yellow for caution/pending cargo, green for nominal/resolved/available state, and neutral for idle/unavailable information. Color remains presentation-only. |
| E2-VIEW-05 | PASS | Differences in font, ornament, imagery, spacing, and border detail are treated as non-failures except where they cause the recorded E2-VIEW-02 hierarchy failure. |

Overall E2 visual verdict: **REVIEW COMPLETE / FAIL (`E2-VIEW-02`)**.

## E2 closure decision

```text
PHASE E1                FROZEN / PASS
PHASE E2                REVIEW COMPLETE / FAIL
E2-VIEW-02              WON'T FIX / DESIGN DIVERGENCE
MACHINE RUN             EXISTENCE + SUCCESS VERIFIED
LOG CONTENT (10353)     DIRECTLY VERIFIED IN POST-PUSH CI LOG
PUBLIC ANONYMOUS LOG    LOGIN-GATED / NOT EXTERNALLY REPRODUCED
PR #3                   OPEN / DRAFT
MAIN MERGE              HOLD
```

`E2-VIEW-02` is a structural difference between the PC reference and the current canonical instant-resolution loop, not an authorization to add gameplay inside a presentation phase. It is closed for E2 as `WON'T FIX / DESIGN DIVERGENCE`; its FAIL verdict is retained rather than converted to PASS or waived silently.

Future consideration is registered in the repository HOLD list as `GOLEM-EXPEDITION-LIVE-LOOP-01`:

```text
PURPOSE       Decide whether an in-progress Expedition state, intermediate
              decisions, and CONTINUE / RETREAT intervention belong in the
              canonical mechanic.
STATUS        D0 PASS / OPTION B APPROVED; D1 FROZEN; IMPLEMENTATION HOLD
DEPENDENCIES  NONE — independent design gate; Phase E2/E3 completion is not
              a prerequisite.
```

The gate is not an E2 continuation and does not authorize implementation. D0 approved a deterministic, turn-based supervised loop; D1 is frozen in `docs/design/GOLEM_EXPEDITION_LIVE_LOOP_01_CANONICAL_CONTRACT.md`. E2/E3 presentation work must not be used to introduce the canonical mechanic indirectly.

## Intentional differences

- No live 3D/illustrated expedition feed is added. The Godot parity slice currently has no canonical live-expedition state.
- No `EMERGENCY RETREAT` action is added. Expedition resolution is immediate in the frozen canonical loop, so adding that control would imply a new mechanic.
- Canonically absent depth, joint load, signal strength, magnetic noise, and efficiency values remain visibly `N/A` or `UNAVAILABLE`.
- The visual treatment uses Godot-native panels rather than reproducing the reference's raster ornamentation.

## Machine evidence

Local execution with the official Godot 4.7.1 stable Windows build:

```text
Godot version           4.7.1.stable.official.a13da4feb
Project import          PASS
E2 capture              PASS — 1280x720
Headless regression     GODOT-PORT: PASS — 10353 checks
```

The regression includes E1-DATA-06: two builds from the same fixed canonical snapshot must be Variant-equal and JSON-equal, and the source snapshot must remain unchanged.

The post-push PR #3 primary run log was read directly from GitHub Actions job `96395679491`. It records the same engine identity, successful project import, and `GODOT-PORT: PASS — 10353 checks` at `2026-08-20T10:32:52Z`:

<https://github.com/zerospawn01-coder/golem-builder-expedition/actions/runs/32359444629/job/96395679491>

This is an execution environment independent of the local Windows verification. Anonymous third-party access to the log body remains login-gated; that access limitation does not change the directly observed CI content.

The E2 REVIEW verdict is complete and failed on E2-VIEW-02. Successful machine evidence does not override the visual gate and does not release `MAIN MERGE`. `GOLEM-EXPEDITION-LIVE-LOOP-01` now has Option B direction approval, a frozen D1 contract, and frozen D2 vectors; E3 requires an explicit start decision and no gameplay implementation is currently authorized.
