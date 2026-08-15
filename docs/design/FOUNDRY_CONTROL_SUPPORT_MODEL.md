# GOLEM BUILDER — Foundry Control Support Model

```text
STATUS             DESIGN STANDARD
DIAGNOSTIC RULE    CANONICAL
S1 INSTRUMENTATION APPROVED DIRECTION
S2 RISK WARNING    APPROVED DIRECTION
S3 RECOVERY        NOT IMPLEMENTED / EVIDENCE-GATED
SAFE_SUPPLY_S0     HOLD
```

## 1. 設計判断

GOLEM BUILDERの通常攻略はプレイヤーが行う。`FOUNDRY CONTROL SYSTEM / 工廠管理システム` は攻略者ではなく、状態を観測して原因を示す計器として扱う。

```text
PLAYER
区域を読む → 設計する → 派遣する → 撤退を判断する

FOUNDRY CONTROL SYSTEM
状態を計測する → 危険を警告する → 不足原因を表示する
```

完全停止が実プレイで観測された場合に限り、進行素材を与えない最低限の復帰手段を独立候補として検討する。

## 2. 権限境界

### 実行してよいこと

- 現在の耐久、素材、ACTION、稼働可能UNIT数を表示する。
- 派遣条件に対する不足能力、欠落特性、予測損傷源を表示する。
- 現在の操作を続けた場合に起こり得る損失を警告する。
- 完全停止条件を検出し、ラン状態を説明する。
- 復帰プロトコルが正式採用された場合、その利用可能条件と結果を提示する。

### 実行してはいけないこと

- 最適ビルド、最適経路、最適撤退時点を断定する。
- 特定のFRAME / REACTOR / CONTROL SIGILを推奨する。
- パーツ、経路、貨物、修復対象を自動選択する。
- 希少素材、進行キー、特殊特性を無料で与える。
- 派遣結果を成功へ補正する。
- プレイヤー確認なしで解体、復旧、リセットを行う。

原則は次の一文に固定する。

> 原因は示す。解決策はプレイヤーに考えさせる。

## 3. サポートレベル

機能を三段階に分け、同時に実装しない。

### S1 — INSTRUMENTATION / 計器

現在の正本が目指す基本レベル。常時利用可能で、ルール上すでに確定している情報だけを表示する。

```text
ACTIVE UNIT          1 OPERATIONAL / 2 DAMAGED
FERROUS MATERIAL     LOW
PREDICTED DAMAGE     HIGH
DAMAGE SOURCES
  ARMOR DEFICIT      +12
  STRUCTURAL WEAR    +4
MAJOR CONTRIBUTOR    ARMOR DEFICIT
```

S1は救済システムではない。資材やUNIT状態を変更しない。

### S2 — RISK WARNING / 危険警告

重大な操作の直前に、結果と原因を再提示する。

候補トリガー：

- 予測損傷が現在耐久以上である。
- 帰還せずCONTINUEすると大破予測になる。
- 最後の修復資材を消費し、その結果として別の損傷UNITの修復など重要な合法操作が失われる可能性がある。
- 最後の稼働可能UNITを高危険度区域へ派遣する。
- 解体後に稼働可能UNITが0体になる。

単に在庫数が1から0になるだけではS2を発火しない。在庫ゼロはS1で表示し、その消費によって具体的な合法操作が失われる場合だけ、失われる操作を `CONSEQUENCE` として警告する。

```text
FERROUS MATERIAL     1 → 0

CONSEQUENCE
NO REMAINING REPAIR MATERIAL FOR 2 DAMAGED UNITS
```

警告は操作を禁止しない。確認後はプレイヤーが続行できる。

```text
WARNING

PREDICTED STRUCTURAL LOSS: CRITICAL
DAMAGE SOURCES
  GRAVITY LOAD      +18
  MOBILITY DEFICIT  +12
MAJOR CONTRIBUTOR   GRAVITY LOAD

[ CANCEL ] [ PROCEED ]
```

同じ警告を一つの操作で重複表示しない。

### S3 — RECOVERY PROTOCOL / 復帰プロトコル

未実装。完全停止が人間プレイで繰り返し観測され、通常操作で復旧不能な場合だけ試作する。

