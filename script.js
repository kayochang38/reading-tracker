const gasUrl = "https://script.google.com/macros/s/AKfycbxi-4SNxOb-DTf0L2YC3COLhkCkrBzhJHzCk85fi7a8XTPiR6BKkCCQFhLqckrK3P6X/exec"; // ← あなたのGAS URL
let sheetUrl = "";
let sessionId = null;
let readingActive = false;

// 要素取得
const testBtn = document.getElementById("testBtn");
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const connectionStatus = document.getElementById("connectionStatus");
const status = document.getElementById("status");
const urlInput = document.getElementById("sheetUrl");

// ✅ ページ読み込み時にlocalStorageから復元
window.addEventListener("DOMContentLoaded", () => {
  const savedUrl = localStorage.getItem("sheetUrl");
  if (savedUrl) {
    urlInput.value = savedUrl;
  }
});

// ✅ 接続テスト
testBtn.addEventListener("click", () => {
  sheetUrl = urlInput.value.trim();
  if (!sheetUrl) return alert("スプレッドシートのURLを入力してください。");

  // 保存
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
        startBtn.disabled = true;
      }
    })
    .catch(() => {
      connectionStatus.textContent = "⚠️ 通信エラーが発生しました。";
      connectionStatus.classList.add("error");
      startBtn.disabled = true;
    });
});

// 📖 読書開始
startBtn.addEventListener("click", () => {
  const title = document.getElementById("title").value.trim();
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
      status.textContent = "📚 読書中...";
    })
    .catch(() => {
      status.textContent = "⚠️ 通信に失敗しました。";
    });
});

// 🏁 読書終了
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

// ⚠️ ページ離脱時の警告
window.addEventListener("beforeunload", (event) => {
  if (readingActive) {
    event.preventDefault();
    event.returnValue = "終了ボタンを押してから閉じてください。";
  }
});
