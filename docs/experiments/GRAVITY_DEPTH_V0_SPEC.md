# GRAVITY_DEPTH_V0 — 実装仕様書

```text
EXPERIMENT   GRAVITY_DEPTH_V0
STATUS       NON-CANONICAL VERTICAL SLICE
BASELINE     v2.0.0
SCOPE        1 ZONE / 4 DEPTHS / 3 EXPERIMENTAL MATERIALS
```

本実験は [`CONTENT_EXPANSION_MODEL.md`](../design/CONTENT_EXPANSION_MODEL.md) の最初の縦切りである。同文書の将来候補すべてを検証するものではない。

## 1. 目的

この実験は、次の仮説だけを検証する。

> 能力値を単純に高くするより、区域・深度・目的に合わせた設計を選ぶ方が有利なら、GOLEM BUILDERの設計ゲーム性は強くなる。

正式拡張、経済調整、長期周回の検証は目的に含めない。既存MVPの正本ルールと通常セーブは変更しない。

## 2. 成功条件

人間プレイで次を観測する。自動試験の数値だけでは昇格させない。

| ID | PASS条件 | 記録する証拠 |
|---|---|---|
| G0-1 | DEPTH 2以降で `RETURN / CONTINUE` を迷う | 選択前の発話、確認時間、選択理由 |
| G0-2 | POWER最大構成が常に最適にならない | 使用構成、到達深度、損傷、回収物 |
| G0-3 | DEPTH 3をPOWER経路とWORK経路の両方で攻略したくなる | 経路選択理由、再挑戦時の設計変更 |
| G0-4 | 新素材が別設計の製造意欲につながる | 製造候補、捨てた能力、狙う深度 |
| G0-5 | 同じ区域へ別設計で再挑戦したくなる | プレイヤーの自発的な次回案 |

最重要判定はG0-5とする。セッション終了時に「もう一度遊びますか」だけを尋ねるのではなく、プレイヤーが具体的な別設計を説明できるかを見る。

## 3. 実験境界

### 3.0 UNIT保有制限 / U0境界

V0では正本と同じ「完成機を最大3体保有」を維持する。DAY 2プレイで専用機需要と4案目の保存需要が観測されたため、`U0 — BLUEPRINT ONLY` だけを分離セーブ内の入れ子実験として含める。`RESERVE / ACTIVE` の分離は含めない。

BLUEPRINTはFRAME / REACTOR / CONTROL SIGIL / 試験材料のIDだけを最大10件保存する。保存時に素材やACTIONを消費せず、完成機の能力、耐久、実績を複製しない。LOADは製造欄へIDを復元するだけであり、製造には通常素材、1 ACTION、空きUNIT枠を要求する。

一時比較用の `comparisonCandidates` は完成機相当スナップショットのまま保持し、U0 BLUEPRINTとはみなさない。

### 3.1 起動

実験は次のURLでのみ有効にする。

```text
/?experiment=GRAVITY_DEPTH_V0
```

通常URLでは、区域、素材、型、表示、保存データのいずれにも影響を与えない。

### 3.2 保存

- 実験専用キー接頭辞を `golem_builder_gravity_depth_v0` とする。
- `golem_builder_expedition_save_v2` を読み書きしない。
- 実験開始時は専用の固定初期状態を生成する。
- 実験素材を通常インベントリへ移送できない。
- 実験終了後も正本セーブのマイグレーションを要求しない。

### 3.3 V0に含めないもの

```text
複数区域 / 区域ランダム生成 / 同時派遣 / 新経済
レアリティ / 製造ガチャ / 永続変異 / 曝露履歴
大量の新パーツ / 実時間待機 / 戦闘モード
```

## 4. プレイループ

```text
実験用UNITを選択
→ DEPTH 1を開始（1 ACTION消費）
→ 深度結果と現在状態を確認
→ RETURN または CONTINUE
→ 帰還時だけ積載品を確定
→ 実験素材で別UNITを製造
→ 同一区域へ再挑戦
```

- 派遣開始時だけ1 ACTIONを消費する。`CONTINUE` は追加ACTIONを消費しない。
- 途中帰還も最深部帰還も、同じ1回の派遣として数える。
- 損傷は深度間で累積し、各深度の開始時耐久は直前結果を引き継ぐ。
- UNITの耐久が0以下になった時点で大破撤退となり、その派遣の未確定貨物をすべて失う。
- `RETURN` 成功時は現在の未確定貨物から、既存ルールどおり `WORK × 2` 以内を選んで持ち帰る。
- DEPTH 4を完了すると `CONTINUE` は表示せず、帰還処理へ進む。

## 5. ANOMALOUS ZONE G-01

