# Expedition Presentation Data Contract — Phase E1

```text
STATUS          FROZEN
PHASE           E1 — PC PROVISIONAL PRESENTATION
SOURCE BASELINE main@74989d65
CANONICAL RULES NO CHANGE
MOBILE          OUT OF SCOPE / PHASE M1
```

## Purpose

Phase E1 may reproduce the information hierarchy of the PC Expedition reference, but it must not turn presentation-only values into gameplay state or move gameplay calculations into UI code.

The dependency direction is frozen as:

```text
domain -> state -> presentation -> ui
             \-> event stream -> presentation/log ui
```

Forbidden directions:

```text
ui -> gameplay calculation
ui -> duplicate domain rules
presentation -> mutate state
domain -> layout / widget / animation concerns
presentation -> random / clock / global mutable state
```

## Data-source classification

### Canonical GameState source of truth

The following values must come from a GameState snapshot, not be recalculated by UI:

- DAY / ACTION
- inventory and accepted cargo
- UNIT identity, FRAME / REACTOR / CONTROL SIGIL IDs
- POWER / ARMOR / MOBILITY / WORK
- traits
- durability / hull integrity
- current expedition result while cargo is pending
- current expedition region ID
- expedition total damage
- cargo capacity, candidate loot, selected cargo indexes, selected cargo weight, claimed state

`expedition_runtime` is runtime GameState. It preserves the already-existing deploy -> inspect cargo -> confirm cargo loop. It does not introduce a new combat or economy rule and is intentionally not persisted across application restart in this parity phase.

### Presentation-derived values

The following values exist only in `presentation/` and have zero gameplay effect:

- ANALYZER normalized axes
- AREA MAP highlighting
- NAVIGATION labels
- severity / status labels
- formatted event log rows
- STABILITY INDEX presentation proxy

For E1, `STABILITY INDEX` is explicitly a `DURABILITY_PROXY`: it is equal to clamped canonical durability and must be labeled as presentation-derived. It is not a hidden gameplay statistic.

### Canonical values not present in the current game

The PC reference contains concepts that do not exist in the current canonical rules. Phase E1 must not invent them merely to fill a panel.

```text
JOINT LOAD                  UNAVAILABLE
NUMERIC DEPTH               UNAVAILABLE
SIGNAL STRENGTH             UNAVAILABLE
MAG. NOISE %                UNAVAILABLE
POWER CORE EFFICIENCY %     UNAVAILABLE
RUNE EFFICIENCY %           UNAVAILABLE
```

The UI may display `N/A` / `UNAVAILABLE`. Adding any of these as a real mechanic requires a separate canonical design decision and regression contract.

POWER CORE and RUNE identity themselves are canonical because the UNIT stores `core` and `rune` IDs; only their percentage efficiency values are unavailable.

### Event stream / LOG

Domain resolution emits structured events only. Presentation converts event dictionaries into labels and rows.

The E1 UI must not consume preformatted `title` or `message` strings from the domain layer.

## Phase E1 implementation gates

```text
E1-DATA-01  Every visible block has a source classification.
E1-DATA-02  ui/ performs no canonical gameplay calculation.
E1-DATA-03  domain/ contains no E1 visualization-only calculation.
E1-DATA-04  presentation/ cannot mutate GameState.
E1-DATA-05  LOG rows are generated from structured events.
E1-DATA-06  Same canonical snapshot produces exactly the same presentation model.
E1-DATA-07  Missing canonical concepts remain UNAVAILABLE; no fake state is introduced.
```

## E1-DATA-06 test contract

`tests/run_all.gd` must:

1. construct one fixed GameState-style snapshot;
2. pass the same deep-copied snapshot to `ExpeditionPresenter.build()` twice;
3. assert complete Variant equality and serialized JSON equality;
4. verify the source snapshot itself was not mutated.

This rejects clock-, random-, and mutation-dependent presentation behavior. `presentation/` must not call `randi()`, `randf()`, `RandomNumberGenerator.randomize()`, `Time.*`, or equivalent nondeterministic APIs.

## Phase boundary

Phase E1 PASS means the PC Expedition information architecture is implemented with the frozen data ownership rules. It does not imply Mobile parity, visual polish, or promotion of experimental mechanics.
