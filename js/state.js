/* =========================================================
   state.js — アプリの状態（しおりデータ）と、その保存・読み込み
   依存: storage.js（store）
   ========================================================= */

/** localStorage に保存するときのキー */
const STORAGE_KEY = "tabi-shiori-v1";

/** 初期状態を作る。地図の初期位置は箱根あたり */
const DEFAULT = () => ({
  title:"", date:"", members:"",
  days:[{date:"", stops:[]}],
  curDay:0,
  view:{lat:35.2329, lng:139.1069, z:13}
});

/** S … アプリ全体で共有する唯一の状態オブジェクト */
let S;
try{ S = JSON.parse(store.get(STORAGE_KEY)) || DEFAULT(); }
catch(e){ S = DEFAULT(); }
if(!S.days || !S.days.length) S = DEFAULT();

/** 現在の状態を localStorage に保存する */
function save(){ store.set(STORAGE_KEY, JSON.stringify(S)); }
