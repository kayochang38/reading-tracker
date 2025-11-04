// ====== Constants & Keys ======
const RELAY_ENDPOINT = 'https://www.laboratomie.com/reading-tracker/relay.php';
const LS_KEYS = {
  sheetUrl: 'rt.sheet_url',
  titleHistory: 'rt.title_history',
  deviceId: 'rt.device_id',
  pendingIds: 'rt.pending_ids',
  seq: (yyyyMMdd) => `rt.seq.${yyyyMMdd}`,
};
const SS_KEYS = { session: 'rt.session' };

// ====== Audio / Mute System ======
let isMuted = localStorage.getItem('rt.is_muted') === 'true';
function playSound(name) {
  if (isMuted) return;
  const audio = new Audio(`./${name}.mp3`);
  audio.play().catch(() => {});
}
function toggleMute() {
  isMuted = !isMuted;
  localStorage.setItem('rt.is_muted', String(isMuted));
  updateMuteButton();
}
function updateMuteButton() {
  const btn = document.querySelector('#muteBtn');
  if (!btn) return;
  if (isMuted) {
    btn.classList.add('muted');
    btn.classList.remove('unmuted');
    btn.textContent = '🔇 ミュート中';
  } else {
    btn.classList.add('unmuted');
    btn.classList.remove('muted');
    btn.textContent = '🔈 ミュート解除中';
  }
}

// ====== Utilities ======
const $ = (sel) => document.querySelector(sel);
const pad2 = (n) => String(n).padStart(2, '0');
function todayYMD() {
  const d = new Date();
  return `${d.getFullYear()}${pad2(d.getMonth()+1)}${pad2(d.getDate())}`;
}
function todayD6() {
  const d = new Date();
  return `${String(d.getFullYear()).slice(-2)}${pad2(d.getMonth()+1)}${pad2(d.getDate())}`;
}
function ensureDeviceId() {
  let did = localStorage.getItem(LS_KEYS.deviceId);
  if (!did) {
    const rand4 = Math.floor(1000 + Math.random()*9000);
    did = `D-${todayD6()}-${rand4}`;
    localStorage.setItem(LS_KEYS.deviceId, did);
  }
  return did;
}
function nextSeq(did) {
  const ymd = todayYMD();
  const key = LS_KEYS.seq(ymd);
  let n = Number(localStorage.getItem(key) || '0') + 1;
  localStorage.setItem(key, String(n));
  return String(n).padStart(4, '0');
}
function buildReadingId(did) {
  return `R${todayYMD()}-${did}-${nextSeq(did)}`;
}
function setStatus(msg, color) {
  const el = $('#status');
  el.textContent = msg || '';
  el.style.color = color || '#3e2f1c';
}

