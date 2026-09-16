const emptyMedals = { gold: "", silver: "", bronze: "" };

const defaultState = {
  teams: [
    { id: "a", name: "A팀", color: "#22b98f", mascot: "토끼단" },
    { id: "b", name: "B팀", color: "#ff8f6b", mascot: "로켓단" },
    { id: "c", name: "C팀", color: "#4d8dff", mascot: "별똥단" },
  ],
  events: [
    { id: "quiz", name: "스피드 퀴즈", day: "Day 1", icon: "🧠", status: "done", medals: { gold: "a", silver: "c", bronze: "b" } },
    { id: "pingpong", name: "탁구 랠리", day: "Day 2", icon: "🏓", status: "done", medals: { gold: "c", silver: "a", bronze: "b" } },
    { id: "typing", name: "타자왕", day: "Day 3", icon: "⌨️", status: "live", medals: { ...emptyMedals } },
    { id: "basket", name: "미니 농구", day: "Day 4", icon: "🏀", status: "pending", medals: { ...emptyMedals } },
    { id: "relay", name: "컵 릴레이", day: "Day 5", icon: "🥤", status: "pending", medals: { ...emptyMedals } },
    { id: "drawing", name: "그림 전달", day: "Day 6", icon: "🎨", status: "pending", medals: { ...emptyMedals } },
    { id: "memory", name: "메모리 게임", day: "Day 7", icon: "🃏", status: "pending", medals: { ...emptyMedals } },
    { id: "final", name: "파이널 챌린지", day: "Day 10", icon: "🏁", status: "pending", medals: { ...emptyMedals } },
  ],
};

const state = structuredClone(defaultState);
let activeFilter = "all";

const nodes = {
  teamStrip: document.querySelector("#teamStrip"),
  progressLabel: document.querySelector("#progressLabel"),
  progressBar: document.querySelector("#progressBar"),
  completedCount: document.querySelector("#completedCount"),
  leaderName: document.querySelector("#leaderName"),
  remainingLabel: document.querySelector("#remainingLabel"),
  leaderboard: document.querySelector("#leaderboard"),
  eventGrid: document.querySelector("#eventGrid"),
  template: document.querySelector("#eventCardTemplate"),
};

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

function renderTeamStrip(rows) {
  nodes.teamStrip.innerHTML = rows
    .map(
      (team, index) => `
        <article class="team-summary" style="--team-color:${team.color}">
          <div class="summary-head">
            <span class="rank-badge">${index + 1}</span>
            <div>
              <h2>${team.name}</h2>
              <p>${team.mascot}</p>
            </div>
          </div>
          <div class="summary-medals">
            ${medalPill("🥇", team.gold)}
            ${medalPill("🥈", team.silver)}
            ${medalPill("🥉", team.bronze)}
            ${medalPill("합계", team.total, "total")}
          </div>
        </article>
      `,
    )
    .join("");
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
    const status = fragment.querySelector(".status-pill");

    fragment.querySelector(".event-icon").textContent = event.icon;
    fragment.querySelector("h3").textContent = event.name;
    fragment.querySelector(".event-day").textContent = event.day;
    status.textContent = statusText(event.status);
    status.classList.add(event.status);

    ["gold", "silver", "bronze"].forEach((medal) => {
      fragment.querySelector(`[data-medal="${medal}"]`).textContent = medalText(event.medals[medal]);
    });

    nodes.eventGrid.appendChild(fragment);
  });
}

function render() {
  const rows = medalTable();
  renderTeamStrip(rows);
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

render();