S3は攻略を容易にする機能ではなく、ランを再びプレイヤー判断可能な状態へ戻す最後の安全網である。

## 4. 診断表示の情報境界

### 表示してよい情報

- `POWER 6 / RECOMMENDED 9`
- `DARK ENVIRONMENT DETECTED`
- `REQUIRED TRAIT MISSING`
- `PREDICTED DAMAGE 32`
- `DAMAGE SOURCES: MOBILITY DEFICIT +18 / STRUCTURAL WEAR +4`
- `MAJOR CONTRIBUTOR: MOBILITY DEFICIT`
- `CARGO CAPACITY 8 / DISCOVERED WEIGHT 11`

### 表示してはいけない情報

- `IRON FRAMEを製造してください`
- `WATER REACTORが最適です`
- `このBLUEPRINTなら成功します`
- `WORK経路を選ぶべきです`
- `DEPTH 3でRETURNしてください`

複数の攻略経路がある場合、各経路の要求と予測結果は並列表示してよい。ただしシステムが自動で「BEST」や「RECOMMENDED」を付けない。

損傷原因は単一原因へ要約せず、評価関数が返す全寄与量を `DAMAGE SOURCES` として表示する。最大寄与項目は `MAJOR CONTRIBUTOR` と呼べるが、それだけを直せば安全になるとは表示しない。同値最大が複数ある場合はすべてを `MAJOR CONTRIBUTORS` として並記する。

## 5. 警告生成契約

警告はUI固有の推測で生成せず、予測と実測で共有する評価結果から導出する。

```ts
interface FoundryDiagnostic {
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  code: string;
  subjectId: string;
  observedValue?: number | string;
  threshold?: number | string;
  damageSources?: Array<{
    code: string;
    label: string;
    amount: number;
  }>;
  majorContributorCodes?: string[];
  cause?: string;
  consequence: string;
  allowedActions: string[];
}
```

- `damageSources` は寄与量の降順ではなく、評価処理上の安定した表示順で全項目を返す。0の項目は通常表示しない。
- `majorContributorCodes` は最大寄与量と同値の項目をすべて含む。改善策や優先順位を意味しない。
- 損傷量を持たない診断だけが `cause` を使用できる。具体的パーツ名を解決策として含めない。
- `consequence` は予測される損傷、出撃不能、在庫不足など直接の結果だけを表す。
- 閾値はゲームの正本評価関数から取得する。
- ランダム報酬や未知情報を既知として表示しない。
- 同一入力に対する診断結果は決定的である。

## 6. 完全停止の定義候補

復帰プロトコルの検討前に、単なる不利と完全停止を区別する。

```text
PROGRAM SUSPENDED CANDIDATE =
  operational_units == 0
  AND no_legal_repair
  AND no_legal_fabrication
  AND no_legal_disassembly_that_restores_fabrication
  AND no_reachable_zero_risk_recovery_action
```

判定は現在のUNIT、耐久、全素材、ACTION、解体可能性を含む合法操作探索に基づく。ACTIONが0なだけであれば「次の日へ」が可能なため完全停止ではない。

次も完全停止ではない。

- 希少素材をまだ持っていない。
- 希望するビルドを作れない。
- 高難度区域を攻略できない。
- 修復に数日かかる。
- プレイヤーが損失を避けたいだけで、合法操作は残っている。

## 7. ラン停止表示

世界観上の表示は一般的な死亡表現を使わない。

```text
EXPEDITION PROGRAM SUSPENDED

OPERATIONAL UNITS     0
AVAILABLE MATERIALS   INSUFFICIENT
LEGAL RECOVERY        NONE DETECTED
```

完全停止判定後の画面には、次を明示する。

1. 停止した直接原因
2. 評価した復旧可能性
3. 利用可能な復帰プロトコル、またはラン終了
4. 新しいランを開始した場合に失われるもの

`GAME OVER`、`YOU DIED` は使用しない。

## 8. 復帰プロトコル候補

次は採用仕様ではなく、完全停止が観測された場合の最小試作境界である。

