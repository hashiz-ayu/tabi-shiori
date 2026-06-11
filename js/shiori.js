/* =========================================================
   shiori.js — ③しおりをみる：印刷用のしおりHTMLを組み立てる
   依存: utils.js（$, esc, fmtDate）, state.js（S）
   ========================================================= */

/** しおり全体（表紙＋各日＋締め）を描画する */
function renderShiori(){
  $("shioriView").innerHTML =
    shioriCover() + S.days.map(shioriDay).join("") + shioriFoot();
}

/** 表紙（タイトル・日程・メンバー・スタンプ） */
function shioriCover(){
  return `
    <div class="sh-cover">
      <div class="kazari">✿ た び の し お り ✿</div>
      <h1>${esc(S.title)||"わたしたちの旅"}</h1>
      <div class="date">${esc(S.date)}</div>
      <div class="members">${esc(S.members)}</div>
      <div class="sh-stamp">GOOD<br>TRIP!</div>
    </div>`;
}

/** 1日分の見出しと予定一覧 */
function shioriDay(d, i){
  let html = `<div class="sh-day"><h2>${i+1}日目${d.date?`<small>${fmtDate(d.date)}</small>`:""}</h2>`;
  if(!d.stops.length) html += `<div class="mm note">（よていは これから ♪）</div>`;
  d.stops.forEach((s, j)=>{
    if(j>0) html += `<div class="sh-line"></div>`;
    html += `<div class="sh-row">
      <div class="tm">${esc(s.time)||"--:--"}</div>
      <div><div class="nm">${esc(s.name)||"（未定）"}</div>
      ${s.memo?`<div class="mm">${esc(s.memo)}</div>`:""}</div>
    </div>`;
  });
  html += `</div>`;
  return html;
}

/** 締めのひとこと */
function shioriFoot(){
  return `<div class="sh-foot">わすれもの・きっぷ・カメラ よし！ ☑</div>`;
}