// ====== POST (URLエンコード版・最終安定形) ======
async function postToRelay(payload) {
  const params = new URLSearchParams();
  for (const key in payload) params.append(key, payload[key]);
  const res = await fetch(RELAY_ENDPOINT, { method: 'POST', body: params });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

// ====== Logic ======
window.addEventListener('DOMContentLoaded', () => {
  // ===== 初期化 =====
  updateMuteButton();
  $('#muteBtn').onclick = toggleMute;

  const did = ensureDeviceId();
  $('#deviceId').textContent = did;
  $('#endBtn').disabled = true;

  // ===== タイトル履歴 =====
  function loadTitleHistory() {
    const titles = JSON.parse(localStorage.getItem('rt.titles') || '[]');
    const list = $('#titleHistory');
    list.innerHTML = titles.length
      ? titles.map((t) => `<li>${t}</li>`).join('')
      : '<li class="empty">履歴はありません</li>';
  }
  loadTitleHistory();

  $('#titleHistory').addEventListener('click', (e) => {
    if (e.target.tagName === 'LI' && !e.target.classList.contains('empty')) {
      $('#titleInput').value = e.target.textContent;
    }
  });

  $('#clearHistoryBtn').onclick = () => {
    localStorage.removeItem('rt.titles');
    loadTitleHistory();
    setStatus('タイトル履歴をクリアしました。', '#555');
  };

  // ===== Enterキーで開始 =====
  const titleInput = $('#titleInput');
  if (titleInput) {
    titleInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        $('#startBtn').click();
      }
    });
  }

  // ===== 開始 =====
  $('#startBtn').onclick = async () => {
    const title = $('#titleInput').value.trim();
    if (!title) {
      setStatus('タイトルを入力してください。', '#b62324');
      playSound('alert');
      return;
    }

    let sheetUrl = $('#sheetUrl').value.trim().replace(/[\?#].*$/, '');
    if (!/\/edit$/.test(sheetUrl)) sheetUrl += '/edit';
    localStorage.setItem(LS_KEYS.sheetUrl, sheetUrl);

    const readingId = buildReadingId(did);
    const startTsISO = new Date().toISOString();

    const payload = {
      mode: 'append_start',
      sheetUrl,
      id: readingId,
      device: did,
      title,
      startTimeISO: startTsISO,
    };

    try {
      setStatus('開始を送信中…');
      const json = await postToRelay(payload);
      if (json?.ok) {
        playSound('clear');
        setStatus(`開始しました：${readingId}`);
        localStorage.setItem('rt.currentId', readingId);
        if (json.sheet) localStorage.setItem('rt.sheetName', json.sheet);
        $('#currentReadingId').textContent = readingId;

        // ✅ 開始時に未完了一覧を閉じる
        const section = document.querySelector('#unfinishedSection');
        const list = document.querySelector('#unfinishedList');
        if (section) section.style.display = 'none';
        if (list) list.innerHTML = '';

        let titles = JSON.parse(localStorage.getItem('rt.titles') || '[]');
        if (!titles.includes(title)) {
          titles.unshift(title);
          titles = titles.slice(0, 10);
        }
        localStorage.setItem('rt.titles', JSON.stringify(titles));
        loadTitleHistory();

        $('#endBtn').disabled = false;
      } else {
        playSound('alert');
        setStatus('⚠️ 開始送信に失敗しました。', '#b62324');
      }
    } catch (e) {
      playSound('alert');
      setStatus('通信エラー：relay.phpに接続できません。', '#b62324');
    }
  };

  // ===== 終了 =====
  $('#endBtn').onclick = async () => {
    const sheetUrl = $('#sheetUrl').value.trim();
    const currentId = localStorage.getItem('rt.currentId');
    if (!sheetUrl || !currentId) {
      setStatus('⚠️ 開始データが見つかりません。', '#b62324');
      return;
    }

    const payload = {
      mode: 'append_end',
      sheetUrl,
      id: currentId,
      endTimeISO: new Date().toISOString(),
    };

    try {
      setStatus('終了を送信中…');
      const json = await postToRelay(payload);
      if (json?.ok) {
        playSound('clear');
        setStatus(`終了しました：${currentId}`);
        localStorage.removeItem('rt.currentId');
        $('#currentReadingId').textContent = '(なし)';
        $('#endBtn').disabled = true;

        // 一覧をクリア（安全措置）
        const section = document.querySelector('#unfinishedSection');
        if (section) section.style.display = 'none';
        const list = document.querySelector('#unfinishedList');
        if (list) list.innerHTML = '';

        // ✅ 開始ボタンを再度有効化
        $('#startBtn').disabled = false;
      } else {
        playSound('alert');
        setStatus('⚠️ 終了送信に失敗しました。', '#b62324');
      }
    } catch (e) {
      playSound('alert');
      setStatus('通信エラー：relay.phpに接続できません。', '#b62324');
    }
  };

  // ===== 照合（未完了一覧） =====
  $('#verifyBtn').onclick = async () => {
    setStatus('照合中…');
    try {
      const sheetUrl = $('#sheetUrl').value.trim();
      if (!sheetUrl) {
        setStatus('スプレッドシートURLを入力してください。', '#b62324');
        return;
      }

      const json = await postToRelay({
        mode: 'verify',
        sheetUrl,
        device: ensureDeviceId(),
      });

      const section = $('#unfinishedSection');
      const list = $('#unfinishedList');
      list.innerHTML = '';

      if (json?.ok && json.unfinished?.length) {
        section.style.display = 'block';
        list.innerHTML = json.unfinished.map(item => `
          <div class="unfinished-card" data-id="${item.ID}" data-row="${item.row}">
            <p>📘 <strong>${item.Title}</strong></p>
            <p>開始：${new Date(item.StartTime).toLocaleString('ja-JP')}</p>
            <div class="button-row">
              <button class="continueBtn primary">続ける</button>
              <button class="finishBtn secondary">終了する</button>
              <button class="deleteBtn danger">削除</button>
            </div>
          </div>
        `).join('');

        setStatus(`未完了の読書が ${json.unfinished.length} 件あります。`);

        // ===== 続ける =====
        list.querySelectorAll('.continueBtn').forEach(btn => {
          btn.onclick = e => {
            const card = e.target.closest('.unfinished-card');
            const title = card.querySelector('strong').textContent;
            const id = card.dataset.id;
            $('#titleInput').value = title;
            $('#endBtn').disabled = false;
            $('#startBtn').disabled = true;
            localStorage.setItem('rt.currentId', id);
            localStorage.setItem('rt.lastTitle', title);
            setStatus(`読書を再開中：${title}`);

            // 一覧を即非表示
            section.style.display = 'none';
            list.innerHTML = '';
          };
        });

        // ===== 終了する =====
        list.querySelectorAll('.finishBtn').forEach(btn => {
          btn.onclick = async e => {
            const card = e.target.closest('.unfinished-card');
            const id = card.dataset.id;
            const json = await postToRelay({
              mode: 'append_end',
              sheetUrl,
              id,
              device: ensureDeviceId(),
              endTimeISO: new Date().toISOString(),
            });
            if (json.ok) {
              card.remove();
              setStatus(`「${card.querySelector('strong').textContent}」を終了しました。`);
              // 一覧が空なら非表示
              if (list.children.length === 0) {
                section.style.display = 'none';
                list.innerHTML = '';
              }
              // ✅ 開始ボタンを再び有効化
              $('#startBtn').disabled = false;
            }
          };
        });

        // ===== 削除 =====
        list.querySelectorAll('.deleteBtn').forEach(btn => {
          btn.onclick = async e => {
            const card = e.target.closest('.unfinished-card');
            const row = card.dataset.row;
            const json = await postToRelay({
              mode: 'delete_row',
              sheetUrl,
              row,
            });
            if (json.ok) {
              card.remove();
              setStatus(`「${card.querySelector('strong').textContent}」の記録を削除しました。`);
              // 一覧が空なら非表示
              if (list.children.length === 0) {
                section.style.display = 'none';
                list.innerHTML = '';
              }
              // ✅ 開始ボタンを再び有効化
              $('#startBtn').disabled = false;
            }
          };
        });

      } else {
        section.style.display = 'none';
        setStatus('未完了の読書はありません。');
      }
    } catch (e) {
      console.error(e);
      setStatus('通信エラー：relay.phpに接続できません。', '#b62324');
    }
  };

  // ===== 手動で未完了一覧を閉じる =====
  const closeBtn = document.querySelector('#closeUnfinishedBtn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      const section = document.querySelector('#unfinishedSection');
      const list = document.querySelector('#unfinishedList');
      if (section) section.style.display = 'none';
      if (list) list.innerHTML = '';
      setStatus('未完了一覧を閉じました。');
    };
  }
});
