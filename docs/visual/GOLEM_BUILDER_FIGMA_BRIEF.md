# GOLEM BUILDER — Figma Design Brief

```text
DOCUMENT TYPE   FIGMA HANDOFF / VISUAL DIRECTION
PRODUCT PHASE   PLAYABLE ALPHA / PRODUCT INTEGRATION
PRIMARY GOAL    UI COMPREHENSION + PRODUCT IDENTITY
RULE CHANGE     NONE
CANONICAL AXIS  RETRO INDUSTRIAL / OCCULT SCIENCE / EXPEDITION ENGINEERING
```

## 1. Product statement

GOLEM BUILDERは、人間が立ち入れない異常区域へ送る無機探索構造体を設計・製造するゲームである。

プレイヤーは`FRAME / REACTOR / CONTROL SIGIL`を組み合わせ、`POWER / ARMOR / MOBILITY / WORK`と環境特性を調整する。完成したUNITを区域へ派遣し、損傷原因と回収資材を読み、次の設計仮説を作る。

```text
DESIGN
→ FABRICATION
→ INSPECTION
→ DEPLOYMENT
→ DAMAGE ASSESSMENT
→ RECOVERY
→ REDESIGN
```

画面の役割は、プレイヤーへ正解を教えることではない。設計判断と結果の因果を読み取れるようにすることである。

## 2. One-line visual direction

> Industrial occult operations UI for constructing and deploying non-living expedition units.

日本語：

> 無機探索構造体を製造・派遣するための、工業的かつオカルト科学的な運用端末UI。

### Desired impression

- 古い工廠で使われ続けている実験端末
- 軍事司令画面ではなく、研究・製造・整備の作業卓
- 魔法を神秘的に飾るのではなく、未解明現象を計測・記録している
- プレイヤーは勇者ではなく、設計者・試験担当者・運用技師
- 装飾よりも、比較、警告、損傷理由、管理番号が世界観を作る

### Avoid

- 中世ファンタジーの羊皮紙、金縁、宝石装飾
- 明るいモバイルゲーム風カードUI
- 過度なネオン、ホログラム、サイバーパンク表現
- 単一の総合戦闘力、レアリティ星、Sランク中心の表示
- キャラクターゲームのような人格化されたゴーレム表現
- 情報を隠すほど強いノイズ、走査線、グリッチ、汚れ

## 3. Figma file structure

```text
00 — COVER & PRINCIPLES
01 — FOUNDATIONS
02 — COMPONENTS
03 — DESIGN / FABRICATION
04 — DEPLOYMENT
05 — EXPEDITION RESULT
06 — UNIT / BLUEPRINT
07 — REQUIRED STATES
08 — MOBILE
09 — PROTOTYPE FLOW
```

各完成画面は、通常状態だけでなく`07 — REQUIRED STATES`へエラー・警告・選択差分を並べる。

## 4. Target frames

### Desktop

- Primary frame: `1440 × 1024`
- Content width: `1152 px`
- Grid: `12 columns`
- Outer margin: `144 px`
- Gutter: `20 px`
- Main layout: input `7 columns` / result `5 columns`

### Mobile

- Primary frame: `390 × 844`
- Outer margin: `16 px`
- Grid: `4 columns`
- Gutter: `12 px`
- Minimum touch target: `44 × 44 px`

### Density

情報密度は高めでよい。ただし一画面の主判断は一つにする。

```text
FABRICATION  = 何を作るか
DEPLOYMENT   = どのUNITをどこまで送るか
RESULT       = なぜこの結果になったか
BLUEPRINT    = どの設計知識を残すか
```

## 5. Foundations

### Color tokens

| Token | Value | Use |
|---|---|---|
| `bg/base` | `#0F1113` | app background, deep terminal surface |
| `bg/panel` | `#121417` | primary panel |
| `bg/elevated` | `#15181C` | header, modal, selected region |
| `bg/selected` | `#1A1C1E` | selected card, active control |
| `border/default` | `#2D3135` | panel and card border |
| `border/strong` | `#596069` | focused technical boundary |
| `text/primary` | `#E0E2E4` | main text and values |
| `text/secondary` | `#B8BDC4` | descriptions |
| `text/muted` | `#8A8F98` | labels and inactive text |
| `signal/amber` | `#F59E0B` | selected, action, fabrication readiness |
| `signal/cyan` | `#22D3EE` | reactor, prediction, detected phenomenon |
| `signal/green` | `#10B981` | acceptable, access satisfied |
| `signal/yellow` | `#FBBF24` | warning, recommended condition missing |
| `signal/red` | `#FB7185` | critical, blocked, destructive action |
| `stat/power` | `#FB7185` | POWER |
| `stat/armor` | `#60A5FA` | ARMOR |
| `stat/mobility` | `#34D399` | MOBILITY |
| `stat/work` | `#C084FC` | WORK |

