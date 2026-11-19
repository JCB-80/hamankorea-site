/* 도면 — 오른쪽 레일(단계별 편집)과 블록 팔레트 */
(function (global) {
  'use strict';
  var DY = global.DY;
  var $ = DY.$, $$ = DY.$$, esc = DY.esc, clamp = DY.clamp;

  var api = null;
  var step = 1;
  var unitPrice = DY.COST.unitPrice;
  var showMoney = false;

  function shareUrl(st) {
    var base = location.href.split('#')[0];
    return base + '#/s/' + DY.encodeState(st);
  }
  DY.shareUrl = shareUrl;

  function author() {
    try { return localStorage.getItem('doyeon.author') || ''; } catch (e) { return ''; }
  }
  function setAuthor(v) {
    try { localStorage.setItem('doyeon.author', v); } catch (e) {}
  }

  function lvChip(lv) { return '<span class="lv lv-' + lv + '">L' + lv + '</span>'; }

  /* ── 1단계: 블록 속성 ──────────────────────────────────── */
  function viewBlock(b) {
    var t = DY.TYPES[b.type];
    var lv = DY.levelOf(b);
    var used = (b.options || []).length;
    return '' +
      '<div class="rail-sec">' +
        '<div class="rail-sec-head"><h2 class="rail-h">' + esc(t ? t.name : '블록') + '</h2>' + lvChip(lv) + '</div>' +
        '<p class="rail-hint">' + esc(t ? t.hint : '') + '</p>' +
        '<label class="fld"><span class="fld-l">제목</span>' +
          '<input class="fld-in" type="text" value="' + esc(b.label) + '" data-action="label" maxlength="24">' +
        '</label>' +
        '<div class="fld-row">' +
          '<div class="fld"><span class="fld-l">폭</span>' +
            '<div class="stepper">' +
              '<button type="button" data-action="span-dec" aria-label="폭 줄이기">−</button>' +
              '<span class="stepper-v" id="spanVal">' + b.span + ' / 12</span>' +
              '<button type="button" data-action="span-inc" aria-label="폭 늘리기">＋</button>' +
            '</div>' +
          '</div>' +
          '<div class="fld"><span class="fld-l">높이</span>' +
            '<div class="stepper">' +
              '<button type="button" data-action="rows-dec" aria-label="높이 줄이기">−</button>' +
              '<span class="stepper-v">' + b.rows + ' 행</span>' +
              '<button type="button" data-action="rows-inc" aria-label="높이 늘리기">＋</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<p class="rail-meta">열 ' + b.col + '–' + (b.col + b.span - 1) + ', 행 ' + b.row + '–' + (b.row + b.rows - 1) +
          ', 기능 옵션 ' + used + '개</p>' +
        '<div class="rail-actions">' +
          '<button class="btn btn-quiet btn-sm" type="button" data-action="go-options">기능 옵션 정하기</button>' +
          '<button class="btn btn-danger btn-sm" type="button" data-action="del-block">블록 삭제</button>' +
        '</div>' +
      '</div>';
  }

  function viewSummary() {
    var st = api.getState();
    var e = DY.estimateDoc(st);
    var pages = DY.allPages(st);
    return '' +
      '<div class="rail-sec">' +
        '<h2 class="rail-h">도면 요약</h2>' +
        '<p class="rail-hint">블록을 고르면 폭·높이·제목을 이 자리에서 고칠 수 있습니다.</p>' +
        '<dl class="stat">' +
          '<div><dt>페이지</dt><dd>' + e.pageCount + '개</dd></div>' +
          '<div><dt>전체 블록</dt><dd>' + e.blockCount + '개</dd></div>' +
          '<div><dt>기능 미확인</dt><dd>' + e.pending + '개</dd></div>' +
        '</dl>' +
        '<p class="rail-meta">이 페이지 블록 ' + st.blocks.length + '개, 컬럼 ' + usedCols(st.blocks) + ' / 12</p>' +
        '<div class="level-strip" aria-label="등급 분포">' +
          '<span class="ls ls-1" style="flex:' + (e.byLevel[1] || 0) + '">L1 ' + (e.byLevel[1] || 0) + '</span>' +
          '<span class="ls ls-2" style="flex:' + (e.byLevel[2] || 0) + '">L2 ' + (e.byLevel[2] || 0) + '</span>' +
          '<span class="ls ls-3" style="flex:' + (e.byLevel[3] || 0) + '">L3 ' + (e.byLevel[3] || 0) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="rail-sec">' +
        '<h2 class="rail-h">예상 공수</h2>' +
        '<p class="big-num">' + DY.fmt1(e.low) + '<span class="big-dash"> – </span>' + DY.fmt1(e.high) + '<span class="big-unit"> 인·일</span></p>' +
        '<p class="rail-meta">' + blockBreakdown(pages) + '</p>' +
      '</div>';
  }

  function usedCols(list) {
    var occ = [];
    var count = 0;
    list.forEach(function (b) {
      for (var x = b.col; x < b.col + b.span; x++) { if (!occ[x]) { occ[x] = true; count++; } }
    });
    return count;
  }

  function blockBreakdown(pages) {
    if (!pages.length) return '기준 공통 작업 1.5 인·일';
    var blocks = 0;
    pages.forEach(function (p) { blocks += p.blocks.length; });
    return pages.length + '개 페이지의 블록 ' + blocks + '개, 공통 반응형 작업 포함';
  }

  /* ── 2단계: 기능 옵션 ──────────────────────────────────── */
  function viewOptions(b) {
    var t = DY.TYPES[b.type];
    if (!t) return viewSummary();
    var lv = DY.levelOf(b);
    var opts = b.options || [];
    var items = t.options.map(function (o) {
      var on = opts.indexOf(o.id) > -1;
      return '<li><label class="opt' + (on ? ' is-on' : '') + '">' +
        '<input type="checkbox" data-action="opt" data-opt="' + o.id + '"' + (on ? ' checked' : '') + (api.isReadonly() ? ' disabled' : '') + '>' +
        '<span class="opt-box" aria-hidden="true"></span>' +
        '<span class="opt-name">' + esc(o.name) + '</span>' +
        '<span class="opt-lv">L' + o.level + '</span>' +
        '</label></li>';
    }).join('');

    return '' +
      '<div class="rail-sec">' +
        '<div class="rail-sec-head"><h2 class="rail-h">' + esc(b.label) + '</h2>' + lvChip(lv) + '</div>' +
        '<p class="rail-hint">' + esc(t.hint) + '</p>' +
        '<ul class="opt-list">' + items + '</ul>' +
        '<p class="spec-box"><span class="spec-box-l">명세 문구</span>' + esc(DY.specOf(b)) + '</p>' +
      '</div>' +
      commentView(b);
  }

  function commentView(b) {
    var st = api.getState();
    var list = DY.threadOf(st, b.id);
    var items = list.map(function (c) {
      return '<li class="cmt-item"><div class="cmt-meta"><span class="cmt-author">' + esc(c.author || '익명') + '</span>' +
        '<span class="cmt-at">' + DY.fmtDate(c.at) + '</span></div>' +
        '<p>' + esc(c.text) + '</p></li>';
    }).join('');
    if (!list.length) items = '<li class="cmt-empty">아직 질문이 없습니다. 이 블록에 핀을 꽂아 묻습니다.</li>';
    return '' +
      '<div class="rail-sec">' +
        '<div class="rail-sec-head"><h2 class="rail-h">질문·답변</h2><span class="count">' + list.length + '</span></div>' +
        '<ul class="cmt-list">' + items + '</ul>' +
        '<form class="cmt-form" data-action="comment">' +
          '<label class="sr-only" for="cmtAuthor">이름</label>' +
          '<input class="fld-in fld-in-sm" id="cmtAuthor" name="author" placeholder="이름" value="' + esc(author()) + '" maxlength="16" autocomplete="nickname">' +
          '<label class="sr-only" for="cmtText">질문 내용</label>' +
          '<textarea class="fld-in fld-in-sm" id="cmtText" name="text" rows="2" placeholder="이 블록에 대해 물어보세요" maxlength="240"></textarea>' +
          '<button class="btn btn-quiet btn-sm" type="submit">질문 남기기</button>' +
        '</form>' +
      '</div>';
  }

  /* ── 3단계: 잠금과 공유 ───────────────────────────────── */
  function viewLock() {
    var st = api.getState();
    var e = DY.estimateDoc(st);
    var current = DY.hashDoc(st);
    var pages = DY.allPages(st);
    var locked = st.lock;
    var out = '';

    if (!locked) {
      out += '<div class="rail-sec">' +
        '<h2 class="rail-h">합의본 잠금</h2>' +
        '<p class="rail-hint">지금 도면을 해시로 고정하고 읽기 전용 링크를 만듭니다. 이후 수정은 이 잠금본과 비교해서 보여줍니다.</p>' +
        '<label class="fld"><span class="fld-l">합의 메모 (선택)</span>' +
          '<input class="fld-in" type="text" data-action="lock-note" placeholder="예: 1차 범위 확정" maxlength="40"></label>' +
        '<button class="btn btn-primary btn-block" type="button" data-action="lock">이 도면을 잠그기</button>' +
        '<p class="rail-meta rail-meta-top">해시 <code class="mono">' + current + '</code></p>' +
        '<p class="rail-meta">' + pages.length + '개 페이지, 블록 ' + e.blockCount + '개, 예상 ' + DY.fmt1(e.low) + '–' + DY.fmt1(e.high) + ' 인·일</p>' +
      '</div>';
    } else {
      var hasSnap = Array.isArray(locked.pages);
      var diff = hasSnap ? DY.diffDoc(st, locked.pages) : [];
      out += '<div class="rail-sec">' +
        '<div class="rail-sec-head"><h2 class="rail-h">잠긴 합의본</h2><span class="seal">잠김</span></div>' +
        '<p class="hash-line"><span class="hash-l">지문</span><code class="mono">' + esc(locked.hash) + '</code></p>' +
        '<p class="rail-meta">' + DY.fmtDate(locked.at) + (locked.note ? ' · ' + esc(locked.note) : '') + '</p>' +
        '<div class="rail-actions rail-actions-col">' +
          '<button class="btn btn-primary btn-sm btn-block" type="button" data-action="copy-link">읽기 전용 링크 복사</button>' +
          '<button class="btn btn-quiet btn-sm btn-block" type="button" data-action="open-spec">명세서 열기</button>' +
          '<button class="btn btn-quiet btn-sm btn-block" type="button" data-action="print-spec">PDF로 인쇄</button>' +
          '<button class="btn btn-quiet btn-sm btn-block" type="button" data-action="download-json">JSON 저장</button>' +
        '</div>' +
        (api.isReadonly() ? '' : '<button class="link-btn" type="button" data-action="unlock">잠금 해제하고 계속 편집</button>') +
      '</div>' +
      '<div class="rail-sec">' +
        '<div class="rail-sec-head"><h2 class="rail-h">잠금본과 다른 점</h2><span class="count">' + diff.length + '</span></div>' +
        (!hasSnap
          ? '<p class="rail-meta">이 링크에는 잠금 시점의 사본이 담겨 있지 않아 비교를 건너뜁니다. 잠근 사람이 링크를 다시 만들면 비교가 표시됩니다.</p>'
          : diff.length
          ? '<ul class="diff-list">' + diff.map(function (d) {
              var mark = d.kind === 'add' ? '+' : d.kind === 'del' ? '−' : '~';
              var cls = d.kind === 'add' ? 'is-add' : d.kind === 'del' ? 'is-del' : 'is-edit';
              return '<li class="diff-item ' + cls + '"><span class="diff-mark">' + mark + '</span>' +
                '<span class="diff-name"><span class="diff-page">' + esc(d.page) + '</span>' + esc(d.label) + '</span>' +
                '<span class="diff-fields">' + esc(d.detail || '') + '</span></li>';
            }).join('') + '</ul>'
          : '<p class="rail-meta">잠근 뒤 바뀐 블록이 없습니다. 지문 <code class="mono">' + current + '</code>도 같습니다.</p>') +
      '</div>';
    }

    /* 견적 상세 */
    out += '<div class="rail-sec">' +
      '<h2 class="rail-h">견적 상세</h2>' +
      '<p class="big-num">' + DY.fmt1(e.low) + '<span class="big-dash"> – </span>' + DY.fmt1(e.high) + '<span class="big-unit"> 인·일</span></p>' +
      '<div class="level-strip" aria-label="등급 분포">' +
        '<span class="ls ls-1" style="flex:' + (e.byLevel[1] || 0) + '">L1 ' + (e.byLevel[1] || 0) + '</span>' +
        '<span class="ls ls-2" style="flex:' + (e.byLevel[2] || 0) + '">L2 ' + (e.byLevel[2] || 0) + '</span>' +
        '<span class="ls ls-3" style="flex:' + (e.byLevel[3] || 0) + '">L3 ' + (e.byLevel[3] || 0) + '</span>' +
      '</div>' +
      '<div class="money-row">' +
        '<button class="link-btn" type="button" data-action="toggle-money">' + (showMoney ? '금액 숨기기' : '금액으로 보기') + '</button>' +
        (showMoney ? '<label class="fld fld-inline"><span class="fld-l">인·일 단가</span>' +
          '<input class="fld-in fld-in-sm" type="number" min="0" step="10000" value="' + unitPrice + '" data-action="unit-price">' +
          '<span class="fld-unit">원</span></label>' : '') +
      '</div>' +
      (showMoney ? '<p class="money">' + DY.money(e, unitPrice) + '</p>' : '') +
      '<p class="rail-meta">설계 기준 추정치이며 확정 견적이 아닙니다. 공통 1.5 인·일과 페이지 레이아웃 ' + DY.fmt1(e.pageCost) + ' 인·일이 포함됩니다.</p>' +
    '</div>';

    if (!api.isReadonly()) {
      out += '<div class="rail-sec rail-sec-quiet">' +
        '<h2 class="rail-h">다음</h2>' +
        '<p class="rail-hint">잠근 링크를 그대로 보내면 의뢰자도 같은 도면을 봅니다. 질문은 블록에 핀으로 남습니다.</p>' +
      '</div>';
    }
    return out;
  }

  /* ── 렌더 ───────────────────────────────────────────────── */
  function render() {
    var el = $('#rail');
    if (!el || !api) return;
    var st = api.getState();
    var id = api.getSelected();
    var b = st.blocks.filter(function (x) { return x.id === id; })[0];
    var html = '';

    if (step === 1) html = (b ? viewBlock(b) : '') + viewSummary();
    else if (step === 2) html = b ? viewOptions(b) : viewSummary() + '<div class="rail-sec rail-sec-quiet"><p class="rail-hint">캔버스에서 블록을 누르면 기능 체크리스트가 열립니다.</p></div>';
    else html = viewLock();

    el.innerHTML = html;
  }

  /* ── 팔레트 ─────────────────────────────────────────────── */
  function renderPalette() {
    var el = $('#paletteList');
    if (!el) return;
    var html = DY.GROUPS.map(function (g) {
      var types = Object.keys(DY.TYPES).filter(function (k) { return DY.TYPES[k].group === g; });
      return '<div class="pal-grp"><h3 class="pal-grp-h">' + esc(g) + '</h3>' +
        types.map(function (k) {
          var t = DY.TYPES[k];
          return '<button class="pal" type="button" data-add="' + k + '">' +
            '<span class="pal-ico" aria-hidden="true">' + DY.icon(k) + '</span>' +
            '<span class="pal-body"><span class="pal-name">' + esc(t.name) + '</span>' +
            '<span class="pal-meta">' + esc(t.hint) + '</span></span>' +
            '<span class="pal-lv lv-' + t.level + '">L' + t.level + '</span>' +
            '</button>';
        }).join('') + '</div>';
    }).join('');
    el.innerHTML = html;
  }

  /* ── 이벤트 ─────────────────────────────────────────────── */
  function onChange() {
    api.commit();
    render();
  }

  function bindEvents() {
    var rail = $('#rail');

    rail.addEventListener('input', function (e) {
      var a = e.target.dataset.action;
      if (a === 'label') {
        var b = current();
        if (!b) return;
        b.label = e.target.value.slice(0, 24);
        api.touch();
        DY.canvas.render();
      } else if (a === 'unit-price') {
        unitPrice = Math.max(0, Number(e.target.value) || 0);
        render();
      } else if (a === 'lock-note') {
        api.setLockNote(e.target.value);
      }
    });

    rail.addEventListener('change', function (e) {
      var a = e.target.dataset.action;
      if (a === 'opt') {
        var b = current();
        if (!b) return;
        var id = e.target.dataset.opt;
        var i = b.options.indexOf(id);
        if (e.target.checked && i < 0) b.options.push(id);
        if (!e.target.checked && i > -1) b.options.splice(i, 1);
        onChange();
      }
    });

    rail.addEventListener('submit', function (e) {
      var form = e.target.closest('[data-action="comment"]');
      if (!form) return;
      e.preventDefault();
      var b = current();
      if (!b) return;
      var au = form.elements.author.value.trim();
      var tx = form.elements.text.value.trim();
      if (!tx) { DY.toast('질문 내용을 적어 주세요.'); return; }
      setAuthor(au);
      var st = api.getState();
      DY.threadOf(st, b.id).push({ id: DY.uid('c'), at: Date.now(), author: au || '익명', text: tx });
      form.elements.text.value = '';
      onChange();
      DY.canvas.render();
      DY.toast('블록에 핀을 꽂았습니다.');
    });

    rail.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var a = btn.dataset.action;
      var b = current();
      var st = api.getState();

      if (a === 'span-inc' && b) { b.span = clamp(b.span + 1, 1, 13 - b.col); onChange(); }
      else if (a === 'span-dec' && b) { b.span = clamp(b.span - 1, 1, 12); onChange(); }
      else if (a === 'rows-inc' && b) { b.rows = clamp(b.rows + 1, 1, 14); onChange(); }
      else if (a === 'rows-dec' && b) { b.rows = clamp(b.rows - 1, 1, 12); onChange(); }
      else if (a === 'del-block' && b) { api.deleteBlock(b.id); }
      else if (a === 'go-options') { api.goto(2); }
      else if (a === 'lock') {
        st.lock = {
          hash: DY.hashDoc(st),
          at: Date.now(),
          note: (st.lockNote || '').trim(),
          pages: JSON.parse(JSON.stringify(DY.allPages(st)))
        };
        st.snapshots = (st.snapshots || []).concat([{ hash: st.lock.hash, at: st.lock.at, note: st.lock.note }]).slice(-6);
        onChange();
        DY.toast('잠갔습니다 · ' + st.lock.hash);
      }
      else if (a === 'unlock') {
        st.lock = null;
        onChange();
        DY.toast('잠금을 해제했습니다. 수정 내용은 새 지문으로 계산됩니다.');
      }
      else if (a === 'copy-link') {
        var url = shareUrl(st);
        copy(url);
      }
      else if (a === 'open-spec') { api.openSpec(); }
      else if (a === 'print-spec') { api.printSpec(); }
      else if (a === 'download-json') { api.downloadJson(); }
      else if (a === 'toggle-money') { showMoney = !showMoney; render(); }
    });

    $('#paletteList').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-add]');
      if (!btn) return;
      api.addBlock(btn.dataset.add);
    });
  }

  function current() {
    var st = api.getState();
    var id = api.getSelected();
    return st.blocks.filter(function (x) { return x.id === id; })[0] || null;
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        DY.toast('링크를 복사했습니다. 이 주소로 도면이 그대로 열립니다.');
      }).catch(function () { fallbackCopy(text); });
    } else fallbackCopy(text);
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    DY.toast(ok ? '링크를 복사했습니다.' : '복사하지 못했습니다. 주소창의 링크를 직접 복사해 주세요.');
  }

  DY.rail = {
    init: function (a) { api = a; renderPalette(); bindEvents(); },
    render: render,
    setStep: function (s) { step = s; render(); },
    setUnitPrice: function (v) { unitPrice = v; }
  };
})(window);
