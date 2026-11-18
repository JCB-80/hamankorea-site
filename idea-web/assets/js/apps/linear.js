/* linear — Cmd+K가 있는 이슈 트래커 */
(function () {
  "use strict";

  const DEFAULT_ISSUES = [
    { id: "SHB-14", title: "포인터 포인터: 모바일에서 손가락이 늦게 따라옴", status: "진행 중", priority: "높음", who: "서" },
    { id: "SHB-13", title: "꼬맨틀 사전에 ‘신박’과 ‘웹사이트’ 추가", status: "백로그", priority: "보통", who: "민" },
    { id: "SHB-12", title: "휠 오브 네임즈: 결과 복사 버튼", status: "완료", priority: "낮음", who: "지" },
    { id: "SHB-11", title: "딥 시 수심 표시가 1,000m에서 끊김", status: "진행 중", priority: "높음", who: "서" },
    { id: "SHB-10", title: "인피니트 크래프트 조합 결과 저장", status: "백로그", priority: "보통", who: "현" },
    { id: "SHB-9", title: "패스워드 게임 규칙 10번 문구 다듬기", status: "완료", priority: "낮음", who: "민" },
  ];

  window.LAB.add({
    id: "linear",
    name: "리니어 Cmd+K",
    original: "Linear",
    tier: "champ",
    tag: "커맨드 팔레트",
    blurb:
      "1등은 화면이 아니라 키보드였습니다. Cmd+K 하나로 모든 동작을 찾아 실행하는 방식, 여기서 직접 해보세요.",
    info: "커맨드 팔레트, 키보드 단축키",
    mount(root) {
      const { el, store, toast } = window.UI;
      const KEY = "linear.issues";
      let issues = store.get(KEY, DEFAULT_ISSUES);
      let selected = 0;
      let hideDone = false;
      let composing = false;
      let cmdOpen = false;
      let cmdIndex = 0;
      let cmdQuery = "";

      document.body.dataset.cmdk = "off";

      const shell = el("div", { class: "linear-shell" });
      const list = el("div", { class: "linear-list", role: "listbox", "aria-label": "이슈 목록" });
      const count = el("span", { class: "mono" });
      const search = el("input", {
        class: "linear-search",
        type: "search",
        placeholder: "이슈 검색",
        "aria-label": "이슈 검색",
      });
      const composeHost = el("div", { class: "linear-compose", hidden: true });
      const cmd = el("div", { class: "linear-cmd", hidden: true });
      const cmdInput = el("input", {
        class: "linear-cmd-input",
        type: "text",
        placeholder: "명령 또는 이슈 검색",
        "aria-label": "명령 검색",
        autocomplete: "off",
      });
      const cmdList = el("div", { class: "linear-cmd-list", role: "listbox" });

      const visible = () => {
        const query = search.value.trim().toLowerCase();
        return issues.filter((issue) => {
          if (hideDone && issue.status === "완료") return false;
          if (!query) return true;
          return `${issue.title} ${issue.id}`.toLowerCase().includes(query);
        });
      };

      const statusClass = (status) =>
        status === "완료" ? "is-done" : status === "진행 중" ? "is-doing" : "is-backlog";

      const renderList = () => {
        const rows = visible();
        if (selected >= rows.length) selected = Math.max(0, rows.length - 1);
        list.replaceChildren(
          ...(rows.length
            ? rows.map((issue, index) =>
                el(
                  "button",
                  {
                    class: `linear-row${index === selected ? " is-selected" : ""}`,
                    type: "button",
                    role: "option",
                    "aria-selected": index === selected ? "true" : "false",
                    onclick: () => {
                      selected = index;
                      renderList();
                    },
                  },
                  el("span", { class: `linear-dot ${statusClass(issue.status)}`, "aria-hidden": "true" }),
                  el("span", { class: "linear-id mono", text: issue.id }),
                  el("span", { class: "linear-title", text: issue.title }),
                  el("span", { class: "linear-priority", text: issue.priority }),
                  el("span", { class: "linear-who", text: issue.who })
                )
              )
            : [
                el("p", {
                  class: "linear-empty",
                  text: search.value.trim() ? "검색 결과가 없습니다." : "이슈가 없습니다. c 를 눌러 새로 만드세요.",
                }),
              ])
        );
        count.textContent = `${rows.length}개 · 완료 ${issues.filter((issue) => issue.status === "완료").length}`;
      };

      const save = () => store.set(KEY, issues);

      const commands = () => {
        const current = visible()[selected];
        const done = current && current.status === "완료";
        return [
          {
            label: "새 이슈 만들기",
            hint: "C",
            run: () => openCompose(),
          },
          {
            label: done ? "선택한 이슈 다시 열기" : "선택한 이슈 완료로 표시",
            hint: "Enter",
            run: () => {
              if (!current) return;
              current.status = done ? "백로그" : "완료";
              save();
              renderList();
              toast(done ? "이슈를 다시 열었습니다" : "이슈를 완료했습니다");
            },
          },
          {
            label: hideDone ? "완료된 이슈 보이기" : "완료된 이슈 숨기기",
            hint: "H",
            run: () => {
              hideDone = !hideDone;
              renderList();
            },
          },
          {
            label: "이슈 검색으로 이동",
            hint: "/",
            run: () => search.focus(),
          },
        ];
      };

      const renderCommands = () => {
        const query = cmdQuery.trim().toLowerCase();
        const rows = commands().filter((command) => command.label.toLowerCase().includes(query));
        if (cmdIndex >= rows.length) cmdIndex = Math.max(0, rows.length - 1);
        cmdList.replaceChildren(
          ...(rows.length
            ? rows.map((command, index) =>
                el(
                  "button",
                  {
                    class: `linear-cmd-row${index === cmdIndex ? " is-selected" : ""}`,
                    type: "button",
                    role: "option",
                    "aria-selected": index === cmdIndex ? "true" : "false",
                    onclick: () => runCommand(command),
                  },
                  el("span", { class: "linear-cmd-label", text: command.label }),
                  el("span", { class: "linear-cmd-hint mono", text: command.hint })
                )
              )
            : [el("p", { class: "linear-empty", text: "일치하는 명령이 없습니다." })])
        );
      };

      const runCommand = (command) => {
        closeCommands();
        command.run();
      };

      const openCommands = () => {
        cmdOpen = true;
        cmdQuery = "";
        cmdIndex = 0;
        cmd.hidden = false;
        cmdInput.value = "";
        renderCommands();
        cmdInput.focus();
      };

      const closeCommands = () => {
        cmdOpen = false;
        cmd.hidden = true;
        cmdQuery = "";
      };

      const openCompose = () => {
        composing = true;
        composeHost.hidden = false;
        composeHost.replaceChildren(
          el(
            "form",
            {
              class: "linear-new",
              onsubmit: (event) => {
                event.preventDefault();
                const input = composeHost.querySelector("input");
                const title = input.value.trim();
                if (!title) return;
                const maxId = issues.reduce(
                  (max, issue) => Math.max(max, Number(issue.id.replace("SHB-", "")) || 0),
                  0
                );
                issues.unshift({
                  id: `SHB-${maxId + 1}`,
                  title,
                  status: "백로그",
                  priority: "보통",
                  who: "나",
                });
                selected = 0;
                save();
                closeCompose();
                renderList();
                toast("이슈를 만들었습니다");
              },
            },
            el("input", {
              class: "linear-new-input",
              type: "text",
              placeholder: "무엇을 고칠까요?",
              "aria-label": "새 이슈 제목",
              maxlength: "80",
            }),
            el("button", { class: "linear-new-submit", type: "submit", text: "추가" }),
            el("button", {
              class: "linear-new-cancel",
              type: "button",
              text: "취소",
              onclick: closeCompose,
            })
          )
        );
        composeHost.querySelector("input").focus();
      };

      const closeCompose = () => {
        composing = false;
        composeHost.hidden = true;
        composeHost.replaceChildren();
      };

      cmd.addEventListener("keydown", (event) => {
        const rows = commands().filter((command) =>
          command.label.toLowerCase().includes(cmdQuery.trim().toLowerCase())
        );
        if (event.key === "Escape") {
          event.preventDefault();
          closeCommands();
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          cmdIndex = (cmdIndex + 1) % Math.max(1, rows.length);
          renderCommands();
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          cmdIndex = (cmdIndex - 1 + Math.max(1, rows.length)) % Math.max(1, rows.length);
          renderCommands();
        } else if (event.key === "Enter" && rows[cmdIndex]) {
          event.preventDefault();
          runCommand(rows[cmdIndex]);
        }
      });

      cmdInput.addEventListener("input", () => {
        cmdQuery = cmdInput.value;
        cmdIndex = 0;
        renderCommands();
      });

      cmd.addEventListener("mousedown", (event) => {
        if (event.target === cmd) closeCommands();
      });

      search.addEventListener("input", () => {
        selected = 0;
        renderList();
      });

      const onKey = (event) => {
        const typing = event.target.closest("input, textarea, select");
        if (cmdOpen) return;
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
          event.preventDefault();
          event.stopImmediatePropagation();
          openCommands();
          return;
        }
        if (typing) {
          if (event.key === "Escape" && composing) closeCompose();
          return;
        }
        const rows = visible();
        if (event.key === "j" || event.key === "ArrowDown") {
          event.preventDefault();
          selected = Math.min(rows.length - 1, selected + 1);
          renderList();
        } else if (event.key === "k" || event.key === "ArrowUp") {
          event.preventDefault();
          selected = Math.max(0, selected - 1);
          renderList();
        } else if (event.key.toLowerCase() === "c") {
          event.preventDefault();
          openCompose();
        } else if (event.key === "Enter" && rows[selected]) {
          event.preventDefault();
          const issue = rows[selected];
          issue.status = issue.status === "완료" ? "백로그" : "완료";
          save();
          renderList();
        } else if (event.key === "Escape") {
          closeCompose();
          closeCommands();
        }
      };
      document.addEventListener("keydown", onKey);

      const head = el(
        "header",
        { class: "linear-head" },
        el("h3", { class: "linear-heading", text: "이슈" }),
        count,
        el("span", { class: "linear-spacer" }),
        search,
        el("button", {
          class: "linear-kbd-btn",
          type: "button",
          onclick: openCommands,
          html: `${window.UI.icon("search", 14)}<span class="mono">⌘K</span>`,
          "aria-label": "명령 팔레트 열기",
        })
      );

      const sidebar = el(
        "aside",
        { class: "linear-side" },
        el("span", { class: "linear-logo mono", text: "SHINBAK" }),
        el(
          "nav",
          { class: "linear-nav", "aria-label": "보기" },
          el("span", { class: "linear-nav-item is-active", text: "이슈" }),
          el("span", { class: "linear-nav-item", text: "프로젝트" }),
          el("span", { class: "linear-nav-item", text: "로드맵" })
        ),
        el("span", { class: "linear-side-note mono", text: "⌘K" })
      );

      shell.append(
        sidebar,
        el(
          "section",
          { class: "linear-main" },
          head,
          composeHost,
          list,
          el(
            "footer",
            { class: "linear-foot" },
            el("span", { class: "mono", text: "J / K 이동 · C 새 이슈 · ENTER 완료 · ⌘K 명령" }),
            el("span", { class: "mono", text: "Cmd+K" })
          )
        ),
        cmd
      );

      cmd.append(
        el("div", { class: "linear-cmd-panel", role: "dialog", "aria-label": "명령 팔레트" }, cmdInput, cmdList, el("div", { class: "linear-cmd-foot mono", text: "↑↓ 이동 · Enter 실행 · Esc 닫기" }))
      );

      root.append(el("div", { class: "lab linear-lab" }, shell));
      renderList();

      return () => {
        document.removeEventListener("keydown", onKey);
        delete document.body.dataset.cmdk;
      };
    },
  });
})();
