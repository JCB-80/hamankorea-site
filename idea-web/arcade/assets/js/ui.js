/* ui — shared helpers for the shell and the 23 labs */
window.UI = (function () {
  "use strict";

  const el = (tag, attrs, ...children) => {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === false) return;
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key === "html") node.innerHTML = value;
      else if (key === "dataset") Object.assign(node.dataset, value);
      else if (key === "style") {
        Object.entries(value).forEach(([prop, val]) => {
          if (prop.startsWith("--")) node.style.setProperty(prop, val);
          else node.style[prop] = val;
        });
      }
      else if (key.startsWith("on") && typeof value === "function") {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, value);
    });
    children.flat(Infinity).forEach((child) => {
      if (child === undefined || child === null || child === false) return;
      node.append(child.nodeType ? child : document.createTextNode(String(child)));
    });
    return node;
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const clear = (node) => {
    while (node.firstChild) node.removeChild(node.firstChild);
    return node;
  };

  const fmt = (n) => new Intl.NumberFormat("ko-KR").format(Math.round(n));
  const money = (n) => "$" + new Intl.NumberFormat("en-US").format(Math.round(n));

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const debounce = (fn, wait = 120) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  };

  const copy = async (text, message = "복사했습니다") => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      toast(message);
      return true;
    } catch (err) {
      toast("복사하지 못했습니다");
      return false;
    }
  };

  const download = (name, data, type = "text/plain;charset=utf-8") => {
    const blob = data instanceof Blob ? data : new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  let toastTimer = 0;
  const toast = (message) => {
    const node = document.getElementById("toast");
    if (!node) return;
    node.textContent = message;
    node.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove("is-on"), 1900);
  };

  const on = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    return () => target.removeEventListener(type, fn, opts);
  };

  const canvas = (parent, w, h, ratio) => {
    const cv = document.createElement("canvas");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    cv.style.width = "100%";
    cv.style.aspectRatio = `${w} / ${h}`;
    cv.style.height = "auto";
    if (ratio) cv.style.maxWidth = ratio;
    const ctx = cv.getContext("2d");
    ctx.scale(dpr, dpr);
    if (parent) parent.appendChild(cv);
    return { cv, ctx, w, h, dpr };
  };

  const pointerPos = (cv, event, w, h) => {
    const rect = cv.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * w,
      y: ((event.clientY - rect.top) / rect.height) * h,
    };
  };

  const mem = new Map();
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (err) {
        return mem.has(key) ? mem.get(key) : fallback;
      }
    },
    set(key, value) {
      mem.set(key, value);
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (err) {
        /* file:// or private mode — memory keeps it for the session */
      }
    },
  };

  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  };

  const seeded = (seed) => {
    let a = seed >>> 0;
    return () => {
      a += 0x6d2b79f5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const icon = (name, size = 18) => {
    const paths = {
      search: '<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/>',
      back: '<path d="M15 5l-7 7 7 7"/>',
      next: '<path d="M9 5l7 7-7 7"/>',
      check: '<path d="m5 12 4.5 4.5L19 7"/>',
      close: '<path d="M6 6l12 12M18 6 6 18"/>',
      copy: '<rect x="9" y="9" width="10" height="10" rx="1.5"/><path d="M6 15H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1"/>',
      download: '<path d="M12 4v11m0 0 4-4m-4 4-4-4"/><path d="M5 19h14"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      minus: '<path d="M5 12h14"/>',
      trash: '<path d="M4 7h16M9 7V5h6v2m-8 0 1 13h8l1-13"/>',
      play: '<path d="M7 5l12 7-12 7V5z"/>',
      pause: '<path d="M8 5v14M16 5v14"/>',
      lock: '<rect x="5" y="10" width="14" height="10" rx="1.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
      unlock: '<rect x="5" y="10" width="14" height="10" rx="1.5"/><path d="M8 10V7a4 4 0 0 1 7-2"/>',
    };
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ""}</svg>`;
  };

  return {
    el,
    $,
    $$,
    clear,
    fmt,
    money,
    clamp,
    lerp,
    randInt,
    pick,
    shuffle,
    easeOutCubic,
    easeOutQuart,
    easeInOutCubic,
    debounce,
    copy,
    download,
    toast,
    on,
    canvas,
    pointerPos,
    store,
    todayKey,
    seeded,
    icon,
  };
})();
