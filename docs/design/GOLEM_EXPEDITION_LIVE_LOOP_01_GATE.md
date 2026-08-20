# GOLEM-EXPEDITION-LIVE-LOOP-01 — Canonical decision gate

```text
STATUS          STARTED / DESIGN REVIEW
IMPLEMENTATION  HOLD / NOT AUTHORIZED
DECISION CLASS  CANONICAL GAMEPLAY
DEPENDENCIES    NONE — independent; Phase E2/E3 completion is not required
STARTED         2026-08-20
MAIN MERGE      HOLD
```

## Purpose

Decide whether GOLEM BUILDER should promote an in-progress Expedition state, intermediate decisions, and player intervention through normal `CONTINUE` / `RETURN` actions into the canonical loop.

This gate exists because the PC North Star assumes supervised expedition progress while the current canonical Godot loop resolves an Expedition immediately. Phase E2 recorded that structural mismatch as `E2-VIEW-02: FAIL (WON'T FIX / DESIGN DIVERGENCE)`. This gate must not retroactively convert that verdict to PASS.

## Why review may start now

The gate has no dependency on Phase E2 or E3. The following existing evidence is sufficient to begin a decision review without authorizing implementation:

- `GRAVITY_DEPTH_V0` implements an isolated multi-depth state machine with cumulative damage and normal `RETURN` / `CONTINUE` decisions.
- Its internal result records the central hypothesis as `CONFIRMED ENOUGH TO PROCEED`, with additional testing stopped until product integration.
- Current development priorities explicitly say to preserve cumulative damage and `RETURN` / `CONTINUE` decisions during Gravity Depth product presentation work.
- The approved Expedition information baseline describes `observe -> diagnose -> decide CONTINUE or RETURN -> preserve result -> redesign`.
- Phase E2 demonstrated that the PC North Star's primary gaze target cannot be represented truthfully by the current instant-resolution canonical loop.

These are inputs to a decision, not proof that the experiment is canonical.

## Frozen boundaries during review

- Do not modify canonical `GameState`, damage, cargo, ACTION, persistence, or Expedition resolution code.
- Do not port `GRAVITY_DEPTH_V0` fields into canonical state before an explicit promotion verdict and contract.
- Do not add a cosmetic live feed that implies unavailable mid-mission agency.
- Do not add `EMERGENCY RETREAT` merely because it is visually prominent in the North Star.
- Keep experiment saves and canonical saves isolated.
- Preserve the E1 dependency direction: `domain -> state -> presentation -> ui`.
- Keep PR #3 Draft and `MAIN MERGE` on HOLD.

## Decision under review

```text
OPTION A  Retain instant resolution.
          Accept the live-loop North Star elements as permanent design divergence.

OPTION B  Promote a supervised multi-step Expedition loop.
          Define canonical in-progress state plus normal CONTINUE / RETURN.

OPTION C  Simulate an ongoing mission only in presentation.
          Rejected as a review option because it would imply agency and state
          that the canonical loop does not provide.
```

The open canonical choice is therefore A versus B. No implementation preference is inferred from the visual reference alone.

## Required decision questions

| ID | Question |
|---|---|
| LIVE-01 | Is an in-progress Expedition state necessary to the canonical design loop, or is instant resolution intentional? |
| LIVE-02 | If promoted, does only initial deployment spend one ACTION, with `CONTINUE` consuming no additional ACTION as in `GRAVITY_DEPTH_V0`? |
| LIVE-03 | What exact state is secured or lost on normal `RETURN`, destruction, reload, and application exit? |
| LIVE-04 | Must every `CONTINUE` decision show the next-step prediction from the same pure evaluator used by resolution? |
| LIVE-05 | Must canonical saves resume at the same unresolved decision point, and what schema/version migration is required? |
| LIVE-06 | Is `EMERGENCY RETREAT` mechanically distinct from normal `RETURN`? If not, it remains unavailable and must not be displayed. |
| LIVE-07 | Which structured events are required for decision, return, destruction, cargo, and Blueprint/archive linkage? |

## Promotion requirements

Option B cannot be authorized until a separate frozen contract defines:

1. the canonical Expedition state machine and legal transitions;
2. ACTION and durability transaction boundaries;
3. prediction/resolution equality at every step;
4. unsecured cargo and return consequences;
5. persistence, reload, and duplicate-input behavior;
6. structured event schemas;
7. migration and regression coverage;
8. an explicit decision on normal `RETURN` versus conditional `EMERGENCY RETREAT`.

The contract must reuse evidence from `GRAVITY_DEPTH_V0` without silently promoting its experimental materials, zone, routes, or save schema.

## Exit states

```text
RETAIN INSTANT LOOP
  -> record permanent North Star design divergence
  -> keep live-loop controls unavailable

PROMOTE SUPERVISED LOOP
  -> freeze a new canonical gameplay contract
  -> create a separate implementation phase and regression gate

INSUFFICIENT EVIDENCE
  -> keep implementation HOLD
  -> name the exact missing evidence; do not return the work to E2/E3
```

Current verdict: **OPEN / NO CANONICAL DECISION YET**.
