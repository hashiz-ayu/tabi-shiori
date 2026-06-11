/* =========================================================
   map.js — ①エリアをえらぶ：地図の表示とスポット検索
   依存: utils.js（$, esc, toast）, state.js（S, save）, plan.js（renderPlan）
   外部 : Leaflet（L）, OpenStreetMap タイル, Nominatim, Overpass API
   ========================================================= */

/* ---------- 地図の初期化 ---------- */
const map = L.map("map").setView([S.view.lat, S.view.lng], S.view.z);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom:19, attribution:'&copy; OpenStreetMap contributors'
}).addTo(map);

// 地図を動かしたら、その表示位置を覚えておく（次回起動時に復元する）
map.on("moveend", ()=>{
  const c = map.getCenter();
  S.view = {lat:c.lat, lng:c.lng, z:map.getZoom()};
  save();
});

// 検索結果のピンをまとめて置くレイヤー
let markers = L.layerGroup().addTo(map);

/* ---------- 地名ジャンプ（Nominatim・無料） ---------- */
async function geoJump(){
  const q = $("geoInput").value.trim();
  if(!q) return;
  $("geoBtn").disabled = true;
  try{
    const r = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=ja&q=" + encodeURIComponent(q));
    const j = await r.json();
    if(j[0]){ map.setView([+j[0].lat, +j[0].lon], 14); toast("「"+q+"」へ移動したよ"); }
    else toast("見つからなかった…別の書き方で試してみて");
  }catch(e){ toast("検索エラー。少し待って再度どうぞ"); }
  $("geoBtn").disabled = false;
}
$("geoBtn").addEventListener("click", geoJump);
$("geoInput").addEventListener("keydown", e=>{ if(e.key==="Enter") geoJump(); });

/* ---------- カテゴリの選択状態と、チップの開閉操作 ---------- */
const cats = {yado:true, onsen:true, kanko:true, gurume:false};
document.querySelectorAll("#catChips .chip").forEach(c=>{
  c.addEventListener("click", ()=>{
    cats[c.dataset.cat] = !cats[c.dataset.cat];
    c.classList.toggle("on", cats[c.dataset.cat]);
  });
});

/* ---------- カテゴリ定義（ラベル・CSSクラス・Overpassクエリ断片） ---------- */
const CAT_DEF = {
  yado:  {label:"宿",   cls:"yado",   q:'nwr["tourism"~"hotel|guest_house|hostel|motel"]'},
  onsen: {label:"温泉", cls:"onsen",  q:'nwr["amenity"="public_bath"];nwr["leisure"="spa"];nwr["natural"="hot_spring"]'},
  kanko: {label:"観光", cls:"kanko",  q:'nwr["tourism"~"attraction|museum|viewpoint|zoo|aquarium|theme_park"];nwr["historic"~"castle|shrine|temple|monument|ruins"];nwr["amenity"="place_of_worship"]["name"]'},
  gurume:{label:"グルメ", cls:"gurume", q:'nwr["amenity"~"restaurant|cafe"]["name"]'}
};

/* ---------- いま見えているエリアでスポットを検索（Overpass） ---------- */
async function searchArea(){
  const btn = $("searchAreaBtn");
  btn.disabled = true; btn.textContent = "🔍 さがしています…";

  // 地図の表示範囲を bbox 文字列にする
  const b = map.getBounds();
  const bbox = [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()].map(n=>n.toFixed(5)).join(",");

  // 選択中カテゴリのクエリ断片を、bbox 付きで連結する
  const parts = Object.keys(cats).filter(k=>cats[k])
    .flatMap(k=>CAT_DEF[k].q.split(";"))
    .map(q=>q+`["name"](${bbox});`).join("");
  if(!parts){
    toast("カテゴリを1つ以上選んでね");
    btn.disabled=false; btn.textContent="📍 いま見えているエリアでさがす";
    return;
  }

  const query = `[out:json][timeout:25];( ${parts} );out center 60;`;
  try{
    const r = await fetch("https://overpass-api.de/api/interpreter", {method:"POST", body:"data="+encodeURIComponent(query)});
    const j = await r.json();
    renderResults(j.elements||[]);
    toast((j.elements||[]).length+" 件みつかったよ");
  }catch(e){
    $("results").innerHTML = '<div class="empty">検索が混み合っているみたい…<br>少し待ってもう一度押してみてね</div>';
  }
  btn.disabled = false; btn.textContent = "📍 いま見えているエリアでさがす";
}
$("searchAreaBtn").addEventListener("click", searchArea);

