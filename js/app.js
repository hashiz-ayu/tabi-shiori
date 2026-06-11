/* =========================================================
   app.js — 起動と全体の橋渡し（ヘッダー入力・タブ切替・初期描画）
   依存: utils.js（$）, state.js（S, save）, map.js（map）,
         plan.js（renderPlan）, shiori.js（renderShiori）
   ※ 他のスクリプトをすべて読み込んだ後に、最後に読み込むこと
   ========================================================= */

/* ---------- ヘッダーの入力欄（タイトル・日程・メンバー） ---------- */
// 入力欄のid → 状態(S)のキー の対応
const HEAD_FIELDS = {tripTitle:"title", tripDate:"date", tripMembers:"members"};
Object.entries(HEAD_FIELDS).forEach(([id, key])=>{
  $(id).value = S[key]||"";
  $(id).addEventListener("input", e=>{ S[key]=e.target.value; save(); renderShiori(); });
});

/* ---------- タブ切り替え ---------- */
document.querySelectorAll(".tab").forEach(b=>{
  b.addEventListener("click", ()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    document.querySelectorAll(".pane").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    $("pane-"+b.dataset.pane).classList.add("active");
    // 各タブを開いたときの追加処理
    if(b.dataset.pane==="map")    setTimeout(()=>map.invalidateSize(), 60); // 隠れていた地図のサイズを再計算
    if(b.dataset.pane==="shiori") renderShiori();
    if(b.dataset.pane==="plan")   renderPlan();
  });
});

/* ---------- 初期描画 ---------- */
renderPlan();
renderShiori();
