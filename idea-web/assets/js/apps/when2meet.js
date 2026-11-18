/* when2meet — 가능한 시간을 칠하면 겹치는 시간이 보인다 */
(function () {
  "use strict";

  const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
  const HOURS = Array.from({ length: 13 }, (_, i) => i + 9);

  window.LAB.add({
    id: "when2meet",
    name: "웬투밋",
    original: "When2meet",
    tier: "t2",
    tag: "일정 조율",
    blurb:
      "회의 잡느라 링크를 열두 개 주고받는 대신, 가능한 칸을 칠하고 링크 하나만 보내세요.",
    info: "드래그 가능 시간 조율",
    mount(root) {
      const { el, store, toast } = window.UI;
      const KEY = "when2meet.responses";
      let responses = store.get(KEY, []);
      const selected = new Set();
      let painting = false;
      let paintValue = true;

      const keyOf = (day, hour) => `${day}-${hour}`;
      const labelOf = (day, hour) =>
        `${DAYS[day]}요일 ${String(hour).padStart(2, "0")}:00`;

      const head = el("span", { class: "mono", text: `${responses.length}명 참여` });
      const nameInput = el("input", {
        class: "input",
        type: "text",
        value: "나",
        maxlength: "12",
        "aria-label": "이름",
      });
      const grid = el("div", { class: "w2m-grid" });
      const bestHost = el("div", { class: "w2m-best" });
      const people = el("div", { class: "w2m-people" });
      const cells = new Map();

      const setCell = (day, hour, on) => {
        const cell = cells.get(keyOf(day, hour));
        if (!cell) return;
        const key = keyOf(day, hour);
        if (on) selected.add(key);
        else selected.delete(key);
        cell.classList.toggle("is-on", on);
        cell.setAttribute("aria-pressed", on ? "true" : "false");
      };

      const buildGrid = () => {
        grid.append(el("span", { class: "w2m-corner mono", text: "시간" }));
        DAYS.forEach((day) =>
          grid.append(el("span", { class: "w2m-day", text: day }))
        );
        HOURS.forEach((hour) => {
          grid.append(el("span", { class: "w2m-hour mono", text: `${hour}:00` }));
          DAYS.forEach((_, dayIndex) => {
            const cell = el("button", {
              class: "w2m-cell",
              type: "button",
              dataset: { day: String(dayIndex), hour: String(hour) },
              "aria-label": labelOf(dayIndex, hour),
              "aria-pressed": "false",
            });
            cell.append(el("span", { class: "w2m-count", text: "" }));
            cells.set(keyOf(dayIndex, hour), cell);
            grid.append(cell);
          });
        });
      };

      const paint = (event) => {
        const cell = event.target.closest(".w2m-cell");
        if (!cell) return;
        painting = true;
        paintValue = !cell.classList.contains("is-on");
        setCell(Number(cell.dataset.day), Number(cell.dataset.hour), paintValue);
      };

      grid.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        paint(event);
      });

      const onMove = (event) => {
        if (!painting) return;
        const cell = document.elementFromPoint(event.clientX, event.clientY);
        const target = cell && cell.closest ? cell.closest(".w2m-cell") : null;
        if (target) {
          setCell(Number(target.dataset.day), Number(target.dataset.hour), paintValue);
        }
      };
      const onUp = () => {
        painting = false;
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);

      const counts = () => {
        const map = new Map();
        responses.forEach((response) => {
          response.slots.forEach((key) => map.set(key, (map.get(key) || 0) + 1));
        });
        return map;
      };

      const renderHeat = () => {
        const map = counts();
        const max = Math.max(1, ...map.values());
        cells.forEach((cell, key) => {
          const count = map.get(key) || 0;
          const label = cell.querySelector(".w2m-count");
          label.textContent = count ? String(count) : "";
          cell.style.setProperty("--heat", String(count / max));
          cell.classList.toggle("has-people", count > 0);
        });

        const top = Array.from(map.entries())
          .filter(([, count]) => count > 0)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);
        bestHost.replaceChildren(
          ...(top.length
            ? [
                el("span", { class: "w2m-best-label mono", text: "가장 많이 겹치는 시간" }),
                ...top.map(([key, count]) => {
                  const [day, hour] = key.split("-").map(Number);
                  return el(
                    "span",
                    { class: "w2m-best-chip" },
                    el("strong", { text: labelOf(day, hour) }),
                    el("span", { class: "mono", text: `${count}명` })
                  );
                }),
              ]
            : [el("span", { class: "hint", text: "아직 응답이 없습니다. 이름을 적고 칸을 칠해 보세요." })])
        );

        people.replaceChildren(
          ...(responses.length
            ? responses.map((response, index) =>
                el(
                  "span",
                  { class: "w2m-person" },
                  el("span", { class: "w2m-person-name", text: response.name }),
                  el("span", { class: "mono", text: `${response.slots.length}칸` }),
                  el("button", {
                    class: "w2m-person-x",
                    type: "button",
                    "aria-label": `${response.name} 응답 지우기`,
                    html: window.UI.icon("close", 11),
                    onclick: () => {
                      responses.splice(index, 1);
                      store.set(KEY, responses);
                      head.textContent = `${responses.length}명 참여`;
                      renderHeat();
                    },
                  })
                )
              )
            : [])
        );
      };

      const save = () => {
        const name = nameInput.value.trim() || "이름 없음";
        if (!selected.size) {
          toast("가능한 시간을 먼저 칠해 주세요");
          return;
        }
        const slots = Array.from(selected.values());
        const existing = responses.findIndex((response) => response.name === name);
        const entry = { name, slots };
        if (existing >= 0) responses[existing] = entry;
        else responses.push(entry);
        store.set(KEY, responses);
        head.textContent = `${responses.length}명 참여`;
        renderHeat();
        toast(`${name}의 가능한 시간 ${slots.length}칸을 저장했습니다`);
      };

      root.append(
        el(
          "div",
          { class: "lab w2m-lab" },
          el(
            "div",
            { class: "lab-top" },
            el("span", { class: "lab-h", text: "이번 주 회의 잡기" }),
            head
          ),
          el(
            "div",
            { class: "w2m-toolbar" },
            el(
              "label",
              { class: "w2m-name" },
              el("span", { class: "hint", text: "이름" }),
              nameInput
            ),
            el("button", { class: "btn btn--sm btn--primary", type: "button", text: "내 시간 저장", onclick: save }),
            el("button", {
              class: "btn btn--sm btn--ghost",
              type: "button",
              text: "선택 지우기",
              onclick: () => {
                selected.clear();
                cells.forEach((cell) => {
                  cell.classList.remove("is-on");
                  cell.setAttribute("aria-pressed", "false");
                });
              },
            }),
            el("span", { class: "hint", text: "칸을 누르고 문지르면 한 번에 칠해집니다" })
          ),
          el("div", { class: "w2m-scroll" }, grid),
          bestHost,
          el(
            "div",
            { class: "w2m-foot" },
            el("span", { class: "hint", text: "응답은 이 브라우저에만 저장됩니다." }),
            el(
              "div",
              { class: "w2m-people" },
              people
            )
          )
        )
      );

      buildGrid();
      renderHeat();

      return () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };
    },
  });
})();
