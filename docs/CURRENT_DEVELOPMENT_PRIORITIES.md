# GOLEM BUILDER — Current Development Priorities

Status: canonical development decision

Effective: 2026-08-20

This is a current, revisable decision record. Permanent phase and decision rules live in [`MVP_STATUS_AND_PLAYTEST_POLICY.md`](MVP_STATUS_AND_PLAYTEST_POLICY.md).

## Stage assessment

```text
MVP              PASS
PLAYABLE ALPHA   YES
RELEASE READY    NO
```

## Priorities

### P0 — Blueprint integration and purpose identification

`U0_BLUEPRINT_ONLY` is `PROMISING`. The integrated R2 V1 presentation is frozen for preregistered evidence collection; do not return to the incomplete standalone prototype.

- R2 V1 implementation is complete: saved designs can be distinguished by player-authored, non-mechanical purpose tags.
- Blueprint save and recall are connected to the V-1 Design / Fabrication flow and canonical `fabricateGolem()` transaction.
- Keep Blueprint, fabricated UNIT, and future RESERVE concepts distinct.
- Preserve normal material and ACTION costs when fabricating from a Blueprint.
- Do not add RESERVE HANGAR as part of this work.
- Freeze the calibrated R2 V1 schema, opportunity semantics, behavioral metrics, and thresholds after PR review and main integration.
- Do not begin Behavioral collection with telemetry from the uncalibrated PR revision.
- Do not promote R2 V1 from `CANONICAL HOLD` until at least 30 eligible save opportunities and 30 eligible redeploy decisions have been observed.

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
- `GOLEM-EXPEDITION-LIVE-LOOP-01`
  - Purpose: decide whether an in-progress Expedition state, intermediate decisions, and player intervention (`CONTINUE` / `RETREAT`) belong in the canonical mechanic.
  - Status: `STARTED / DESIGN REVIEW`; implementation remains `HOLD / NOT AUTHORIZED`.
  - Dependencies: none. This is an independent design gate and does not require Phase E2 or E3 to be completed first.
  - Boundary: it is not continuation work for E2 and does not authorize gameplay or presentation implementation.
  - Gate record: [`design/GOLEM_EXPEDITION_LIVE_LOOP_01_GATE.md`](design/GOLEM_EXPEDITION_LIVE_LOOP_01_GATE.md).

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
IMPLEMENTATION      COMPLETE
MACHINE GATES       PASS
BEHAVIORAL          INSUFFICIENT EVIDENCE
METRIC CALIBRATION  PASS / AWAITING PR RE-REVIEW
COLLECTION          NOT STARTED
NEXT                PR REVIEW -> MAIN -> EVIDENCE COLLECTION
CANONICAL           HOLD
```

Testing resumes when the integrated feature group is coherent enough for one end-to-end play session, or when a material defect is found.
