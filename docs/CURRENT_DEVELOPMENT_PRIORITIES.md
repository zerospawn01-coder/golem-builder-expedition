# GOLEM BUILDER — Current Development Priorities

Status: canonical development decision

Effective: 2026-08-14

This is a current, revisable decision record. Permanent phase and decision rules live in [`MVP_STATUS_AND_PLAYTEST_POLICY.md`](MVP_STATUS_AND_PLAYTEST_POLICY.md).

## Stage assessment

```text
MVP              PASS
PLAYABLE ALPHA   YES
RELEASE READY    NO
```

## Priorities

### P0 — Blueprint integration and purpose identification

`U0_BLUEPRINT_ONLY` is `PROMISING`. Do not request another standalone human test for the current incomplete presentation.

- Make saved designs easier to distinguish by intended use without assigning a system-recommended role.
- Connect Blueprint save and recall to the V-1 Design / Fabrication flow.
- Keep Blueprint, fabricated UNIT, and future RESERVE concepts distinct.
- Preserve normal material and ACTION costs when fabricating from a Blueprint.
- Do not add RESERVE HANGAR as part of this work.

### P1 — Gravity Depth product presentation

`GRAVITY_DEPTH_V0` has provided enough evidence for its central design hypothesis. Do not expand the current test population before improving product completeness.

- Move the experiment presentation toward the product's foundry and anomalous-zone UI language.
- Preserve POWER / WORK route choice, cumulative damage, and RETURN / CONTINUE decisions.
- Preserve unknown-material disclosure boundaries.
- Keep prediction and resolution on the same evaluation function.
- Do not add new zones, mission types, exposure mutation, or random hazards during this integration.

### P2 — Cross-screen UNIT selection consistency

- The selected UNIT in storage/detail and the initially selected UNIT in deployment must describe one intentional state model.
- Do not label the current single selected UNIT as an ACTIVE ROSTER.
- Resolve this as existing product-state consistency, not as an implicit implementation of RESERVE / ACTIVE.

### Completed foundations

- Predicted and actual damage share an evaluation path and remain a regression contract.
- Cargo / Regeneration Rune naming remains governed by the World & Terminology baseline.
- Underground Crystal Core bad-luck protection is not a current production priority and must not expand into a recovery economy without a new decision.

## Hold

- `SAFE_SUPPLY_S0`
- New recovery or economy systems
- Additional audit infrastructure
- Additional standalone human testing of the current `GRAVITY_DEPTH_V0` and `U0_BLUEPRINT_ONLY` presentations
- `U1 — RESERVE HANGAR`

Items on hold are not implied backlog priorities. They require observed player-facing need before reconsideration.

## Release Gate snapshot

| Gate | Current assessment | Note |
|---|---|---|
| G1 — Core Loop | `PASS CANDIDATE` | Predicted and actual damage consistency remains P0 |
| G2 — Economy | `HOLD` | Safe Supply has been deprioritized |
| G3 — Progression | `PARTIAL / HOLD` | Long bad-luck waits for the Underground Crystal Core remain |
| G4 — UI Comprehension | `OBSERVED / PARTIAL PASS` | Damage prediction and rune naming remain |
| G5 — World & Terminology | `IMPLEMENTATION PENDING` | Canonical baseline exists; remaining UI synchronization is incomplete |
| G6 — Regression | `PARTIAL` | A foundation exists; release hardening has not started |
| G7 — Release Freeze | `NOT STARTED` | Not applicable in the current phase |

These assessments do not redefine MVP completion and are not automatic blockers during the current product-integration phase.

## Human-playtest finding

The following within-run continuation motivation was observed:

- The player wanted to attempt another expedition.
- Recovered materials created a desire to fabricate the next unit.

This supports the core loop from expedition result to redesign. Long-term replay across multiple new games has not yet been established and is evaluated separately from MVP completion.

## Experiment decisions

```text
GRAVITY_DEPTH_V0
DESIGN HYPOTHESIS   CONFIRMED ENOUGH TO PROCEED
NEXT                PRODUCT UI INTEGRATION
ADDITIONAL TEST     STOP

U0_BLUEPRINT_ONLY
VERDICT             PROMISING
NEXT                PURPOSE IDENTIFICATION + V-1 INTEGRATION
ADDITIONAL TEST     STOP
```

Testing resumes when the integrated feature group is coherent enough for one end-to-end play session, or when a material defect is found.
