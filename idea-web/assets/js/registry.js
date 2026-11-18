/* registry — tier meta and app registration */
window.LAB = (function () {
  "use strict";

  const tiers = [
    {
      key: "champ",
      no: "1등",
      name: "1등",
      note: "표의 맨 위, 리니어 Cmd+K",
      color: "var(--t-champ)",
      soft: "var(--t-champ-soft)",
    },
    {
      key: "t1",
      no: "01",
      name: "1티어",
      note: "한 번 보면 계속 쓰게 되는",
      color: "var(--t1)",
      soft: "var(--t1-soft)",
    },
    {
      key: "t2",
      no: "02",
      name: "2티어",
      note: "아이디어가 선명한",
      color: "var(--t2)",
      soft: "var(--t2-soft)",
    },
    {
      key: "t3",
      no: "03",
      name: "3티어",
      note: "한 판 더 하게 되는",
      color: "var(--t3)",
      soft: "var(--t3-soft)",
    },
    {
      key: "t4",
      no: "04",
      name: "4티어",
      note: "직접 해봐야 아는",
      color: "var(--t4)",
      soft: "var(--t4-soft)",
    },
    {
      key: "t5",
      no: "05",
      name: "5티어",
      note: "웃음이 먼저 오는",
      color: "var(--t5)",
      soft: "var(--t5-soft)",
    },
    {
      key: "extra",
      no: "번외",
      name: "번외",
      note: "표 밖에서도 신박한",
      color: "var(--t-extra)",
      soft: "var(--t-extra-soft)",
    },
  ];

  const apps = [];

  const byId = (id) => apps.find((app) => app.id === id) || null;
  const orderOf = (key) => tiers.findIndex((tier) => tier.key === key);
  const tierOf = (app) => tiers.find((tier) => tier.key === app.tier) || tiers[0];

  const ordered = () =>
    apps
      .map((app, index) => ({ app, index }))
      .sort((a, b) => orderOf(a.app.tier) - orderOf(b.app.tier) || a.index - b.index)
      .map((row) => row.app)
      .map((app, index) => Object.assign(app, { position: index + 1 }));

  const add = (app) => {
    if (!app || !app.id || !app.mount) {
      console.warn("LAB.add: id와 mount가 필요합니다", app);
      return;
    }
    if (byId(app.id)) {
      console.warn("LAB.add: 중복 id", app.id);
      return;
    }
    apps.push(app);
  };

  return { tiers, apps, add, byId, ordered, tierOf, orderOf };
})();
