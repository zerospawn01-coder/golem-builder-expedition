# Documentation Index

This directory separates current product decisions, isolated experiments, design candidates, and visual references. A document being present in the repository does not make its mechanics canonical.

## Authority order

When documents disagree, use this order:

1. [`MVP_STATUS_AND_PLAYTEST_POLICY.md`](MVP_STATUS_AND_PLAYTEST_POLICY.md)
2. [`CURRENT_DEVELOPMENT_PRIORITIES.md`](CURRENT_DEVELOPMENT_PRIORITIES.md)
3. [`WORLD_AND_TERMINOLOGY.md`](WORLD_AND_TERMINOLOGY.md)
4. Current implementation and shared verification contracts
5. Experiment specifications and results
6. Candidate design models and visual references

## Canonical product decisions

| Document | Scope |
|---|---|
| [`MVP_STATUS_AND_PLAYTEST_POLICY.md`](MVP_STATUS_AND_PLAYTEST_POLICY.md) | Phase, gates, and test policy |
| [`CURRENT_DEVELOPMENT_PRIORITIES.md`](CURRENT_DEVELOPMENT_PRIORITIES.md) | Current priorities and hold list |
| [`WORLD_AND_TERMINOLOGY.md`](WORLD_AND_TERMINOLOGY.md) | Player-facing terminology |

## Experiments

| Document | Status |
|---|---|
| [`experiments/GRAVITY_DEPTH_V0_SPEC.md`](experiments/GRAVITY_DEPTH_V0_SPEC.md) | Non-canonical vertical slice; product integration in progress |
| [`experiments/R2_BLUEPRINT_LIBRARY_V1_PREREGISTRATION.md`](experiments/R2_BLUEPRINT_LIBRARY_V1_PREREGISTRATION.md) | Frozen V1 schema, telemetry, metrics, and thresholds |
| [`experiments/R2_BLUEPRINT_LIBRARY_V1_AUTOMATED_RESULT.md`](experiments/R2_BLUEPRINT_LIBRARY_V1_AUTOMATED_RESULT.md) | Implementation complete; machine PASS; behavioral evidence insufficient |
| [`experiments/R2_BLUEPRINT_LIBRARY_V1_BEHAVIORAL_PROTOCOL.md`](experiments/R2_BLUEPRINT_LIBRARY_V1_BEHAVIORAL_PROTOCOL.md) | Human evidence collection and reporting procedure |
| [`experiments/EXP_MULTI_PATH_RUINS_V1_RESULT.md`](experiments/EXP_MULTI_PATH_RUINS_V1_RESULT.md) | Failed candidate; canonical HOLD |
| [`../EXPERIMENT_RUINS.md`](../EXPERIMENT_RUINS.md) | Historical Ancient Ruins A/B/C comparison |
| [`../MAINTENANCE_EXPERIMENT.md`](../MAINTENANCE_EXPERIMENT.md) | Historical maintenance comparison |

An experiment must use isolated state and explicit activation. A successful experiment is evidence for a decision, not an automatic production rule.

## Design models

Files under [`design/`](design/) describe candidate structures and decision boundaries. They do not authorize implementation by themselves.

- [`design/CONTENT_EXPANSION_MODEL.md`](design/CONTENT_EXPANSION_MODEL.md)
- [`design/FOUNDRY_CONTROL_SUPPORT_MODEL.md`](design/FOUNDRY_CONTROL_SUPPORT_MODEL.md)
- [`design/UNIT_CAPACITY_MODEL.md`](design/UNIT_CAPACITY_MODEL.md)
- [`design/WORKSHOP_REASONING_SUPPORT_MODEL.md`](design/WORKSHOP_REASONING_SUPPORT_MODEL.md)
- [`design/GOLEM_EXPEDITION_LIVE_LOOP_01_GATE.md`](design/GOLEM_EXPEDITION_LIVE_LOOP_01_GATE.md) — active canonical decision review; implementation not authorized

## Visual and information design

- [`visual/V1_DESIGN_FABRICATION_WIREFRAME.md`](visual/V1_DESIGN_FABRICATION_WIREFRAME.md)
- [`visual/EXPEDITION_MOBILE_MVP_INFORMATION_SPEC.md`](visual/EXPEDITION_MOBILE_MVP_INFORMATION_SPEC.md)
- [`visual/GOLEM_BUILDER_FIGMA_BRIEF.md`](visual/GOLEM_BUILDER_FIGMA_BRIEF.md)
- [`visual/north-star/`](visual/north-star/) — aspirational visual references, not rule evidence

North Star images fix experience and visual direction. Text and mechanics rendered inside those images are illustrative unless another authoritative document defines them.
