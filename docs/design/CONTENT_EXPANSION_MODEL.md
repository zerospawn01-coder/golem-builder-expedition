# GOLEM BUILDER — Content Expansion Model

```text
STATUS            EXPANSION DESIGN STANDARD
CORE FANTASY      DESIGN A MACHINE FOR A DIFFICULT ENVIRONMENT
GROWTH MODEL      NEW DESIGN OPTIONS, NOT NUMERIC REPLACEMENT
FIRST VALIDATION  GRAVITY_DEPTH_V0
```

## 1. 上位原則

GOLEM BUILDERの拡張は、要求値と能力値を交互に上げる数値階段を中心にしない。

```text
避ける成長
要求値 8 → 能力 10 → 要求値 12 → 能力 14

目指す成長
新しい環境問題
→ 複数の設計方針
→ 何を通し、何を捨てるか選ぶ
→ 新素材で別の方針が可能になる
```

プレイヤーへ要求するのは「より強いUNIT」ではなく「対象の問題に合ったUNIT」である。

> 上位コンテンツは数値的に難しいだけでなく、設計上の問いが異ならなければならない。

## 2. 拡張コンテンツの評価基準

新しい区域、素材、任務、ハザードは、少なくとも次の一つを増やす。

- 異なる能力間のトレードオフ
- 同じ障害に対する複数の突破方法
- 生還、回収量、到達深度の優先順位差
- UNIT間の役割差
- 過去に得た素材や知識の新しい用途
- 運用中の撤退・経路・貨物判断

要求値だけを引き上げる追加は、既存区域と異なるプレイヤー判断を生む根拠がない限り採用しない。

## 3. 区域設計契約

一つの上位区域には、原則として2〜4個の異なる圧力を置く。すべてを同じ能力で解決できないようにする。

```text
ZONE T-05 / THERMAL ANOMALY

HIGH TEMPERATURE
→ THERMAL対策

SOFT GROUND
→ HEAVY FRAMEへ追加負荷

RARE DEPOSIT
→ WORKで回収量変化

LONG TRANSIT
→ MOBILITY不足で追加損傷
```

### 必須条件

1. 圧力のうち少なくとも2つが異なる設計軸を参照する。
2. 一つの能力を上げると、別の圧力または報酬効率で代償が生じる。
3. すべての圧力を完全無効化する単一構成を前提にしない。
4. 損傷原因は [`FOUNDRY_CONTROL_SUPPORT_MODEL.md`](FOUNDRY_CONTROL_SUPPORT_MODEL.md) に従い寄与量で表示できる。
5. プレイヤーが区域情報から複数の設計仮説を立てられる。

### 警戒する兆候

- 4能力すべての要求値が一様に高い。
- 最終的に総能力値が最大の構成だけが通る。
- 特定特性の有無だけで出撃可否と成功が決まる。
- 推奨構成をUIで示さないと攻略方法を理解できない。
- 新区域が既存区域の色違いと報酬増加に留まる。

## 4. 複数攻略方法

同じ深度または障害に複数の経路を用意できる。

```text
COLLAPSED STRUCTURE

POWER ROUTE
短時間で破砕
損傷高め / 時間・作業負荷低め

WORK ROUTE
迂回路を施工
複数能力を要求 / 損傷を抑えやすい

CONTROL ROUTE
異常現象を相殺
特殊特性を要求 / 通常能力は高くなくてよい
```

- システムは全経路の既知条件と予測結果を並列表示する。
- `BEST / RECOMMENDED / OPTIMAL` を付けない。
- 最良経路を自動採用せず、プレイヤーが明示選択する。
- 各経路は損傷だけでなく、報酬傾向、貨物負荷、次深度情報のいずれかでも差を持てる。
- 経路数を増やすこと自体を目的にせず、一つの明確なトレードオフがない経路は追加しない。

## 5. 素材設計契約

新素材は既存素材の数値的な上位互換にしない。

```text
禁止例
IRON          ARMOR +5 / MOBILITY -2
BLACK IRON    ARMOR +8 / MOBILITY -2

採用候補
BLACK IRON       ARMOR +7 / POWER +2 / WORK -3
AETHER CERAMIC   ARMOR +4 / THERMAL EFFECT / LIGHT
POROUS MINERAL   WORK +4 / ARMOR -2 / DEPOSIT RELATION
```

### 素材追加条件

新素材は次のうち2つ以上を満たす。

1. 既存構成では難しかった設計方針を可能にする。
2. 明確な負の補正または機会費用を持つ。
3. 特定環境との因果関係を持つ。
4. 生還、回収、到達、経路の優先順位を変える。
5. 既存素材が有利な状況を残す。