表示名は `ANOMALOUS ZONE G-01 / 重力異常区域` とする。V0では進入必須特性を置かず、すべての実験用UNITがDEPTH 1へ出撃できる。

### DEPTH 1 — OUTER FIELD / 外縁区域

目的はルール導入と少量の基礎回収であり、設計ゲートにはしない。

| 項目 | 値 |
|---|---|
| 環境損傷 | 0 |
| 移動要求 | MOBILITY 4 |
| 移動損傷 | 不足1につき4、上限12 |
| 報酬 | 既存一般素材を固定2重量分 |
| 次深度予告 | `MASS DISTORTION / 重量負荷` |

### DEPTH 2 — MASS DISTORTION / 質量歪曲域

重いFRAMEのARMOR優位と移動負荷を衝突させる。

| 項目 | 値 |
|---|---|
| 基礎重力損傷 | 6 |
| 重量負荷 | FRAME質量が `HEAVY` なら+18、`MEDIUM`なら+8、`LIGHT`なら+0 |
| 機動軽減 | `max(0, 8 - MOBILITY) × 3` |
| 特殊軽減 | `gravity_control` があれば重力由来損傷を50%軽減、端数切り捨て |
| 報酬 | `LOW-MASS COMPOSITE` 候補1個 |
| 次深度予告 | POWER経路 / WORK経路、予測損傷と報酬傾向 |

重力由来損傷は `基礎重力損傷 + 重量負荷 + 機動軽減` とし、その合計へ特殊軽減を適用する。ARMORでは軽減しない。

### DEPTH 3 — FRACTURED WORKSITE / 断裂作業区

プレイヤーが出撃前に経路を予約するのではなく、到達時に現在耐久と貨物を見て経路を選ぶ。

#### POWER経路 — COLLAPSED GATE

```text
損傷 = 8 + max(0, 10 - POWER) × 4
報酬 = DENSE FERROUS MATERIAL 1個
```

- 最低損傷は8。
- POWER不足時は短時間で強行突破するため損傷が増える。

#### WORK経路 — SERVICE SHAFT

```text
損傷 = 4 + max(0, 9 - WORK) × 3 + max(0, 6 - MOBILITY) × 2
報酬 = LOW-MASS COMPOSITE 1個
```

- 損傷は抑えやすいが、WORKとMOBILITYの二軸を要求する。
- 選択した経路、各損傷項、獲得候補を報告書へ残す。

### DEPTH 4 — GRAVITY WELL / 重力井戸

最深部は特殊対策の価値を検証する。到達自体に特性ゲートは置かない。

```text
重力損傷 = 18 + max(0, 10 - MOBILITY) × 4
構造損傷 = max(0, 8 - ARMOR) × 3
```

- `gravity_control` があれば重力損傷を60%軽減し、端数を切り捨てる。
- 報酬候補は `GRAVITY-SHIFT CRYSTAL` 1個。
- 完了後は自動帰還画面へ進む。

## 6. 実験素材

3素材は通常のBODY / CORE / RUNE在庫へ直接追加しない。実験専用の `prototype_frame_material` として扱い、既存FRAMEを製造するときに1つだけ選べる置換材とする。未使用も選択可能とする。

これにより、既存の64基本構成を維持したまま横方向の設計差を検証できる。

| ID | 表示名 | 効果 | 質量 | 製造消費 |
|---|---|---|---|---|
| `low_mass_composite` | LOW-MASS COMPOSITE / 低質量複合材 | MOBILITY +3、ARMOR -3 | LIGHT | 1 |
| `dense_ferrous_material` | DENSE FERROUS MATERIAL / 高密度鉄材 | ARMOR +4、POWER +1、MOBILITY -3、WORK -1 | HEAVY | 1 |
| `gravity_shift_crystal` | GRAVITY-SHIFT CRYSTAL / 重力偏移結晶 | `gravity_control` 付与、通常能力補正なし | MEDIUM | 1 |

補正後能力は0未満にならない。素材を使わない既存FRAMEの質量は、木=`LIGHT`、粘土=`MEDIUM`、石・鉄=`HEAVY` とする。

V0では置換材はFRAMEスロットの新レアリティではなく、原因と効果が固定された試験用材料である。ランダム品質、強化値、個体差を持たせない。

## 7. 予測と解決

既存方針どおり、画面予測と実際の損傷は同一の純粋関数を呼ぶ。

```ts
evaluateGravityDepth(
  depth: GravityDepth,
  unit: GravityUnitSnapshot,
  route?: 'POWER' | 'WORK'
): GravityDepthEvaluation
```

返却値は最低限、次を含む。

