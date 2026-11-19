/* 도면 — 상태·계산·직렬화. 서버 없이 브라우저와 URL만 사용합니다. */
(function (global) {
  'use strict';

  var DY = global.DY;
  var TYPES = DY.TYPES;
  var COST = DY.COST;

  /* ── DOM 유틸 ───────────────────────────────────────────── */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
  function uid(prefix) {
    return (prefix || 'id') + '_' + Math.random().toString(36).slice(2, 7) + Date.now().toString(36).slice(-3);
  }
  function fmt1(n) { return (Math.round(n * 10) / 10).toFixed(1); }
  function fmtDate(ms) {
    var d = new Date(ms);
    function p(n) { return n < 10 ? '0' + n : String(n); }
    return d.getFullYear() + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  /* ── 블록 ───────────────────────────────────────────────── */
  function optionDef(typeId, optId) {
    var t = TYPES[typeId];
    if (!t) return null;
    for (var i = 0; i < t.options.length; i++) if (t.options[i].id === optId) return t.options[i];
    return null;
  }

  function newBlock(typeId, over) {
    var t = TYPES[typeId];
    if (!t) return null;
    var b = {
      id: uid('blk'),
      type: typeId,
      label: t.name,
      col: 1,
      row: 1,
      span: t.span,
      rows: t.rows,
      options: []
    };
    if (over) for (var k in over) if (Object.prototype.hasOwnProperty.call(over, k)) b[k] = over[k];
    b.span = clamp(b.span, 1, 12);
    b.rows = clamp(b.rows, 1, 14);
    return b;
  }

  function levelOf(b) {
    var t = TYPES[b.type];
    var lv = t ? t.level : 1;
    (b.options || []).forEach(function (o) {
      var d = optionDef(b.type, o);
      if (d && d.level > lv) lv = d.level;
    });
    return lv;
  }

  function specOf(b) {
    var t = TYPES[b.type];
    if (!t) return '';
    var parts = [];
    (b.options || []).forEach(function (o) {
      var d = optionDef(b.type, o);
      if (d) parts.push(d.spec);
    });
    if (!parts.length) return t.fallback;
    return parts.join(', ') + '.';
  }

  /* ── 배치: 12컬럼 격자 패킹 ──────────────────────────────── */
  function occupancy(list, skipId) {
    var occ = [];
    list.forEach(function (b) {
      if (b.id === skipId) return;
      for (var y = b.row; y < b.row + b.rows; y++) {
        var row = occ[y] || (occ[y] = []);
        for (var x = b.col; x < b.col + b.span; x++) row[x] = true;
      }
    });
    return occ;
  }
  function isFree(occ, r, c, span, rows) {
    if (c < 1 || c + span - 1 > 12) return false;
    for (var y = r; y < r + rows; y++) {
      var row = occ[y];
      if (!row) continue;
      for (var x = c; x < c + span; x++) if (row[x]) return false;
    }
    return true;
  }
  function mark(occ, r, c, span, rows) {
    for (var y = r; y < r + rows; y++) {
      var row = occ[y] || (occ[y] = []);
      for (var x = c; x < c + span; x++) row[x] = true;
    }
  }

  /* 읽기 순서대로 처음 비는 자리에 채워 넣습니다. */
  function pack(list) {
    var occ = [];
    list.forEach(function (b) {
      var span = clamp(b.span, 1, 12), rows = clamp(b.rows, 1, 14);
      var done = false;
      for (var r = 1; !done && r < 600; r++) {
        for (var c = 1; c <= 12 - span + 1; c++) {
          if (isFree(occ, r, c, span, rows)) { b.row = r; b.col = c; mark(occ, r, c, span, rows); done = true; break; }
        }
      }
      if (!done) { b.row = 1; b.col = 1; }
    });
    return list;
  }

  function readOrder(list) {
    return list.slice().sort(function (a, b) {
      return a.row - b.row || a.col - b.col;
    });
  }

  function bottomRow(list) {
    var m = 0;
    list.forEach(function (b) { m = Math.max(m, b.row + b.rows - 1); });
    return m;
  }

  /* 겹침이 있으면 아래로 밀어냅니다. */
  function settle(list, id) {
    var b = list.filter(function (x) { return x.id === id; })[0];
    if (!b) return;
    var occ = occupancy(list, id);
    var guard = 0;
    while (!isFree(occ, b.row, b.col, b.span, b.rows) && guard++ < 400) {
      b.row += 1;
    }
  }

  function autoPackAll(list) {
    var ordered = readOrder(list);
    var occ = [];
    ordered.forEach(function (b) {
      var span = clamp(b.span, 1, 12), rows = clamp(b.rows, 1, 14);
      var done = false;
      for (var r = 1; !done && r < 600; r++) {
        for (var c = 1; c <= 12 - span + 1; c++) {
          if (isFree(occ, r, c, span, rows)) { b.row = r; b.col = c; mark(occ, r, c, span, rows); done = true; break; }
        }
      }
    });
    return ordered;
  }

  /* ── 견적 ───────────────────────────────────────────────── */
  function estimate(list) {
    var total = COST.setup;
    var byLevel = { 1: 0, 2: 0, 3: 0 };
    var pending = 0;
    var hasOptions = 0;
    list.forEach(function (b) {
      var lv = levelOf(b);
      byLevel[lv] += 1;
      total += COST.level[lv];
      var opts = (b.options || []).filter(function (o) { return !!optionDef(b.type, o); });
      if (TYPES[b.type] && TYPES[b.type].options.length) hasOptions += 1;
      if (!opts.length && TYPES[b.type] && TYPES[b.type].options.length) pending += 1;
      opts.forEach(function (o) {
        var d = optionDef(b.type, o);
        total += COST.option[d.level] || 0;
      });
    });
    return {
      total: total,
      low: total * COST.lowRate,
      high: total * COST.highRate,
      byLevel: byLevel,
      pending: pending,
      withOptions: hasOptions
    };
  }

  function money(range, unit) {
    var lo = Math.round(range.low * unit / 10000);
    var hi = Math.round(range.high * unit / 10000);
    function man(v) {
      if (v >= 10000) return (v / 10000).toFixed(v % 10000 === 0 ? 0 : 1) + '억';
      return v.toLocaleString('ko-KR');
    }
    return man(lo) + ' ~ ' + man(hi) + '만원';
  }

  /* 문서 전체(여러 페이지) 견적: 공통 1회 + 추가 페이지마다 레이아웃 공수 */
  function estimateDoc(st) {
    var pages = allPages(st);
    var total = COST.setup + Math.max(0, pages.length - 1) * COST.page;
    var byLevel = { 1: 0, 2: 0, 3: 0 };
    var pending = 0, count = 0;
    pages.forEach(function (pg) {
      var e = estimate(pg.blocks);
      total += e.total - COST.setup;
      byLevel[1] += e.byLevel[1];
      byLevel[2] += e.byLevel[2];
      byLevel[3] += e.byLevel[3];
      pending += e.pending;
      count += pg.blocks.length;
    });
    return {
      total: total,
      low: total * COST.lowRate,
      high: total * COST.highRate,
      byLevel: byLevel,
      pending: pending,
      pageCount: pages.length,
      blockCount: count,
      pageCost: Math.max(0, pages.length - 1) * COST.page
    };
  }

  /* ── 해시 ───────────────────────────────────────────────── */
  function fnv(str, seed) {
    var h = seed >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return ('0000000' + h.toString(16)).slice(-8);
  }
  function specString(list) {
    return readOrder(list).map(function (b) {
      return [b.type, b.label, b.col, b.row, b.span, b.rows, levelOf(b), (b.options || []).slice().sort().join('+')].join('|');
    }).join(';') + '#n' + list.length;
  }
  function hashSpec(list) {
    var s = specString(list);
    return 'v1-' + fnv(s, 0x811c9dc5) + fnv(s, 0x5bd1e995);
  }
  function specStringDoc(st) {
    return allPages(st).map(function (pg) {
      return pg.name + ':' + specString(pg.blocks);
    }).join('~');
  }
  function hashDoc(st) {
    var s = specStringDoc(st);
    return 'v1-' + fnv(s, 0x811c9dc5) + fnv(s, 0x5bd1e995);
  }

  /* ── 인코딩 ─────────────────────────────────────────────── */
  function b64url(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function unb64url(s) {
    s = String(s).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function serBlocks(list) {
    return list.map(function (b) {
      return [b.id, b.type, b.label, b.col, b.row, b.span, b.rows, (b.options || []).slice()];
    });
  }
  function toPayload(st) {
    var pages = allPages(st);
    var p = {
      v: 2,
      n: st.name,
      t: st.tpl || '',
      cur: st.current,
      pg: pages.map(function (pg) { return { i: pg.id, n: pg.name, b: serBlocks(pg.blocks) }; }),
      k: st.threads,
      l: st.lock ? [st.lock.hash, st.lock.at, st.lock.note || ''] : null
    };
    if (st.lock && st.lock.pages) {
      p.lp = st.lock.pages.map(function (pg) { return { i: pg.id, n: pg.name, b: serBlocks(pg.blocks) }; });
    }
    return p;
  }
  function rowToBlock(r) {
    return {
      id: r[0] || uid('blk'), type: r[1], label: r[2] || '',
      col: clamp(r[3] || 1, 1, 12), row: clamp(r[4] || 1, 1, 99),
      span: clamp(r[5] || 12, 1, 12), rows: clamp(r[6] || 3, 1, 14),
      options: Array.isArray(r[7]) ? r[7] : []
    };
  }
  function rowsToPages(list, fallbackName) {
    var pages = (list || []).map(function (pg) {
      if (Array.isArray(pg)) return { id: uid('pg'), name: fallbackName || '메인', blocks: pg.map(rowToBlock) };
      return { id: pg.i || uid('pg'), name: pg.n || '새 페이지', blocks: (pg.b || []).map(rowToBlock) };
    });
    if (!pages.length) pages.push(newPage(fallbackName || '메인'));
    return pages;
  }
  function fromPayload(p) {
    var st = blankState();
    st.name = p.n || '이름 없는 도면';
    st.tpl = p.t || '';
    if (Array.isArray(p.pg)) {
      st.pages = rowsToPages(p.pg);
    } else {
      var one = newPage('메인');
      one.blocks = (p.b || []).map(rowToBlock);
      st.pages = [one];
    }
    var cur = pageOf(st, p.cur) || st.pages[0];
    st.current = cur.id;
    st.blocks = cur.blocks;
    st.threads = p.k || {};
    st.lock = p.l ? { hash: p.l[0], at: p.l[1], note: p.l[2] || '' } : null;
    if (st.lock) {
      if (Array.isArray(p.lp)) st.lock.pages = rowsToPages(p.lp);
      else if (Array.isArray(p.ls)) {
        var snap = newPage(cur.name);
        snap.id = cur.id;
        snap.blocks = p.ls.map(rowToBlock);
        st.lock.pages = [snap];
      }
    }
    return st;
  }
  function encodeState(st) { return b64url(JSON.stringify(toPayload(st))); }
  function decodeState(str) {
    try { return fromPayload(JSON.parse(unb64url(str))); }
    catch (e) { return null; }
  }

  /* ── 상태 ───────────────────────────────────────────────── */
  function newPage(name) {
    return { id: uid('pg'), name: name || '새 페이지', blocks: [] };
  }

  function blankState() {
    var page = newPage('메인');
    return {
      name: '이름 없는 도면',
      tpl: '',
      pages: [page],
      current: page.id,
      blocks: page.blocks,   // 현재 페이지의 블록 배열과 같은 참조
      threads: {},           // blockId -> [{ id, at, author, text }]
      lock: null,            // { hash, at, note, pages }
      snapshots: []          // 잠금 이력
    };
  }

  function pageOf(st, id) {
    var pages = st.pages || [];
    for (var i = 0; i < pages.length; i++) if (pages[i].id === id) return pages[i];
    return null;
  }
  function curPage(st) {
    return pageOf(st, st.current) || (st.pages && st.pages[0]) || null;
  }
  /* 현재 페이지의 blocks 참조를 state.blocks 와 일치시킵니다. */
  function bindBlocks(st) {
    var p = curPage(st);
    if (p) { p.blocks = st.blocks; if (!st.pages) st.pages = [p]; }
    return st;
  }
  /* 모든 페이지를 현재 상태가 반영된 사본으로 돌려줍니다. */
  function allPages(st) {
    var pages = (st.pages || []).slice();
    pages.forEach(function (p) {
      if (p.id === st.current) p.blocks = st.blocks;
    });
    return pages;
  }
  function activatePage(st, id) {
    if (!pageOf(st, id)) return false;
    bindBlocks(st);
    var p = pageOf(st, id);
    st.current = id;
    st.blocks = p.blocks;
    return true;
  }

  function stateFromTemplate(tplId) {
    var tpl = DY.TEMPLATES[tplId];
    var st = blankState();
    if (!tpl) return st;
    st.tpl = tplId;
    st.name = tpl.name;
    st.blocks = tpl.blocks.map(function (spec) {
      return newBlock(spec.type, { label: spec.label, options: (spec.options || []).slice() });
    });
    pack(st.blocks);
    bindBlocks(st);
    return st;
  }

  function threadOf(st, blockId) {
    if (!st.threads[blockId]) st.threads[blockId] = [];
    return st.threads[blockId];
  }
  function commentCount(st, blockId) { return (st.threads[blockId] || []).length; }
  function totalComments(st) {
    var n = 0;
    for (var k in st.threads) if (Object.prototype.hasOwnProperty.call(st.threads, k)) n += st.threads[k].length;
    return n;
  }

  /* ── 잠금 비교 ───────────────────────────────────────────── */
  function diffAgainst(blocks, snapshotBlocks) {
    var prev = {};
    snapshotBlocks.forEach(function (b) { prev[b.id] = b; });
    var seen = {};
    var out = [];
    readOrder(blocks).forEach(function (b) {
      var old = prev[b.id];
      if (!old) { out.push({ kind: 'add', block: b }); return; }
      seen[b.id] = true;
      var changed = [];
      if (old.label !== b.label) changed.push('제목');
      if (old.span !== b.span) changed.push('폭 ' + old.span + '→' + b.span);
      if (old.rows !== b.rows) changed.push('높이 ' + old.rows + '→' + b.rows);
      if (old.col !== b.col || old.row !== b.row) changed.push('위치');
      var a = (old.options || []).slice().sort().join('+');
      var c = (b.options || []).slice().sort().join('+');
      if (a !== c) changed.push('기능 옵션');
      if (levelOf(old) !== levelOf(b)) changed.push('등급 ' + levelOf(old) + '→' + levelOf(b));
      if (changed.length) out.push({ kind: 'edit', block: b, fields: changed });
    });
    snapshotBlocks.forEach(function (b) {
      if (!seen[b.id] && !blocks.some(function (x) { return x.id === b.id; })) {
        out.push({ kind: 'del', block: b });
      }
    });
    return out;
  }

  /* 잠금본 대비 문서 전체 비교: 페이지 이름·추가/삭제·블록 단위를 한 줄씩 돌려줍니다 */
  function diffDoc(st, lockPages) {
    var cur = allPages(st);
    var prev = {};
    (lockPages || []).forEach(function (pg) { prev[pg.id] = pg; });
    var seen = {};
    var out = [];
    cur.forEach(function (pg) {
      var old = prev[pg.id];
      if (!old) {
        out.push({ kind: 'add', page: pg.name, label: '새 페이지', detail: '블록 ' + pg.blocks.length + '개' });
        return;
      }
      seen[pg.id] = true;
      if (old.name !== pg.name) {
        out.push({ kind: 'edit', page: pg.name, label: '페이지 이름', detail: esc(old.name) + ' → ' + esc(pg.name) });
      }
      diffAgainst(pg.blocks, old.blocks).forEach(function (d) {
        out.push({
          kind: d.kind,
          page: pg.name,
          label: d.block.label,
          detail: d.fields ? d.fields.join(' · ') : (d.kind === 'add' ? '블록 추가' : '블록 삭제')
        });
      });
    });
    (lockPages || []).forEach(function (pg) {
      if (!seen[pg.id] && !cur.some(function (x) { return x.id === pg.id; })) {
        out.push({ kind: 'del', page: pg.name, label: '페이지 삭제', detail: '블록 ' + pg.blocks.length + '개' });
      }
    });
    return out;
  }

  /* ── 저장 ───────────────────────────────────────────────── */
  var KEY = 'doyeon.draft.v1';
  function save(st) {
    try {
      var payload = toPayload(st);
      payload.snap = (st.snapshots || []).slice(-6);
      localStorage.setItem(KEY, JSON.stringify(payload));
      return true;
    } catch (e) { return false; }
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var p = JSON.parse(raw);
      var st = fromPayload(p);
      if (Array.isArray(p.snap)) st.snapshots = p.snap;
      return st;
    } catch (e) { return null; }
  }
  function clearSave() { try { localStorage.removeItem(KEY); } catch (e) {} }

  /* ── 토스트 ─────────────────────────────────────────────── */
  var toastTimer = null;
  function toast(msg, kind) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast is-show' + (kind ? ' is-' + kind : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = 'toast'; }, 2600);
  }

  DY.$ = $; DY.$$ = $$; DY.esc = esc; DY.clamp = clamp; DY.uid = uid;
  DY.fmt1 = fmt1; DY.fmtDate = fmtDate;
  DY.optionDef = optionDef; DY.newBlock = newBlock; DY.levelOf = levelOf; DY.specOf = specOf;
  DY.pack = pack; DY.readOrder = readOrder; DY.bottomRow = bottomRow; DY.settle = settle;
  DY.autoPackAll = autoPackAll; DY.isFree = isFree; DY.occupancy = occupancy;
  DY.estimate = estimate; DY.estimateDoc = estimateDoc; DY.money = money;
  DY.hashSpec = hashSpec; DY.specString = specString; DY.hashDoc = hashDoc; DY.diffDoc = diffDoc;
  DY.newPage = newPage; DY.pageOf = pageOf; DY.curPage = curPage; DY.bindBlocks = bindBlocks;
  DY.allPages = allPages; DY.activatePage = activatePage;
  DY.encodeState = encodeState; DY.decodeState = decodeState;
  DY.blankState = blankState; DY.stateFromTemplate = stateFromTemplate;
  DY.threadOf = threadOf; DY.commentCount = commentCount; DY.totalComments = totalComments;
  DY.diffAgainst = diffAgainst;
  DY.save = save; DY.load = load; DY.clearSave = clearSave;
  DY.toast = toast;
})(window);
