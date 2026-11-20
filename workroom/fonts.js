(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const ui = Object.fromEntries(
    ["fileInput","sample","size","sizeValue","filter","format","notice","allTab","selectedTab",
    "fontCount","selectedCount","cards","selectedList","selectionActions","downloadNames","clearSelection"].map(
      (id) => [id, $(id)]
    )
  );
  const DEFAULT = "한글의 여백, Haman 123";
  const TYPES = new Set(["TTF", "OTF", "WOFF", "WOFF2"]);
  const fonts = new Map();
  const selected = new Set();
  let nextId = 0;
  let selectedOnly = false;
  let importing = false;
  function announce(message, error = false) {
    ui.notice.textContent = message;
    ui.notice.classList.toggle("error", error);
  }
  function element(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  }
  function focusButton(button) { if (button) button.focus({preventScroll:true}); }
  async function importFonts(files) {
    if (importing || !files.length) return;
    if (!("FontFace" in window) || !document.fonts) {
      announce("이 브라우저에서는 로컬 글꼴을 미리 볼 수 없습니다.", true);
      return;
    }
    importing = true;
    ui.fileInput.disabled = true;
    announce("글꼴을 불러오는 중입니다.");
    const failed = [];
    let imported = 0;
    let duplicates = 0;
    let excess = 0;
    const keySet = new Set([...fonts.values()].map((f) => f.key));
    for (const file of files) {
      if (fonts.size >= 25) { excess += 1; continue; }
      const type = file.name.split(".").pop().toUpperCase();
      if (!TYPES.has(type) || !file.size || file.size > 15 * 1024 * 1024) {
        failed.push(file.name);
        continue;
      }
      const key = JSON.stringify([file.name, file.size, file.lastModified]);
      if (keySet.has(key)) { duplicates += 1; continue; }
      try {
        const id = ++nextId;
        const family = "HamanLocalFont" + id;
        const face = new FontFace(family, await file.arrayBuffer());
        await face.load();
        document.fonts.add(face);
        fonts.set(id, {id, name:file.name, type, key, family, face});
        keySet.add(key);
        imported += 1;
      } catch (_) { failed.push(file.name); }
    }
    importing = false;
    ui.fileInput.disabled = false;
    const notes = [`추가 ${imported}개`];
    if (duplicates) notes.push(`중복 ${duplicates}개 제외`);
    if (excess) notes.push(`최대 개수 초과 ${excess}개 제외`);
    if (failed.length) notes.push(`열지 못한 파일 ${failed.length}개: ${failed.slice(0,3).join(", ")}${failed.length > 3 ? " 외" : ""}`);
    announce(notes.join(" · "), Boolean(failed.length || excess));
    render();
  }
  function sampleText(node) {
    node.textContent = ui.sample.value || DEFAULT;
    node.style.fontSize = `${Math.max(16, Math.min(96, Number(ui.size.value) || 40))}px`;
  }
  function render() {
    const search = ui.filter.value.trim().normalize("NFKC").toLocaleLowerCase("ko");
    const type = ui.format.value;
    ui.fontCount.textContent = fonts.size;
    ui.selectedCount.textContent = selected.size;
    ui.allTab.setAttribute("aria-pressed", String(!selectedOnly));
    ui.selectedTab.setAttribute("aria-pressed", String(selectedOnly));
    ui.cards.replaceChildren();
    let showing = 0;
    for (const font of fonts.values()) {
      if (selectedOnly && !selected.has(font.id)) continue;
      if (type && font.type !== type) continue;
      if (search && !font.name.normalize("NFKC").toLocaleLowerCase("ko").includes(search)) continue;
      showing += 1;
      const card = element("article","card");
      const header = element("header");
      header.append(element("h2",null,font.name),element("span","format",font.type));
      const sample = element("p","preview");
      sample.style.fontFamily = font.family + ", system-ui, sans-serif";
      sampleText(sample);
      const footer = element("footer");
      const select = element("button","button", selected.has(font.id) ? "선택됨" : "선택");
      select.type = "button";
      select.id = "selectFont" + font.id;
      select.setAttribute("aria-label", font.name + " 선택");
      select.setAttribute("aria-pressed", String(selected.has(font.id)));
      select.addEventListener("click", () => {
        if (selected.has(font.id)) selected.delete(font.id);
        else selected.add(font.id);
        render();
        focusButton($(select.id) || ui.selectedTab);
      });
      const remove = element("button","button","제거");
      remove.type = "button";
      remove.setAttribute("aria-label", font.name + " 미리보기에서 제거");
      remove.addEventListener("click", () => {
        document.fonts.delete(font.face);
        fonts.delete(font.id);
        selected.delete(font.id);
        announce(font.name + "을 미리보기에서 제거했습니다.");
        render();
        focusButton(ui.allTab);
      });
      footer.append(select,remove);
      card.append(header,sample,footer);
      ui.cards.append(card);
    }
    if (!showing) ui.cards.append(element("div","empty",
      !fonts.size ? "글꼴 파일을 열면 이곳에 비교 카드가 표시됩니다."
      : selectedOnly && !selected.size ? "아직 선택한 글꼴이 없습니다."
      : "현재 검색 조건에 맞는 글꼴이 없습니다."
    ));
    ui.selectedList.replaceChildren();
    for (const id of selected) ui.selectedList.append(element("li",null,fonts.get(id).name));
    ui.selectionActions.hidden = !selected.size;
  }
  ui.fileInput.addEventListener("change", () => {
    const files = [...ui.fileInput.files];
    ui.fileInput.value = "";
    void importFonts(files);
  });
  for (const el of [ui.sample,ui.size]) el.addEventListener("input", () => {
    ui.sizeValue.value = ui.size.value + "px";
    ui.cards.querySelectorAll(".preview").forEach(sampleText);
  });
  ui.filter.addEventListener("input",render);
  ui.format.addEventListener("change",render);
  ui.allTab.addEventListener("click",() => {selectedOnly = false; render();});
  ui.selectedTab.addEventListener("click",() => {selectedOnly = true; render();});
  ui.clearSelection.addEventListener("click",() => {
    selected.clear();
    render();
    focusButton(ui.selectedTab);
  });
  ui.downloadNames.addEventListener("click",() => {
    const names = [...selected].map((id) => fonts.get(id).name.replace(/[\r\n]/g, " "));
    if (!names.length) return;
    const blob = new Blob(["\uFEFF" + names.join("\r\n") + "\r\n"], {type:"text/plain;charset=utf-8"});
    const link = document.createElement("a");
    link.download = "haman-font-selection.txt";
    link.href = URL.createObjectURL(blob);
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
  });
  render();
})();
