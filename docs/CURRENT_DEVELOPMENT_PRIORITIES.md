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

### P0 — Predicted and actual damage consistency

This is a core-loop trust fix, not a cosmetic UI fix.

- Prediction and expedition resolution must call the same evaluation function.
- The shared evaluation must account for current durability, traits, and every damage source.
- Automated verification must assert equality between predicted and actual damage under the same inputs.
- A mismatch is a P0 regression because it invalidates the player's pre-deployment decision.

### P1 — Underground Crystal Core bad-luck protection

Minimum implementation candidate:

- Count only complete returns from the abandoned mine.
- After three complete returns without obtaining the Underground Crystal Core, guarantee it.
- `PARTIAL` and failed expeditions do not advance the guarantee counter.
- Reset or complete the protection state when the core is obtained.

This candidate must remain minimal and must not grow into a general recovery or economy system without new player-facing evidence.

### P2 — Cargo / Regeneration Rune display-name consistency

- A single internal ID must resolve to one player-facing display name.
- All screens must read the name from one authoritative definition.
- Final wording must follow the World & Terminology Baseline.
- Screen-specific aliases are not permitted.

## Hold

- `SAFE_SUPPLY_S0`
- New recovery or economy systems
- Additional audit infrastructure

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

These assessments do not redefine MVP completion and are not automatic blockers during the current human-playtest phase.

## Human-playtest finding

The following within-run continuation motivation was observed:

- The player wanted to attempt another expedition.
- Recovered materials created a desire to fabricate the next unit.

This supports the core loop from expedition result to redesign. Long-term replay across multiple new games has not yet been established and is evaluated separately from MVP completion.