色だけで状態を伝えない。すべての状態色に、ラベル、記号、数値のいずれかを併記する。

### Typography

Recommended Figma fonts:

- UI / numbers / labels: `IBM Plex Mono`
- Japanese body copy: `Noto Sans JP`
- Headings: `IBM Plex Sans Condensed`または`Barlow Condensed`

Type scale:

| Style | Size / Line | Use |
|---|---:|---|
| `Display/Unit` | `28 / 34` | UNIT name, major result |
| `Heading/Screen` | `22 / 28` | screen title |
| `Heading/Panel` | `16 / 22` | panel title |
| `Label/Technical` | `11 / 16`, tracking `8%` | uppercase English label |
| `Body/Primary` | `14 / 22` | explanation |
| `Body/Compact` | `12 / 18` | dense card text |
| `Value/Stat` | `20 / 24`, tabular | primary stat value |
| `Value/Small` | `12 / 16`, tabular | stock, damage source |

Japanese explanation should not be forced into all-uppercase or wide tracking. English technical labels and Japanese explanation have different typographic roles.

### Spacing and shape

- Spacing base: `4 px`
- Common gaps: `8 / 12 / 16 / 24 / 32`
- Panel padding: desktop `20–24`, mobile `16`
- Border radius: `2–4 px`; almost square
- Border: `1 px`; selected state may use amber or cyan
- Shadow: minimal; use border and subtle inner glow instead
- Angled corner cuts may appear only on major status plates, not every card

### Texture

- Very subtle painted metal or dark enamel texture
- Faint inspection-grid and registration marks
- Localized abrasion around frame edges only
- No texture behind small text
- Grain opacity target: `2–4%`

## 6. Shared component library

Build all components with Auto Layout, variants, and tokenized colors.

### `App/Header`

- Product mark: `GOLEM BUILDER`
- Current facility: `EXPERIMENTAL FOUNDRY`
- `DAY`, `ACTION`, `UNIT SLOTS`
- Stock summary
- Navigation: `FABRICATION / DEPLOYMENT / UNIT RECORDS`

### `Panel/Technical`

Variants:

- default
- selected
- warning
- critical
- disabled
- unknown

Anatomy:

```text
eyebrow label
panel title
optional management code
content
status strip / footer
```

### `Part/Card`

Used for `FRAME / REACTOR / CONTROL SIGIL / PROTOTYPE MATERIAL`.

Required content:

- part name
- small structural icon
- owned stock
- primary stat contribution
- selected indicator
- unavailable reason

Variants:

- available
- selected
- unavailable
- newly recovered
- blueprint-loaded

### `Stat/Readout`

```text
POWER       11   +3
ARMOR        7   -1
MOBILITY     4    —
WORK         8   +2
```

- Absolute value is primary.
- Delta is secondary and temporary.
- Positive and negative deltas receive equal visual weight.
- Use tabular numbers.
- Do not combine into one total score.

### `Trait/Badge`

- icon
- trait name
- state: gained / active / lost / required
- cause line: `FRAME + REACTOR`

`TRAIT LOST` must remain visible immediately after a selection change.

### `Damage/Breakdown`

```text
PREDICTED STRUCTURAL DAMAGE   38%

GRAVITY WELL                 +26
STRUCTURAL DEFICIT           +12
--------------------------------
AFTER DEPLOYMENT              52%
```

- Total alone is insufficient.
- Show source, amount, and resulting durability.
- `ACCEPTABLE / WARNING / CRITICAL` appears as text and icon.

### `Status/Plate`

Variants:

- `ACCEPTABLE`
- `WARNING`
- `CRITICAL`
- `ACCESS BLOCKED`
- `UNCLASSIFIED`
- `RECOVERY CONFIRMED`

### `Button/Operation`

Variants:

