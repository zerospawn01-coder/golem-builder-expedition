# Expedition View Contract — Phase E2

```text
STATUS          FROZEN
PHASE           E2 — PC VISUAL HIERARCHY
SOURCE          PC Expedition reference screenshot
TARGET          Godot / 16:9 PC
CANONICAL RULES NO CHANGE
PIXEL MATCH     OUT OF SCOPE
MOBILE          OUT OF SCOPE / PHASE M1
```

## Purpose

Phase E2 aligns the Godot Expedition presentation with the established PC reference at the level of information hierarchy, spatial zoning, visual salience, disclosure behavior, and warning semantics. It does not require pixel-identical reproduction and must not introduce new gameplay state or rules.

## E2 pass criteria

```text
E2-VIEW-01  Block placement matches the reference at the coarse spatial level:
             left / center / right and upper / middle / lower regions.

E2-VIEW-02  Primary gaze guidance matches the reference:
             the same operational element must be the most visually salient first-look target,
             followed by the same secondary information tier.

E2-VIEW-03  Always-visible vs collapsible / drill-down information matches the reference intent.
             A block may be merged or split only if its disclosure level remains equivalent.

E2-VIEW-04  Warning color semantics are fixed and consistent:
             RED    = critical / failed / blocked / immediate danger
             YELLOW = caution / partial / elevated risk
             GREEN  = nominal / safe / successful / available
             NEUTRAL= inactive / unavailable / informational only
             Color is presentation-only and must not define gameplay state.

E2-VIEW-05  Pixel-level equality is explicitly out of scope.
             Font rasterization, exact spacing, exact border thickness, and sub-pixel alignment
             are not E2 failure conditions unless they alter hierarchy, legibility, or salience.
```

## Verification method

E2 is a visual review gate, not a deterministic gameplay gate.

The reviewer must compare one Godot PC capture against the PC reference at the same 16:9 presentation class and record PASS / FAIL for E2-VIEW-01 through E2-VIEW-05.

Required evidence:

1. one reference image;
2. one Godot E2 capture;
3. a five-row verdict table for E2-VIEW-01 through E2-VIEW-05;
4. any intentional differences documented as presentation decisions rather than silent drift.

The comparison is based on relative spatial zones and hierarchy, not image-diff percentage.

## Salience rule

E2-VIEW-02 must be judged by hierarchy, not developer intent. A reviewer should be able to identify the same first-look operational target in both images without reading implementation notes first.

Salience may be created through size, contrast, position, whitespace, warning emphasis, or grouping. The implementation is free to differ from the reference in exact pixels provided the perceptual ordering remains equivalent.

## Disclosure rule

`always-visible`, `collapsible`, and `drill-down` are presentation contracts. Moving always-visible operational information behind interaction is an E2-VIEW-03 failure even if the information still exists somewhere in the UI.

## Warning mapping

Where canonical statuses exist, presentation color mapping is:

```text
FAILED / BLOCKED / DANGER   RED
PARTIAL                     YELLOW
SUCCESS / SAFE              GREEN
UNAVAILABLE / N/A / IDLE    NEUTRAL
```

If a value has no canonical status, E2 must not invent one merely to obtain a red/yellow/green state.

## Non-goals

- no new canonical mechanics;
- no new Expedition calculations;
- no Mobile layout work;
- no pixel-perfect screenshot cloning;
- no animation polish gate;
- no typography micro-tuning loop unless readability or hierarchy is affected.

## Phase boundary

Phase E2 PASS means the Godot PC Expedition screen preserves the reference's coarse placement, perceptual priority, disclosure model, and warning semantics while remaining within the frozen E1 data ownership contract.
