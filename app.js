const STORAGE_KEY = "office-mini-olympics-state";

const emptyMedals = { gold: "", silver: "", bronze: "" };

const defaultState = {
  teams: [
    { id: "mint", name: "민트 번개팀", color: "#22b98f" },
    { id: "peach", name: "복숭아 로켓팀", color: "#ff8f6b" },
    { id: "blue", name: "파랑 별똥팀", color: "#4d8dff" },
  ],
  events: [
    { id: "quiz", name: "스피드 퀴즈", day: "Day 1", icon: "🧠", status: "done", medals: { gold: "mint", silver: "blue", bronze: "peach" } },
    { id: "pingpong", name: "탁구 랠리", day: "Day 2", icon: "🏓", status: "done", medals: { gold: "blue", silver: "mint", bronze: "peach" } },
    { id: "typing", name: "타자왕", day: "Day 3", icon: "⌨️", status: "live", medals: { ...emptyMedals } },
    { id: "basket", name: "미니 농구", day: "Day 4", icon: "🏀", status: "pending", medals: { ...emptyMedals } },
    { id: "relay", name: "컵 릴레이", day: "Day 5", icon: "🥤", status: "pending", medals: { ...emptyMedals } },
    { id: "drawing", name: "그림 전달", day: "Day 6", icon: "🎨", status: "pending", medals: { ...emptyMedals } },
    { id: "memory", name: "메모리 게임", day: "Day 7", icon: "🃏", status: "pending", medals: { ...emptyMedals } },
    { id: "final", name: "파이널 챌린지", day: "Day 10", icon: "🏁", status: "pending", medals: { ...emptyMedals } },
  ],
};

let state = loadState();
let activeFilter = "all";