```ts
interface GravityDepthEvaluation {
  depth: 1 | 2 | 3 | 4;
  route?: 'POWER' | 'WORK';
  damageSources: Array<{
    id: string;
    label: string;
    amount: number;
  }>;
  totalDamage: number;
  durabilityBefore: number;
  durabilityAfter: number;
  status: 'ACCEPTABLE' | 'WARNING' | 'CRITICAL';
  destroyed: boolean;
  rewardPreview: GravityRewardPreview[];
}
```

- `durabilityAfter = max(0, durabilityBefore - totalDamage)`。
- `ACCEPTABLE` は残耐久61以上、`WARNING` は残耐久1〜60、`CRITICAL` は大破または次深度予測で大破見込みとする。
- 深度選択画面、経路選択画面、結果報告は同じ `damageSources` を表示する。
- 乱数は損傷へ使用しない。報酬候補もV0では固定し、判断因果を曖昧にしない。

## 8. 画面フロー

### 8.1 実験入口

画面上部へ常時表示する。

```text
EXPERIMENT: GRAVITY_DEPTH_V0
NON-CANONICAL / SAVE ISOLATED
```

### 8.2 出撃前

表示順を固定する。

1. UNITと現在耐久
2. 4能力、FRAME質量、`gravity_control` の有無
3. DEPTH 1の損傷内訳予測
4. 到達可能な既知深度と主条件
5. `DEPLOY` ボタン

### 8.3 深度結果／撤退判断

DEPTH 1、2、3の完了後に表示する。

```text
UNIT CONDITION      68%
UNSECURED CARGO     7 / 10

NEXT DEPTH          GRAVITY LOAD: HIGH
PREDICTED DAMAGE    24
DAMAGE SOURCES
  GRAVITY LOAD      +18
  MOBILITY DEFICIT  +6
MAJOR CONTRIBUTOR   GRAVITY LOAD
DETECTED MATERIAL   UNCLASSIFIED

[ RETURN ] [ CONTINUE ]
```

- `CONTINUE` の直前に、次深度の合計損傷、全損傷源の寄与量、最大寄与項目を必ず表示する。最大項目は解決すべき唯一の原因として扱わない。
- 未獲得素材の正確な名称は、初回回収まで `UNCLASSIFIED MATERIAL` と表示してよい。ただし効果の検証を妨げないよう、回収後は名称と全効果を開示する。
- `CONTINUE` を無効化する隠し条件を置かない。予測上大破する場合も選択可能だが、`CRITICAL` 警告を表示する。
- 警告は [`FOUNDRY_CONTROL_SUPPORT_MODEL.md`](../design/FOUNDRY_CONTROL_SUPPORT_MODEL.md) のS1/S2境界に従い、原因と結果だけを示す。推奨構成、推奨経路、推奨撤退判断は表示しない。

### 8.4 DEPTH 3経路選択

POWER / WORKの各カードへ次を並べる。

- 現在値と要求値
- 損傷内訳と合計
- 報酬傾向
- 選択理由を一文で説明する因果表示

自動で最良経路を選ばない。プレイヤーが明示選択する。

### 8.5 帰還

帰還画面は以下の順に表示する。

1. 到達深度と選択経路
2. 深度別損傷内訳
3. 未確定貨物一覧
4. `WORK × 2` の積載選択
5. 確定回収物
6. 「このUNITで次に改善できる点」の自由回答記録欄（テスト時のみ）

### 8.6 最小設計比較

[`WORKSHOP_REASONING_SUPPORT_MODEL.md`](../design/WORKSHOP_REASONING_SUPPORT_MODEL.md) のW0全体は導入せず、実験セッション内だけの比較ピンを最大3案まで許可する。

- 現在UNITと最大2つの製造前候補を並べる。
- 4能力、FRAME質量、`gravity_control`、観測済み深度の損傷源を表示する。
- 総合点、勝者、推奨構成、推奨経路を表示しない。
- 帰還後の自由回答欄は `MY NEXT HYPOTHESIS` と表示する。
- 検索、永続ノート、因果辞典はV0へ含めない。

比較UIが深度実験の判断へ与える影響を分離する必要がある場合は、プレイテスト記録に比較UI使用の有無を残す。

## 9. データ構造

実装時は正本型へV0専用フィールドを混在させず、`src/experiments/gravity-depth-v0/` 以下へ閉じ込める。

```ts
type GravityDepth = 1 | 2 | 3 | 4;
type FrameMass = 'LIGHT' | 'MEDIUM' | 'HEAVY';
type GravityRoute = 'POWER' | 'WORK';
type PrototypeMaterialId =
  | 'low_mass_composite'
  | 'dense_ferrous_material'
  | 'gravity_shift_crystal';

interface GravityUnitSnapshot {
  golemId: string;
  stats: GolemStats;
  durability: number;
  frameMass: FrameMass;
  gravityControl: boolean;
}

interface GravityRunState {
  runId: string;
  golemId: string;
  currentDepth: GravityDepth;
  durability: number;
  unsecuredCargo: GravityCargoItem[];
  depthResults: GravityDepthEvaluation[];
  chosenRoute?: GravityRoute;
  phase: 'IN_PROGRESS' | 'ROUTE_CHOICE' | 'RETURNING' | 'DESTROYED' | 'COMPLETE';
}
```

