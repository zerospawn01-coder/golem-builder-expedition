# GOLEM BUILDER — Workshop Reasoning Support Model

```text
STATUS          FUTURE DESIGN STANDARD CANDIDATE
PURPOSE         EXTERNALIZE PLAYER REASONING
SYSTEM ROLE     SEARCH / COMPARE / RECORD OBSERVED CAUSALITY
PLAYER ROLE     FORM HYPOTHESIS / CHOOSE BUILD / JUDGE RESULT
```

## 1. 設計判断

実験工廠は単なる装備選択画面ではなく、観測結果を整理して次の設計仮説を立てる場所とする。

```text
OBSERVE
区域条件と損傷源を確認
    ↓
SEARCH
自分の仮説に関係する部品を探す
    ↓
COMPARE
複数の設計案で得失を比較する
    ↓
HYPOTHESIZE
自分の計画を記録する
    ↓
TEST
UNITを製造・派遣する
    ↓
REVIEW
予測と結果を設計ノートへ残す
```

システムは情報の探索、並置、記録を支援する。最適解の計算、推奨、選択代行は行わない。

## 2. Foundry Controlとの境界

本モデルは [`FOUNDRY_CONTROL_SUPPORT_MODEL.md`](FOUNDRY_CONTROL_SUPPORT_MODEL.md) の原則に従う。

> 原因は示す。解決策はプレイヤーに考えさせる。

### システムが行うこと

- プレイヤーが指定した条件で部品を絞り込む。
- ピン留めした2〜3案を同じ評価条件で比較する。
- 観測済みの区域、ハザード、効果、損傷源を因果表示する。
- 派遣の入力、予測、選択、結果を設計ノートへ転記する。
- プレイヤー自身が書いた仮説とタグを保存する。

### システムが行わないこと

```text
AUTO BUILD
BEST BUILD
RECOMMENDED PARTS
OPTIMAL ROUTE
EXPECTED BEST CHOICE
AUTO HYPOTHESIS
```

- 検索結果を「強さ」「適性」「成功率」で自動順位付けしない。
- 未発見の因果関係を検索語、候補方向、ツールチップから漏らさない。
- 比較結果へ勝者、点数、総合評価を付けない。
- プレイヤーの `MY HYPOTHESIS` を自動生成・補完しない。

## 3. 優先順位

| 優先 | 機能 | 中心価値 |
|---:|---|---|
| 1 | 検索・フィルター | 自分の仮説に合う候補を探す |
| 2 | 複数ビルド比較 | 複数案のトレードオフを見る |
| 3 | 因果グラフ | 観測した問題構造を整理する |
| 4 | 設計ノート | 仮説と試験結果を結び付ける |
| 5 | 発見済み知識ライブラリ | 確認した因果を長期資産にする |

これは実装順の初期候補でもあるが、全機能を一度に導入しない。

## 4. 検索・フィルター

### 4.1 検索対象

- 所有中および発見済みのFRAME / REACTOR / CONTROL SIGIL
- 正式採用済みの置換材、モジュール、特性
- BLUEPRINT機能が存在する場合は保存済みBLUEPRINT

未発見部品は件数にも検索結果にも表示しない。シルエット表示を採用する場合も、能力・特性・入手区域を漏らさない。

### 4.2 フィルター軸

```text
STAT EFFECT
POWER / ARMOR / MOBILITY / WORK

TRAIT
発見済み特性

PHYSICAL PROPERTY
FRAME MASS / MATERIAL CATEGORY

ZONE RELATION
観測済み因果に基づく関係

OWNERSHIP
OWNED / DISCOVERED / CRAFTABLE
```

能力フィルターは、正負の効果を区別できる。

```text
MOBILITY INCREASES
MOBILITY DECREASES
MOBILITY AFFECTED
```

`ZONE RELATION` はシステムが区域への適性を推測する機能ではない。プレイヤーが観測済みの関係を持つ部品だけを、関係の根拠とともに列挙する。

### 4.3 並び順

既定順は安定した図鑑順または名前順とする。次の並び順を禁止する。

- BEST MATCH
- SUCCESS RATE
- RECOMMENDED
- OVERALL POWER
- 対象区域での推定最適度

プレイヤーが明示的に個別能力値で昇順・降順ソートすることは許可する。ただしこれは単一軸の数値整理であり、総合評価ではない。

### 4.4 結果カード

各候補は効果を省略せず、利点と欠点を同じ面積・強度で示す。

```text
LOW-MASS COMPOSITE

MOBILITY   +3
ARMOR      -3
MASS       LIGHT

OBSERVED RELATION
LIGHT MASS → GRAVITY LOAD REDUCED
```

検索条件に一致した部分だけを強調しても、負の効果を隠さない。

## 5. 比較ボード

### 5.1 基本規則