const nodes = {
  progressLabel: document.querySelector("#progressLabel"),
  progressBar: document.querySelector("#progressBar"),
  completedCount: document.querySelector("#completedCount"),
  leaderName: document.querySelector("#leaderName"),
  remainingLabel: document.querySelector("#remainingLabel"),
  leaderboard: document.querySelector("#leaderboard"),
  eventGrid: document.querySelector("#eventGrid"),
  eventSelect: document.querySelector("#eventSelect"),
  goldSelect: document.querySelector("#goldSelect"),
  silverSelect: document.querySelector("#silverSelect"),
  bronzeSelect: document.querySelector("#bronzeSelect"),
  statusSelect: document.querySelector("#statusSelect"),
  saveBtn: document.querySelector("#saveBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  importInput: document.querySelector("#importInput"),
  template: document.querySelector("#eventCardTemplate"),
};

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return structuredClone(defaultState);

  try {
    return JSON.parse(stored);
  } catch {
    return structuredClone(defaultState);
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getTeam(teamId) {
  return state.teams.find((team) => team.id === teamId);
}

function medalTable() {
  const rows = state.teams.map((team) => ({
    ...team,
    gold: 0,
    silver: 0,
    bronze: 0,
    total: 0,
  }));

  state.events.forEach((event) => {
    ["gold", "silver", "bronze"].forEach((medal) => {
      const row = rows.find((team) => team.id === event.medals[medal]);
      if (!row) return;
      row[medal] += 1;
      row.total += 1;
    });
  });

  return rows.sort(
    (a, b) =>
      b.gold - a.gold ||
      b.silver - a.silver ||
      b.bronze - a.bronze ||
      b.total - a.total ||
      a.name.localeCompare(b.name, "ko"),
  );
}

function renderSummary(rows) {
  const done = state.events.filter((event) => event.status === "done").length;
  const progress = state.events.length ? Math.round((done / state.events.length) * 100) : 0;

  nodes.progressLabel.textContent = `${progress}%`;
  nodes.progressBar.style.width = `${progress}%`;
  nodes.completedCount.textContent = `${done} / ${state.events.length}`;
  nodes.leaderName.textContent = rows[0]?.name ?? "-";
  nodes.remainingLabel.textContent = `${state.events.length - done}개`;
}

function medalPill(label, value, className = "") {
  return `<span class="count-pill ${className}">${label} ${value}</span>`;
}

function renderLeaderboard(rows) {
  nodes.leaderboard.innerHTML = rows
    .map(
      (team, index) => `
        <article class="team-card">
          <div class="team-rank">${index + 1}</div>
          <div>
            <h3 class="team-name"><span class="team-color" style="background:${team.color}"></span>${team.name}</h3>
            <div class="medal-counts">
              ${medalPill("🥇", team.gold)}
              ${medalPill("🥈", team.silver)}
              ${medalPill("🥉", team.bronze)}
              ${medalPill("합계", team.total, "total")}
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}

function statusText(status) {
  return {
    done: "완료",
    live: "진행 중",
    pending: "진행 전",
  }[status];
}

function medalText(teamId) {
  const team = getTeam(teamId);
  return team ? team.name : "미정";
}

function renderEvents() {
  nodes.eventGrid.innerHTML = "";
  const filtered = state.events.filter((event) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "done") return event.status === "done";
    return event.status !== "done";
  });

  filtered.forEach((event) => {
    const fragment = nodes.template.content.cloneNode(true);
    const card = fragment.querySelector(".event-card");
    const status = fragment.querySelector(".status-pill");

    fragment.querySelector(".event-icon").textContent = event.icon;
    fragment.querySelector("h3").textContent = event.name;
    fragment.querySelector(".event-day").textContent = event.day;
    status.textContent = statusText(event.status);
    status.classList.add(event.status);

    ["gold", "silver", "bronze"].forEach((medal) => {
      fragment.querySelector(`[data-medal="${medal}"]`).textContent = medalText(event.medals[medal]);
    });

    card.addEventListener("click", () => selectEvent(event.id));
    nodes.eventGrid.appendChild(fragment);
  });
}

function option(value, text) {
  const element = document.createElement("option");
  element.value = value;
  element.textContent = text;
  return element;
}

function populateEditor() {
  nodes.eventSelect.innerHTML = "";
  state.events.forEach((event) => nodes.eventSelect.appendChild(option(event.id, event.name)));

  [nodes.goldSelect, nodes.silverSelect, nodes.bronzeSelect].forEach((select) => {
    select.innerHTML = "";
    select.appendChild(option("", "미정"));
    state.teams.forEach((team) => select.appendChild(option(team.id, team.name)));
  });

  selectEvent(state.events[0]?.id);
}

function selectEvent(eventId) {
  const event = state.events.find((item) => item.id === eventId);
  if (!event) return;

  nodes.eventSelect.value = event.id;
  nodes.goldSelect.value = event.medals.gold;
  nodes.silverSelect.value = event.medals.silver;
  nodes.bronzeSelect.value = event.medals.bronze;
  nodes.statusSelect.value = event.status;
}

function saveSelectedEvent() {
  const event = state.events.find((item) => item.id === nodes.eventSelect.value);
  if (!event) return;

  event.medals = {
    gold: nodes.goldSelect.value,
    silver: nodes.silverSelect.value,
    bronze: nodes.bronzeSelect.value,
  };
  event.status = nodes.statusSelect.value;
  persist();
  render();
}

function exportState() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `office-olympics-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importState(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const nextState = JSON.parse(String(reader.result));
      if (!Array.isArray(nextState.teams) || !Array.isArray(nextState.events)) {
        throw new Error("Invalid data");
      }
      state = nextState;
      persist();
      populateEditor();
      render();
    } catch {
      alert("가져오기 파일 형식이 올바르지 않습니다.");
    }
  };
  reader.readAsText(file);
}

function render() {
  const rows = medalTable();
  renderSummary(rows);
  renderLeaderboard(rows);
  renderEvents();
}

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll(".filter").forEach((item) => item.classList.toggle("active", item === button));
    renderEvents();
  });
});

nodes.eventSelect.addEventListener("change", (event) => selectEvent(event.target.value));
nodes.saveBtn.addEventListener("click", saveSelectedEvent);
nodes.exportBtn.addEventListener("click", exportState);
nodes.resetBtn.addEventListener("click", () => {
  state = structuredClone(defaultState);
  persist();
  populateEditor();
  render();
});
nodes.importInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (file) importState(file);
  event.target.value = "";
});

populateEditor();
render();
