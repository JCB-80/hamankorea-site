/* palette — the Cmd+K site finder */
window.LAB = window.LAB || {};
window.LAB.palette = (function () {
  "use strict";

  const root = document.getElementById("palette");
  const input = document.getElementById("palette-input");
  const list = document.getElementById("palette-list");
  const panel = root.querySelector(".palette-panel");
  const { el, clear } = window.UI;

  let isOpen = false;
  let selected = 0;
  let results = [];
  let lastFocus = null;

  const normalize = (value) => (value || "").toLowerCase().replace(/\s+/g, " ").trim();

  const match = (app, query) => {
    if (!query) return true;
    const tier = window.LAB.tierOf(app);
    const haystack = normalize(
      [app.name, app.original, app.tag, app.blurb, tier.name, app.info].join(" ")
    );
    return query.split(" ").every((word) => haystack.includes(word));
  };

  const paint = (query) => {
    results = window.LAB.ordered().filter((app) => match(app, query));
    selected = 0;
    clear(list);

    if (!results.length) {
      list.append(
        el("p", {
          class: "palette-empty",
          text: `“${query}”에 해당하는 곳이 없습니다. 다른 낱말로 찾아보세요.`,
        })
      );
      input.removeAttribute("aria-activedescendant");
      return;
    }

    results.forEach((app, index) => {
      const tier = window.LAB.tierOf(app);
      const item = el(
        "button",
        {
          class: "palette-item",
          type: "button",
          role: "option",
          id: `palette-item-${app.id}`,
          "aria-selected": index === 0 ? "true" : "false",
          style: { "--tier": tier.color },
          dataset: { id: app.id },
        },
        el("span", { class: "p-tier", text: tier.no }),
        el("span", { class: "p-name", text: app.name }),
        el("span", { class: "p-tag", text: app.tag })
      );
      item.addEventListener("mouseenter", () => select(index, false));
      item.addEventListener("click", () => choose(app));
      list.append(item);
    });
    input.setAttribute("aria-activedescendant", `palette-item-${results[0].id}`);
  };

  const select = (index, scroll = true) => {
    if (!results.length) return;
    selected = (index + results.length) % results.length;
    const items = Array.from(list.querySelectorAll(".palette-item"));
    items.forEach((item, i) => item.setAttribute("aria-selected", i === selected ? "true" : "false"));
    const active = items[selected];
    if (active) {
      input.setAttribute("aria-activedescendant", active.id);
      if (scroll) active.scrollIntoView({ block: "nearest" });
    }
  };

  const choose = (app) => {
    close();
    window.location.hash = `#/a/${app.id}`;
  };

  const open = () => {
    if (isOpen) return;
    isOpen = true;
    lastFocus = document.activeElement;
    root.hidden = false;
    document.body.style.overflow = "hidden";
    input.value = "";
    paint("");
    requestAnimationFrame(() => input.focus());
  };

  const close = () => {
    if (!isOpen) return;
    isOpen = false;
    root.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  };

  input.addEventListener("input", () => paint(normalize(input.value)));

  root.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      select(selected + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      select(selected - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      select(0);
    } else if (event.key === "End") {
      event.preventDefault();
      select(results.length - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (results[selected]) choose(results[selected]);
    } else if (event.key === "Tab") {
      event.preventDefault();
      input.focus();
    }
  });

  root.addEventListener("mousedown", (event) => {
    if (event.target === root) close();
  });

  document.addEventListener("keydown", (event) => {
    if (document.body.dataset.cmdk === "off") return;
    const key = event.key.toLowerCase();
    if ((event.metaKey || event.ctrlKey) && key === "k") {
      event.preventDefault();
      if (isOpen) close();
      else open();
    }
  });

  document.querySelectorAll("[data-open-palette]").forEach((button) => {
    button.addEventListener("click", open);
  });

  panel.addEventListener("click", (event) => event.stopPropagation());

  return { open, close, isOpen: () => isOpen };
})();