総能力値が高いことは追加理由にしない。素材価値は「作れる設計の種類」で評価する。

## 6. 目的別任務

既存の派遣ルールを再利用しながら、成功の意味を変える。

| 任務 | 主目的 | 既存能力の意味を変える要素 |
|---|---|---|
| COLLECTION / 採集 | 希少素材を最大量回収 | WORK、貨物選択 |
| SURVEY / 調査 | 深部到達と観測データ取得 | MOBILITY、特殊特性 |
| RECOVERY / 回収 | 破損した旧式UNITを持ち帰る | 帰路で固定貨物負荷が追加 |
| INSTALLATION / 設置 | 観測装置を指定地点へ運ぶ | 出発時からWORK容量を占有 |
| BREACH / 突破 | 障害の向こうへ到達 | POWER、ARMOR、経路選択 |

### 共通規則

- 任務ごとに新しい基本通貨や操作モードを作らない。
- 既存の能力、損傷、貨物、深度、経路を組み替えて目的差を作る。
- 成功条件を出撃前に明示する。
- 任務失敗とUNIT大破を同義にしない。
- 任務目的を達成しても、安全に帰還するか追加回収を狙うかの判断を残せる。

目的別任務は `GRAVITY_DEPTH_V0` の合否へ含めず、深度と撤退判断が成立した後の独立実験とする。

## 7. 遠征深度

遠征深度は、現在の即時解決方式を維持したまま運用判断を追加する第一候補である。

```text
DEPTH RESULT
→ CURRENT CONDITION
→ UNSECURED CARGO
→ NEXT DEPTH DAMAGE SOURCES
→ RETURN / CONTINUE
```

### 深度ごとの役割

- DEPTH 1: 進入と基本ルールの確認
- DEPTH 2: 区域固有圧力を明示
- DEPTH 3: 複数経路または目的差を提示
- DEPTH 4: 特殊素材と高い帰還リスク

深度は単なる難易度1〜4ではない。各段階で異なる設計判断または運用判断を一つ以上追加する。

最初の実装仕様は [`GRAVITY_DEPTH_V0_SPEC.md`](../experiments/GRAVITY_DEPTH_V0_SPEC.md) を正本とする。

## 8. UNIT間の役割分担

一体ですべてを解決させず、複数回の派遣で区域理解と攻略状態を進められる。

```text
SCOUT
高速UNITで区域を調査
→ 経路・ハザード情報を発見

EXTRACTOR
WORK型UNITで採掘
→ 特殊素材を回収

HEAVY UNIT
突破型UNITで深部へ進む
→ 次区画を開放
```

### 境界

- 同時派遣を必須にしない。
- バックグラウンド収集を追加しない。
- 各派遣はプレイヤーがUNIT、経路、撤退を選択する。
- 役割名をクラスとして固定せず、構成と目的から自然に生じさせる。
- `SCOUT BONUS` のような抽象補正より、MOBILITYによる到達、WORKによる回収など既存ルールで表現する。

専用機需要が完成機3体上限に阻害された場合は [`UNIT_CAPACITY_MODEL.md`](UNIT_CAPACITY_MODEL.md) に従い、まずBLUEPRINTだけを検証する。

## 9. 区域状態の持続

順次派遣に意味を持たせる場合、区域側へ観測済み状態を保存できる。

```ts
interface ZoneProgress {
  zoneId: string;
  observedHazardIds: string[];
  discoveredRouteIds: string[];
  installedDeviceIds: string[];
  recoveredTargetIds: string[];
  deepestReached: number;
}
```

- 状態変化は派遣結果に直接対応させる。
- 永続効果を得るための反復回数を隠さない。
- 同じ派遣の単純反復だけで区域が自動攻略されない。
- 観測済み因果は [`WORKSHOP_REASONING_SUPPORT_MODEL.md`](WORKSHOP_REASONING_SUPPORT_MODEL.md) の知識ライブラリ候補と接続できる。

この状態モデルはV0へ含めない。V0では一回の深度進行だけを検証する。

## 10. 曝露と構造変質

区域運用履歴をUNIT設計の一部にする将来候補。

```text
EXPOSURE RECORD
GRAVITY ZONE   72%
THERMAL ZONE   14%

STRUCTURAL ALTERATION DETECTED
LOW-MASS JOINT
MOBILITY +1 / ARMOR -1
```

### 採用する場合の原則

- 完全ランダムガチャにしない。
- どの区域へ何度派遣したかと結果に依存させる。
- 変質前に原因候補と予兆を観測可能にする。
- 利点と欠点を同時に持たせる。
- 希少度、レアリティ色、抽選演出を中心にしない。
- プレイヤーが変質を狙う、止める、受け入れる判断を持てる。
- 既存UNITの個体性を増やすが、必須攻略キーにはしない。