- 比較ピンは最大3案。
- 完成機、製造前候補、保存済みBLUEPRINTを同じボードへ置ける。
- 比較条件は一つのZONE / DEPTH / ROUTE候補へ固定できる。
- ピン留めは製造せず、素材とACTIONを消費しない。
- ピン留め案から製造する場合だけ通常コストを適用する。

### 5.2 表示項目

```text
BUILD A                 BUILD B
FRAME                    FRAME
REACTOR                  REACTOR
CONTROL SIGIL            CONTROL SIGIL

POWER       9            5       -4
ARMOR      10            7       -3
MOBILITY    5            9       +4
WORK        6           10       +4

DAMAGE SOURCES           DAMAGE SOURCES
GRAVITY LOAD +18         GRAVITY LOAD +6
WEAR          +4         WEAR         +7

ROUTE REQUIREMENTS
POWER       PASS         FAIL
WORK        FAIL         PASS
```

差分は基準案に対する符号付き数値で示す。色だけに依存せず、`+ / -`、名称、値を併記する。

### 5.3 禁止する集約

- 総合スコア
- 星評価
- 勝者表示
- 自動選択
- 「この区域に最適」バッジ
- 複数損傷源を単一の安全度へ隠す表示

`ACCEPTABLE / WARNING / CRITICAL` は個別評価結果の状態表示として利用できるが、ビルド案の順位には使わない。

### 5.4 経路表示

複数経路がある場合、各案がどの要求を満たすかを並列表示する。システムは最小損傷経路を自動採用しない。

```text
POWER ROUTE   REQUIREMENT PASS   PREDICTED DAMAGE 29
WORK ROUTE    REQUIREMENT FAIL   PREDICTED DAMAGE —
```

経路が選択可能なら、プレイヤーが比較条件として明示選択する。

## 6. 因果グラフ

### 6.1 表示範囲

自由描画式マインドマップではなく、観測記録から半自動生成する。

```text
ZONE
  → HAZARD
    → EFFECT
      → CURRENT DEFICIT / DAMAGE SOURCE
        → MY PLAN
```

システムが生成するのは `ZONE → HAZARD → EFFECT → CURRENT DEFICIT` までとする。`MY PLAN` はプレイヤー入力だけで作る。

### 6.2 ノード例

```text
ANOMALOUS ZONE G-01
  → MASS DISTORTION
    → GRAVITY LOAD
      → HEAVY FRAME +18
      → MOBILITY DEFICIT +12
      → NO OBSERVED CONTROL EFFECT
        → MY PLAN: __________________
```

### 6.3 開示規則

- 区域に到達して観測したハザードだけを表示する。
- 数値は実際に予測または結果画面で開示済みのものだけを表示する。
- 未発見の軽減特性や部品を「欠如」として表示しない。
- `NO OBSERVED CONTROL EFFECT` は、該当因果自体が観測済みの場合に限る。
- システムは「軽量化」「制御で相殺」などの設計方向ノードを自動生成しない。

## 7. 設計ノート

### 7.1 レコード構造

```ts
interface FoundryNote {
  id: string;
  createdAt: number;
  target?: {
    zoneId: string;
    depth?: number;
    route?: string;
  };
  observedFactIds: string[];
  hypothesis: string;
  pinnedBuildIds: string[];
  testUnitId?: string;
  expeditionReportId?: string;
  resultSummary?: {
    reachedDepth?: number;
    route?: string;
    totalDamage?: number;
    recoveredCargoWeight?: number;
    status?: string;
  };
  playerConclusion: string;
  tags: string[];
}
```

### 7.2 自動転記と手入力

| 項目 | 入力元 |
|---|---|
| TARGET | 現在選択中の区域・深度、プレイヤーが変更可能 |
| OBSERVED | ピン留めした観測済み事実 |
| MY HYPOTHESIS | プレイヤーだけが入力 |
| TEST UNIT | 製造・派遣時に関連付け、変更可能 |
| RESULT | 遠征報告から自動転記 |
| MY CONCLUSION | プレイヤーだけが入力 |

自由入力は任意とし、遠征や製造をブロックしない。空欄でも保存できる。

### 7.3 ノートの役割

- 正解判定をしない。
- 仮説と結果の矛盾を自動修正しない。
- 結論を生成しない。
- 同じ対象の過去ノートを時系列で参照できる。
- BLUEPRINTが存在する場合は、ノートから設計記録へリンクできる。

## 8. 発見済み知識ライブラリ

### 8.1 保存対象

通常のアイテム図鑑ではなく、プレイヤーが確認した因果関係を保存する。

```ts
interface DiscoveredRelationship {
  id: string;
  subjectId: string;
  relation: string;
  objectId: string;
  numericEffect?: number;
  firstObservedAt: number;
  evidenceReportIds: string[];
  confidence: 'OBSERVED' | 'REPEATED';
}
```

例：

```text
HEAVY FRAME
→ GRAVITY LOAD INCREASES

HIGH WORK
→ CARGO CAPACITY INCREASES

NIGHT VISION
→ DARKNESS PENALTY REMOVED
```

### 8.2 発見条件

