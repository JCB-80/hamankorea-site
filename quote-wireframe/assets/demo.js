/* 도면 — 랜딩 히어로의 미니 캔버스. 같은 계산을 그대로 씁니다. */
(function () {
  'use strict';
  var DY = window.DY;
  var host = document.getElementById('demoCanvas');
  if (!host) return;

  var blocks = [
    { id: 'd1', type: 'hero', label: '상단 버튼 / 배너', options: ['link', 'tel'], col: 1, row: 1, span: 12, rows: 4 },
    { id: 'd2', type: 'booking', label: '일정·예약', options: ['date'], col: 1, row: 5, span: 6, rows: 4 },
    { id: 'd3', type: 'contact', label: '문의하기', options: ['db'], col: 7, row: 5, span: 6, rows: 4 },
    { id: 'd4', type: 'board', label: '목록·게시판', options: [], col: 1, row: 9, span: 12, rows: 3 }
  ];
  var sel = 'd1';
  var optHost = document.getElementById('demoOptions');
  var specEl = document.getElementById('demoSpec');
  var costEl = document.getElementById('demoCost');
  var lvEl = document.getElementById('demoLevel');

  function byId(id) {
    for (var i = 0; i < blocks.length; i++) if (blocks[i].id === id) return blocks[i];
    return null;
  }

  function render() {
    Array.prototype.forEach.call(host.children, function (btn) {
      var id = btn.dataset.b === 'hero' ? 'd1' : btn.dataset.b === 'booking' ? 'd2' : btn.dataset.b === 'contact' ? 'd3' : 'd4';
      var on = id === sel;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    var b = byId(sel);
    var t = DY.TYPES[b.type];
    optHost.innerHTML = t.options.map(function (o) {
      var on = b.options.indexOf(o.id) > -1;
      return '<button class="chip' + (on ? ' is-on' : '') + '" type="button" data-opt="' + o.id + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + DY.esc(o.name) + '</button>';
    }).join('');

    specEl.textContent = DY.specOf(b);
    var e = DY.estimate(blocks);
    costEl.textContent = DY.fmt1(e.low) + '–' + DY.fmt1(e.high);
    lvEl.textContent = '선택 L' + DY.levelOf(b) + ' / ' + b.label;
  }

  host.addEventListener('click', function (e) {
    var btn = e.target.closest('.demo-block');
    if (!btn) return;
    sel = btn.dataset.b === 'hero' ? 'd1' : btn.dataset.b === 'booking' ? 'd2' : btn.dataset.b === 'contact' ? 'd3' : 'd4';
    render();
  });

  optHost.addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (!chip) return;
    var b = byId(sel);
    var id = chip.dataset.opt;
    var i = b.options.indexOf(id);
    if (i > -1) b.options.splice(i, 1); else b.options.push(id);
    render();
  });

  render();
})();