曝露変質は製造、保有、修復、BLUEPRINT、解体へ影響するため、第3段階以前には導入しない。

## 11. 変動ハザード

周回性は完全ランダム生成ではなく、読み取り可能な条件セットで作る。

```text
ZONE: ABANDONED MINE

RUN A
DARKNESS / COLLAPSE / MINERAL GROWTH

RUN B
FLOODING / MAGNETIC ANOMALY / OLD WORK UNIT

RUN C
HIGH TEMPERATURE / TOXIC DUST / DEEP DEPOSIT
```

### 生成契約候補

```text
2〜3 HAZARDS
+ 1 MATERIAL TENDENCY
+ 1 SPECIAL CONDITION
```

- 出撃前に既知条件を表示する。
- 未知条件は観測可能な予兆を持つ。
- 組み合わせが一つの構成を完全排除しないか静的監査する。
- 同義の数値補正を異なる名前で水増ししない。
- seedを保存し、同じ状態を再現可能にする。
- 完全ランダムな報酬量だけで周回差を作らない。

## 12. 3段階ロードマップ

### PHASE E1 — DESIGN BREADTH

```text
1 NEW ZONE
3 HORIZONTAL MATERIALS
MULTIPLE PRESSURES
MULTIPLE ROUTES
```

目的は、同じ総能力でも適切な設計が有利になることを確認する。

最初の縦切りは `GRAVITY_DEPTH_V0` とする。V0は深度も含むが、評価中心は区域圧力、複数経路、横方向素材である。

### PHASE E2 — EXPEDITION DECISIONS

```text
DEPTH
RETURN / CONTINUE
MISSION OBJECTIVES
SEQUENTIAL UNIT ROLES
```

目的は、出撃前だけでなく運用中にも意味のある判断を作ること。

### PHASE E3 — REPLAYABILITY

```text
HAZARD SET VARIATION
MATERIAL TENDENCY VARIATION
EXPOSURE-BASED ALTERATION
```

目的は、同じ区域の固定解を崩し、運用履歴を設計資産にすること。

E3はE1/E2で別設計による再挑戦意欲が観測されるまで開始しない。

## 13. 検証順序

```text
E0  C_MULTI_AXISの理解可能性を確認
E1  GRAVITY_DEPTH_V0
E2a  目的別任務を1種類だけ追加
E2b  順次派遣による役割分担を1区域で検証
E3a  固定ハザードセットを2種類比較
E3b  曝露変質を1区域・1変質だけ試作
```

各段階は前段の未解決問題を隠すために追加しない。たとえば、固定区域で別設計を試したいと思えない状態で変動ハザードを追加しない。

## 14. 成功条件

| ID | PASS条件 |
|---|---|
| CE-1 | 総能力が低い構成でも、問題適合により有利になる場面がある |
| CE-2 | 同一区域に異なる設計理由を持つ複数の攻略構成がある |
| CE-3 | 新素材入手後、既存UNITの単純置換ではなく別用途のUNITを作りたくなる |
| CE-4 | プレイヤーが何を捨て、何を通したか説明できる |
| CE-5 | 深度間でRETURN / CONTINUEを迷う |
| CE-6 | 同じ区域へ別設計で再挑戦したくなる |
| CE-7 | 役割分担が同時派遣や自動収集なしで成立する |
| CE-8 | 変動条件が増えても、出撃前に問題を読み取れる |

## 15. 拡張提案テンプレート

新コンテンツを提案するときは、データ量ではなく判断差を記述する。

```text
CONTENT ID

PLAYER QUESTION
何を捨て、何を通すか

PRESSURES
異なる設計軸を要求する2〜4条件

AVAILABLE APPROACHES
少なくとも2つの設計または経路

TRADE-OFF
各方法が失うもの

NEW MATERIAL PURPOSE
新しく可能になる設計

EXISTING MATERIAL VALUE
旧素材が有利な状況

OBSERVABLE CAUSALITY
予測・結果で表示する寄与量

NON-GOALS
今回追加しない隣接システム

HUMAN PASS CONDITION
プレイヤー行動として何を観測するか
```

## 16. 現時点の決定

一つだけ進める場合は、`遠征深度 × 複数攻略方法` を選ぶ。

```text
GRAVITY_DEPTH_V0
1 ZONE
4 DEPTHS
POWER / WORK ROUTES
3 HORIZONTAL MATERIALS
RETURN / CONTINUE
```

目的別任務、順次役割分担、変動ハザード、曝露変質は、この縦切りで「同じ区域を別設計で再挑戦したい」が観測された後に進める。
