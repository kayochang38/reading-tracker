// === GAS接続先（proxy.php経由） ===
const gasUrl = "https://laboratomie.com/proxy.php";

let sheetUrl = "";
let sessionId = null;
let readingActive = false;

// DOM要素
const testBtn = document.getElementById("testBtn");
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const clearTitlesBtn = document.getElementById("clearTitlesBtn");
const connectionStatus = document.getElementById("connectionStatus");
const status = document.getElementById("status");
const urlInput = document.getElementById("sheetUrl");
const titleInput = document.getElementById("title");

// --- localStorageから復元 ---
window.addEventListener("DOMContentLoaded", () => {
  const savedUrl = localStorage.getItem("sheetUrl");
  if (savedUrl) urlInput.value = savedUrl;

  // タイトル履歴を datalist にセット
  updateTitleList();
});

function updateTitleList() {
  // 既存 datalist を削除して再生成
  let dataList = document.getElementById("titleSuggestions");
  if (dataList) dataList.remove();

  const savedTitles = JSON.parse(localStorage.getItem("titles") || "[]");
  dataList = document.createElement("datalist");
  dataList.id = "titleSuggestions";

  savedTitles.forEach(title => {
    const option = document.createElement("option");
    option.value = title;
    dataList.appendChild(option);
  });

  document.body.appendChild(dataList);
  titleInput.setAttribute("list", "titleSuggestions");
}

// --- 履歴をクリア ---
clearTitlesBtn.addEventListener("click", () => {
  if (confirm("保存されているタイトル履歴をすべて削除しますか？")) {
    localStorage.removeItem("titles");
    updateTitleList();
    alert("タイトル履歴をクリアしました。");
  }
});

// --- 接続テスト ---
testBtn.addEventListener("click", () => {
  sheetUrl = urlInput.value.trim();
  if (!sheetUrl) return alert("スプレッドシートのURLを入力してください。");

  localStorage.setItem("sheetUrl", sheetUrl);

  connectionStatus.textContent = "接続テスト中...";
  connectionStatus.className = "status";

  fetch(gasUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "test", sheetUrl })
  })
    .then(res => res.text())
    .then(res => {
      if (res === "Connection OK") {
        connectionStatus.textContent = "✅ 接続成功しました！";
        connectionStatus.classList.add("success");
        startBtn.disabled = false;
      } else {
        connectionStatus.textContent = "⚠️ 接続できません。URLを確認してください。";
        connectionStatus.classList.add("error");
      }
    })
    .catch(() => {
      connectionStatus.textContent = "⚠️ 通信エラーが発生しました。";
      connectionStatus.classList.add("error");
    });
});

// --- 読書開始 ---
function startReading() {
  const title = titleInput.value.trim();
  if (!title) return alert("タイトルを入力してください。");

  fetch(gasUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "start", title, sheetUrl })
  })
    .then(res => res.text())
    .then(id => {
      sessionId = id;
      readingActive = true;
      startBtn.disabled = true;
      endBtn.disabled = false;
      status.textContent = "📖 読書中...";

      // タイトル履歴に追加
      const saved = JSON.parse(localStorage.getItem("titles") || "[]");
      if (!saved.includes(title)) {
        saved.push(title);
        localStorage.setItem("titles", JSON.stringify(saved));
      }
      updateTitleList();
    })
    .catch(() => {
      status.textContent = "⚠️ 通信に失敗しました。";
    });
}

startBtn.addEventListener("click", startReading);

// --- Enterキーで読書開始 ---
titleInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !startBtn.disabled) {
    startReading();
  }
});

// --- 読書終了 ---
endBtn.addEventListener("click", () => {
  if (!sessionId) return;

  // 読書終了を送信
  fetch(gasUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "end",
      sessionId,
      sheetUrl
    })
  })
    .then(res => res.text())
    .then(res => {
      // --- #NUM! 対策 ---
      // GAS側で安全処理済みだが、念のためNaN防止チェックを追加
      if (res.includes("Error") || res.includes("NUM")) {
        status.textContent = "⚠️ 計算エラーが発生しました（1分として記録されます）。";
      } else {
        status.textContent = "✅ 記録しました。";
      }

      readingActive = false;
      startBtn.disabled = false;
      endBtn.disabled = true;
      sessionId = null;
    })
    .catch(() => {
      status.textContent = "⚠️ 通信に失敗しました。";
    });
});

// --- ページ離脱時の警告 ---
window.addEventListener("beforeunload", (event) => {
  if (readingActive) {
    event.preventDefault();
    event.returnValue = "終了ボタンを押してから閉じてください。";
  }
});