`GravityRunState` は各選択後に専用保存キーへ保存し、リロード時に同じ判断画面へ復帰できるようにする。

## 10. 固定初期状態

実験開始直後から比較可能にするため、通常進行を再走させない。

- DAY 1 / 3 ACTION
- 既存4種FRAME、4種REACTOR、4種CONTROL SIGILを各1回以上比較製造できる試験在庫
- 既存スターターUNIT 1体
- 実験素材在庫はすべて0
- ゴーレム保有上限3体、製造・修復・派遣のACTION規則は正本と同じ
- 解体規則とBODY素材修復コストも正本と同じ
- 実験素材を使用したUNITの解体でも、返却は正本どおりBODY素材1個とCORE素材1個だけとする。実験素材は返却しない。

初期在庫の具体数は、全候補を無制限に試せる量にはしない。少なくとも「現在UNITで出撃する」か「1 ACTIONと素材を使って別UNITを作る」かが選択になる量へ調整し、仕様実装後のスモークプレイで固定する。

## 11. 自動検証

### 必須テスト

1. 各深度・全64基本構成・3素材＋未使用について、予測損傷と実測損傷が一致する。
2. DEPTH 2で同能力なら `LIGHT < MEDIUM < HEAVY` の損傷順になる。
3. `gravity_control` が通常能力を上げず、DEPTH 2と4の重力損傷だけを軽減する。
4. DEPTH 3でPOWER経路とWORK経路の優位構成がそれぞれ1つ以上存在する。
5. POWER最大構成が全深度・全経路の単独最適解にならない。
6. 大破時に未確定貨物が0になり、RETURN成功時だけ積載確定できる。
7. 派遣開始で1 ACTION消費し、CONTINUEでは追加消費しない。
8. 通常URLの型・区域・セーブ値・ビルド結果が実験追加前と一致する。
9. 実験セーブと正本セーブが相互に変更されない。

### 非目標

botの最適化率、30日経済、長期softlock、区域間進行はV0の合否へ使わない。

## 12. 人間プレイテスト記録と停止判断

内部プレイにより、深度による設計差、POWER / WORKの攻略思想、損傷原因からの再設計、RETURN判断は成立すると判断した。

```text
GRAVITY_DEPTH_V0
CORE HYPOTHESIS     CONFIRMED ENOUGH TO PROCEED
VERDICT             PROMISING
ADDITIONAL TEST     STOP
NEXT                PRODUCT UI / WORLD PRESENTATION INTEGRATION
```

現行の未完成実験画面を対象とした追加の初見30〜45分テストは、NEXT TASKから外す。同じビルドの参加人数を増やさない。

次の人間テストは、製品UIへの統合、世界観表現、Blueprintとの工房導線がまとまった後に、一回の通しプレイとして行う。重大な欠陥が見つかった場合を除き、それまではlint、build、関連する最小回帰だけを要求する。

過去の観測項目G0-1〜G0-5は設計記録として維持するが、全項目を複数プレイヤーで閉じることを制作開始条件にしない。

## 13. 実装順序と完了条件

```text
M0  純粋な深度評価関数と全構成テスト
M1  実験専用データ・保存・固定初期状態
M2  深度進行、RETURN / CONTINUE、POWER / WORK選択
M3  未確定貨物と帰還時積載
M4  実験素材を使うFRAME置換製造
M5  予測／結果UIと手動試験記録
```

V0実装完了は、M0〜M5、必須自動テスト、通常ビルドの回帰確認が通った状態とする。現在は中心仮説を確認済みとして、追加テストではなく製品UI統合へ進む。正式採用は統合後の通しプレイと別判断にする。

## 14. 昇格判断

- G0-1〜G0-5は正式昇格時の評価観点として使用できるが、複数プレイヤーで個別に閉じることを機能制作のゲートにしない。
- G0-1だけが強く、G0-3〜G0-5が弱い場合は、深度が単なるプッシュ・ユア・ラックになっているため不採用または再設計とする。
- 特定素材が常に選ばれる場合は数値を上げ下げする前に、各深度が異なる設計問題を提示できているかを見直す。
- 不採用でも正本v2.0.0へ影響を残さない。
- 追加テストで判断が変わらない状態では `TEST STOP` とし、UI統合と完成度向上へ戻る。