- primary amber: fabrication, deploy, confirm recovery
- secondary outline: compare, load blueprint, return
- destructive red outline: disassembly, delete blueprint
- disabled: include exact reason nearby

Use verbs and costs:

```text
FABRICATE — 1 ACTION
DEPLOY — 1 ACTION
LOAD TO FABRICATION
CONFIRM RECOVERY
```

### `Blueprint/Row`

Required content:

- blueprint number or editable label
- `FRAME / REACTOR / CONTROL SIGIL`
- optional prototype material
- optional non-mechanical purpose tag
- load action
- duplicate warning

Do not display durability, UNIT history, damage, or a copied UNIT portrait. BLUEPRINT is design knowledge, not a completed machine.

## 7. Screen A — Design / Fabrication

This is the hero screen and the first design target.

### Primary question

> What did this part change, what did I lose, and where can this UNIT work?

### Desktop structure

```text
┌──────────────────────────────────────────────────────────────────────┐
│ DESIGN / FABRICATION     TARGET ZONE [ZONE G-01 ▼]   ACTION 2 / 3   │
├───────────────────────────────────┬──────────────────────────────────┤
│ ASSEMBLY INPUTS                   │ UNIT INSPECTION                  │
│                                   │                                  │
│ 1 FRAME                           │ [STRUCTURAL UNIT DIAGRAM]        │
│ [Stone] [Iron] [Wood] [Clay]      │                                  │
│                                   │ CHANGED: FRAME Iron → Clay       │
│ 2 REACTOR                         │ POWER      3  -4                 │
│ [Fire] [Water] [Wind] [Earth]     │ ARMOR      7   —                 │
│                                   │ MOBILITY   5  +3                 │
│ 3 CONTROL SIGIL                   │ WORK      13  +8                 │
│ [Attack] [Defense] [Speed] [...]  │                                  │
│                                   │ TRAITS / CAUSES                  │
│ 4 PROTOTYPE MATERIAL              │ ZONE FIT / DAMAGE BREAKDOWN      │
│ [None] [Low Mass] [Gravity...]    │                                  │
│                                   │ [OPEN FABRICATION REVIEW]        │
├───────────────────────────────────┴──────────────────────────────────┤
│ COST / STOCK · UNIT SLOTS · FABRICATION READINESS                  │
└──────────────────────────────────────────────────────────────────────┘
```

### Unit diagram

The UNIT visual is a functional exploded diagram, not a decorative character portrait.

- FRAME changes outer mass, limb thickness, stance, and silhouette.
- REACTOR changes central core geometry and emitted light.
- CONTROL SIGIL changes etched plate or projected geometric mark.
- Prototype material appears as a secondary material layer, not a rarity aura.
- Label attachment points with restrained technical callouts.

### Required feedback

- Last part transition
- All four stat deltas
- Trait gained and lost
- Exact predicted damage
- Access and environmental conditions separately
- Current and post-fabrication stock
- Unit-slot status

## 8. Screen B — Deployment

### Primary question

> Which UNIT should enter, how far should it go, and what risk am I accepting?

Layout:

```text
LEFT                         CENTER                        RIGHT
ZONE / DEPTH MAP             SELECTED UNIT                 RISK REPORT
depth nodes                  compact structural diagram    exact damage
known hazards                stats and traits              damage sources
detected materials           cargo capacity                after durability
                              route affinity                deploy action
```

### Depth presentation

- Present depth as a vertical industrial cross-section, not a fantasy world map.
- Each depth node has a management code, name, known risk, and detected material.
- Unknown information appears as `UNCLASSIFIED`, never as a misleading silhouette.
- `RETURN` and `CONTINUE` receive equal visual legitimacy.
- Show unsecured cargo next to risk so the player weighs loss against progress.

### Route choice

POWER and WORK must not look like red/blue versions of the same button.

```text
POWER ROUTE
collapsed gate / forced breach / dense recovery

WORK ROUTE
service shaft / excavation / low-mass recovery
```

Each route card shows:

- required stat relationship
- predicted damage
- primary damage source
- reward tendency
- remaining durability

Do not mark either route as recommended or best.

## 9. Screen C — Expedition Result

### Primary question

> Why did this happen, what did I recover, and what should I redesign?

Use a technical return report rather than a victory screen.