```text
FOUNDRY RECOVERY PROTOCOL

INPUT
Damaged workshop equipment / non-inventory fixture

OUTPUT
Basic FRAME material ×1

CANNOT PRODUCE
Rare REACTOR materials
CONTROL SIGILS
Progression materials
Experimental materials
```

候補制約：

- 完全停止判定時だけ1回提示する。
- プレイヤーの明示確認を要求する。
- 直接の成功構成を完成させない。
- 最低限の合法操作を1つ回復させる量だけを与える。
- 希少素材の待ち時間対策、周回報酬、定期配給へ拡張しない。
- 使用記録を残し、人間プレイ評価で「学習を継続できたか」を確認する。

具体的な入力源と出力素材は、実際の停止再現手順が得られるまで固定しない。架空の設備を無限に解体できる循環を作らない。

## 9. SAFE_SUPPLY_S0との境界

`SAFE_SUPPLY_S0` は引き続きHOLDとする。

| 項目 | 診断システム | 復帰プロトコル候補 | SAFE_SUPPLY_S0 |
|---|---|---|---|
| 常時利用 | YES | NO | 想定次第 |
| 状態変更 | NO | YES、最小限 | YES |
| 発動条件 | 危険・不足 | 完全停止のみ | 別設計 |
| 進行素材 | なし | なし | 復活させない |
| 現在の扱い | 原則採用可能 | evidence-gated | HOLD |

警告UIを追加したことを、SAFE_SUPPLY導入の根拠にしない。自動監査で到達可能なsoftlockが見つかったことだけでも復帰プロトコルを実装しない。

## 10. 人間プレイでの導入条件

S3の試作には、次のすべてを要求する。

1. 通常の初見プレイ経路で完全停止が複数回発生する。
2. プレイヤーが原因を理解していても、合法な復旧操作が存在しない。
3. 停止によって設計学習ではなく、同じ序盤の再実行だけが発生する。
4. 最小復帰手段が希少素材や区域攻略を代行しない。
5. ルール複雑性より継続可能になる価値が大きい。

一つでも満たさなければ、S3は実装しない。

## 11. 成功条件

### S1 / S2

| ID | PASS条件 |
|---|---|
| FS-1 | プレイヤーが最大損傷原因を説明できる |
| FS-2 | 警告を見て、自分で複数の改善案を考えられる |
| FS-3 | 特定パーツをシステムから指示されたと感じない |
| FS-4 | 危険を理解したうえで警告を無視する自由がある |
| FS-5 | 予測原因と帰還報告の原因が一致する |

### S3候補

| ID | PASS条件 |
|---|---|
| FR-1 | 完全停止時以外に利用できない |
| FR-2 | 使用後も区域攻略にはプレイヤー設計が必要である |
| FR-3 | 希少素材や進行キーの獲得を代行しない |
| FR-4 | 同じランで設計学習を継続できる |
| FR-5 | 意図的な全損が有利な素材獲得手段にならない |

## 12. 実装順序

```text
F0  既存評価結果から原因コードを生成
F1  出撃前・深度判断・帰還報告で同じ原因を表示
F2  重大操作の確認警告
F3  完全停止の観測と再現記録
F4  必要性が成立した場合だけ復帰プロトコル実験
```

F0〜F2は情報提示の改善であり、正本ルールを変更しない。F3は観測のみ。F4は新メカニクスなので、`MVP_STATUS_AND_PLAYTEST_POLICY.md` の証拠条件を満たした後に別仕様と実験フラグを要求する。

```text
RULE CHANGE
F0–F3   NO
F4      YES / SEPARATE EXPERIMENT REQUIRED
```

## 13. GRAVITY_DEPTH_V0への適用

`GRAVITY_DEPTH_V0` ではS1とS2だけを使用する。

- 次深度の予測損傷、全損傷源の寄与量、最大寄与項目を示す。
- `CONTINUE` が大破予測ならCRITICAL警告を出す。
- POWER / WORK両経路の情報を並列表示し、推奨経路を付けない。
- 実験中の全損に対して復帰素材を追加しない。
- 全損や資材枯渇が再挑戦を阻害した場合、その事実を観測記録へ残す。

これにより、撤退判断を支援しながら、V0の中心仮説である「設計と運用をプレイヤー自身が選ぶ」を維持する。
