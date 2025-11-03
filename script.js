// ===========================
// 📚 Reading Tracker Script
// ===========================

// --- 要素取得 ---
const sheetUrlInput = document.getElementById("sheetUrl");
const testBtn = document.getElementById("testBtn");
const connectionStatus = document.getElementById("connectionStatus");

const titleInput = document.getElementById("title");
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const statusMsg = document.getElementById("status");

const clearBtn = document.getElementById("clearTitlesBtn");
const suggestionList = document.getElementById("titleSuggestions");

// --- 初期化 ---
let gasUrl = "";
let sessionId = null;
let savedTitles = JSON.parse(localStorage.getItem("titles") || "[]");

// 初期UI設定
updateClearButtonState();
loadSavedSheetUrl();
populateTitleSuggestions();

// ===========================
// 🚀 スプレッドシート接続テスト
// ===========================
testBtn.addEventListener("click", async () => {
  const sheetUrl = sheetUrlInput.value.trim();
  if (!sheetUrl) {
    alert("スプレッドシートのURLを入力してください。");
    return;
  }

  try {
    connectionStatus.textContent = "接続を確認中...";
    connectionStatus.className = "status";

    const response = await fetch(getGasExecUrl(), {
      method: "POST",
      body: JSON.stringify({ action: "test", sheetUrl }),
    });

    const result = await response.text();
    console.log("接続テスト結果:", result);

    if (result === "OK_EDITABLE") {
      connectionStatus.textContent = "✅ 接続成功（編集権限あり）";
      connectionStatus.className = "status success";
      localStorage.setItem("sheetUrl", sheetUrl);
      gasUrl = getGasExecUrl();
      startBtn.disabled = false;

    } else if (result === "ERROR_NO_PERMISSION") {
      connectionStatus.textContent = "⚠️ スプレッドシートは閲覧専用のため接続できません。";
      connectionStatus.className = "status error";
      startBtn.disabled = true;

    } else if (result === "ERROR_NO_ACCESS") {
      connectionStatus.textContent = "❌ スプレッドシートが非公開のためアクセスできません。";
      connectionStatus.className = "status error";
      startBtn.disabled = true;

    } else if (result === "ERROR_INVALID_SHEET") {
      connectionStatus.textContent = "❌ URLが無効またはスプレッドシートが存在しません。";
      connectionStatus.className = "status error";
      startBtn.disabled = true;

    } else {
      connectionStatus.textContent = "❌ 予期しないエラーが発生しました。";
      connectionStatus.className = "status error";
      startBtn.disabled = true;
    }
  } catch (error) {
    console.error(error);
    connectionStatus.textContent = "❌ 通信エラーが発生しました。";
    connectionStatus.className = "status error";
  }
});

// ===========================
// 📖 読書開始
// ===========================
startBtn.addEventListener("click", async () => {
  const title = titleInput.value.trim();
  if (!title) {
    alert("タイトルを入力してください。");
    return;
  }

  const sheetUrl = sheetUrlInput.value.trim() || localStorage.getItem("sheetUrl");
  if (!sheetUrl) {
    alert("スプレッドシートのURLが設定されていません。");
    return;
  }

  try {
    statusMsg.textContent = "開始を記録中...";
    const response = await fetch(getGasExecUrl(), {
      method: "POST",
      body: JSON.stringify({ action: "start", title, sheetUrl }),
    });

    const result = await response.text();
    if (result && result !== "Invalid action") {
      sessionId = result;
      statusMsg.textContent = "📗 読書中...";
      statusMsg.className = "status success";

      startBtn.disabled = true;
      endBtn.disabled = false;

      // タイトルを履歴に保存
      if (!savedTitles.includes(title)) {
        savedTitles.push(title);
        localStorage.setItem("titles", JSON.stringify(savedTitles));
        populateTitleSuggestions();
      }

      updateClearButtonState(); // ✅ 履歴追加後に有効化
    } else {
      throw new Error(result);
    }
  } catch (error) {
    console.error(error);
    statusMsg.textContent = "❌ 開始に失敗しました";
    statusMsg.className = "status error";
  }
});

// ===========================
// 📕 読書終了
// ===========================
endBtn.addEventListener("click", async () => {
  if (!sessionId) {
    alert("開始セッションがありません。");
    return;
  }

  try {
    statusMsg.textContent = "終了を記録中...";
    const sheetUrl = sheetUrlInput.value.trim() || localStorage.getItem("sheetUrl");

    const response = await fetch(getGasExecUrl(), {
      method: "POST",
      body: JSON.stringify({ action: "end", sessionId, sheetUrl }),
    });

    const result = await response.text();
    if (result.includes("End logged")) {
      statusMsg.textContent = "✅ 終了を記録しました";
      statusMsg.className = "status success";
      startBtn.disabled = false;
      endBtn.disabled = true;
      sessionId = null;
    } else {
      throw new Error(result);
    }
  } catch (error) {
    console.error(error);
    statusMsg.textContent = "❌ 終了に失敗しました";
    statusMsg.className = "status error";
  }
});

// ===========================
// 🧹 履歴クリア機能
// ===========================
clearBtn.addEventListener("click", () => {
  if (savedTitles.length === 0) return;

  const confirmClear = confirm("タイトル履歴をすべて削除しますか？");
  if (!confirmClear) return;

  savedTitles = [];
  localStorage.removeItem("titles");
  suggestionList.innerHTML = "";
  updateClearButtonState(); // ✅ 無効化
});

// ===========================
// 🧩 関連関数
// ===========================

// GAS実行URL（公開済みWebアプリURL）
function getGasExecUrl() {
  // 公開URLをここに設定（例）
  return "https://script.google.com/macros/s/AKfycbxi-4SNxOb-DTf0L2YC3COLhkCkrBzhJHzCk85fi7a8XTPiR6BKkCCQFhLqckrK3P6X/exec";
}

// スプレッドシートURLの読み込み
function loadSavedSheetUrl() {
  const savedUrl = localStorage.getItem("sheetUrl");
  if (savedUrl) {
    sheetUrlInput.value = savedUrl;
    gasUrl = getGasExecUrl();
    startBtn.disabled = false;
  }
}

// 履歴からサジェストを再生成
function populateTitleSuggestions() {
  suggestionList.innerHTML = "";
  savedTitles.forEach((t) => {
    const option = document.createElement("option");
    option.value = t;
    suggestionList.appendChild(option);
  });
}

// 履歴クリアボタンの有効・無効切り替え
function updateClearButtonState() {
  clearBtn.disabled = savedTitles.length === 0;
}

// Enterキーで「読書開始」を押せるように
titleInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !startBtn.disabled) {
    startBtn.click();
  }
});
