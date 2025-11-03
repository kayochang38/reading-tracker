[readme.md](https://github.com/user-attachments/files/23293977/readme.md)
📚 Reading Tracker

Reading Tracker は、
読書時間を記録して Google スプレッドシートに保存できる
シンプルな Web アプリです。

ブラウザ上で「読書開始」「読書終了」を押すだけで、
開始時刻・終了時刻・読書時間が自動で記録されます。

静かな読書時間を、記録というかたちに。

🪄 特徴

⏱ ワンクリック記録：開始と終了のボタン操作だけ

☁️ クラウド保存：Google スプレッドシートに自動保存

⚡ 軽量＆シンプル：HTML / CSS / JS のみで構成

🛡️ 安心設計：終了ボタン押し忘れ時も自動補完

💬 オープンソース：MITライセンスで自由に利用可能

🧠 使い方
① Google スプレッドシートの準備

Google ドライブで新しいスプレッドシートを作成

シートの1行目に以下の列名を入力：

A列	B列	C列	D列	E列	F列	G列
セッションID	記録日時	タイトル	開始時刻	終了時刻	読書時間(分)	状態
② Apps Script（GAS）の設定

スプレッドシートの上メニューから
　「拡張機能 → Apps Script」 を開く

すべて削除して、以下のコードを貼り付ける

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const now = new Date();
    const action = data.action;
    const title = data.title;

    if (action === "start") {
      const sessionId = Utilities.getUuid();
      sheet.appendRow([
        sessionId,
        Utilities.formatDate(now, "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss"),
        title,
        Utilities.formatDate(now, "Asia/Tokyo", "HH:mm:ss"),
        "",
        "",
        ""
      ]);
      return ContentService.createTextOutput(sessionId);
    }

    if (action === "end") {
      const sessionId = data.sessionId;
      const values = sheet.getDataRange().getValues();

      for (let i = values.length - 1; i >= 1; i--) {
        if (values[i][0] === sessionId && values[i][5] === "") {
          const startTime = new Date(`${Utilities.formatDate(now, "Asia/Tokyo", "yyyy/MM/dd")} ${values[i][3]}`);
          const endTime = now;
          const diffMinutes = Math.round((endTime - startTime) / 1000 / 60);
          sheet.getRange(i + 1, 5).setValue(Utilities.formatDate(endTime, "Asia/Tokyo", "HH:mm:ss"));
          sheet.getRange(i + 1, 6).setValue(diffMinutes);
          sheet.getRange(i + 1, 7).setValue("完了");
          return ContentService.createTextOutput("End logged");
        }
      }
      return ContentService.createTextOutput("No matching ID found");
    }

    return ContentService.createTextOutput("Invalid action");
  } catch (error) {
    return ContentService.createTextOutput("Error: " + error);
  }
}

// 自動補完処理
function autoCloseSessions() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const values = sheet.getDataRange().getValues();
  const now = new Date();

  for (let i = 1; i < values.length; i++) {
    const status = values[i][6];
    const endTime = values[i][4];
    const startTimeStr = values[i][3];

    if (!endTime && (!status || status !== "完了")) {
      const startTime = new Date(`${Utilities.formatDate(now, "Asia/Tokyo", "yyyy/MM/dd")} ${startTimeStr}`);
      const diffHours = (now - startTime) / 1000 / 60 / 60;
      if (diffHours > 6) {
        const diffMinutes = Math.round((now - startTime) / 1000 / 60);
        sheet.getRange(i + 1, 5).setValue(Utilities.formatDate(now, "Asia/Tokyo", "HH:mm:ss"));
        sheet.getRange(i + 1, 6).setValue(diffMinutes);
        sheet.getRange(i + 1, 7).setValue("自動終了");
      }
    }
  }
}


「デプロイ → 新しいデプロイ → ウェブアプリ」
　- 実行するユーザー：自分
　- アクセス権：全員（匿名含む）

「デプロイ」してURLをコピー
　例：https://script.google.com/macros/s/AKfycbx_abc123/exec

③ アプリの設定（script.js）

script.js の先頭にこの URL を貼り付けます👇

const gasUrl = "https://script.google.com/macros/s/AKfycbx_abc123/exec";

④ トリガー設定（自動補完）

Apps Script の ⏰ トリガーアイコンをクリック

「トリガーを追加」ボタン

以下を設定：

項目	内容
実行する関数	autoCloseSessions
イベントの種類	時間主導型
頻度	毎時間

これで「未終了」の行を自動的に補完します。

🖋 ファイル構成
reading-tracker/
├── index.html   # ページ本体
├── style.css    # デザイン
└── script.js    # 動作スクリプト

🪶 操作方法

タイトルを入力して「読書開始」を押す

終わったら「読書終了」を押す

ブラウザを閉じそうになると警告表示

終了し忘れた場合も、6時間後に自動で「自動終了」

💡 スプレッドシート出力例
セッションID	記録日時	タイトル	開始時刻	終了時刻	読書時間(分)	状態
550e8400-e29b-41d4	2025/11/03 20:00	ノルウェイの森	20:00	20:45	45	完了
123e4567-e89b-12d3	2025/11/03 14:00	幸福論	14:00	20:00	360	自動終了
🌿 デプロイ（公開）

index.html をサーバーにアップロードすればすぐに動作します。

WordPressやcPanelの場合：

/public_html/lp/reading-tracker/
├── index.html
├── style.css
└── script.js


アクセスURL：

https://yourdomain.com/lp/reading-tracker/

💬 トラブルシューティング
症状	対処法
記録されない	GASの「アクセス権」を“全員（匿名含む）”に設定
時間がずれる	Asia/Tokyo の部分を確認
ブラウザ警告が出ない	モバイルSafariでは非対応。PCでは動作
自動終了されない	トリガーが正しく設定されているか確認
✨ クレジット

Design / Code: kayochang38

Tools: HTML, CSS, Vanilla JS, Google Apps Script

Hosting: WordPress + cPanel

License: MIT License

静かな読書時間が、あとで見返せる形になりますように。 ☕
