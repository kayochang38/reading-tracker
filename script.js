// === Reading Tracker JS ===
// Google Apps ScriptのデプロイURLをここに貼る
const gasUrl = "https://script.google.com/macros/s/AKfycbztXC-aATn37POxGaAj4PFmzKFo26bneQOJEScn4_gfx3gtd7Y_KpQlMNdglGHCPwf9/exec";

let sessionId = null;
let readingActive = false;

const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const status = document.getElementById("status");

// --- 読書開始 ---
startBtn.addEventListener("click", () => {
  const title = document.getElementById("title").value.trim();
  if (!title) {
    alert("タイトルを入力してください。");
    return;
  }

  fetch(gasUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "start", title })
  })
    .then(res => res.text())
    .then(id => {
      sessionId = id;
      readingActive = true;
      status.textContent = "読書中...";
      startBtn.disabled = true;
      endBtn.disabled = false;
      document.body.style.backgroundColor = "#f2fff2";
    })
    .catch(() => {
      status.textContent = "通信エラー。もう一度試してください。";
    });
});

// --- 読書終了 ---
endBtn.addEventListener("click", () => {
  if (!sessionId) {
    alert("セッション情報が見つかりません。");
    return;
  }

  fetch(gasUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "end", sessionId })
  })
    .then(res => res.text())
    .then(() => {
      status.textContent = "記録しました ✅";
      startBtn.disabled = false;
      endBtn.disabled = true;
      readingActive = false;
      sessionId = null;
      document.body.style.backgroundColor = "#f9f9f9";
      document.getElementById("title").value = "";
    })
    .catch(() => {
      status.textContent = "送信エラー。";
    });
});

// --- 閉じる前の警告 ---
window.addEventListener("beforeunload", (event) => {
  if (readingActive) {
    event.preventDefault();
    event.returnValue = "終了ボタンを押してから閉じてください。";
  }
});
