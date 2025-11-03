# 📚 Reading Tracker

Googleスプレッドシートを使った、シンプルな読書時間トラッカーです。  
自分のスプレッドシートURLを入力するだけで、読書開始・終了を記録できます。

---

## ✨ Features

- スプレッドシートURLをフォームに入力するだけで接続可能  
- URLは自動変換され、安全に自分のシートに書き込み  
- localStorageでURLをブラウザに保存（次回から自動復元）  
- 接続テストで通信確認  
- 読書開始／終了を記録  
- 6時間経過した未完了セッションを自動終了（GASトリガー）

---

## 🧭 How to Use

1. Webアプリを開く  
2. スプレッドシートのURLを貼り付けて「接続テスト」  
3. 「読書開始」→「読書終了」で時間を記録  
4. URLはブラウザに保存され、次回自動で復元されます  

---

## ⚙️ Setup

### 1️⃣ Google Apps Script

1. 新しいGASプロジェクトを作成  
2. `Code.gs` の内容を貼り付けて保存  
3. デプロイ → 「ウェブアプリ」として公開（全員にアクセス許可）

### 2️⃣ Webアプリ側

1. このリポジトリをcloneまたはダウンロード  
2. `index.html`, `style.css`, `script.js` を同じフォルダに配置  
3. `script.js` の `gasUrl` に自分のGASデプロイURLを設定

---

## ⏰ Trigger（自動終了設定）

| 項目 | 設定 |
|------|------|
| 関数名 | `autoCloseSessions` |
| イベントタイプ | 時間主導型 |
| 頻度 | 6時間ごと |

未完了セッションは自動的に「自動終了」として記録されます。

---

## 🧱 Tech Stack

- HTML / CSS / JavaScript  
- Google Apps Script  
- Google Spreadsheet API  
- localStorage  

---

## 🧑‍💻 Author

- Developed by [@kayochang38](https://github.com/kayochang38)
- Contact / Feedback → GitHub Issues またはコメント欄まで  

---

## 📜 License

MIT License
