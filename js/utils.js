/* =========================================================
   utils.js — 小さな共通ヘルパー（DOM取得・文字列処理・通知・日付）
   依存: なし
   ========================================================= */

/** id から要素を取得する短縮関数 */
const $ = id => document.getElementById(id);

/** HTML特殊文字をエスケープし、ユーザー入力を安全に埋め込めるようにする */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
}[c]));

/** 画面下に短いメッセージ（トースト）を一定時間だけ表示する */
function toast(msg){
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._tm);
  t._tm = setTimeout(() => t.classList.remove("show"), 2200);
}

/** "2026-06-20" → "6/20（土）" の形に整える。空・不正値はそのまま返す */
function fmtDate(d){
  if(!d) return "";
  const dt = new Date(d + "T00:00:00");
  if(isNaN(dt)) return d;
  const w = "日月火水木金土"[dt.getDay()];
  return `${dt.getMonth()+1}/${dt.getDate()}（${w}）`;
}