関係は次のいずれかで登録する。

- 予測画面で因果と寄与量が正式に開示された。
- 帰還報告で因果が観測された。
- 製造結果で部品と能力変化を確認した。

単に部品を所有しただけでは、未観測の区域効果を登録しない。

### 8.3 知識の強度

- 初回確認を `OBSERVED` とする。
- 別の派遣または構成でも同じ関係を確認すると `REPEATED` にできる。
- 強度は報酬や能力補正を与えない。
- 不確実性システムや確率推論はV0へ含めない。

## 9. Blueprint Libraryとの関係

[`UNIT_CAPACITY_MODEL.md`](UNIT_CAPACITY_MODEL.md) のBLUEPRINTは「設計構成」、Foundry Noteは「設計理由と試験記録」、Knowledge Libraryは「観測済み因果」を保存する。

| 資産 | 保存するもの | 保存しないもの |
|---|---|---|
| BLUEPRINT | 部品構成 | なぜ作ったか、試験結果 |
| FOUNDRY NOTE | 仮説、対象、UNIT、結果、結論 | 完成機や素材 |
| KNOWLEDGE | 観測済みの因果関係 | プレイヤー個人の計画 |

三者を同じ「お気に入り」機能へ統合しない。相互リンクは許可する。

## 10. 保存とスコープ

- 検索条件はセッション中保持し、明示的に解除できる。
- 比較ピンは画面遷移後も保持するが、新しいランへ自動継承しない。
- 設計ノートと発見済み知識はラン内資産として保存する。
- 周回をまたぐ知識継承は、周回システムの仕様が確定するまで決めない。
- 実験フラグの記録は正本セーブへ混在させない。

## 11. 段階実装

### W0 — FILTER + COMPARE

```text
検索・フィルター
比較ピン最大3
能力差分
観測済み損傷源の比較
```

目的は、候補探索とトレードオフ比較が設計理由を明確にするかを見ること。

### W1 — CAUSAL VIEW

```text
ZONE → HAZARD → EFFECT → DEFICIT
MY PLAN自由入力
```

目的は、複数損傷源を単一原因や推奨解へ潰さず整理できるかを見ること。

### W2 — FOUNDRY NOTES

仮説、ピン留め案、試験UNIT、結果を一つの記録へ関連付ける。

### W3 — KNOWLEDGE LIBRARY

複数ノートや遠征結果から発見済み因果を検索可能にする。

## 12. GRAVITY_DEPTH_V0での最小適用

`GRAVITY_DEPTH_V0` の中心仮説を増やさないため、正式なW0〜W3を同時実装しない。

V0で許可する最小支援は次とする。

1. 出撃前に現在UNITと最大2つの一時候補を比較できる。
2. 比較対象は能力、FRAME質量、`gravity_control`、既知深度の損傷源に限定する。
3. 比較ピンは実験セッション内だけ保持する。
4. `BEST / RECOMMENDED / OPTIMAL` を表示しない。
5. 帰還後、自由入力1欄 `MY NEXT HYPOTHESIS` を任意表示する。
6. 検索、永続ノート、知識ライブラリはV0後の独立検証とする。

この最小比較UI自体がCONTINUE / RETURN判断へ強く影響する場合は、支援あり／なしを分けて観察し、深度設計の効果とUI理解の効果を混同しない。

## 13. 成功条件

| ID | PASS条件 |
|---|---|
| WR-1 | プレイヤーが検索条件を自分の仮説から選ぶ |
| WR-2 | 比較後に、得た能力と失った能力の両方を説明できる |
| WR-3 | 比較ボードが特定案を正解として提示したと感じない |
| WR-4 | 因果グラフから損傷源を理解し、自分の計画を書ける |
| WR-5 | ノートを見て過去の仮説と結果を再説明できる |
| WR-6 | 発見済み知識が別設計の着想につながる |
| WR-7 | 設計支援の操作時間が製造・派遣判断を上回らない |

## 14. 失敗兆候

- プレイヤーが毎回同じフィルターを機械的に適用する。
- 数値最大順の検索結果をそのまま選ぶ。
- 比較ボードが事実上の勝者を色や配置で示す。
- ノート入力が遠征前の必須事務作業になる。
- 因果グラフが未発見の解決策を漏らす。
- 知識登録の通知が多く、結果理解を中断する。
- 支援UIの整理自体が目的になり、UNITを試す回数が減る。

これらが観測された場合、機能を追加せず、表示量、永続性、入力必須性を減らす。

## 15. 現時点の推奨

最初の正式候補は `W0 — FILTER + COMPARE` とする。ただし `GRAVITY_DEPTH_V0` では深度仮説の検証を優先し、一時的な最大3案比較と `MY NEXT HYPOTHESIS` だけを使用する。

設計ノートと知識ライブラリは、プレイヤーが実際に外部メモを使う、過去の設計理由を忘れる、同一区域で仮説検証を繰り返す、といった行動が観測された後に昇格させる。