/* ---------- 検索結果のタグから、表示用カテゴリを判定 ---------- */
function catOf(tags){
  if(/hotel|guest_house|hostel|motel/.test(tags.tourism||"")) return "yado";
  if(tags.amenity==="public_bath"||tags.leisure==="spa"||tags.natural==="hot_spring") return "onsen";
  if(tags.amenity==="restaurant"||tags.amenity==="cafe") return "gurume";
  return "kanko";
}

/* ---------- 検索結果を、地図のピンとカード一覧に描画 ---------- */
function renderResults(els){
  markers.clearLayers();

  // 名前のあるものだけを、重複を除いて最大60件に絞る
  const seen = new Set();
  const items = els.filter(e=>{
    const n = e.tags && e.tags.name;
    if(!n || seen.has(n)) return false;
    seen.add(n); return true;
  }).slice(0, 60);

  if(!items.length){
    $("results").innerHTML = '<div class="empty">このエリアでは見つからなかった…<br>少しズームアウトしたり、カテゴリを増やしてみてね</div>';
    return;
  }

  // 宿→温泉→観光→グルメ の順に並べる
  const order = {yado:0, onsen:1, kanko:2, gurume:3};
  items.sort((a,b)=>order[catOf(a.tags)]-order[catOf(b.tags)]);

  $("results").innerHTML = "";
  items.forEach(e=> $("results").appendChild(buildSpotCard(e)));
}

/* ---------- 1件のスポットカードを作り、地図にもピンを立てる ---------- */
function buildSpotCard(e){
  const t = e.tags, name = t.name;
  const lat = e.lat ?? e.center?.lat, lng = e.lon ?? e.center?.lon;
  const cat = catOf(t);
  const hp = t.website || t["contact:website"] || t.url || "";
  const gmap = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=&center=${lat},${lng}`;
  const gsearch = `https://www.google.com/search?q=${encodeURIComponent(name+" 公式サイト")}`;

  L.marker([lat, lng]).addTo(markers).bindPopup(esc(name));

  const card = document.createElement("div");
  card.className = "spot-card";
  card.innerHTML = `
    <span class="cat ${CAT_DEF[cat].cls}">${CAT_DEF[cat].label}</span>
    <h3>${esc(name)}</h3>
    <div class="spot-links">
      ${hp?`<a href="${esc(hp)}" target="_blank" rel="noopener">🏠 公式HP</a>`:`<a href="${gsearch}" target="_blank" rel="noopener">🔎 HPを検索</a>`}
      <a href="${gmap}" target="_blank" rel="noopener">🗾 Googleマップ</a>
    </div>
    <div class="spot-actions">
      <select class="day-sel"></select>
      <button class="btn shu sm add-btn">＋ プランに追加</button>
    </div>`;

  // 「○日目」の選択肢を作り、いま開いている日を初期選択にする
  const sel = card.querySelector(".day-sel");
  S.days.forEach((d, i)=> sel.add(new Option(`${i+1}日目`, i)));
  sel.value = Math.min(S.curDay, S.days.length-1);

  // 「＋ プランに追加」で、選んだ日にこのスポットを追加する
  card.querySelector(".add-btn").addEventListener("click", ()=>{
    const di = +sel.value;
    S.days[di].stops.push({time:"", name, memo:"", lat, lng, url:hp||gsearch});
    S.curDay = di; save(); renderPlan();
    toast(`「${name}」を ${di+1}日目 に追加したよ ♪`);
  });
  return card;
}
