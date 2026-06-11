/* =========================================================
   storage.js — データの保存先（localStorage、使えない時はメモリに退避）
   依存: なし
   ========================================================= */

/** localStorage が使えない環境（プライベートモード等）のための代替メモリ */
const mem = {};

/** 文字列の get / set だけを持つ、シンプルな保存ラッパー */
const store = {
  get(k){ try{ return localStorage.getItem(k); } catch(e){ return mem[k] ?? null; } },
  set(k, v){ try{ localStorage.setItem(k, v); } catch(e){ mem[k] = v; } }
};