```text
DEPLOYMENT REPORT / RETURN RECORD

DEPTH 1   MOBILITY DEFICIT        +8
DEPTH 2   GRAVITY / MASS / MOB    +16
DEPTH 3   FORCED BREACH            +8
DEPTH 4   NOT ENTERED               —

RETURN CONDITION                  13%
RECOVERED WEIGHT                 6 / 8
MAJOR CONTRIBUTOR       MOBILITY DEFICIT

[RECOVERED MATERIAL CARDS]
[MY NEXT HYPOTHESIS]
```

### Cargo selection

- Material card shows weight, quantity, known function, and current stock.
- Newly identified material uses a brief cyan detection treatment.
- If function is not yet verified, show `POSSIBLE APPLICATION`, not a confirmed effect.
- Capacity meter must remain visible while selecting.

### Learning connection

The result screen should visually link:

```text
damage source
→ relevant stat / characteristic
→ recovered material
→ possible next modification
```

Do not automatically prescribe the next build. Provide evidence for the player to form a hypothesis.

## 10. Screen D — Unit & Blueprint Records

### Unit record

- completed UNIT identity
- current durability
- component assembly
- expeditions completed
- repair and disassembly actions

### Blueprint library

- separate panel from completed UNITs
- design-only visual treatment: technical sheet, no durability bar
- default capacity `0 / 10`
- names such as `BLUEPRINT 01`, editable later
- optional tags: `SCOUT / EXTRACTOR / HEAVY / ENVIRONMENT / CARGO / CUSTOM`
- `LOAD TO FABRICATION` restores selections only

### Current scope boundary

Do not design or imply the following as implemented:

- RESERVE HANGAR
- ACTIVE ROSTER
- passive degradation
- passive repair
- upkeep costs
- simultaneous deployments
- background collection

## 11. Zone identity

Zones use restrained technical thumbnails and diagrammatic identity.

| Zone type | Visual language |
|---|---|
| Quarry | fractured stone planes, survey marks, ochre dust |
| Forest | dense vertical silhouettes, root-grid obstruction, muted green |
| Mine | black voids, timber braces, narrow amber lamps |
| Ancient Ruins | impossible geometry, sealed rings, pale cyan aether |
| Gravity Depth | distorted grid, falling debris suspended, compressed depth lines |

The thumbnail supports recognition. Risk, access, and reward remain readable text.

## 12. Golem visual language

### FRAME

- Stone: broad blocks, chipped planes, high center mass
- Iron: riveted plates, reinforced joints, compact heavy silhouette
- Wood: articulated limbs, lighter frame, tension braces
- Clay: modular molded segments, wide work appendages

### REACTOR

- Fire: compact hot aperture, amber-red emission
- Water: layered fluid chamber, cool blue pulse
- Wind: turbine ring or rotating vanes, pale teal emission
- Earth: dense geometric core, ochre-violet resonance

### CONTROL SIGIL

- Attack: converging angular mark
- Defense: nested shield geometry
- Speed: directional broken ring
- Capacity: repeated lattice or container grid

The UNIT should remain non-living. Avoid faces, expressive eyes, heroic poses, and humanoid armor ornament.

## 13. Motion

Motion must communicate state change.

- Part selection: `120–180 ms` state transition
- Stat delta: brief rise/fall highlight, then settle
- Trait gained/lost: stamp-in / strike-out
- Prediction recalculation: numeric roll no longer than `250 ms`
- Reactor: slow pulse while idle
- Critical warning: one controlled pulse; no continuous flashing
- Fabrication: mechanical lock sequence, `600–900 ms`
- Result log: reveal by depth, skippable

Respect reduced-motion settings.

## 14. Accessibility and comprehension

- Minimum body text: `12 px` desktop, `14 px` mobile where possible
- Contrast target: WCAG AA for functional text
- Never encode POWER / ARMOR / MOBILITY / WORK by color alone
- Exact damage uses percentage and resulting durability
- Required and recommended conditions must use different words and icons
- Disabled actions display one specific reason
- Japanese text should not be smaller to imitate dense instrumentation
- Unknown material state must remain distinguishable from unavailable state

## 15. Required Figma variants

Create component and screen variants for:

- default selection
- part changed with positive and negative deltas
- trait gained
- trait lost
- access blocked
- acceptable damage
- warning damage
- critical / destroyed prediction
- insufficient material
- no ACTION
- unit slots full
- newly recovered material
- unclassified material
- blueprint saved
- duplicate blueprint
- blueprint loaded
- RETURN selected
- CONTINUE selected
- cargo over capacity

