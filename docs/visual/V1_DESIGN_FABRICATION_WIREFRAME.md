# V-1 — Design / Fabrication Information Architecture & Wireframe

Status: Figma Make pass reviewed / focused revision required

Target: Design / Fabrication screen

Rule change: none

Primary gate: G4 UI Comprehension

Secondary gate: G5 World & Terminology

## Objective

パーツを変更した瞬間に、プレイヤーが次の3点を説明できる状態を作る。

1. 何が伸びたか。
2. 何を失ったか。
3. どの異常区域へ向く機体になったか。

本段階では色、質感、装飾イラストを決定しない。既存ロジックとルールを変更せず、情報の順序、比較方法、操作の流れだけを固定する。

## Decision flow

```text
1. TARGET ZONEを選ぶ
   ↓
2. FRAME / REACTOR / CONTROL SIGILを選ぶ
   ↓  each selection updates immediately
3. STAT DELTAとTRAIT CAUSEを読む
   ↓
4. ZONE FITと予測損傷を判断する
   ↓
5. COST / STOCKを確認する
   ↓
6. DESIGN CHARACTERISTICSから用途をプレイヤー自身が言語化する
   ↓
7. FABRICATION REVIEWを開き、製造する
```

区域を先に置くのは、パーツ選択を素材一覧の閲覧ではなく「目的に対する設計判断」にするためである。区域未選択状態も許容するが、初期値は現在の最初の派遣先を使用する。

## Information hierarchy

### Tier 1 — Persistent decision context

- Target Zone
- Current stock summary
- Remaining ACTION
- Unit slots, displayed as `UNIT SLOTS 2 / 3`

スクロールや選択変更の間も、何のために設計しているかを見失わない位置へ置く。

### Tier 2 — Primary inputs

- `FRAME` (`BODY` internal ID)
- `REACTOR` (`CORE` internal ID)
- `CONTROL SIGIL` (`RUNE` internal ID)

各選択肢には名称、在庫、主要能力寄与を表示する。説明文は選択後の詳細へ寄せ、一覧内で判断を阻害しない。

### Tier 3 — Immediate consequences

- Last changed part and transition, for example `FRAME: Iron → Stone`
- Four current stats
- Delta from the previously selected part
- Active traits
- Trait cause: which combination produced each trait
- Exact predicted damage and deployment status for the target zone

差分は選択操作の直後にのみ強調し、能力の絶対値と混同させない。増加だけでなく低下と消失特性も同じ重要度で示す。

### Tier 4 — Fabrication readiness

- Cost per selected part
- Owned stock and post-fabrication stock
- Missing material
- ACTION cost
- Unit-slot availability

製造不能理由はボタンの近くで一つの具体的な文として表示する。

### Tier 5 — Result identity

- Unit silhouette or structural diagram
- Generated unit name
- Selected assembly
- Design characteristics without an automatically assigned role
- Final fabrication review

シルエットは装飾ではなく、FRAME、REACTOR、CONTROL SIGILの選択がどこへ反映されたかを示す構造図として扱う。

