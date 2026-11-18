/* shell — home tiers, hash router, workbench mounting */
(function () {
  "use strict";

  const { el, clear, fmt, pick, toast, icon } = window.UI;
  const LAB = window.LAB;
  const baseTitle = document.title;
  const home = document.getElementById("home");
  const appView = document.getElementById("app");
  const tiersHost = document.getElementById("tiers");
  const miniHost = document.getElementById("mini-table");

  let cleanup = null;
  let currentId = null;

  const pad = (n) => String(n).padStart(2, "0");

  function cardFor(app) {
    const tier = LAB.tierOf(app);
    return el(
      "a",
      {
        class: "card",
        href: `#/a/${app.id}`,
        style: { "--tier": tier.color },
        dataset: { app: app.id },
      },
      el("span", { class: "card-no", text: pad(app.position) }),
      el("span", { class: "card-tag", text: app.tag }),
      el("span", { class: "card-name", text: app.name }),
      el("span", { class: "card-blurb", text: app.blurb }),
      el("span", { class: "card-go", text: "체험" })
    );
  }

  function featureFor(app) {
    const tier = LAB.tierOf(app);
    const row = (label, keys) =>
      el(
        "div",
        { class: "feature-keys-row" },
        el("span", { text: label }),
        el("span", {}, ...keys.map((key) => el("span", { class: "kbd", text: key })))
      );
    return el(
      "a",
      {
        class: "card card--feature",
        href: `#/a/${app.id}`,
        style: { "--tier": tier.color },
        dataset: { app: app.id },
      },
      el(
        "div",
        { class: "feature-main" },
        el("span", { class: "card-tag", text: `${tier.name} · ${app.tag}` }),
        el("span", { class: "card-name", text: app.name }),
        el("span", { class: "card-blurb", text: app.blurb }),
        el("span", { class: "card-go", text: "체험" })
      ),
      el(
        "div",
        { class: "feature-keys", "aria-hidden": "true" },
        row("사이트 찾기", ["⌘", "K"]),
        row("이동", ["↑", "↓"]),
        row("열기", ["Enter"])
      )
    );
  }

  function buildTiers() {
    const all = LAB.ordered();
    clear(tiersHost);
    LAB.tiers.forEach((tier) => {
      const apps = all.filter((app) => app.tier === tier.key);
      if (!apps.length) return;
      const row = el(
        "section",
        {
          class: `tier${tier.key === "champ" ? " tier--champ" : ""}`,
          style: { "--tier": tier.color, "--tier-soft": tier.soft },
          "aria-labelledby": `tier-${tier.key}`,
        },
        el(
          "div",
          { class: "tier-label" },
          el("span", { class: "tier-no", "aria-hidden": "true", text: tier.no }),
          el("h3", {
            class: `tier-name${tier.name === tier.no ? " sr-only" : ""}`,
            id: `tier-${tier.key}`,
            text: tier.name,
          }),
          el("span", { class: "tier-count", text: `${apps.length}곳` }),
          el("p", { class: "hint", text: tier.note })
        ),
        el(
          "div",
          { class: "tier-cards" },
          ...apps.map((app) => (tier.key === "champ" ? featureFor(app) : cardFor(app)))
        )
      );
      tiersHost.append(row);
    });
  }

  function buildMini() {
    const all = LAB.ordered();
    clear(miniHost);
    miniHost.append(
      el(
        "div",
        { class: "mini-head" },
        el("strong", { text: "티어표" }),
        el("span", { class: "mono", text: `${all.length}곳` })
      )
    );
    LAB.tiers.forEach((tier) => {
      const apps = all.filter((app) => app.tier === tier.key);
      if (!apps.length) return;
      const shown = apps.slice(0, 3);
      miniHost.append(
        el(
          "div",
          { class: "mini-row" },
          el("span", { class: "mini-row-no", text: tier.no }),
          el(
            "div",
            { class: "mini-chips" },
            ...shown.map((app) =>
              el(
                "a",
                {
                  class: "mini-chip",
                  href: `#/a/${app.id}`,
                  title: app.blurb,
                },
                app.name
              )
            ),
            apps.length > shown.length
              ? el("span", { class: "mini-chip", text: `+${apps.length - shown.length}` })
              : null
          )
        )
      );
    });
    miniHost.append(
      el(
        "div",
        { class: "mini-foot" },
        el("span", { text: "이름을 누르면 바로 열립니다" }),
        el("span", { class: "mono", text: "⌘K" })
      )
    );
  }

  function stopApp() {
    if (typeof cleanup === "function") {
      try {
        cleanup();
      } catch (err) {
        console.warn("cleanup 실패", err);
      }
    }
    cleanup = null;
    currentId = null;
  }

  function showHome(hash) {
    stopApp();
    appView.hidden = true;
    home.hidden = false;
    document.title = baseTitle;
    const target = hash && hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
    if (target) {
      requestAnimationFrame(() => target.scrollIntoView({ block: "start", behavior: "smooth" }));
    } else if (hash !== "#table") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }

  function renderApp(app) {
    stopApp();
    const tier = LAB.tierOf(app);
    const all = LAB.ordered();
    const index = all.findIndex((row) => row.id === app.id);
    const prev = all[(index - 1 + all.length) % all.length];
    const next = all[(index + 1) % all.length];

    currentId = app.id;
    home.hidden = true;
    appView.hidden = false;
    clear(appView);
    appView.style.setProperty("--tier", tier.color);
    appView.style.setProperty("--tier-soft", tier.soft);

    const bar = el(
      "div",
      { class: "workbench-bar" },
      el(
        "a",
        { class: "crumb", href: "#/" },
        el("span", { html: icon("back", 15), "aria-hidden": "true" }),
        "티어표"
      ),
      el(
        "div",
        { class: "row" },
        el("span", { class: "mono", text: `${pad(app.position)} / ${all.length}` }),
        el("button", {
          class: "btn btn--sm btn--ghost",
          type: "button",
          text: "링크 복사",
          onclick: () => window.UI.copy(location.href, "주소를 복사했습니다"),
        })
      )
    );

    const head = el(
      "div",
      { class: "workbench-head" },
      el(
        "div",
        {},
        el(
          "span",
          { class: "tier-pill" },
          el("b", { text: tier.name }),
          el("span", { text: `· ${app.original}` })
        ),
        el("h1", { class: "workbench-title", tabindex: "-1", text: app.name }),
        el("p", { class: "workbench-lede", text: app.blurb })
      )
    );

    const stage = el("div", { class: "stage", id: "stage", tabindex: "-1" });

    const foot = el(
      "div",
      { class: "app-foot" },
      el("span", { class: "mono", text: `원본 ${app.original} · 아이디어만 참고해 새로 구현` }),
      el(
        "div",
        { class: "row" },
        el("a", {
          class: "btn btn--sm",
          href: `#/a/${prev.id}`,
          text: "이전",
          "aria-label": `이전: ${prev.name}`,
        }),
        el("a", {
          class: "btn btn--sm",
          href: `#/a/${next.id}`,
          text: "다음",
          "aria-label": `다음: ${next.name}`,
        })
      )
    );

    appView.append(bar, head, stage, foot);
    document.title = `${app.name} · 아이디어웹`;

    try {
      const result = app.mount(stage, { toast, go: (id) => (location.hash = `#/a/${id}`) });
      cleanup = typeof result === "function" ? result : null;
    } catch (err) {
      console.error(`[${app.id}]`, err);
      stage.append(
        el(
          "div",
          { class: "app-error" },
          el("h2", { text: "이 화면을 열지 못했습니다" }),
          el("p", { text: String(err && err.message ? err.message : err) })
        )
      );
    }

    window.scrollTo({ top: 0, behavior: "auto" });
    const title = appView.querySelector(".workbench-title");
    if (title) title.focus({ preventScroll: true });
  }

  function route() {
    const hash = location.hash || "";
    if (hash.startsWith("#/a/")) {
      const id = decodeURIComponent(hash.slice(4).split("?")[0]);
      const app = LAB.byId(id);
      if (app) {
        renderApp(app);
        return;
      }
      toast("없는 사이트입니다. 티어표로 돌아갑니다");
    }
    showHome(hash === "#/" ? "" : hash);
  }

  buildTiers();
  buildMini();

  document.querySelectorAll("[data-random]").forEach((button) => {
    button.addEventListener("click", () => {
      const pool = LAB.ordered().filter((app) => app.id !== currentId);
      const app = pick(pool.length ? pool : LAB.apps);
      location.hash = `#/a/${app.id}`;
    });
  });

  window.addEventListener("hashchange", route);
  route();
})();
