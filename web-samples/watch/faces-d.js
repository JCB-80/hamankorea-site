(() => {
  'use strict';
  const $ = id => document.getElementById(id), id = document.body.dataset.face;
  const buttons = [...document.querySelectorAll('[data-mode]')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = n => String(n).padStart(2, '0');
  let mode = buttons[0].dataset.mode, bpm = 100, timerEnd = 0, peak = 0, peakUntil = 0;
  const text = (name, value) => { if ($(name)) $(name).textContent = value; };
  const pressed = () => buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  function timeParts(now) { return [pad(now.getHours()), pad(now.getMinutes())]; }
  function updateVU(now) {
    const meterMode = mode === 'meter', sec = now / 1000;
    const beat = (sec * bpm / 60) % 1;
    const sample = reduce ? (meterMode ? .46 : .6) : meterMode
      ? Math.min(1, .24 + .64 * Math.abs(Math.sin(sec * 1.31) * Math.cos(sec * 2.64)) + .14 * Math.abs(Math.sin(sec * 7)))
      : .12 + .76 * Math.exp(-beat * 7);
    if (sample >= peak || now >= peakUntil) { peak = sample; peakUntil = now + 900; }
    $('needle').setAttribute('transform', 'rotate(' + (-58 + sample * 116).toFixed(1) + ' 120 150)');
    $('peak-needle').setAttribute('transform', 'rotate(' + (-58 + peak * 116).toFixed(1) + ' 120 150)');
    $('peak-needle').setAttribute('visibility', meterMode ? 'visible' : 'hidden');
    text('face-mode', meterMode ? 'PEAK HOLD' : bpm + ' BPM');
    text('panel-value', meterMode ? (Math.round(-20 + peak * 23) + ' dB') : bpm + ' BPM');
  }
  function render() {
    const now = new Date(), epoch = now.getTime();
    if (id === 'vu') { updateVU(epoch); return; }
    if (id === 'melon') {
      const countdown = mode === 'timer';
      const remain = Math.max(0, Math.ceil((timerEnd - epoch) / 1000));
      const pair = countdown ? [pad(Math.floor(remain / 60)), pad(remain % 60)] : timeParts(now);
      text('face-hours', pair[0]); text('face-minutes', pair[1]); text('panel-value', pair.join(':'));
      text('face-mode', countdown ? (remain ? 'TIMER · DEMO' : 'TIMER · END') : 'LOCAL TIME');
      return;
    }
    if (id === 'teletext') {
      const agenda = mode === 'agenda', time = timeParts(now).join(':');
      text('face-time', time); text('face-primary', agenda ? '10:30' : '18°');
      text('face-type', agenda ? 'TODAY / 02' : 'WEATHER / 01');
      text('face-detail', agenda ? '스튜디오 미팅' : '예시 · 구름 조금');
      text('face-extra', agenda ? '14:00 자료 정리' : '최고 22° · 최저 13°');
      text('panel-value', agenda ? '10:30' : '18°C');
      $('rail').setAttribute('fill', agenda ? '#72b5ff' : '#00e5a8');
      return;
    }
    const red = mode === 'red';
    $('sky').classList.toggle('red', red);
    text('face-mode', red ? 'CRIMSON MODE' : 'INDIGO MODE'); text('panel-value', red ? 'Crimson' : 'Indigo');
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.mode;
    if (id === 'melon' && mode === 'timer') timerEnd = Date.now() + 60000;
    if (id === 'vu') { peak = 0; peakUntil = 0; $('bpm-controls').hidden = mode !== 'beat'; }
    pressed(); render(); text('status', button.textContent + ' 모드로 바꿨어요.');
  }));
  if (id === 'vu') {
    document.querySelectorAll('[data-bpm]').forEach(button => button.addEventListener('click', () => {
      bpm = Math.max(60, Math.min(160, bpm + Number(button.dataset.bpm))); render();
      text('status', bpm + ' BPM으로 조정했어요. 소리는 재생하지 않습니다.');
    }));
  }
  render();
  if (id !== 'night') {
    const interval = id !== 'vu' || reduce ? 1000 : 90;
    setInterval(() => { if (!document.hidden) render(); }, interval);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
  }
})();