## Desktop wireframe

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ DESIGN / FABRICATION       TARGET ZONE [Abandoned Mine ▼]   ACTION 2 / 3    │
│ Objective: access requirement, recommended stats, exact predicted damage    │
├──────────────────────────────────────────┬───────────────────────────────────┤
│ ASSEMBLY INPUTS                          │ UNIT SUMMARY                      │
│                                          │                                   │
│ 1 FRAME                                  │       [STRUCTURAL DIAGRAM]        │
│ [Stone] [Iron] [Wood] [Clay]             │    frame / reactor / sigil        │
│ selected contribution + stock            │                                   │
│                                          │ CHANGED: FRAME Iron → Stone       │
│ 2 REACTOR                                │                                   │
│ [Fire] [Wind] [Water] [Earth]            │ POWER      8   +1                 │
│ selected contribution + stock            │ ARMOR      7    —                 │
│                                          │ MOBILITY   5   -1                 │
│ 3 CONTROL SIGIL                          │ WORK       6   +2                 │
│ [Attack] [Defense] [Speed] [Capacity]    │                                   │
│ selected contribution + stock            │ TRAITS: Heat Proof                 │
│                                          │ Cause: Stone Frame + Fire Reactor │
│ COST / STOCK                             │ LOST: Poison Proof                │
│                                          │ Previous: Iron + Defense          │
│ FRAME 1/2  REACTOR 1/1  SIGIL 1/3       │                                   │
│ post-fabrication stock shown inline      │ ABANDONED MINE                    │
│                                          │ ACCESS ✓  ENVIRONMENT △           │
│                                          │ PWR ✓ ARM ✓ MOB ! WORK ✓          │
│                                          │ PREDICTED DAMAGE 43%              │
│                                          │ [OPEN FABRICATION REVIEW]         │
└──────────────────────────────────────────┴───────────────────────────────────┘
```

Desktopでは左を入力、右を結果に固定する。右側には編集可能な要素を置かない。視線は左上から下へ選択し、右上から下へ結果を確認する。能力、特性、区域適合、製造確認を別画面へ分散しない。

## Mobile wireframe

```text
┌──────────────────────────────┐
│ TARGET ZONE [Mine ▼]         │
│ access / danger / prediction │
├──────────────────────────────┤
│ [UNIT STRUCTURE — compact]   │
│ PWR 8 ARM 7 MOB 5 WORK 6    │
│ delta source + trait summary │
├──────────────────────────────┤
│ 1 FRAME                      │
│ horizontally wrapping choices│
│ 2 REACTOR                    │
│ 3 CONTROL SIGIL              │
├──────────────────────────────┤
│ ZONE FIT / COST / STOCK      │
│ [OPEN FABRICATION REVIEW]    │
└──────────────────────────────┘
```

Mobileでは結果サマリーを入力より先に置き、選択変更後の反応をスクロール移動なしで確認できるようにする。詳細な特性理由とコストは選択欄の後で再掲する。

## Interaction rules

- パーツ選択は即時反映し、適用ボタンを要求しない。
- Default starter selectionでは`CHANGED`とDeltaを表示しない。最初のユーザー変更後から、直前構成との差分を表示する。
- Deltaの直前に、変更種別と遷移（例: `FRAME: Iron → Stone`）を表示する。
- 直前選択との差分を4能力すべてに表示する。
- 特性には名称だけでなく発現原因を表示する。
- 消失した特性も選択直後に明示する。
- Zone Fitは単一総合スコアを主表示にしない。アクセス、環境耐性、4能力の充足、予測損傷を分解して表示する。
- 必要な場合のみ、分解表示の後へ `VIABLE / HIGH RISK` のような小さな派遣状態を置ける。
- 予測損傷はP0の共通評価関数による確定値を使用する。
- ゲーム側は `MINING SPECIALIST` のような用途を断定しない。高装甲、耐熱、低機動など、用途判断の根拠となるDesign Characteristicsだけを表示する。
- Fabrication Reviewを開くまで資材とACTIONを消費しない。
- 最終確認には選択部品、能力、特性、区域適合、消費後在庫を表示する。
- ランダム選択は主要判断フローから外し、低優先度の補助操作とする。
- Mobileの能力略称は初回検証では `PWR / ARM / MOB / WORK` とする。`P / A / M / W` への短縮はV-1Eで理解が確認されるまで採用しない。
- 保有機体枠は常に `UNIT SLOTS current / max` と表示する。満杯時は `UNIT SLOTS 3 / 3 — NO FREE SLOT` とし、製造不能理由へ同じ文言を接続する。

## Required states

- Default starter selection
- Part changed with positive and negative deltas
- Trait gained
- Trait lost
- Access blocked
- High predicted damage
- Insufficient material
- No free unit slot
- No ACTION remaining
- Fabrication review ready
- Fabrication completed
- Rapid consecutive part changes

連続変更状態では、Deltaが常に直前比較であること、特性の獲得・消失が残留しないこと、予測損傷とCost / Stockが最新構成だけを表すことを確認する。

## V-1E human validation

テスターには操作方法を先に説明せず、設計完了時に次を尋ねる。

1. なぜそのFRAME / REACTOR / CONTROL SIGILを選びましたか。
2. 直前の構成から何が良くなり、何が悪くなりましたか。
3. この機体をどの区域へ派遣したいですか。なぜですか。
4. 発現特性は、どの組み合わせが原因だと思いますか。
5. 製造すると何を消費し、在庫はいくつ残りますか。

各回答を `OBSERVED / NOT OBSERVED / AMBIGUOUS` で記録する。見栄えの好みではなく、選択理由と用途を説明できるかをV-1の合否判断に使う。

### Observation criteria

| Question | `OBSERVED` condition |
|---|---|
| Q1 Part reason | 3部品中2つ以上について、能力・特性・区域との関係を説明できる |
| Q2 Trade-off | 改善を1つ以上、悪化を1つ以上、正しく説明できる |
| Q3 Zone purpose | 区域名と適性理由を1つ以上説明できる |
| Q4 Trait cause | 発現原因となる正しい構成要素を特定できる |
| Q5 Fabrication cost | 消費物と製造後在庫を正しく説明できる |

### V-1 PASS candidate

```text
Q1 OBSERVED
Q2 OBSERVED
Q3 OBSERVED
Q4 OBSERVED
Q5 OBSERVED

critical misunderstanding = 0
```

現行の未完成Figma Make版へ追加人間テストは要求しない。下記の実装差分を直し、Fabrication、Gravity Depth、Blueprintが一つの製品導線としてまとまった後に一回の通しプレイで確認する。

## Progression after this baseline

```text
V-1 INFORMATION ARCHITECTURE
→ focused Figma Make revision
→ product UI implementation / integration
→ integrated required-state review
→ one end-to-end comprehension play
→ PASS / FIX
→ World Skin / visual language
```

## Readiness assessment

```text
Objective definition        PASS
Decision flow               PASS
Information hierarchy       PASS
Desktop structure           PASS
Mobile structure            PASS
Immediate feedback model    PASS
Trade-off visibility        PASS
Trait causality             PASS
Zone-fit decomposition      PASS
Fabrication readiness       PASS
Human validation design     PASS

