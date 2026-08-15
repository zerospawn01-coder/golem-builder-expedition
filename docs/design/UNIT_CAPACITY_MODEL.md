# GOLEM BUILDER — UNIT Capacity Model

```text
STATUS       U0 PROTOTYPE JUSTIFIED
CANONICAL    NO
DEPENDENCY   SPECIALIZED UNIT DEMAND OBSERVED — PASS
SCOPE        OWNERSHIP / READINESS / DESIGN MEMORY
```

## 1. 設計判断

将来、区域・深度・任務によって専用機の需要が増えた場合、UNIT数を一つの上限だけで管理しない。

```text
BLUEPRINT LIBRARY
設計知識を保存
        ↓ FABRICATION
RESERVE HANGAR
完成機を保管
        ↓ ACTIVATE
ACTIVE ROSTER
現在運用する最大3体
        ↓ SELECT
DEPLOYMENT
原則1任務ずつ
```

正本候補は次の三層構造とする。

| 層 | 役割 | 初期候補上限 | プレイヤーが判断すること |
|---|---|---:|---|
| BLUEPRINT LIBRARY | 過去の有効な構成を設計記録として保存 | 10〜20 | どの設計知識を残すか |
| RESERVE HANGAR | 製造済みUNITを非稼働状態で保管 | 6 | どの専用機を完成状態で維持するか |
| ACTIVE ROSTER | 今回使用できるUNIT | 3 | どの3体を現場対応可能にするか |

目的は保有上限を緩めること自体ではない。専用機を保存可能にしつつ、現在比較・管理する対象を3体に保つことである。

## 2. 中核原則

### 所有数と稼働数を分ける

問題は「3体しか同時運用できない」ことではなく、「設計解を3体しか完成状態で残せない」ことにある。

将来の3体制限は次の意味へ変更する。

```text
旧候補: MAX OWNED UNITS 3
新候補: ACTIVE ROSTER 3 / 3
```

ACTIVE 3体の制限は、区域群に対して何を持ち込むかという編成判断として維持する。

### 設計知識を資産にする

BLUEPRINTはUNITそのものではない。FRAME / REACTOR / CONTROL SIGILと、将来正式採用された追加設計要素の組み合わせを記録する。

- 保存時に素材を消費しない。
- BLUEPRINTからの製造は通常の素材と1 ACTIONを消費する。
- BLUEPRINT保存だけで完成機や素材を複製しない。
- 元のUNITを解体してもBLUEPRINTは残る。
- BLUEPRINTは能力値のスナップショットではなく、部品IDの組み合わせを正本とする。
- 部品ルールが変わった場合、能力値は現行定義から再計算する。

これにより、個体を手放してもプレイヤーが発見した設計解は失われない。

### 管理負荷を増やさない

RESERVE中のUNITは原則として静止状態とする。

```text
DEPLOYMENT       UNAVAILABLE
PASSIVE DAMAGE   NONE
PASSIVE REPAIR   NONE
ACTION UPKEEP    NONE
RESOURCE UPKEEP  NONE
```

RESERVE中に耐久を自動回復させない。保管による無料修復ループを作らないため、耐久値はそのまま保持する。継続的な炉心燃料、保管料、時間経過劣化も導入しない。

## 3. 操作規則候補

### BLUEPRINT保存

- 製造確認画面または保有UNIT詳細から保存する。
- 同一構成の重複保存は警告し、既定では既存BLUEPRINTを開く。
- 名前と短い用途タグを編集できる。
- V1用途タグは `SCOUT / EXTRACTOR / HEAVY / ENVIRONMENT / CARGO / CUSTOM` 程度に限定する。
- 用途タグはルール効果を持たない。

### RESERVEへの移動

- ACTIVEからRESERVEへの移動はACTIONを消費しない。
- 派遣進行中、損傷解決中、貨物選択中のUNITは移動できない。
- RESERVE上限到達時は、別UNITをACTIVEへ移すか解体するまで新たに保管できない。

### ACTIVE化

- RESERVEからACTIVEへの移動はACTIONを消費しない。
- ACTIVE枠が3体埋まっている場合は、同じ操作内で交代対象を選択する。
- ACTIVE化しても修復や能力補正は発生しない。
- 編成変更に日単位の待機、燃料、通貨を要求しない。

ACTIONを要求しない理由は、編成の試行を妨げず、コスト判断を製造・修復・派遣へ集中させるためである。人間プレイで無制限な入れ替えが判断を空洞化させた場合だけ再検討する。

## 4. DEPLOYMENTとの関係

- 派遣選択画面へ表示するのはACTIVEの最大3体だけとする。
- 1回の派遣で選ぶUNITは原則1体のまま維持する。
- ACTIVE枠は同時遠征枠ではない。
- 複数区域への自動派遣、バックグラウンド収集、帰還タイマーを同時導入しない。
- 複数UNITを順番に使う区域攻略を導入する場合も、各派遣は個別のプレイヤー判断として解決する。

