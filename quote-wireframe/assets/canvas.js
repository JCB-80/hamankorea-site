/* 도면 — 12컬럼 스냅 캔버스. 자유 좌표 없이 컬럼·행 단위로만 배치합니다. */
(function (global) {
  'use strict';
  var DY = global.DY;
  var $ = DY.$, esc = DY.esc, clamp = DY.clamp;

  var COLS = 12, ROW = 40, GAP = 8;

  var C = {
    state: null,
    mode: 'pc',
    selectedId: null,
    onChange: null,      // (opts) -> void
    onSelect: null,
    onOpenLabel: null,
    readonly: false,
    _geo: { cell: 0, gap: GAP, row: ROW }
  };

  /* ── 개략도 글리프 ───────────────────────────────────────── */
  function art(type) {
    switch (type) {
      case 'hero':
        return '<div class="art"><span class="a-bar"></span><span class="a-bar a-short"></span><span class="a-pill"></span></div>';
      case 'contact':
        return '<div class="art"><span class="a-field"></span><span class="a-field"></span><span class="a-field a-tall"></span><span class="a-pill a-pill-sm"></span></div>';
      case 'booking':
        return '<div class="art"><div class="a-cal">' +
          '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>' +
          '</div><span class="a-pill a-pill-sm"></span></div>';
      case 'board':
        return '<div class="art"><span class="a-row"><i class="a-sq"></i><span class="a-line"></span></span>' +
          '<span class="a-row"><i class="a-sq"></i><span class="a-line"></span></span>' +
          '<span class="a-row"><i class="a-sq"></i><span class="a-line a-short"></span></span></div>';
      case 'pricing':
        return '<div class="art a-cols"><span class="a-col"><i class="a-blk"></i><i class="a-line"></i><i class="a-line a-short"></i></span>' +
          '<span class="a-col"><i class="a-blk"></i><i class="a-line"></i><i class="a-line a-short"></i></span>' +
          '<span class="a-col"><i class="a-blk"></i><i class="a-line"></i><i class="a-line a-short"></i></span></div>';
      case 'gallery':
        return '<div class="art a-cols"><i class="a-blk a-tall"></i><i class="a-blk a-tall"></i><i class="a-blk a-tall"></i></div>';
      case 'map':
        return '<div class="art"><div class="a-map"><span class="a-pin"></span></div><span class="a-line"></span></div>';
      case 'faq':
        return '<div class="art"><span class="a-row a-between"><span class="a-line"></span><i class="a-chev"></i></span>' +
          '<span class="a-row a-between"><span class="a-line a-short"></span><i class="a-chev"></i></span></div>';
      case 'team':
        return '<div class="art a-cols a-center"><span class="a-col a-col-c"><i class="a-circle"></i><i class="a-line a-short"></i></span>' +
          '<span class="a-col a-col-c"><i class="a-circle"></i><i class="a-line a-short"></i></span>' +
          '<span class="a-col a-col-c"><i class="a-circle"></i><i class="a-line a-short"></i></span></div>';
      case 'login':
        return '<div class="art"><span class="a-field"></span><span class="a-field"></span><span class="a-pill a-pill-sm"></span></div>';
      case 'footer':
        return '<div class="art a-cols"><span class="a-col"><i class="a-line"></i><i class="a-line a-short"></i></span>' +
          '<span class="a-col"><i class="a-line"></i><i class="a-line a-short"></i></span>' +
          '<span class="a-col"><i class="a-line"></i><i class="a-line a-short"></i></span></div>';
      default:
        return '<div class="art"><span class="a-line"></span><span class="a-line"></span><span class="a-line a-short"></span></div>';
    }
  }

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  /* ── 배치 계산 ───────────────────────────────────────────── */
  function layoutUnits() {
    return C.mode === 'mo' ? DY.readOrder(C.state.blocks) : C.state.blocks;
  }

  function geometry() {
    var inner = $('#canvasBlocks');
    var w = inner ? inner.clientWidth : 0;
    var cell = (w - GAP * (COLS - 1)) / COLS;
    if (!isFinite(cell) || cell < 1) cell = 1;
    C._geo = { cell: cell, gap: GAP, row: ROW, width: w };
    return C._geo;
  }

  function hRows(rows) { return rows * ROW + (rows - 1) * GAP; }

  function posOf(b, g) {
    if (C.mode === 'mo') {
      var order = layoutUnits();
      var idx = 0;
      for (var i = 0; i < order.length; i++) if (order[i].id === b.id) { idx = i; break; }
      var top = 0;
      for (var j = 0; j < idx; j++) top += hRows(order[j].rows) + GAP;
      return { left: 0, top: top, width: g.width, height: hRows(b.rows) };
    }
    return {
      left: (b.col - 1) * (g.cell + GAP),
      top: (b.row - 1) * (ROW + GAP),
      width: b.span * g.cell + (b.span - 1) * GAP,
      height: hRows(b.rows)
    };
  }

  function contentHeight(g) {
    var order = layoutUnits();
    if (C.mode === 'mo') {
      var h = 0;
      order.forEach(function (b) { h += hRows(b.rows) + GAP; });
      return Math.max(h - GAP, 240);
    }
    var maxBottom = 2;
    order.forEach(function (b) { maxBottom = Math.max(maxBottom, b.row + b.rows); });
    return (maxBottom - 1) * (ROW + GAP) + ROW;
  }

  /* ── 렌더 ───────────────────────────────────────────────── */
  function render(keepFocus) {
    if (!C.state) return;
    var host = $('#canvasBlocks');
    if (!host) return;
    var focusedId = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.id : null;
    if (keepFocus && focusedId) C.selectedId = focusedId;
    if (C.selectedId && !C.state.blocks.some(function (b) { return b.id === C.selectedId; })) C.selectedId = null;

    var g = geometry();
    var order = layoutUnits();
    var html = order.map(function (b) {
      var p = posOf(b, g);
      var lv = DY.levelOf(b);
      var opts = (b.options || []).length;
      var cm = C.state ? DY.commentCount(C.state, b.id) : 0;
      var sel = C.selectedId === b.id;
      var compact = p.height < 116;
      var label = b.label || (DY.TYPES[b.type] ? DY.TYPES[b.type].name : '블록');
      var aria = label + ', 폭 ' + (C.mode === 'mo' ? 12 : b.span) + '컬럼, 높이 ' + b.rows + '행, Level ' + lv +
        (opts ? ', 기능 옵션 ' + opts + '개' : '') + (cm ? ', 댓글 ' + cm + '개' : '');
      return '<div class="blk' + (sel ? ' is-sel' : '') + (compact ? ' is-compact' : '') + '"' +
        ' data-id="' + esc(b.id) + '" tabindex="' + (C.readonly ? '-1' : '0') + '"' +
        ' role="button" aria-pressed="' + (sel ? 'true' : 'false') + '" aria-label="' + esc(aria) + '"' +
        ' style="left:' + p.left + 'px;top:' + p.top + 'px;width:' + p.width + 'px;height:' + p.height + 'px">' +
        '<div class="blk-in">' +
        '<div class="blk-top"><span class="blk-name">' + esc(label) + '</span>' +
        '<span class="blk-lv lv-' + lv + '">L' + lv + '</span></div>' +
        art(b.type) +
        (opts ? '<div class="blk-tags"><span class="blk-tag">기능 ' + opts + '</span></div>' : '') +
        '</div>' +
        (cm ? '<span class="blk-pin" aria-hidden="true">' + cm + '</span>' : '') +
        (C.readonly ? '' :
          '<span class="blk-h blk-h-e" data-h="e" role="presentation"></span>' +
          '<span class="blk-h blk-h-s" data-h="s" role="presentation"></span>' +
          '<span class="blk-h blk-h-se" data-h="se" role="presentation"></span>') +
        '</div>';
    }).join('');

    host.innerHTML = html;

    var h = contentHeight(g);
    var pad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--canvas-pad')) || 18;
    var canvas = $('#canvas');
    canvas.style.height = (h + pad * 2) + 'px';
    host.style.height = h + 'px';

    var emptyEl = $('#canvasEmpty');
    if (emptyEl) emptyEl.hidden = C.state.blocks.length > 0;

    var grid = $('#canvasGrid');
    if (grid && !grid.childElementCount) {
      var cols = '';
      for (var i = 0; i < COLS; i++) cols += '<span></span>';
      grid.innerHTML = cols;
      grid.style.setProperty('--pitch', (ROW + GAP) + 'px');
    }

    if (keepFocus && focusedId) {
      var again = host.querySelector('[data-id="' + focusedId + '"]');
      if (again) again.focus({ preventScroll: true });
    }
  }

  /* ── 선택 ───────────────────────────────────────────────── */
  function select(id, silent) {
    if (C.selectedId === id) { if (!silent) render(); return; }
    C.selectedId = id;
    render();
    if (C.onSelect && !silent) C.onSelect(id);
  }

  /* ── 상호작용 ───────────────────────────────────────────── */
  var drag = null;

  function ptr(e) { return { x: e.clientX, y: e.clientY }; }

  function onDown(e) {
    if (C.readonly) return;
    if (e.button != null && e.button !== 0) return;
    var handle = e.target.closest ? e.target.closest('.blk-h') : null;
    var node = e.target.closest ? e.target.closest('.blk') : null;
    if (!node) return;
    var id = node.dataset.id;
    var b = C.state.blocks.filter(function (x) { return x.id === id; })[0];
    if (!b) return;

    if (C.selectedId !== id) {
      C.selectedId = id;
      if (C.onSelect) C.onSelect(id);
    } else if (C.onSelect) {
      C.onSelect(id);
    }
    if (C.mode === 'mo') { render(); return; }
    if (handle) e.preventDefault();

    var g = geometry();
    drag = {
      id: id, handle: handle ? handle.dataset.h : null,
      startX: e.clientX, startY: e.clientY,
      col: b.col, row: b.row, span: b.span, rows: b.rows,
      node: node, g: g, moved: false, b: b
    };
    node.setPointerCapture && node.setPointerCapture(e.pointerId);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
  }

  function onMove(e) {
    if (!drag) return;
    var g = drag.g;
    var dx = e.clientX - drag.startX;
    var dy = e.clientY - drag.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true;
    var dCol = Math.round(dx / (g.cell + GAP));
    var dRow = Math.round(dy / (ROW + GAP));

    if (!drag.handle) {
      var col = clamp(drag.col + dCol, 1, COLS - drag.span + 1);
      var row = Math.max(1, drag.row + dRow);
      drag.node.style.left = ((col - 1) * (g.cell + GAP)) + 'px';
      drag.node.style.top = ((row - 1) * (ROW + GAP)) + 'px';
      drag.preview = { col: col, row: row };
      drag.node.classList.add('is-drag');
    } else {
      var span = drag.span, rows = drag.rows;
      if (drag.handle === 'e' || drag.handle === 'se') span = clamp(drag.span + dCol, 1, COLS - drag.col + 1);
      if (drag.handle === 's' || drag.handle === 'se') rows = clamp(drag.rows + dRow, 1, 14);
      drag.node.style.width = (span * g.cell + (span - 1) * GAP) + 'px';
      drag.node.style.height = (rows * ROW + (rows - 1) * GAP) + 'px';
      drag.preview = { span: span, rows: rows };
      drag.node.classList.add('is-drag');
    }
    var hint = $('#stageHint');
    if (hint) {
      hint.textContent = drag.preview && drag.preview.col != null
        ? '열 ' + drag.preview.col + '–' + (drag.preview.col + drag.b.span - 1) + ' · 행 ' + drag.preview.row
        : '폭 ' + drag.preview.span + '컬럼 · 높이 ' + drag.preview.rows + '행';
    }
    e.preventDefault();
  }

  function onUp() {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onUp);
    var hint = $('#stageHint');
    if (hint) hint.textContent = '12 컬럼 격자 · 행 40px 스냅';
    if (!drag) return;
    var d = drag; drag = null;
    if (!d.moved || !d.preview) { render(); return; }
    var b = d.b;
    if (d.preview.col != null) { b.col = d.preview.col; b.row = d.preview.row; }
    if (d.preview.span != null) { b.span = d.preview.span; b.rows = d.preview.rows; }
    DY.settle(C.state.blocks, b.id);
    render();
    if (C.onChange) C.onChange();
  }

  function onKey(e) {
    if (C.readonly || C.mode === 'mo') return;
    var node = e.target.closest ? e.target.closest('.blk') : null;
    if (!node) return;
    var id = node.dataset.id;
    var b = C.state.blocks.filter(function (x) { return x.id === id; })[0];
    if (!b) return;
    var step = e.shiftKey ? 'resize' : 'move';
    var handled = true;
    if (e.key === 'ArrowLeft') { step === 'move' ? (b.col = clamp(b.col - 1, 1, COLS - b.span + 1)) : (b.span = clamp(b.span - 1, 1, b.span)); }
    else if (e.key === 'ArrowRight') { step === 'move' ? (b.col = clamp(b.col + 1, 1, COLS - b.span + 1)) : (b.span = clamp(b.span + 1, 1, COLS - b.col + 1)); }
    else if (e.key === 'ArrowUp') { step === 'move' ? (b.row = Math.max(1, b.row - 1)) : (b.rows = Math.max(1, b.rows - 1)); }
    else if (e.key === 'ArrowDown') { step === 'move' ? (b.row = b.row + 1) : (b.rows = clamp(b.rows + 1, 1, 14)); }
    else if (e.key === 'Escape') { C.selectedId = null; render(); if (C.onSelect) C.onSelect(null); return; }
    else handled = false;
    if (!handled) return;
    e.preventDefault();
    C.selectedId = b.id;
    DY.settle(C.state.blocks, b.id);
    render(true);
    if (C.onSelect) C.onSelect(b.id);
    if (C.onChange) C.onChange();
  }

  function onClick(e) {
    var node = e.target.closest ? e.target.closest('.blk') : null;
    if (!node) { if (C.selectedId) { C.selectedId = null; render(); if (C.onSelect) C.onSelect(null); } return; }
    C.selectedId = node.dataset.id;
    render();
    if (C.onSelect) C.onSelect(C.selectedId);
  }

  function onDblClick(e) {
    if (C.readonly) return;
    var node = e.target.closest ? e.target.closest('.blk') : null;
    if (!node) return;
    if (C.onOpenLabel) C.onOpenLabel(node.dataset.id);
  }

  C.mount = function (state) {
    C.state = state;
    var host = $('#canvasBlocks');
    host.addEventListener('pointerdown', onDown);
    host.addEventListener('click', onClick);
    host.addEventListener('dblclick', onDblClick);
    host.addEventListener('keydown', onKey);
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { render(true); });
      ro.observe($('#canvasBlocks'));
    } else {
      window.addEventListener('resize', function () { render(true); });
    }
    render();
  };

  C.setState = function (state) { C.state = state; render(); };
  C.render = render;
  C.select = select;
  C.setMode = function (mode) {
    C.mode = mode;
    var canvas = $('#canvas');
    canvas.classList.toggle('is-mo', mode === 'mo');
    var hint = $('#stageHint');
    if (hint) hint.textContent = mode === 'mo' ? '모바일 1단 자동 변환 · 배치는 PC에서' : '12 컬럼 격자 · 행 40px 스냅';
    render();
  };
  C.getMode = function () { return C.mode; };
  C.setReadonly = function (v) { C.readonly = v; render(); };
  C.COLS = COLS; C.ROW = ROW; C.GAP = GAP;

  DY.canvas = C;
})(window);
