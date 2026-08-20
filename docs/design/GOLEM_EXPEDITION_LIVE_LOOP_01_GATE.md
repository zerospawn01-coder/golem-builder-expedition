# GOLEM-EXPEDITION-LIVE-LOOP-01 — Canonical decision gate

```text
STATUS          D0 PASS / OPTION B APPROVED
IMPLEMENTATION  HOLD / NOT AUTHORIZED
DECISION CLASS  CANONICAL GAMEPLAY
DEPENDENCIES    NONE — independent; Phase E2/E3 completion is not required
STARTED         2026-08-20
MAIN MERGE      HOLD
APPROVAL        CANONICAL DIRECTION APPROVED — OPTION B
CONTRACT        D1 FROZEN / PASS
D2              FROZEN / PASS — 5,120 GOLDEN VECTORS
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

## Product decision and synchronization model

This is not a UI-layout decision. It selects how an Expedition exists in canonical time and when player decisions may occur.

```text
OPTION A  ATOMIC / INSTANT RESOLUTION
          Deploy commits one complete Expedition transaction and exposes only
          its result and cargo decision.

OPTION B  PERSISTENT / MULTI-STEP RESOLUTION
          Deploy opens a canonical runtime transaction that survives across
          one or more explicit decision points before return or destruction.
```

Persistent does not automatically mean real-time. Option B may use deterministic, turn-based steps such as the isolated `GRAVITY_DEPTH_V0` flow. Real-time ticks, timers, random mid-mission events, and command-combat controls are separate decisions and are not implied by this gate.

The upstream product question is therefore:

> Is GOLEM BUILDER primarily an atomic design-and-result puzzle, or does its core experience include supervising a design through multiple expedition decisions before the result returns to the foundry?

The answer is a game-design choice. Code quality or architecture alone cannot select it.

## Technical impact comparison

| Concern | Option A — instant | Option B — persistent multi-step |
|---|---|---|
| `state/` | No new canonical runtime transitions | Canonical in-progress state, legal decision points, resume/close behavior |
| `domain/` | Existing whole-run transaction remains | Step evaluator and transition rules; exact RETURN/destruction consequences |
| Presentation | Result-oriented UI; permanent North Star divergence | Truthful live/decision view can derive from canonical state |
| Persistence | Current result/cargo boundary | Unresolved-run schema, reload behavior, migration, duplicate-input protection |
| Damage audit | Existing 5,120 whole-run cases remain authoritative | Existing cases must be preserved or mapped, plus per-step composition/equality audits |
| Cargo | Current post-result selection | Secured/unsecured ownership across continue, return, destruction, and reload |
| Cost | Low; decision documentation | High; core-mechanism contract, implementation, migration, and regression work |
| Product risk | Formally gives up full live-loop North Star parity | Changes the canonical core loop and may invalidate instant-resolution assumptions |

Option B is a core-mechanism change, not a presentation feature. It must not be estimated or reviewed as ordinary E3 UI work.

The existing 5,120-case damage audit must not simply be discarded if Option B is selected. A promotion contract must state whether the whole-run result is preserved by composing deterministic step results or intentionally changed under a separately approved balance decision.

## D1 resolution of required decision questions

| ID | Frozen resolution |
|---|---|
| LIVE-01 | A canonical in-progress Expedition is required; instant resolution is rejected as the canonical end-state. |
| LIVE-02 | Only initial deployment spends one ACTION; `CONTINUE` and `RETURN` spend none. |
| LIVE-03 | RETURN preserves pending cargo for capacity-limited claim; destruction clears it; reload preserves exactly-once state. |
| LIVE-04 | Every decision uses the same pure step evaluator for forecast and resolution. |
| LIVE-05 | Canonical saves restore or deterministically recover the same unresolved command/decision with a versioned fail-closed schema. |
| LIVE-06 | `EMERGENCY RETREAT` is not canonical; normal `RETURN` is the only retreat action. |
| LIVE-07 | Stable run/decision IDs join start, presentation, continue, return, terminal, cargo, and record events. |

## Promotion requirements

Option B implementation cannot be authorized until the frozen contract defines:

1. the canonical Expedition state machine and legal transitions;
2. ACTION and durability transaction boundaries;
3. prediction/resolution equality at every step;
4. unsecured cargo and return consequences;
5. persistence, reload, and duplicate-input behavior;
6. structured event schemas;
7. migration and regression coverage;
8. an explicit decision on normal `RETURN` versus conditional `EMERGENCY RETREAT`.

The contract must reuse evidence from `GRAVITY_DEPTH_V0` without silently promoting its experimental materials, zone, routes, or save schema.

## Evidence basis for the approved direction

**Option B is approved: a deterministic, turn-based supervised Expedition loop.** This direction approval is not an implementation authorization.

Reasons:

1. The PC North Star and approved mobile information baseline both define observation, diagnosis, and `CONTINUE` / `RETURN` as the intended experience rather than decoration.
2. `GRAVITY_DEPTH_V0` already demonstrates an isolated discrete implementation, and its central hypothesis is recorded as confirmed enough to proceed to product integration.
3. Current priorities explicitly require preservation of cumulative damage and `RETURN` / `CONTINUE` decisions during that integration.
4. Option A is technically cheaper but would formally abandon full North Star parity and contradict the recorded product direction.
5. Constraining Option B to deterministic decision steps avoids inferring real-time ticks, random mid-mission events, or command-combat mechanics.

The approved direction does **not** include experimental materials, a new zone, POWER/WORK routes, real-time simulation, `AUTO`, speed controls, or `EMERGENCY RETREAT`. Those require separate evidence or decisions.

The product owner explicitly approved Option B. The required D1 contract is frozen in [`GOLEM_EXPEDITION_LIVE_LOOP_01_CANONICAL_CONTRACT.md`](GOLEM_EXPEDITION_LIVE_LOOP_01_CANONICAL_CONTRACT.md). Until a later implementation phase is authorized, the current instant-resolution implementation remains authoritative.

The D1 audit confirmed that the existing domain evaluator already exposes an ordered damage decomposition (`resist`, `mobility`, `encounter`) rather than only a scalar total. D2 must preserve those exact components, their prefix sums, and early-failure reachability across all 5,120 legacy audit cases; it is not authorized to invent a new split.

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

Current verdict: **D0 PASS / OPTION B APPROVED / D1 FROZEN / D2 FROZEN / IMPLEMENTATION HOLD**.