```text
ACTIVE UNITS 3
≠ SIMULTANEOUS DEPLOYMENTS 3
```

## 5. FRAME個体性とモジュール交換

REACTOR / CONTROL SIGIL交換は、この保有モデルの必須要素ではない。別の仮説として扱う。

将来試す場合の第一候補は次とする。

```text
FRAME           FIXED TO UNIT
REACTOR         REFITTABLE
CONTROL SIGIL   REFITTABLE
```

ただし交換が自由すぎると、製造と専用機保有の価値を消す。少なくとも次を独立に検証するまで正本へ含めない。

- UNITの個体性がFRAMEだけで十分残るか。
- 再製造より換装が常に正解にならないか。
- 換装操作が遠征前の定型作業にならないか。

## 6. 導入条件

このモデルは、コンテンツ計画だけを理由に実装しない。次のプレイヤー行動が複数回観測された場合に試作候補とする。

1. 区域専用UNITを残したいため、新設計を試せない。
2. 有効だった設計を失うことを嫌い、解体を避ける。
3. 3体すべてが明確な役割を持ち、別役割の需要が発生する。
4. 過去構成を再現するため、スクリーンショットや外部メモを使う。
5. `GRAVITY_DEPTH_V0` 等で「次は別設計を試したい」が発生する一方、保有枠がその行動を阻害する。

単に「枠が多い方が便利」という回答だけでは導入根拠にしない。

## 7. 段階的な検証

三層を一度に実装しない。

### U0 — BLUEPRINT ONLY

```text
完成機上限   3（正本維持）
BLUEPRINT    最大10
再製造       通常コスト
```

最初に、設計記憶だけで窮屈さが解消するかを見る。最も小さく、現在の3体制限の判断価値も保持できる。

### U1 — RESERVE HANGAR

U0で完成機を残せない不満が継続した場合だけ追加する。

```text
RESERVE      最大6
ACTIVE       最大3
DEPLOYMENT   1 UNIT / 1 MISSION
```

### U2 — REFIT EXPERIMENT

RESERVEでも製造・解体の反復が単調な場合に限り、REACTOR / CONTROL SIGIL交換を独立実験する。

## 8. 成功条件

| ID | PASS条件 |
|---|---|
| UC-1 | プレイヤーが用途の異なる3体をACTIVEに選ぶ理由を説明できる |
| UC-2 | BLUEPRINT保存によって新設計を試す心理的抵抗が下がる |
| UC-3 | RESERVEを含む全UNITの定期整備作業が発生しない |
| UC-4 | 派遣前に比較する中心対象がACTIVE 3体に留まる |
| UC-5 | 所有数増加後も、派遣1回ごとの設計判断が維持される |
| UC-6 | BLUEPRINT、完成機、ACTIVE状態の違いを説明なしで理解できる |

## 9. 失敗兆候

- プレイヤーが毎回全RESERVEを巡回して耐久確認する。
- ACTIVE交代が意味のないクリック作業になる。
- 同じ万能構成を複数体保管するのが最適になる。
- BLUEPRINT一覧が名前違いの重複で埋まる。
- 設計より保管枠整理へ時間を使う。
- 複数派遣や自動収集を前提にしないと所有数の意味がなくなる。

これらが観測された場合、上限数を増やす前に、BLUEPRINTの重複整理、専用機需要、ACTIVE編成の情報設計を見直す。

## 10. 現時点の推奨

`GRAVITY_DEPTH_V0` のDAY 2プレイで、完成機3枠を用途の異なる機体が占有し、4案目の軽量WORK型を設計記録として残したい需要が観測された。これをU0試作の根拠とする。

U0は実験専用セーブ内だけで試作し、完成機最大3体、通常素材、製造時1 ACTIONを維持する。BLUEPRINTだけで問題が解消すれば、RESERVE HANGARを追加しない。RESERVEが必要になった場合もACTIVE 3体と1任務ずつの派遣原則を維持する。

```text
U0_BLUEPRINT_ONLY
DESIGNED                    PASS
PRE-IMPLEMENTATION DEMAND   OBSERVED / PASS
INTERNAL PLAY               PASS / PROMISING
IMPLEMENTED                 EXPERIMENTAL
NEXT                        PURPOSE IDENTIFICATION + V-1 INTEGRATION
ADDITIONAL HUMAN TEST       STOP UNTIL FEATURE-GROUP INTEGRATION
CANONICAL                   NO
```

内部プレイでは、設計保存、複数用途の保存価値、設計と完成機の分離が確認された。用途識別の弱さは追加テスト項目ではなく、次の制作課題として扱う。

U0の現時点の判定は `PROMISING` とし、同じ未完成UIへの追加人間テストを要求しない。次は用途を識別しやすくし、V-1製造UIと一つの操作体験へ統合する。U1 RESERVE HANGARは引き続き開始しない。