Rule changes                NONE
World Skin                  HOLD

STATUS
VISUAL DIRECTION PASS
STRUCTURE STRONG PASS
FOCUSED REVISION REQUIRED
```

## Reviewed Figma Make pass — required revision

現在の左右分割、構造図、視覚方向、部品選択の可読性は維持する。レイアウトの作り直しは行わない。

### A1 — Last change and stat delta

右側STAT READOUTの直前へ、最後に変更した部品と遷移を表示する。

```text
LAST CHANGE
FRAME: STONE → IRON

POWER       15   -2
ARMOR        8   +2
MOBILITY     6   +1
WORK         4   -1
```

- 4能力すべてに直前構成との差分を表示する。
- 正負の差分へ同じ視覚重量を与える。
- 初期表示ではDeltaを出さない。
- 連続変更時は常に直前選択との差分へ更新する。

### A2 — Zone Fit causality

総損傷と状態だけでは完了としない。既知条件と損傷源を分解する。

```text
ACCESS                 PASS
ENVIRONMENT / GRAVITY  WARNING

POWER       15 / 8     PASS
ARMOR        8 / 6     PASS
MOBILITY     6 / 8     LOW
WORK         4 / 9     LOW

DAMAGE SOURCES
GRAVITY LOAD           +12
MOBILITY DEFICIT        +8

PREDICTED DAMAGE        20%
MAJOR CONTRIBUTOR      GRAVITY LOAD
```

- 表示値は対象区域の共通評価関数から取得する。
- `MAJOR CONTRIBUTOR` は最大寄与の説明であり、推奨改善箇所ではない。
- 損傷しない不足条件を、損傷源として偽って表示しない。
- 複数経路がある場合は選択中経路の評価であることを明示する。

### A3 — Canonical unit slots

完成機上限は正本どおり3体とする。

```text
UNIT SLOTS 1 / 3
```

`1 / 4`を表示しない。BLUEPRINT枠は完成機枠とは別に `BLUEPRINTS current / 10` と表現する。RESERVE / ACTIVE ROSTERを暗示しない。

### B1 — Part-card hierarchy

カードの情報優先順位を次にする。

```text
IRON                         STOCK 2
ARMOR +8   MOBILITY +3
Riveted plate assembly
```

- 名称、在庫、主要能力寄与を第一階層にする。
- 説明文は弱い色・小さい階層へ下げる。
- 選択状態でも負の寄与を隠さない。

### B2 — Fabrication cost and readiness

最下部の一行要約を廃止し、Reviewボタンの直前へ移す。

```text
FABRICATION COST

FRAME          1 / 2 → 1
REACTOR        1 / 2 → 1
CONTROL SIGIL  1 / 3 → 2
ACTION         1
UNIT SLOT      1 / 3

FABRICATION READY
[ OPEN FABRICATION REVIEW ]
```

- `6 ACTION`のように総在庫や別数値を製造ACTIONと誤読させない。
- 現在在庫、消費量、製造後在庫を同じ行で示す。
- 製造不能理由はボタンの直前へ一文で表示する。

### B3 — Trait cause change

```text
HEAT CORE
CAUSE
FIRE REACTOR
GAINED BY CURRENT CHANGE
```

消失時は次を短時間表示する。

```text
LOST
FORGE-TEMPERED
PREVIOUS CAUSE: STONE FRAME + FIRE REACTOR
```

### Terminology and data synchronization

- `OFFENSE`ではなく正本表示の`ATTACK`へ統一する。
- Prototype Materialは実験正本の名称だけを使用する。
  - `LOW-MASS COMPOSITE`
  - `DENSE FERROUS MATERIAL`
  - `GRAVITY-SHIFT CRYSTAL`
- `GRAVITY BRACE`を正式実装候補へ使用しない。
- 未回収素材は`UNCLASSIFIED MATERIAL`とし、名前、効果、比較値を開示しない。

### Focused revision acceptance

```text
LAST CHANGE + 4 STAT DELTAS       REQUIRED
ZONE FIT DAMAGE SOURCES           REQUIRED
UNIT SLOTS current / 3            REQUIRED
FABRICATION COST NEAR REVIEW      REQUIRED
CANONICAL PART / MATERIAL NAMES   REQUIRED

LAYOUT REBUILD                    NOT REQUIRED
WORLD SKIN EXPANSION              HOLD
ADDITIONAL STANDALONE PLAYTEST    STOP
```

## Out of scope

- Game-rule or balance changes
- New stats, traits, parts, zones, or fabrication variance
- Three-tier maintenance
- World Skin, final colors, textures, animation, and final illustration
- P1 bad-luck protection and P2 naming implementation
