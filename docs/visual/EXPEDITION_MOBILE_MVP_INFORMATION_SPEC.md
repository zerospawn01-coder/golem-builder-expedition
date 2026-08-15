# Expedition Telemetry — Mobile MVP Information Specification

Status: approved information baseline

Effective: 2026-08-15

Scope: mobile expedition supervision screen

Rule change: none

Related priorities: Gravity Depth product presentation, Blueprint integration

## North Star references

- [`expedition-mobile-north-star.png`](north-star/expedition-mobile-north-star.png)
- [`expedition-desktop-north-star.png`](north-star/expedition-desktop-north-star.png)

These images fix the intended experience and visual direction. They are not pixel-accurate layouts, evidence that depicted mechanics exist, or permission to add rules. Text rendered inside the images is illustrative. Current domain terms, damage rules, ACTION economy, available equipment, and disclosure rules remain authoritative.

The shared product direction is:

```text
observe expedition
→ diagnose causes
→ decide CONTINUE or RETURN
→ preserve the result
→ apply the observation to the next design
```

Mobile concentrates on one selected UNIT. Desktop may expose more information in parallel, but must preserve the same decision sequence and terminology.

## Objective

At every expedition decision point, the player must be able to answer:

1. Where is this UNIT and what is it doing?
2. What changed since the previous step?
3. What is causing current or predicted damage?
4. What will CONTINUE and RETURN do?
5. What observation should influence the next design?

The screen is a design-result visualization, not a combat-command interface. The UNIT acts according to its construction and current expedition state; the player supervises risk and chooses whether to proceed or return.

## MVP viewport and layout contract

Primary validation viewport: `390 × 844 CSS px`.

Supported mobile width: `360–480 CSS px`.

The screen uses one vertical reading column. A desktop-style right rail must not be compressed beside the live view on mobile.

```text
┌──────────────────────────────┐
│ STICKY CONTEXT HEADER        │
│ DAY · ACTION · ZONE · DEPTH  │
├──────────────────────────────┤
│ LIVE EXPEDITION VIEW         │
│ UNIT / task / hazard overlay │
├──────────────────────────────┤
│ DECISION SUMMARY             │
│ DAMAGE · CARGO · STABILITY   │
│ principal cause / forecast   │
├──────────────────────────────┤
│ CONTINUE         RETURN      │
│ [EMERGENCY RETREAT if valid] │
├──────────────────────────────┤
│ RECENT DIAGNOSTIC LOG        │
│ latest 3; expand for history │
├──────────────────────────────┤
│ UNIT / ROUTE DETAIL          │
│ collapsed secondary panels  │
├──────────────────────────────┤
│ PRODUCT NAVIGATION           │
└──────────────────────────────┘
```

The context header remains visible while scrolling. The decision summary and primary actions must be visible together at the decision point; the player must not need to scroll between risk information and the choice it informs.

## Information hierarchy

### Tier 1 — Persistent expedition context

- `DAY current`
- `ACTION remaining / maximum`
- `ZONE canonical name`
- `DEPTH current / known maximum`, or an explicit unknown marker when the maximum is undisclosed
- selected UNIT identity
- current phase: `ADVANCING`, `EXTRACTING`, `RETURNING`, `DESTROYED`, or `COMPLETE`

DAY and ACTION are campaign resources. DEPTH is route progress. They must never be combined into a single progress score.

### Tier 2 — Live expedition view

The live view communicates, in this order:

1. UNIT presence and structural identity.
2. Current task, such as advancing, extracting, or returning.
3. Visible environmental hazard.
4. Current material contact when disclosure rules permit it.

The image is evidence-bearing presentation. Hazard markers must correspond to an active or observed condition; warning graphics cannot be decorative false alarms.

Minimum mobile aspect ratio is `4:3`; preferred presentation is between `4:3` and `3:2`. The full-height North Star composition may be used as art direction, but the MVP must reserve vertical space for diagnosis and decisions.

### Tier 3 — Decision summary

The summary contains three distinct values:

- `DAMAGE`: accumulated damage and predicted damage after the proposed next step.
- `CARGO`: used capacity / total capacity.
- `STABILITY`: the current expedition stability value defined by the active experiment model.

Each value has a text label, numeric value, and state. Color alone is insufficient.

Immediately below the values, show:

- primary damage cause;
- cause contribution or exact damage when known;
- next-step forecast;
- one evidence-based design observation when available.

Do not display `HULL INTEGRITY`, `JOINT LOAD`, `MAG.NOISE`, weapon statistics, or invented percentages unless the current domain model actually produces them. The North Star labels are visual examples rather than canonical fields.

### Tier 4 — Player decision

The normal decision pair is:

- `CONTINUE`: spend the defined expedition opportunity and resolve the next depth step.
- `RETURN`: begin or complete normal return with the currently recoverable cargo.

`EMERGENCY RETREAT` is conditional, not the permanent visual default. It appears only when the active rules provide a mechanically distinct emergency action. Its confirmation must state exact cost, cargo consequence, and survival consequence before execution.

Disabled actions remain visible when they teach the state, with one concrete reason adjacent to the control. No action may be enabled when its consequence cannot be predicted by the shared evaluator.

### Tier 5 — Diagnostic log

The collapsed view shows the latest three events. Expanded history is chronological and retains the complete expedition record.

Event vocabulary:

