# 📚 Reading Tracker

**Reading Tracker** は、  
読書開始・終了の記録を Google スプレッドシートに自動連携できる、  
クラフト紙風デザインのシンプルな読書タイマーアプリです。  

---

## ✨ Features（機能）

### 🕒 基本機能
- **読書開始／終了ボタン**  
  開始を押すとスプレッドシートに記録を追加、終了で経過時間を自動計算して完了登録。

- **スプレッドシート連携（GAS＋PHP）**  
  Google Apps Script をバックエンドにし、relay.php 経由で通信。  
  空のシートや構造違いも自動判別・生成します。

- **未完了一覧（照合機能）**  
  「照合」ボタンでスプレッドシートを走査し、進行中の読書を一覧表示。  
  → 続ける／終了する／削除 の操作が可能。

- **履歴管理**  
  入力した書籍タイトルはローカルに保存され、最大10件まで履歴からワンクリック再利用。

- **オフライン復元**  
  ブラウザを閉じても、再読み込み時に進行中の読書を自動検出。

---

### 🎨 デザイン＆UX
- クラフト紙風の UI  
  文具のような手触り感を重視した、まろやかで落ち着いた配色（クリーム・薄緑・薄ピンク基調）。

- ミュートボタン  
  ボタン群と調和したデザインで、アラート音／完了音を手軽にオンオフ切替可能。

- フォームやボタン類の配色統一  
  時間帯や端末を選ばない、自然な読みやすさを実現。

- ステータス表示  
  通信状況や結果を画面下部にメッセージ表示。

---

### 🔔 サウンド通知
- **完了音（clear.mp3）**：正常動作時  
- **警告音（alert.mp3）**：エラー時  
- ミュートボタンでいつでも切替可

---

### ⚙️ スプレッドシート構造
| 列 | 項目名 | 内容 |
|----|--------|------|
| A | ID | 例：`R20251104-D-251104-8631-0001` |
| B | タイトル | 書籍タイトル |
| C | 開始日時 | JST（日本時間） |
| D | 終了日時 | JST |
| E | 経過時間（分） | 自動計算（1分未満切り上げ） |
| F | 状態 | `進行中` / `完了` |

- シート名は `読書記録_yyyyMMdd_HHmm`  
- 構造が一致する既存シートがあれば追記、なければ自動生成

---

### 💻 技術構成
| レイヤー | 使用技術 |
|-----------|-----------|
| フロントエンド | HTML / CSS / JavaScript (Vanilla) |
| バックエンド | PHP (relay.php) + Google Apps Script (Web App) |
| データ保存 | Google スプレッドシート |
| 通信形式 | JSON（URLエンコード方式で WAF 回避対応） |

---

### 📜 主なファイル構成

reading-tracker/
├── index.html # メインUI
├── style.css # クラフト紙風スタイル
├── app.js # メインロジック（機能制御）
├── relay.php # フロント→GAS中継API
├── clear.mp3 / alert.mp3 # 通知音
├── icon.png # サイトアイコン
└── README.md


---

## 🧩 主要ロジック（機能概要）

### JavaScript (`app.js`)
- `verifyBtn`：照合（進行中一覧取得）
- `continueBtn`：読書再開（一覧を閉じて再開状態へ）
- `finishBtn`：終了（シート更新＆一覧自動非表示）
- `deleteBtn`：行削除（シート更新＆一覧自動非表示）
- `closeUnfinishedBtn`：一覧を手動で閉じる
- `startBtn`：開始時にも未完了一覧を自動非表示
- `endBtn`：終了送信処理・音・ステータス表示

---

### Google Apps Script (`doPost(e)`)
- `append_start`：開始行を追加  
- `append_end`：終了時間・経過時間を更新  
- `verify`：構造一致シート全探索、`進行中`行を抽出  
- `delete_row`：該当行削除  
- `findOrCreateTargetSheet`：構造判定＋自動生成  
- 自動タイムゾーン変換（JST）

---

## 🧪 開発メモ

| 機能 | 実装ポイント |
|------|---------------|
| JSON通信 | POSTデータURLエンコード化でWAF対策 |
| シート生成 | 空白・異構造検出で新規生成 or 既存再利用 |
| UI安定化 | 開始・終了時に未完了一覧を自動クローズ |
| アラート音 | fetch結果に応じて alert / clear 切替再生 |
| 状態保持 | `localStorage`で履歴・進行中読書を保存 |
| CSS調整 | 文具感ある落ち着いた彩度の低い色を採用 |

---

## 🚀 公開ページ
[https://www.laboratomie.com/reading-tracker/](https://www.laboratomie.com/reading-tracker/)

---

## 🧑‍💻 作者
**kayochang38**  
- Composer / Web Developer  
- [GitHub](https://github.com/kayochang38)  
- [Website](https://www.laboratomie.com)  
- [X / Twitter](https://x.com/kayochang38)

---

## 🪄 License
MIT License  
(c) 2025 kayochang38
