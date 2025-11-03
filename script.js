// === GAS接続先（proxy.php経由） ===
const gasUrl = "https://laboratomie.com/proxy.php";

let sheetUrl = "";
let sessionId = null;
let readingActive = false;

// DOM取得
const testBtn = document.getElementById("testBtn");
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const connectionStatus = document.getElementById("connectionStatus");
const status = document.getElementById("status");
const urlInput = document.getElementById("sheetUrl");
const titleInput = document.getElementById("title");

// --- 🔄 localStorageから復元 ---
window.addEventListener("DOMContentLoaded", () => {
  const savedUrl = localStorage.getItem("sheetUrl");
  if (savedUrl) urlInput.value = savedUrl;

  // 過去タイトルの履歴を datalist に追加
  const savedTitles = JSON.parse(localStorage.getItem("titles") || "[]");
  const dataList = document.createElement("datalist");
  dataList.id = "titleSuggestions";
  savedTitles.forEach(title => {
    const option = document.createElement("option");
    option.value = title;
    dataList.appendChild(option);
  });
  document.body.appendChild(dataList);
  titleInput.setAttribute("list", "titleSuggestions");
});

// --- ⚡ 接続テスト ---
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

// --- 📚 読書開始 ---
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

      // タイトルを履歴に保存
      const saved = JSON.parse(localStorage.getItem("titles") || "[]");
      if (!saved.includes(title)) {
        saved.push(title);
        localStorage.setItem("titles", JSON.stringify(saved));
      }
    })
    .catch(() => {
      status.textContent = "⚠️ 通信に失敗しました。";
    });
}

startBtn.addEventListener("click", startReading);

// --- 💡 Enterキーで読書開始 ---
titleInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !startBtn.disabled) {
    startReading();
  }
});

// --- 🏁 読書終了 ---
endBtn.addEventListener("click", () => {
  if (!sessionId) return;
  fetch(gasUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "end", sessionId, sheetUrl })
  })
    .then(res => res.text())
    .then(() => {
      readingActive = false;
      startBtn.disabled = false;
      endBtn.disabled = true;
      status.textContent = "✅ 記録しました。";
      sessionId = null;
    })
    .catch(() => {
      status.textContent = "⚠️ 通信に失敗しました。";
    });
});

// --- ⚠️ ページ離脱時警告 ---
window.addEventListener("beforeunload", (event) => {
  if (readingActive) {
    event.preventDefault();
    event.returnValue = "終了ボタンを押してから閉じてください。";
  }
});

