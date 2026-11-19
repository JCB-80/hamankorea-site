/* 도면 — 라우터, 편집기 결선, 명세서 */
(function (global) {
  'use strict';
  var DY = global.DY;
  var $ = DY.$, $$ = DY.$$, esc = DY.esc, clamp = DY.clamp;

  /* ── 아이콘 ─────────────────────────────────────────────── */
  var ICONS = {
    hero: '<rect x="2.5" y="3.5" width="15" height="13" rx="2"/><rect x="5.5" y="7" width="5" height="1.6" rx=".8"/><rect x="5.5" y="10.4" width="3.4" height="3.2" rx="1.6"/>',
    contact: '<rect x="2.5" y="4.5" width="15" height="11" rx="2"/><path d="M3 6l7 5 7-5"/>',
    booking: '<rect x="2.5" y="4.5" width="15" height="12" rx="2"/><path d="M2.5 8.4h15M6.5 3v3M13.5 3v3"/><circle cx="7" cy="11.6" r=".9"/><circle cx="10" cy="11.6" r=".9"/><circle cx="13" cy="11.6" r=".9"/>',
    board: '<path d="M3 6h14M3 10h14M3 14h9"/><circle cx="1.8" cy="6" r=".6"/>',
    pricing: '<path d="M3 3h6l8 8-6 6-8-8z"/><circle cx="6.4" cy="6.4" r="1.1"/>',
    gallery: '<rect x="2.5" y="5" width="10" height="9" rx="1.6"/><path d="M14 8.4h1.8A1.7 1.7 0 0 1 17.5 10v5.6a1.7 1.7 0 0 1-1.7 1.7H8.2"/>',
    map: '<path d="M10 17s5-5.2 5-8.4A5 5 0 0 0 5 8.6C5 11.8 10 17 10 17z"/><circle cx="10" cy="8.4" r="1.8"/>',
    faq: '<path d="M3 4.5h14v8.4a1.6 1.6 0 0 1-1.6 1.6H8.2L4.6 17.5v-3H4.6A1.6 1.6 0 0 1 3 12.9z"/><path d="M7 8h6"/>',
    team: '<circle cx="7" cy="7.6" r="2.4"/><path d="M2.8 15.2a4.2 4.2 0 0 1 8.4 0"/><circle cx="14" cy="7.8" r="1.8"/><path d="M12.6 15.2a3.4 3.4 0 0 1 4.6-2.6"/>',
    login: '<rect x="3" y="4" width="8" height="12" rx="1.8"/><path d="M10 10h7M14.2 7.2 17 10l-2.8 2.8"/>',
    footer: '<rect x="2.5" y="13" width="15" height="4" rx="1.2"/><path d="M2.5 4.6h6M2.5 7.4h9"/>',
    text: '<path d="M3 5h14M3 8.4h14M3 11.8h14M3 15.2h8"/>'
  };
  DY.icon = function (name) {
    var body = ICONS[name] || ICONS.text;
    return '<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
  };

  /* ── 앱 상태 ────────────────────────────────────────────── */
  var app = {
    state: DY.blankState(),
    selected: null,
    step: 1,
    readonly: false,
    view: 'landing'
  };
  DY.app = app;

  var undoStack = [], redoStack = [], lastSnap = null, saveTimer = null;

  function snap() {
    DY.bindBlocks(app.state);
    return JSON.stringify({ p: app.state.pages, c: app.state.current, l: app.state.lock });
  }
  function applySnap(s) {
    var o = JSON.parse(s);
    app.state.pages = o.p;
    app.state.current = o.c;
    var cur = DY.pageOf(app.state, o.c) || app.state.pages[0];
    app.state.current = cur.id;
    app.state.blocks = cur.blocks;
    app.state.lock = o.l;
    if (app.selected && !app.state.blocks.some(function (x) { return x.id === app.selected; })) app.selected = null;
  }
  function saveNow() {
    clearTimeout(saveTimer);
    saveTimer = null;
    DY.save(app.state);
  }

  function commit() {
    var s = snap();
    if (lastSnap && s !== lastSnap) {
      undoStack.push(lastSnap);
      if (undoStack.length > 60) undoStack.shift();
      redoStack.length = 0;
    }
    lastSnap = s;
    saveNow();
    chrome();
    DY.canvas.render();
    DY.rail.render();
  }
  function touch() {
    lastSnap = snap();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 400);
    chrome();
  }
  function undo() {
    if (!undoStack.length) return;
    redoStack.push(lastSnap);
    applySnap(undoStack.pop());
    lastSnap = snap();
    saveNow(); chrome(); DY.canvas.render(); DY.rail.render();
  }
  function redo() {
    if (!redoStack.length) return;
    undoStack.push(lastSnap);
    applySnap(redoStack.pop());
    lastSnap = snap();
    saveNow(); chrome(); DY.canvas.render(); DY.rail.render();
  }

  /* ── 상단 크롬 ──────────────────────────────────────────── */
  function chrome() {
    var st = app.state;
    var e = DY.estimateDoc(st);
    var chipV = $('#estChipValue');
    if (chipV) chipV.textContent = DY.fmt1(e.low) + '–' + DY.fmt1(e.high) + ' 인·일';

    var nameInput = $('#docName');
    if (nameInput && nameInput.value !== st.name) nameInput.value = st.name;

    var tplName = st.tpl && DY.TEMPLATES[st.tpl] ? DY.TEMPLATES[st.tpl].name : '직접 구성';
    var meta = $('#docMeta');
    if (meta) {
      var cm = DY.totalComments(st);
      var parts = [tplName, '페이지 ' + e.pageCount + '개', '블록 ' + e.blockCount + '개', '질문 ' + cm + '개'];
      if (e.pending) parts.push('미확인 ' + e.pending);
      meta.innerHTML = parts.map(function (p) { return '<span>' + esc(p) + '</span>'; }).join('');
    }
    renderPageBar();

    $$('.step-btn').forEach(function (btn) {
      var on = Number(btn.dataset.step) === app.step;
      btn.classList.toggle('is-on', on);
      if (on) btn.setAttribute('aria-current', 'step'); else btn.removeAttribute('aria-current');
    });

    var rb = $('#roBadge');
    if (rb) rb.hidden = !app.readonly;

    var undoBtn = $('#btnUndo'), redoBtn = $('#btnRedo');
    if (undoBtn) undoBtn.disabled = !undoStack.length || app.readonly;
    if (redoBtn) redoBtn.disabled = !redoStack.length || app.readonly;

    var builder = $('#builder');
    var pal = $('#palette');
    var wide = !window.matchMedia('(max-width: 900px)').matches;
    var showPal = (app.step === 1 && wide) || (!!pal && pal.classList.contains('is-open'));
    if (pal) pal.hidden = !showPal;
    if (builder) builder.classList.toggle('has-pal', !!showPal);
    var openBtn = $('#paletteOpen');
    if (openBtn) openBtn.hidden = showPal || app.readonly;

    var b2 = $('#btnShare2');
    if (b2) b2.hidden = app.readonly;
    var b3 = $('#btnReset');
    if (b3) b3.hidden = app.readonly;
    var pick = $('#tplPick');
    if (pick) pick.value = st.tpl || '';
  }

  /* ── 단계 ───────────────────────────────────────────────── */
  function setStep(n) {
    app.step = n;
    DY.rail.setStep(n);
    chrome();
    if (n === 1) { DY.canvas.render(); }
    if (n === 3 && app.state.lock == null) {
      /* 잠금 전에는 지문 미리보기를 위해 한 번 더 그립니다 */
      DY.rail.render();
    }
  }

  /* ── 페이지 ─────────────────────────────────────────────── */
  var renaming = null;

  function renderPageBar() {
    var bar = $('#pageBar');
    if (!bar) return;
    var st = app.state;
    var pages = DY.allPages(st);
    if (!pages.length) { bar.innerHTML = ''; return; }
    var html = pages.map(function (pg, i) {
      var on = pg.id === st.current;
      if (renaming === pg.id) {
        return '<div class="page-tab is-renaming">' +
          '<span class="page-tab-n">' + (i + 1) + '</span>' +
          '<input class="page-rename" type="text" maxlength="16" value="' + esc(pg.name) + '" data-rename="' + esc(pg.id) + '" aria-label="페이지 이름">' +
          '</div>';
      }
      return '<div class="page-tab' + (on ? ' is-on' : '') + '" role="tab" tabindex="' + (app.readonly ? '-1' : '0') + '"' +
        ' aria-selected="' + (on ? 'true' : 'false') + '" data-page="' + esc(pg.id) + '" title="두 번 눌러 이름 바꾸기">' +
        '<span class="page-tab-n">' + (i + 1) + '</span>' +
        '<span class="page-tab-name">' + esc(pg.name) + '</span>' +
        '<span class="page-tab-count">' + pg.blocks.length + '</span>' +
        (pages.length > 1 && !app.readonly
          ? '<button class="page-del" type="button" data-del="' + esc(pg.id) + '" aria-label="' + esc(pg.name) + ' 페이지 삭제">×</button>'
          : '') +
        '</div>';
    }).join('');
    if (!app.readonly) {
      html += '<button class="page-add" type="button" id="pageAdd"><span aria-hidden="true">＋</span> 페이지 추가</button>';
    }
    bar.innerHTML = html;
    var input = bar.querySelector('.page-rename');
    if (input) { input.focus(); input.select(); }
  }

  function switchPage(id) {
    if (!id || id === app.state.current) return;
    if (!DY.activatePage(app.state, id)) return;
    app.selected = app.state.blocks.length ? app.state.blocks[0].id : null;
    lastSnap = snap();
    saveNow();
    DY.canvas.setState(app.state);
    DY.canvas.select(app.selected, true);
    DY.canvas.render();
    chrome();
    DY.rail.render();
  }

  function addPage() {
    if (app.readonly) return;
    DY.bindBlocks(app.state);
    var names = app.state.pages.map(function (p) { return p.name; });
    var n = app.state.pages.length + 1;
    var name = '페이지 ' + n;
    while (names.indexOf(name) > -1) name = '페이지 ' + (++n);
    var p = DY.newPage(name);
    app.state.pages.push(p);
    app.state.current = p.id;
    app.state.blocks = p.blocks;
    app.selected = null;
    renaming = p.id;
    commit();
    DY.canvas.setState(app.state);
    DY.canvas.select(null, true);
    DY.toast('빈 페이지를 추가했습니다. 이 페이지의 블록을 골라 채우세요.');
  }

  function deletePage(id) {
    if (app.readonly || app.state.pages.length < 2) return;
    DY.bindBlocks(app.state);
    var idx = -1;
    app.state.pages.forEach(function (p, i) { if (p.id === id) idx = i; });
    if (idx < 0) return;
    var gone = app.state.pages[idx];
    gone.blocks.forEach(function (b) { delete app.state.threads[b.id]; });
    app.state.pages.splice(idx, 1);
    if (app.state.current === id) {
      var next = app.state.pages[Math.max(0, idx - 1)];
      app.state.current = next.id;
      app.state.blocks = next.blocks;
      app.selected = next.blocks.length ? next.blocks[0].id : null;
    }
    renaming = null;
    commit();
    DY.canvas.setState(app.state);
    DY.canvas.select(app.selected, true);
    DY.toast(gone.name + ' 페이지를 삭제했습니다.');
  }

  function renamePage(id, name) {
    var p = DY.pageOf(app.state, id);
    renaming = null;
    if (!p) { renderPageBar(); return; }
    var v = (name || '').trim().slice(0, 16);
    if (v && v !== p.name) { p.name = v; commit(); }
    else renderPageBar();
  }

  /* ── 블록 조작 ──────────────────────────────────────────── */
  function addBlock(typeId) {
    if (app.readonly) return;
    var t = DY.TYPES[typeId];
    if (!t) return;
    var b = DY.newBlock(typeId, { row: DY.bottomRow(app.state.blocks) + 1, col: 1 });
    app.state.blocks.push(b);
    app.selected = b.id;
    DY.settle(app.state.blocks, b.id);
    commit();
    DY.canvas.select(b.id, true);
    DY.toast(t.name + ' 블록을 추가했습니다.');
  }
  function deleteBlock(id) {
    if (app.readonly) return;
    app.state.blocks = app.state.blocks.filter(function (b) { return b.id !== id; });
    delete app.state.threads[id];
    if (app.selected === id) app.selected = null;
    commit();
    DY.toast('블록을 삭제했습니다.');
  }

  /* ── 저장·내보내기 ──────────────────────────────────────── */
  function exportPayload() {
    var st = app.state;
    var e = DY.estimateDoc(st);
    function blocksOf(list) {
      return DY.readOrder(list).map(function (b) {
        return {
          id: b.id,
          type: b.type,
          label: b.label,
          gridSpan: b.span,
          colStart: b.col,
          rowStart: b.row,
          rows: b.rows,
          featureLevel: DY.levelOf(b),
          options: (b.options || []).slice()
        };
      });
    }
    return {
      service: 'doyeon',
      version: 2,
      name: st.name,
      template: st.tpl || null,
      locked: st.lock ? { hash: st.lock.hash, at: new Date(st.lock.at).toISOString(), note: st.lock.note || '' } : null,
      pages: DY.allPages(st).map(function (pg) {
        return { id: pg.id, name: pg.name, blocks: blocksOf(pg.blocks) };
      }),
      estimate: {
        unit: 'person-day',
        low: Math.round(e.low * 10) / 10,
        high: Math.round(e.high * 10) / 10,
        byLevel: e.byLevel,
        pageCount: e.pageCount,
        note: '워크플로우 설계 기준 추정치이며 확정 견적이 아닙니다.'
      },
      threads: st.threads
    };
  }
  function download(filename, text, mime) {
    var blob = new Blob([text], { type: mime || 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }
  function downloadJson() {
    var p = exportPayload();
    var tag = app.state.lock ? app.state.lock.hash : DY.hashDoc(app.state);
    download('도면-' + (app.state.name || 'spec') + '-' + tag + '.json', JSON.stringify(p, null, 2));
    DY.toast('JSON으로 저장했습니다.');
  }

  /* ── 명세서 ─────────────────────────────────────────────── */
  function pageRows(list) {
    return DY.readOrder(list).map(function (b, i) {
      var lv = DY.levelOf(b);
      var opts = (b.options || []).map(function (o) {
        var d = DY.optionDef(b.type, o);
        return d ? d.name : o;
      }).join(' · ') || '선택 없음';
      return '<tr>' +
        '<td class="mono">' + String(i + 1).padStart(2, '0') + '</td>' +
        '<td><strong>' + esc(b.label) + '</strong><span class="sub">' + esc(DY.TYPES[b.type] ? DY.TYPES[b.type].name : b.type) + '</span></td>' +
        '<td class="mono td-nowrap">' + b.span + ' / ' + b.rows + '</td>' +
        '<td class="td-nowrap"><span class="lv lv-' + lv + '">L' + lv + '</span> ' + esc(DY.LEVELS[lv].tag) + '</td>' +
        '<td>' + esc(opts) + '</td>' +
        '<td>' + esc(DY.specOf(b)) + '</td>' +
        '</tr>';
    }).join('');
  }

  function renderSheet() {
    var st = app.state;
    var pages = DY.allPages(st);
    var e = DY.estimateDoc(st);
    var hash = st.lock ? st.lock.hash : DY.hashDoc(st);
    var tplName = st.tpl && DY.TEMPLATES[st.tpl] ? DY.TEMPLATES[st.tpl].name : '직접 구성';

    var labelOf = {};
    pages.forEach(function (pg) {
      pg.blocks.forEach(function (b) { labelOf[b.id] = { label: b.label, page: pg.name }; });
    });

    var threadRows = [];
    Object.keys(st.threads).forEach(function (id) {
      var meta = labelOf[id];
      (st.threads[id] || []).forEach(function (c) {
        threadRows.push('<tr><td class="td-nowrap">' + esc(meta ? meta.page : '—') + '</td>' +
          '<td><strong>' + esc(meta ? meta.label : '삭제된 블록') + '</strong></td>' +
          '<td>' + esc(c.author || '익명') + '</td><td class="mono">' + DY.fmtDate(c.at) + '</td><td>' + esc(c.text) + '</td></tr>');
      });
    });

    var pageSections = pages.map(function (pg, i) {
      return '<section class="sheet-sec">' +
        '<h2>' + (i + 1) + '. ' + esc(pg.name) + ' <span class="sheet-sec-n">블록 ' + pg.blocks.length + '개</span></h2>' +
        (pg.blocks.length
          ? '<table class="sheet-tbl"><thead><tr><th scope="col">#</th><th scope="col">블록</th><th scope="col">폭/높이</th><th scope="col">등급</th><th scope="col">선택 기능</th><th scope="col">명세 문구</th></tr></thead><tbody>' + pageRows(pg.blocks) + '</tbody></table>'
          : '<p class="sheet-empty">이 페이지에는 아직 블록이 없습니다.</p>') +
        '</section>';
    }).join('');

    var n = pages.length;
    var html = '' +
      '<div class="sheet-bar no-print">' +
        '<button class="btn btn-quiet btn-sm" type="button" data-sheet="back">도면으로 돌아가기</button>' +
        '<div class="sheet-bar-end">' +
          '<button class="btn btn-quiet btn-sm" type="button" data-sheet="json">JSON 저장</button>' +
          '<button class="btn btn-primary btn-sm" type="button" data-sheet="print">PDF로 인쇄</button>' +
        '</div>' +
      '</div>' +
      '<div class="sheet-doc">' +
        '<header class="sheet-head">' +
          '<h1 class="sheet-title">' + esc(st.name) + '</h1>' +
          '<p class="sheet-sub"><span>견적 명세서</span><span>' + esc(tplName) + '</span><span>페이지 ' + n + '개</span><span>블록 ' + e.blockCount + '개</span><span>' + DY.fmtDate(Date.now()) + ' 발급</span></p>' +
          '<dl class="sheet-lock">' +
            '<div><dt>잠금 지문</dt><dd class="mono">' + esc(hash) + '</dd></div>' +
            '<div><dt>잠금 시각</dt><dd>' + (st.lock ? DY.fmtDate(st.lock.at) : '아직 잠그지 않음') + '</dd></div>' +
            '<div><dt>합의 메모</dt><dd>' + (st.lock && st.lock.note ? esc(st.lock.note) : '없음') + '</dd></div>' +
            '<div><dt>예상 공수</dt><dd>' + DY.fmt1(e.low) + ' – ' + DY.fmt1(e.high) + ' 인·일</dd></div>' +
          '</dl>' +
        '</header>' +
        pageSections +
        '<section class="sheet-sec">' +
          '<h2>' + (n + 1) + '. 등급 분포</h2>' +
          '<table class="sheet-tbl sheet-tbl-sm"><thead><tr><th scope="col">등급</th><th scope="col">블록 수</th><th scope="col">기준 공수</th></tr></thead><tbody>' +
            '<tr><td>Level 1 · 기본</td><td>' + (e.byLevel[1] || 0) + '</td><td class="mono">' + DY.fmt1((e.byLevel[1] || 0) * DY.COST.level[1]) + ' 인·일</td></tr>' +
            '<tr><td>Level 2 · 백엔드</td><td>' + (e.byLevel[2] || 0) + '</td><td class="mono">' + DY.fmt1((e.byLevel[2] || 0) * DY.COST.level[2]) + ' 인·일</td></tr>' +
            '<tr><td>Level 3 · 고난도</td><td>' + (e.byLevel[3] || 0) + '</td><td class="mono">' + DY.fmt1((e.byLevel[3] || 0) * DY.COST.level[3]) + ' 인·일</td></tr>' +
            '<tr><td>공통 반응형 작업</td><td>—</td><td class="mono">' + DY.fmt1(DY.COST.setup) + ' 인·일</td></tr>' +
            '<tr><td>페이지 레이아웃 ' + (n > 1 ? '(추가 ' + (n - 1) + '장)' : '') + '</td><td>—</td><td class="mono">' + DY.fmt1(e.pageCost) + ' 인·일</td></tr>' +
          '</tbody></table>' +
        '</section>' +
        '<section class="sheet-sec">' +
          '<h2>' + (n + 2) + '. 질문·답변</h2>' +
          (threadRows.length
            ? '<table class="sheet-tbl"><thead><tr><th scope="col">페이지</th><th scope="col">블록</th><th scope="col">작성자</th><th scope="col">시각</th><th scope="col">내용</th></tr></thead><tbody>' + threadRows.join('') + '</tbody></table>'
            : '<p class="sheet-empty">등록된 질문이 없습니다.</p>') +
        '</section>' +
        '<footer class="sheet-foot">' +
          '<p>이 문서의 예상 공수는 워크플로우 설계 기준 추정치이며 확정 견적이 아닙니다. 잠금 지문 <span class="mono">' + esc(hash) + '</span>은 페이지와 블록 내용에서 계산한 값으로, 같은 도면이면 언제나 같은 값이 나옵니다.</p>' +
        '</footer>' +
      '</div>';
    $('#sheet').innerHTML = html;
  }

  function openSpec() {
    renderSheet();
    setView('spec');
  }
  function printSpec() {
    renderSheet();
    setView('spec');
    setTimeout(function () { window.print(); }, 180);
  }

  /* ── 뷰 전환 ────────────────────────────────────────────── */
  function setView(v) {
    app.view = v;
    document.documentElement.dataset.view = v;
    $('#siteHead').hidden = v !== 'landing';
    $('#main').hidden = v !== 'landing';
    $('#builder').hidden = v !== 'builder';
    $('#sheet').hidden = v !== 'spec';
    document.title = v === 'spec'
      ? '명세서 · ' + app.state.name + ' · 도면'
      : v === 'builder'
        ? app.state.name + ' · 도면'
        : '도면 — 의뢰자와 개발자가 같은 도면을 보는 견적 와이어프레임';
    window.scrollTo(0, 0);
  }

  /* ── 라우팅 ─────────────────────────────────────────────── */
  function parseHash() {
    var raw = (location.hash || '').replace(/^#/, '');
    if (!raw || raw === '/') return { path: '/' };
    if (raw.charAt(0) !== '/') return { path: 'anchor', id: raw };
    var q = raw.indexOf('?');
    var path = q > -1 ? raw.slice(0, q) : raw;
    var query = {};
    if (q > -1) {
      raw.slice(q + 1).split('&').forEach(function (kv) {
        var p = kv.split('=');
        if (p[0]) query[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
      });
    }
    return { path: path, query: query };
  }

  function route() {
    var r = parseHash();

    if (r.path === 'anchor') {
      setView('landing');
      var target = document.getElementById(r.id);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (r.path.indexOf('/s/') === 0) {
      var payload = (location.hash || '').split('/s/')[1] || '';
      var st = DY.decodeState(payload);
      if (!st) {
        DY.toast('공유 링크를 읽지 못했습니다. 주소가 잘렸는지 확인해 주세요.');
        location.hash = '#/';
        return;
      }
      app.readonly = true;
      app.state = st;
      app.selected = st.blocks.length ? st.blocks[0].id : null;
      mountBuilder();
      setStep(st.lock ? 3 : 2);
      setView('builder');
      DY.toast('읽기 전용으로 열었습니다. 질문을 남기면 링크에 담깁니다.');
      return;
    }

    if (r.path === '/build') {
      app.readonly = false;
      var tpl = r.query.t;
      if (tpl && DY.TEMPLATES[tpl]) {
        app.state = DY.stateFromTemplate(tpl);
        app.state.name = DY.TEMPLATES[tpl].name + ' 견적 도면';
        app.selected = app.state.blocks.length ? app.state.blocks[0].id : null;
        lastSnap = snap();
        saveNow();
        DY.toast(DY.TEMPLATES[tpl].name + '으로 시작했습니다.');
      } else {
        var draft = DY.load();
        app.state = draft || DY.stateFromTemplate('clinic');
        if (!draft) {
          app.state.name = '병원·예약형 견적 도면';
          DY.toast('기본 뼈대에서 시작했습니다. 팔레트 위에서 업종을 바꿀 수 있습니다.');
        }
        app.selected = app.state.blocks.length ? app.state.blocks[0].id : null;
        lastSnap = snap();
      }
      mountBuilder();
      setStep(1);
      setView('builder');
      return;
    }

    /* 그 밖의 경로는 랜딩 */
    setView('landing');
  }

  var mounted = false;
  function mountBuilder() {
    app.selected = app.selected || (app.state.blocks.length ? app.state.blocks[0].id : null);
    DY.canvas.setReadonly(app.readonly);
    DY.canvas.onChange = function () { commit(); };
    DY.canvas.onSelect = function (id) {
      app.selected = id;
      DY.rail.render();
    };
    DY.canvas.onOpenLabel = function (id) {
      app.selected = id;
      DY.canvas.select(id, true);
      DY.rail.render();
      var inp = document.querySelector('#rail input[data-action="label"]');
      if (inp) { inp.focus(); inp.select(); }
    };
    if (!mounted) {
      DY.canvas.mount(app.state);
      DY.rail.init({
        getState: function () { return app.state; },
        getSelected: function () { return app.selected; },
        isReadonly: function () { return app.readonly; },
        commit: commit,
        touch: touch,
        addBlock: addBlock,
        deleteBlock: deleteBlock,
        goto: setStep,
        openSpec: openSpec,
        printSpec: printSpec,
        downloadJson: downloadJson,
        setLockNote: function (v) { app.state.lockNote = v; }
      });
      mounted = true;
    } else {
      DY.canvas.setState(app.state);
    }
    DY.canvas.select(app.selected, true);
    DY.canvas.render();
  }

  /* ── 이벤트 결선 ────────────────────────────────────────── */
  function bind() {
    window.addEventListener('hashchange', route);

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (app.view === 'builder') chrome();
      }, 160);
    });

    $$('.step-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { setStep(Number(btn.dataset.step)); });
    });
    $('#estChip').addEventListener('click', function () { setStep(3); });
    $('#btnShare2').addEventListener('click', function () { setStep(3); });
    $('#btnUndo').addEventListener('click', undo);
    $('#btnRedo').addEventListener('click', redo);

    var reset = $('#btnReset');
    var armed = false, armTimer = null;
    reset.addEventListener('click', function () {
      if (!armed) {
        armed = true;
        reset.textContent = '정말 새로?';
        reset.classList.add('is-armed');
        armTimer = setTimeout(function () { armed = false; reset.textContent = '새 도면'; reset.classList.remove('is-armed'); }, 3200);
        return;
      }
      clearTimeout(armTimer);
      armed = false;
      reset.textContent = '새 도면';
      reset.classList.remove('is-armed');
      DY.clearSave();
      app.state = DY.stateFromTemplate('clinic');
      app.state.name = '병원·예약형 견적 도면';
      app.selected = app.state.blocks[0].id;
      undoStack = []; redoStack = [];
      renaming = null;
      lastSnap = snap();
      DY.canvas.setState(app.state);
      commit();
      DY.canvas.select(app.selected, true);
      DY.toast('새 도면을 열었습니다.');
    });

    $('#docName').addEventListener('input', function (e) {
      if (app.readonly) return;
      app.state.name = e.target.value.slice(0, 40);
      touch();
      document.title = app.state.name + ' · 도면';
    });

    $$('.seg-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('.seg-btn').forEach(function (b) { b.classList.remove('is-on'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('is-on');
        btn.setAttribute('aria-pressed', 'true');
        DY.canvas.setMode(btn.dataset.viewW);
      });
    });

    $('#btnAutoPack').addEventListener('click', function () {
      if (app.readonly) return;
      var ordered = DY.autoPackAll(app.state.blocks);
      app.state.blocks = ordered;
      DY.bindBlocks(app.state);
      commit();
      DY.toast('블록을 위에서부터 다시 정렬했습니다.');
    });

    $('#paletteOpen').addEventListener('click', function () {
      $('#palette').classList.add('is-open');
      $('#palette').hidden = false;
      chrome();
    });
    $('#paletteClose').addEventListener('click', function () {
      $('#palette').classList.remove('is-open');
      chrome();
    });

    /* 페이지 탭 */
    var bar = $('#pageBar');
    bar.addEventListener('click', function (e) {
      var del = e.target.closest('[data-del]');
      if (del) { e.stopPropagation(); deletePage(del.dataset.del); return; }
      if (e.target.closest('#pageAdd')) { addPage(); return; }
      var tab = e.target.closest('[data-page]');
      if (tab) switchPage(tab.dataset.page);
    });
    bar.addEventListener('dblclick', function (e) {
      var tab = e.target.closest('[data-page]');
      if (!tab || app.readonly) return;
      renaming = tab.dataset.page;
      renderPageBar();
    });
    bar.addEventListener('keydown', function (e) {
      var inp = e.target.closest('[data-rename]');
      if (inp) {
        if (e.key === 'Enter') { e.preventDefault(); renamePage(inp.dataset.rename, inp.value); }
        else if (e.key === 'Escape') { e.preventDefault(); renaming = null; renderPageBar(); }
        return;
      }
      var tab = e.target.closest('[data-page]');
      if (tab && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); switchPage(tab.dataset.page); }
    });
    bar.addEventListener('focusout', function (e) {
      var inp = e.target.closest('[data-rename]');
      if (inp && renaming) renamePage(inp.dataset.rename, inp.value);
    });

    $$('.tpl').forEach(function (a) { a.addEventListener('click', function () { /* 라우터가 처리 */ }); });

    $('#sheet').addEventListener('click', function (e) {
      var b = e.target.closest('[data-sheet]');
      if (!b) return;
      if (b.dataset.sheet === 'back') { setView('builder'); }
      else if (b.dataset.sheet === 'print') { window.print(); }
      else if (b.dataset.sheet === 'json') { downloadJson(); }
    });

    document.addEventListener('keydown', function (e) {
      var mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      var k = (e.key || '').toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo(); }
      else if (k === 's') { e.preventDefault(); saveNow(); DY.toast('이 브라우저에 저장했습니다.'); }
    });

    /* 팔레트 상단의 업종 선택 */
    var head = $('#palette').querySelector('.palette-head');
    if (head) {
      var wrap = document.createElement('div');
      wrap.className = 'pal-tpl';
      wrap.innerHTML = '<label class="pal-tpl-l" for="tplPick">업종 템플릿</label>' +
        '<select class="pal-tpl-sel" id="tplPick">' +
        '<option value="">직접 구성</option>' +
        Object.keys(DY.TEMPLATES).map(function (k) {
          return '<option value="' + k + '">' + esc(DY.TEMPLATES[k].name) + '</option>';
        }).join('') +
        '</select>';
      head.insertBefore(wrap, head.firstChild);
      $('#tplPick').addEventListener('change', function (e) {
        var id = e.target.value;
        if (!id) return;
        app.state = DY.stateFromTemplate(id);
        app.state.name = DY.TEMPLATES[id].name + ' 견적 도면';
        app.selected = app.state.blocks[0].id;
        undoStack = []; redoStack = [];
        renaming = null;
        lastSnap = snap();
        DY.canvas.setState(app.state);
        DY.canvas.select(app.selected, true);
        commit();
        DY.toast(DY.TEMPLATES[id].name + ' 뼈대로 다시 그렸습니다.');
      });
    }
  }

  /* ── 시작 ───────────────────────────────────────────────── */
  function start() {
    bind();
    if (!location.hash || location.hash === '#') location.hash = '#/';
    route();
    chrome();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window);