| Class | Purpose | Required content |
|---|---|---|
| `INFO` | Progress or collection fact | event, amount or depth, resulting state |
| `WARNING` | Active risk | cause, current consequence, projected consequence |
| `ANALYSIS` | Causal interpretation | dominant cause, contributing build property, actionable observation |
| `RETURN` | Normal return transition | cargo retained, damage state, destination |
| `EMERGENCY` | Exceptional retreat | trigger, explicit cost, retained cargo, result |
| `RESULT` | Expedition closure | recovered resources, damage causes, Blueprint/archive connection |

Logs use canonical cause names. Avoid mood-only messages such as “danger is increasing” when the system can name the responsible deficit or hazard.

Recommended message structure:

```text
[CLASS] Event
CAUSE        canonical cause
EFFECT       exact state change
OBSERVATION  implication for the next decision or design
```

`OBSERVATION` describes evidence; it must not assign a mandatory build recipe or hidden optimal role.

## Required screen states

### 1. Stable progression

- current task is visible;
- no false warning treatment;
- CONTINUE and RETURN consequences are readable;
- latest collection or depth event appears in the log.

### 2. Warning

- affected status is identified by label and value;
- primary cause is named;
- projected next-step damage is shown;
- warning is visible in both summary and log without duplicating full prose.

### 3. Return decision

- CONTINUE and RETURN are both available;
- cargo retained by RETURN is explicit;
- predicted next-step risk is adjacent to the controls;
- neither choice is visually presented as universally correct.

### 4. Emergency retreat

- appears only when supported by rules;
- requires confirmation;
- exact trade-off is stated before commitment;
- the normal return control remains distinguishable.

### 5. Result

- return status and recovered cargo;
- total damage and cause breakdown;
- deepest point reached;
- new observations;
- `SAVE AS BLUEPRINT` or `UPDATE BLUEPRINT RECORD` when the Blueprint feature is available;
- Archive access for the complete record.

The result screen is the explicit bridge from expedition evidence to subsequent design. Blueprint storage and fabricated UNIT storage remain separate.

## Responsive desktop translation

Desktop reflows the same information rather than defining another product model.

```text
LEFT                 CENTER                 RIGHT
live expedition      log and diagnosis      route / UNIT detail
view                  decision summary       comparative context

BOTTOM
CONTINUE · RETURN · conditional EMERGENCY RETREAT · product navigation
```

Desktop may keep live view, log, and route visible simultaneously. It must not add command-combat controls, weapon systems, or a second independent damage interpretation merely because space is available.

## Interaction and safety rules

- Prediction and resolution use the same pure outcome evaluator.
- A decision is resolved once. Repeated taps cannot spend ACTION twice.
- While resolution is pending, controls communicate the pending state without erasing the prior forecast.
- RETURN and EMERGENCY RETREAT require different labels, consequences, and telemetry events.
- Destructive or irreversible consequences require confirmation containing exact effects.
- Unknown materials remain unknown until the current disclosure rule identifies them.
- AUTO and speed controls are outside the mobile MVP until the supervised decision loop works without them.
- Bottom product navigation must not cover expedition actions or device safe areas.
- Touch targets are at least `44 × 44 CSS px` with visible keyboard focus for desktop parity.
- Essential text meets WCAG AA contrast; cyan, amber, and red are reinforced by label and icon.

## Telemetry contract

The MVP records decision evidence without inferring player motivation:

```text
expedition_viewed
depth_decision_presented
continue_selected
return_selected
emergency_retreat_selected
diagnostic_log_expanded
damage_cause_viewed
expedition_result_viewed
blueprint_record_opened_from_result
blueprint_saved_from_result
```

Each decision event records UNIT, zone, depth, accumulated damage, predicted next-step damage, cargo, stability, and available actions. It must not record invented fields shown only in concept art.

## MVP exclusions

- real-time combat control;
- weapon loadout and weapon status;
- multi-UNIT simultaneous mobile monitoring;
- permanent AUTO mode;
- speed multiplier;
- new emergency economy;
- Manual Gather or Safe Supply;
- failure rewards;
- multi-tier maintenance;
- new damage axes introduced solely to match the concept images;
- desktop-only dense panels forced into the mobile viewport.

## Acceptance criteria

### Structural

- At `390 × 844`, DAY, ACTION, ZONE, and DEPTH are readable without horizontal scrolling.
- Live view, decision summary, and available decision controls form one uninterrupted decision sequence.
- No horizontal page overflow occurs from `360–480 px`.
- The latest three logs are accessible and the full history can be expanded.
- Device safe-area insets do not obscure controls.

### Rule integrity

- Prediction and actual cause breakdown match for every required state fixture.
- Every displayed warning maps to an active evaluator output.
- Every enabled action has an implemented consequence.
- Existing ACTION, damage, cargo, and disclosure rules remain unchanged.
- Blueprint connection stores a design record, not another fabricated UNIT.

### Comprehension

Without prior explanation, a tester can identify:

1. current zone and depth;
2. current task;
3. primary damage cause;
4. difference between CONTINUE and RETURN;
5. expected consequence of the selected action;
6. where the expedition observation is retained for future design.

Critical failure occurs if the tester interprets the screen as direct combat control, cannot distinguish normal RETURN from EMERGENCY RETREAT, or believes a concept-art-only metric is a production rule.

## Implementation order

```text
1. State and information contract
2. Shared forecast / resolution projection
3. Mobile semantic layout
4. Five required states with fixtures
5. Diagnostic vocabulary and result-to-Blueprint bridge
6. Responsive desktop reflow
7. Industrial-occult world skin and final art
```

Decoration is applied after the information contract and required states work at the primary mobile viewport.
