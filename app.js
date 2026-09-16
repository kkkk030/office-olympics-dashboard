const emptyMedals = { gold: "", silver: "", bronze: "" };

const defaultState = {
  teams: [
    { id: "a", name: "시온팀", color: "#22b98f", mascot: "토끼", runner: "🐰" },
    { id: "b", name: "나영팀", color: "#ff8f6b", mascot: "거북이", runner: "🐢" },
    { id: "c", name: "상윤팀", color: "#4d8dff", mascot: "나무늘보", runner: "🦥" },
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
const rankRunners = [
  { label: "토끼", className: "rabbit" },
  { label: "거북", className: "turtle" },
  { label: "늘보", className: "sloth" },
];

const nodes = {
  raceTrack: document.querySelector("#raceTrack"),
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

function raceAnimalSvg(type, x, y) {
  if (type === "rabbit") {
    return `
      <g transform="translate(${x} ${y})">
        <ellipse cx="-7" cy="-25" rx="5" ry="17" fill="#fff8ef" stroke="#172033" stroke-width="2" />
        <ellipse cx="7" cy="-25" rx="5" ry="17" fill="#fff8ef" stroke="#172033" stroke-width="2" />
        <circle cx="0" cy="0" r="18" fill="#fff8ef" stroke="#172033" stroke-width="3" />
        <circle cx="-6" cy="-2" r="2.5" fill="#172033" />
        <circle cx="6" cy="-2" r="2.5" fill="#172033" />
        <path d="M -7 8 Q 0 13 7 8" fill="none" stroke="#172033" stroke-width="2" stroke-linecap="round" />
      </g>
    `;
  }

  if (type === "turtle") {
    return `
      <g transform="translate(${x} ${y})">
        <ellipse cx="0" cy="4" rx="22" ry="14" fill="#58bf76" stroke="#172033" stroke-opacity=".18" stroke-width="2" />
        <circle cx="24" cy="2" r="8" fill="#8fe2a5" stroke="#172033" stroke-opacity=".16" stroke-width="2" />
        <path d="M -13 4 Q 0 -7 13 4 Q 0 12 -13 4" fill="none" stroke="#ffffff" stroke-opacity=".58" stroke-width="2" />
        <circle cx="27" cy="0" r="1.8" fill="#172033" />
      </g>
    `;
  }

  return `
    <g transform="translate(${x} ${y})">
      <circle cx="0" cy="0" r="18" fill="#9a6a43" stroke="#172033" stroke-opacity=".16" stroke-width="2" />
      <ellipse cx="-7" cy="-1" rx="6" ry="9" fill="#f2dfc7" />
      <ellipse cx="7" cy="-1" rx="6" ry="9" fill="#f2dfc7" />
      <circle cx="-5" cy="-1" r="2" fill="#172033" />
      <circle cx="5" cy="-1" r="2" fill="#172033" />
      <path d="M -5 8 Q 0 11 5 8" fill="none" stroke="#5a3823" stroke-width="2" stroke-linecap="round" />
    </g>
  `;
}

function renderRaceTrack(rows) {
  const leaderGold = Math.max(...rows.map((team) => team.gold), 1);
  const runnerMarkup = rows
    .map((team, index) => {
      const x = Math.round(100 + (team.gold / leaderGold) * 220);
      const y = [66, 108, 150][index] ?? 150;
      const labelX = x > 240 ? x - 154 : x + 32;
      const runner = rankRunners[index] ?? { label: "주자", className: "runner" };
      return `
        <g class="svg-runner">
          <circle cx="${x - 28}" cy="${y - 25}" r="12" fill="${team.color}" />
          <text x="${x - 28}" y="${y - 21}" text-anchor="middle" class="svg-rank">${index + 1}</text>
          ${raceAnimalSvg(runner.className, x, y)}
          <rect x="${labelX}" y="${y - 27}" width="78" height="22" rx="11" fill="#ffffff" stroke="${team.color}" stroke-width="2" />
          <text x="${labelX + 39}" y="${y - 12}" text-anchor="middle" class="svg-medal">금 ${team.gold}개</text>
          <rect x="${labelX}" y="${y - 2}" width="116" height="22" rx="11" fill="${team.color}" />
          <text x="${labelX + 58}" y="${y + 13}" text-anchor="middle" class="svg-name">${runner.label} · ${team.name}</text>
        </g>
      `;
    })
    .join("");

  nodes.raceTrack.innerHTML = `
    <svg class="race-svg" viewBox="0 0 760 190" role="img" aria-label="금메달 수 기준 순위 레이스">
      <rect x="1" y="1" width="758" height="188" rx="16" fill="#dff2ff" stroke="#bee8dd" stroke-width="2" />
      <rect x="1" y="92" width="758" height="97" rx="16" fill="#e4f9ed" opacity=".95" />
      <rect x="56" y="145" width="620" height="26" rx="13" fill="#ffffff" opacity=".9" stroke="#d6dceb" stroke-width="2" stroke-dasharray="6 6" />
      <rect x="66" y="153" width="530" height="10" rx="5" fill="#dce8ff" />
      <text x="698" y="164" class="svg-flag">FINISH</text>
      <circle cx="108" cy="34" r="8" fill="#ffffff" opacity=".9" />
      <rect x="116" y="29" width="34" height="11" rx="6" fill="#ffffff" opacity=".9" />
      <circle cx="430" cy="44" r="9" fill="#ffffff" opacity=".9" />
      <rect x="438" y="38" width="44" height="13" rx="7" fill="#ffffff" opacity=".9" />
      ${runnerMarkup}
    </svg>
  `;
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
  renderRaceTrack(rows);
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
