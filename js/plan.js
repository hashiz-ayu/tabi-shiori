/* =========================================================
   plan.js — ②プランをつくる：日ごとの予定（ストップ）の編集
   依存: utils.js（$, esc, toast）, state.js（S, save）
   ========================================================= */

/* ---------- 2地点間の乗換・経路リンクを組み立てる ---------- */
function transitLinks(a, b){
  const from = encodeURIComponent(a.name), to = encodeURIComponent(b.name);
  const yahoo = `https://transit.yahoo.co.jp/search/result?from=${from}&to=${to}`;
  const org = (a.lat!=null) ? `${a.lat},${a.lng}` : a.name;
  const dst = (b.lat!=null) ? `${b.lat},${b.lng}` : b.name;
  const gmap = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(org)}&destination=${encodeURIComponent(dst)}&travelmode=transit`;
  return {yahoo, gmap};
}

/* ---------- プラン画面（日タブ＋日付＋予定一覧）を描画 ---------- */
function renderPlan(){
  renderDayTabs();
  renderDayMeta();
  renderStops();
}

/** 日付タブと「＋日を追加」ボタンを描画 */
function renderDayTabs(){
  const dt = $("dayTabs"); dt.innerHTML = "";
  S.days.forEach((d, i)=>{
    const b = document.createElement("button");
    b.className = "day-tab" + (i===S.curDay ? " on" : "");
    b.textContent = (i+1)+"日目";
    b.addEventListener("click", ()=>{ S.curDay=i; save(); renderPlan(); });
    dt.appendChild(b);
  });
  const addD = document.createElement("button");
  addD.className = "day-tab"; addD.textContent = "＋日を追加";
  addD.addEventListener("click", ()=>{
    S.days.push({date:"", stops:[]}); S.curDay=S.days.length-1; save(); renderPlan();
  });
  dt.appendChild(addD);
}

/** 選択中の日の「日付」入力欄を描画 */
function renderDayMeta(){
  const day = S.days[S.curDay];
  $("dayDate").value = day.date||"";
  $("dayDate").onchange = e=>{ day.date=e.target.value; save(); };
}

/** 選択中の日の予定（ストップ）と、その間の移動リンクを描画 */
function renderStops(){
  const day = S.days[S.curDay];
  const list = $("stopList"); list.innerHTML = "";
  if(!day.stops.length){
    list.innerHTML = '<div class="empty">まだ予定がないよ。<br>「① エリアをえらぶ」で見つけた場所を追加するか、下のボタンで手入力してね</div>';
  }
  day.stops.forEach((s, i)=>{
    if(i>0) list.appendChild(buildTransitRow(day.stops[i-1], s));
    list.appendChild(buildTicket(day, s, i));
  });
}

/** 予定と予定の間に挟む「🚃 移動」リンク行を作る */
function buildTransitRow(prev, s){
  const links = transitLinks(prev, s);
  const tr = document.createElement("div");
  tr.className = "transit-link";
  tr.innerHTML = `🚃 移動：<a href="${links.yahoo}" target="_blank" rel="noopener">Yahoo!乗換案内</a>
    <a href="${links.gmap}" target="_blank" rel="noopener">Googleマップ経路</a>`;
  return tr;
}

/** 1件の予定を表すチケット風カードを作る（編集・並べ替え・削除つき） */
function buildTicket(day, s, i){
  const tk = document.createElement("div");
  tk.className = "ticket";
  tk.innerHTML = `
    <span class="punch-l"></span><span class="punch-r"></span>
    <div class="t-time"><input type="time" value="${esc(s.time)}"></div>
    <input class="t-name" value="${esc(s.name)}" placeholder="場所・予定名">
    <textarea class="t-memo" rows="1" placeholder="メモ（チェックイン15時、駅から送迎あり…など）">${esc(s.memo)}</textarea>
    <div class="t-ops">
      ${s.url?`<a href="${esc(s.url)}" target="_blank" rel="noopener">🏠 リンク</a>`:""}
      <button class="up">▲ 上へ</button>
      <button class="dn">▼ 下へ</button>
      <button class="rm">✂ けす</button>
    </div>`;
  tk.querySelector(".t-time input").addEventListener("change", e=>{ s.time=e.target.value; save(); });
  tk.querySelector(".t-name").addEventListener("input", e=>{ s.name=e.target.value; save(); });
  tk.querySelector(".t-memo").addEventListener("input", e=>{ s.memo=e.target.value; save(); });
  tk.querySelector(".up").addEventListener("click", ()=>{
    if(i===0) return;
    [day.stops[i-1], day.stops[i]] = [day.stops[i], day.stops[i-1]]; save(); renderPlan();
  });
  tk.querySelector(".dn").addEventListener("click", ()=>{
    if(i===day.stops.length-1) return;
    [day.stops[i+1], day.stops[i]] = [day.stops[i], day.stops[i+1]]; save(); renderPlan();
  });
  tk.querySelector(".rm").addEventListener("click", ()=>{
    day.stops.splice(i, 1); save(); renderPlan();
  });
  return tk;
}

/* ---------- 画面下部のボタン（手入力で追加・この日を削除） ---------- */
$("addStopBtn").addEventListener("click", ()=>{
  S.days[S.curDay].stops.push({time:"", name:"", memo:""});
  save(); renderPlan();
});
$("delDayBtn").addEventListener("click", ()=>{
  if(S.days.length<=1){ toast("最後の1日は消せないよ"); return; }
  if(!confirm((S.curDay+1)+"日目を削除する？")) return;
  S.days.splice(S.curDay, 1);
  S.curDay = Math.max(0, S.curDay-1);
  save(); renderPlan();
});