## 16. Prototype flow

Build one clickable flow before producing additional illustrations.

```text
01 Select Gravity Depth zone
02 Change FRAME / REACTOR / CONTROL SIGIL
03 Add Low-Mass Composite
04 Read stat and damage deltas
05 Open Fabrication Review
06 Fabricate UNIT
07 Deploy to Depth 1
08 Continue to Depth 3
09 Choose WORK route
10 Return or continue to Depth 4
11 Select cargo
12 Read damage report
13 Save current design as BLUEPRINT
14 Load BLUEPRINT to Fabrication
```

Prototype success means the viewer can explain the reasoning chain without separate instructions.

## 17. Figma AI / Make paste-ready prompt

```text
Design a desktop game operations interface for GOLEM BUILDER, a playable-alpha
expedition engineering game. The player constructs non-living golem units from
FRAME, REACTOR, CONTROL SIGIL, and optional PROTOTYPE MATERIAL components, then
deploys one unit into anomalous zones and learns from exact structural damage.

Visual direction: retro industrial, occult science, expedition engineering.
The interface should feel like a worn experimental foundry terminal and a
technical test record, not medieval fantasy, bright mobile-game UI, or neon
cyberpunk. Use dark enamel and painted-metal surfaces, thin technical borders,
amber operation accents, cyan phenomenon accents, tabular data, management
codes, inspection marks, and subtle local wear. Keep text highly readable.

Create three connected 1440x1024 desktop screens:
1. DESIGN / FABRICATION — target zone, component selection on the left, exploded
   golem structural diagram and immediate POWER / ARMOR / MOBILITY / WORK deltas,
   traits with causes, exact predicted damage, stock and fabrication readiness.
2. DEPLOYMENT — vertical depth map, one selected unit, unsecured cargo, exact
   damage sources, equal RETURN / CONTINUE actions, and distinct POWER versus
   WORK route cards with reward tendencies.
3. EXPEDITION RESULT — depth-by-depth damage report, final durability, cargo
   selection, recovered material purposes, next-hypothesis field, and save-current-
   design-to-BLUEPRINT action.

Do not use a total combat score, rarity stars, S-ranks, hero portraits, faces on
golems, or decorative fantasy frames. Do not imply simultaneous deployments,
reserve hangars, passive repair, or upkeep systems. BLUEPRINT stores design parts
only and must look different from a completed UNIT record.
```

## 18. Definition of done

The first Figma pass is ready for review when:

1. The three primary screens share one component system.
2. A part change visibly shows one benefit and one cost.
3. Trait cause and trait loss are understandable.
4. Predicted damage shows exact sources and final durability.
5. POWER and WORK routes look and read as different methods.
6. The result screen supports a next-build hypothesis.
7. BLUEPRINT cannot be mistaken for a completed UNIT.
8. No unimplemented RESERVE or ACTIVE ROSTER concepts appear.
9. Desktop and mobile preserve the same decision order.
10. A viewer can narrate `design → deployment → result → redesign` without an external explanation.

### Current Figma Make revision gate

The current visual structure and direction pass. Preserve the left-input/right-result layout and the structural UNIT diagram. Before treating the Fabrication screen as implementation-ready, correct these five items:

1. Add `LAST CHANGE` and all four signed stat deltas.
2. Expand Zone Fit into access, environment, stat checks, damage sources, total damage, and major contributor.
3. Display canonical `UNIT SLOTS current / 3`, never `/ 4`.
4. Move itemized fabrication cost, post-fabrication stock, ACTION 1, and slot readiness beside the review action.
5. Use canonical `ATTACK` and prototype-material names; remove `OFFENSE` and `GRAVITY BRACE`.

Do not rebuild the visual skeleton or add World Skin embellishment during this revision.

## 19. Source-of-truth references

- `docs/WORLD_AND_TERMINOLOGY.md`
- `docs/visual/V1_DESIGN_FABRICATION_WIREFRAME.md`
- `docs/design/UNIT_CAPACITY_MODEL.md`
- `docs/experiments/GRAVITY_DEPTH_V0_SPEC.md`

If the visual brief conflicts with a canonical gameplay rule, the gameplay rule and World & Terminology Baseline take precedence.
