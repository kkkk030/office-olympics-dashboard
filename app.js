const emptyMedals = { gold: "", silver: "", bronze: "" };
const storageKey = "office-mini-olympics-state";
const legacyStorageKeys = ["office-mini-olympics-state-v2", "office-mini-olympics-state-v1"];
const adminSessionKey = "office-mini-olympics-admin";
const supabaseUrl = "https://jgofoypdffjzhqnvktyy.supabase.co";
const supabasePublishableKey = "sb_publishable_YM5K-4tNlfCpDWXq_s4LdA_yYfzmrPf";
const remoteStateId = "main";
const adminCredentials = {
  id: "admin",
  password: "olympic2026",
};

const defaultState = {
  teams: [
    { id: "a", name: "시온팀", color: "#22b98f", mascot: "토끼" },
    { id: "b", name: "나영팀", color: "#ff8f6b", mascot: "거북이" },
    { id: "c", name: "상윤팀", color: "#4d8dff", mascot: "나무늘보" },
  ],
  events: [
    { id: "quiz", name: "스피드 퀴즈", day: "Day 1", icon: "🧠", status: "pending", medals: { ...emptyMedals } },
    { id: "pingpong", name: "탁구 랠리", day: "Day 2", icon: "🏓", status: "pending", medals: { ...emptyMedals } },
    { id: "typing", name: "타자왕", day: "Day 3", icon: "⌨️", status: "pending", medals: { ...emptyMedals } },
    { id: "basket", name: "미니 농구", day: "Day 4", icon: "🏀", status: "pending", medals: { ...emptyMedals } },
    { id: "relay", name: "컵 릴레이", day: "Day 5", icon: "🥤", status: "pending", medals: { ...emptyMedals } },
    { id: "drawing", name: "그림 전달", day: "Day 6", icon: "🎨", status: "pending", medals: { ...emptyMedals } },
    { id: "memory", name: "메모리 게임", day: "Day 7", icon: "🃏", status: "pending", medals: { ...emptyMedals } },
    { id: "final", name: "파이널 챌린지", day: "Day 10", icon: "🏁", status: "pending", medals: { ...emptyMedals } },
  ],
  logs: [],
  predictions: [],
};

const sharedState = readSharedStateFromUrl();
let state = sharedState ? hydrateSavedState(sharedState) : loadState();
let activeFilter = "all";
let sharedStateImported = Boolean(sharedState);

if (sharedStateImported) {
  saveState();
  clearSharedStateFromUrl();
}

const rankRunners = [
  { label: "토끼", className: "rabbit" },
  { label: "거북", className: "turtle" },
  { label: "늘보", className: "sloth" },
];

const nodes = {
  dashboardView: document.querySelector("#dashboardView"),
  predictView: document.querySelector("#predictView"),
  manageView: document.querySelector("#manageView"),
  viewTabs: document.querySelectorAll(".view-tab"),
  adminLogin: document.querySelector("#adminLogin"),
  adminContent: document.querySelector("#adminContent"),
  adminId: document.querySelector("#adminId"),
  adminPassword: document.querySelector("#adminPassword"),
  loginMessage: document.querySelector("#loginMessage"),
  logoutAdmin: document.querySelector("#logoutAdmin"),
  raceTrack: document.querySelector("#raceTrack"),
  progressLabel: document.querySelector("#progressLabel"),
  progressBar: document.querySelector("#progressBar"),
  completedCount: document.querySelector("#completedCount"),
  leaderName: document.querySelector("#leaderName"),
  remainingLabel: document.querySelector("#remainingLabel"),
  leaderboard: document.querySelector("#leaderboard"),
  eventGrid: document.querySelector("#eventGrid"),
  managerList: document.querySelector("#managerList"),
  logEvent: document.querySelector("#logEvent"),
  logText: document.querySelector("#logText"),
  logList: document.querySelector("#logList"),
  addLog: document.querySelector("#addLog"),
  addEvent: document.querySelector("#addEvent"),
  predictionName: document.querySelector("#predictionName"),
  predictionRound: document.querySelector("#predictionRound"),
  predictionEvents: document.querySelector("#predictionEvents"),
  predictionLeaderboard: document.querySelector("#predictionLeaderboard"),
  predictionAdminList: document.querySelector("#predictionAdminList"),
  predictionMessage: document.querySelector("#predictionMessage"),
  submitPrediction: document.querySelector("#submitPrediction"),
  loadRemoteData: document.querySelector("#loadRemoteData"),
  saveRemoteData: document.querySelector("#saveRemoteData"),
  newEventName: document.querySelector("#newEventName"),
  newEventDay: document.querySelector("#newEventDay"),
  newEventIcon: document.querySelector("#newEventIcon"),
  exportData: document.querySelector("#exportData"),
  shareData: document.querySelector("#shareData"),
  importData: document.querySelector("#importData"),
  resetData: document.querySelector("#resetData"),
  syncStatus: document.querySelector("#syncStatus"),
  template: document.querySelector("#eventCardTemplate"),
};

function clone(value) {
  return structuredClone(value);
}

function loadState() {
  try {
    const saved = readSavedState();
    if (!saved) return clone(defaultState);
    return hydrateSavedState(saved);
  } catch (error) {
    return clone(defaultState);
  }
}

function readSavedState() {
  const keys = [storageKey, ...legacyStorageKeys];

  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (!value) continue;

    const saved = JSON.parse(value);
    if (!saved || !Array.isArray(saved.events)) continue;

    if (key !== storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(saved));
    }

    return saved;
  }

  return null;
}

function hydrateSavedState(saved) {
  const savedEvents = saved.events.map(normalizeEvent);

  return {
    teams: clone(defaultState.teams),
    events: savedEvents.length ? savedEvents : clone(defaultState.events),
    logs: Array.isArray(saved.logs) ? saved.logs : [],
    predictions: Array.isArray(saved.predictions) ? saved.predictions.map(normalizePrediction) : [],
  };
}

function normalizePrediction(prediction) {
  return {
    id: prediction.id || createId(),
    participant: String(prediction.participant || "").trim(),
    participantKey: String(prediction.participantKey || prediction.participant || "").trim().toLowerCase(),
    round: ["round1", "round2"].includes(prediction.round) ? prediction.round : "round1",
    picks: prediction.picks && typeof prediction.picks === "object" ? prediction.picks : {},
    createdAt: prediction.createdAt || new Date().toISOString(),
    updatedAt: prediction.updatedAt || new Date().toISOString(),
  };
}

function suggestEventIcon(name) {
  const normalizedName = String(name || "");
  const iconRules = [
    ["종이비행기", "✈️"],
    ["병뚜껑", "🥌"],
    ["컬링", "🥌"],
    ["양궁", "🏹"],
    ["사격", "🎯"],
    ["볼링", "🎳"],
    ["탁구", "🏓"],
    ["스타크래프트", "🎮"],
    ["팔씨름", "💪"],
    ["음료", "🥤"],
    ["딱지", "🟦"],
    ["제기", "🦶"],
    ["공기", "✋"],
    ["카트라이더", "🏎️"],
    ["포켓볼", "🎱"],
    ["할리갈리", "🔔"],
    ["몸으로말해요", "🤸"],
  ];

  return iconRules.find(([keyword]) => normalizedName.includes(keyword))?.[1] || "🏆";
}

function eventIcon(event) {
  const icon = String(event.icon || "").trim();
  const staleDefaultIcons = new Set(["", "🏆", "🧠", "🏓", "⌨️", "🏀", "🥤", "🎨", "🃏", "🏁"]);
  return staleDefaultIcons.has(icon) ? suggestEventIcon(event.name) : icon;
}

function eventWeight(value) {
  const weight = Number(value);
  return Number.isFinite(weight) && weight >= 1 ? Math.min(Math.round(weight), 9) : 1;
}

function readSharedStateFromUrl() {
  const encoded = new URLSearchParams(window.location.search).get("data");
  if (!encoded) return null;

  try {
    const decoded = JSON.parse(decodeStateForUrl(encoded));
    return decoded && Array.isArray(decoded.events) ? decoded : null;
  } catch (error) {
    window.alert("공유 링크 데이터를 읽지 못했습니다.");
    return null;
  }
}

function clearSharedStateFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("data");
  window.history.replaceState({}, "", url.toString());
}

function encodeStateForUrl(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeStateForUrl(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

function normalizeEvent(event) {
  return {
    id: event.id || createId(),
    name: String(event.name || "새 종목").trim(),
    day: String(event.day || "Day").trim(),
    icon: eventIcon(event).slice(0, 4),
    weight: eventWeight(event.weight),
    status: ["pending", "live", "done"].includes(event.status) ? event.status : "pending",
    medals: { ...emptyMedals, ...(event.medals || {}) },
  };
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function remoteHeaders(extraHeaders = {}) {
  return {
    apikey: supabasePublishableKey,
    Authorization: `Bearer ${supabasePublishableKey}`,
    ...extraHeaders,
  };
}

function setSyncStatus(message, type = "") {
  nodes.syncStatus.textContent = message;
  nodes.syncStatus.classList.toggle("success", type === "success");
  nodes.syncStatus.classList.toggle("error", type === "error");
}

async function fetchRemoteState() {
  const url = `${supabaseUrl}/rest/v1/dashboard_state?id=eq.${remoteStateId}&select=state,updated_at`;
  const response = await fetch(url, {
    headers: remoteHeaders(),
  });

  if (!response.ok) {
    throw new Error(`서버 불러오기 실패: ${response.status}`);
  }

  const rows = await response.json();
  return rows[0] || null;
}

async function loadRemoteState({ showEmptyMessage = true } = {}) {
  setSyncStatus("서버 데이터를 불러오는 중입니다.");

  try {
    const row = await fetchRemoteState();
    if (!row?.state) {
      if (showEmptyMessage) setSyncStatus("아직 서버에 저장된 데이터가 없습니다. 현재 화면을 서버 저장할 수 있습니다.");
      return false;
    }

    state = hydrateSavedState(row.state);
    saveState();
    render();
    setSyncStatus(`서버 데이터를 불러왔습니다. 마지막 저장: ${formatDateTime(row.updated_at)}`, "success");
    return true;
  } catch (error) {
    setSyncStatus("서버 데이터를 불러오지 못했습니다. Supabase 테이블/정책 설정을 확인해주세요.", "error");
    return false;
  }
}

async function saveRemoteState() {
  setSyncStatus("서버에 저장하는 중입니다.");

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/dashboard_state?on_conflict=id`, {
      method: "POST",
      headers: remoteHeaders({
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      }),
      body: JSON.stringify({
        id: remoteStateId,
        state,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`서버 저장 실패: ${response.status}`);
    }

    const [row] = await response.json();
    setSyncStatus(`서버 저장 완료. 마지막 저장: ${formatDateTime(row?.updated_at)}`, "success");
    return true;
  } catch (error) {
    setSyncStatus("서버 저장에 실패했습니다. Supabase 테이블/정책 설정을 확인해주세요.", "error");
    return false;
  }
}

function formatDateTime(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function createId() {
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function resetState() {
  state = clone(defaultState);
  [storageKey, ...legacyStorageKeys].forEach((key) => localStorage.removeItem(key));
  render();
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
    const weight = eventWeight(event.weight);
    ["gold", "silver", "bronze"].forEach((medal) => {
      const row = rows.find((team) => team.id === event.medals[medal]);
      if (!row) return;
      row[medal] += weight;
      row.total += weight;
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
  nodes.leaderName.textContent = rows.some((row) => row.total > 0) ? rows[0]?.name : "-";
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
    fragment.querySelector(".event-weight").textContent = `메달 x${event.weight}`;
    status.textContent = statusText(event.status);
    status.classList.add(event.status);

    ["gold", "silver", "bronze"].forEach((medal) => {
      fragment.querySelector(`[data-medal="${medal}"]`).textContent = medalText(event.medals[medal]);
    });

    nodes.eventGrid.appendChild(fragment);
  });
}

function teamOptions(selectedTeamId) {
  return [
    `<option value="">미정</option>`,
    ...state.teams.map((team) => `<option value="${team.id}" ${team.id === selectedTeamId ? "selected" : ""}>${team.name}</option>`),
  ].join("");
}

function renderManager() {
  nodes.managerList.innerHTML = state.events
    .map(
      (event) => `
        <article class="manager-card" data-event-id="${event.id}">
          <div class="manager-title">
            <span class="event-icon">${escapeHtml(event.icon)}</span>
            <div>
              <h3>${escapeHtml(event.name)}</h3>
              <p>${escapeHtml(event.day)}</p>
            </div>
          </div>
          <label>
            종목명
            <input data-field="name" type="text" value="${escapeHtml(event.name)}" />
          </label>
          <label>
            일정
            <input data-field="day" type="text" value="${escapeHtml(event.day)}" />
          </label>
          <label>
            아이콘
            <input data-field="icon" type="text" maxlength="4" value="${escapeHtml(event.icon)}" />
          </label>
          <label>
            가중치
            <input data-field="weight" type="number" min="1" max="9" step="1" value="${event.weight}" />
          </label>
          <label>
            상태
            <select data-field="status">
              <option value="pending" ${event.status === "pending" ? "selected" : ""}>진행 전</option>
              <option value="live" ${event.status === "live" ? "selected" : ""}>진행 중</option>
              <option value="done" ${event.status === "done" ? "selected" : ""}>완료</option>
            </select>
          </label>
          <label>
            금
            <select data-medal="gold">${teamOptions(event.medals.gold)}</select>
          </label>
          <label>
            은
            <select data-medal="silver">${teamOptions(event.medals.silver)}</select>
          </label>
          <label>
            동
            <select data-medal="bronze">${teamOptions(event.medals.bronze)}</select>
          </label>
          <button class="danger small delete-event" type="button" data-delete-event="${event.id}">삭제</button>
        </article>
      `,
    )
    .join("");

  nodes.logEvent.innerHTML = state.events.map((event) => `<option value="${event.id}">${escapeHtml(event.name)}</option>`).join("");
}

function renderLogs() {
  if (!state.logs.length) {
    nodes.logList.innerHTML = `<p class="log-empty">아직 기록된 진행 사항이 없습니다.</p>`;
    return;
  }

  nodes.logList.innerHTML = state.logs
    .slice()
    .reverse()
    .map((log) => {
      const event = state.events.find((item) => item.id === log.eventId);
      const date = new Intl.DateTimeFormat("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(log.createdAt));

      return `
        <article class="log-card">
          <div class="log-meta">
            <strong>${event ? event.name : "전체"}</strong>
            <span>${date}</span>
          </div>
          <p>${escapeHtml(log.text)}</p>
          <button class="ghost small" type="button" data-delete-log="${log.id}">삭제</button>
        </article>
      `;
    })
    .join("");
}

function dayNumber(event) {
  const [, number] = String(event.day || "").match(/(\d+)/) || [];
  return Number(number || 0);
}

function predictionRoundEvents(round) {
  return state.events.filter((event) => {
    const day = dayNumber(event);
    if (round === "round1") return day >= 1 && day <= 5;
    return day >= 6 && day <= 9;
  });
}

function predictionRoundLabel(round) {
  return round === "round1" ? "1차 · Day 1~5" : "2차 · Day 6~9";
}

function selectedPrediction() {
  const participantKey = nodes.predictionName.value.trim().toLowerCase();
  const round = nodes.predictionRound.value;
  if (!participantKey) return null;
  return state.predictions.find((prediction) => prediction.participantKey === participantKey && prediction.round === round);
}

function renderPredictionEvents() {
  const round = nodes.predictionRound.value || "round1";
  const existingPrediction = selectedPrediction();
  const events = predictionRoundEvents(round);
  const isLocked = Boolean(existingPrediction);

  nodes.submitPrediction.disabled = isLocked;
  if (isLocked) {
    nodes.predictionMessage.textContent = "이미 제출한 예측입니다. 수정이 필요하면 관리자에게 삭제를 요청해주세요.";
    nodes.predictionMessage.classList.add("error");
    nodes.predictionMessage.classList.remove("success");
  } else if (nodes.predictionMessage.textContent.includes("이미 제출한 예측")) {
    nodes.predictionMessage.textContent = "";
    nodes.predictionMessage.classList.remove("error", "success");
  }

  if (!events.length) {
    nodes.predictionEvents.innerHTML = `<p class="log-empty">해당 회차에 등록된 종목이 없습니다.</p>`;
    return;
  }

  nodes.predictionEvents.innerHTML = events
    .map((event) => {
      const pick = existingPrediction?.picks?.[event.id] || {};

      return `
        <article class="prediction-card" data-prediction-event="${event.id}">
          <div class="prediction-title">
            <span class="event-icon">${escapeHtml(event.icon)}</span>
            <div>
              <h3>${escapeHtml(event.name)}</h3>
              <p>${escapeHtml(event.day)}</p>
            </div>
          </div>
          <label>
            금 · 3점
            <select data-predict-medal="gold" ${isLocked ? "disabled" : ""}>${teamOptions(pick.gold)}</select>
          </label>
          <label>
            은 · 2점
            <select data-predict-medal="silver" ${isLocked ? "disabled" : ""}>${teamOptions(pick.silver)}</select>
          </label>
          <label>
            동 · 1점
            <select data-predict-medal="bronze" ${isLocked ? "disabled" : ""}>${teamOptions(pick.bronze)}</select>
          </label>
        </article>
      `;
    })
    .join("");
}

function scorePrediction(prediction) {
  let score = 0;
  let goldHits = 0;
  let silverHits = 0;
  let bronzeHits = 0;

  state.events.forEach((event) => {
    const pick = prediction.picks?.[event.id] || {};
    if (event.medals.gold && pick.gold === event.medals.gold) {
      score += 3;
      goldHits += 1;
    }
    if (event.medals.silver && pick.silver === event.medals.silver) {
      score += 2;
      silverHits += 1;
    }
    if (event.medals.bronze && pick.bronze === event.medals.bronze) {
      score += 1;
      bronzeHits += 1;
    }
  });

  return { score, goldHits, silverHits, bronzeHits, totalHits: goldHits + silverHits + bronzeHits };
}

function renderPredictionLeaderboard() {
  if (!state.predictions.length) {
    nodes.predictionLeaderboard.innerHTML = `<p class="log-empty">아직 제출된 예측이 없습니다.</p>`;
    return;
  }

  const rows = state.predictions
    .map((prediction) => ({
      ...prediction,
      ...scorePrediction(prediction),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.goldHits - a.goldHits ||
        b.silverHits - a.silverHits ||
        b.bronzeHits - a.bronzeHits ||
        a.participant.localeCompare(b.participant, "ko"),
    );

  nodes.predictionLeaderboard.innerHTML = rows
    .map(
      (row, index) => `
        <article class="prediction-rank">
          <div class="team-rank">${index + 1}</div>
          <div>
            <h3>${escapeHtml(row.participant)}</h3>
            <p>${predictionRoundLabel(row.round)} · 적중 ${row.totalHits}개</p>
          </div>
          <strong>${row.score}점</strong>
        </article>
      `,
    )
    .join("");
}

function renderPredictionAdminList() {
  if (!nodes.predictionAdminList) return;

  if (!state.predictions.length) {
    nodes.predictionAdminList.innerHTML = `<p class="log-empty">아직 제출된 예측이 없습니다.</p>`;
    return;
  }

  nodes.predictionAdminList.innerHTML = state.predictions
    .slice()
    .sort((a, b) => a.participant.localeCompare(b.participant, "ko") || a.round.localeCompare(b.round))
    .map((prediction) => {
      const result = scorePrediction(prediction);

      return `
        <article class="prediction-admin-card">
          <div>
            <strong>${escapeHtml(prediction.participant)}</strong>
            <p>${predictionRoundLabel(prediction.round)} · ${result.score}점 · ${formatDateTime(prediction.updatedAt)}</p>
          </div>
          <button class="danger small" type="button" data-delete-prediction="${prediction.id}">삭제</button>
        </article>
      `;
    })
    .join("");
}

function renderPredictions() {
  renderPredictionEvents();
  renderPredictionLeaderboard();
  renderPredictionAdminList();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function render() {
  const rows = medalTable();
  renderRaceTrack(rows);
  renderSummary(rows);
  renderLeaderboard(rows);
  renderEvents();
  renderManager();
  renderLogs();
  renderPredictions();
  renderAdminGate();
}

function setView(view) {
  nodes.dashboardView.classList.toggle("active", view === "dashboard");
  nodes.predictView.classList.toggle("active", view === "predict");
  nodes.manageView.classList.toggle("active", view === "manage");
  nodes.viewTabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  if (view === "manage" && !isAdminAuthed()) {
    nodes.adminId.focus();
  }
}

function isAdminAuthed() {
  return sessionStorage.getItem(adminSessionKey) === "true";
}

function requireAdmin() {
  if (isAdminAuthed()) return true;

  setView("manage");
  renderAdminGate();
  nodes.loginMessage.textContent = "관리자 로그인 후 수정할 수 있습니다.";
  nodes.adminId.focus();
  return false;
}

function renderAdminGate() {
  const authed = isAdminAuthed();
  nodes.adminLogin.hidden = authed;
  nodes.adminContent.hidden = !authed;
}

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll(".filter").forEach((item) => item.classList.toggle("active", item === button));
    renderEvents();
  });
});

nodes.viewTabs.forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

nodes.managerList.addEventListener("change", (event) => {
  updateManagedEvent(event);
});

nodes.managerList.addEventListener("input", (event) => {
  updateManagedEvent(event);
});

function updateManagedEvent(event) {
  if (!requireAdmin()) return;

  const card = event.target.closest("[data-event-id]");
  const selectedEvent = state.events.find((item) => item.id === card?.dataset.eventId);
  if (!selectedEvent) return;

  if (event.target.dataset.field) {
    const field = event.target.dataset.field;
    if (field === "status") {
      selectedEvent.status = event.target.value;
    }
    if (field === "name") {
      selectedEvent.name = event.target.value.trim() || "새 종목";
    }
    if (field === "day") {
      selectedEvent.day = event.target.value.trim() || "Day";
    }
    if (field === "icon") {
      selectedEvent.icon = event.target.value.trim().slice(0, 4) || "🏆";
    }
    if (field === "weight") {
      selectedEvent.weight = eventWeight(event.target.value);
    }
  }

  if (event.target.dataset.medal) {
    selectedEvent.medals[event.target.dataset.medal] = event.target.value;
  }

  saveState();
  renderSummary(medalTable());
  renderLeaderboard(medalTable());
  renderEvents();
  renderRaceTrack(medalTable());
  renderLogs();
}

nodes.managerList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-event]");
  if (!button) return;
  if (!requireAdmin()) return;

  const selectedEvent = state.events.find((item) => item.id === button.dataset.deleteEvent);
  if (!selectedEvent || !confirm(`${selectedEvent.name} 종목을 삭제할까요?`)) return;

  state.events = state.events.filter((item) => item.id !== selectedEvent.id);
  state.logs = state.logs.filter((log) => log.eventId !== selectedEvent.id);
  saveState();
  render();
});

nodes.adminLogin.addEventListener("submit", (event) => {
  event.preventDefault();
  const id = nodes.adminId.value.trim();
  const password = nodes.adminPassword.value;

  if (id === adminCredentials.id && password === adminCredentials.password) {
    sessionStorage.setItem(adminSessionKey, "true");
    nodes.adminPassword.value = "";
    nodes.loginMessage.textContent = "";
    renderAdminGate();
    return;
  }

  nodes.loginMessage.textContent = "아이디 또는 비밀번호가 맞지 않습니다.";
});

nodes.logoutAdmin.addEventListener("click", () => {
  sessionStorage.removeItem(adminSessionKey);
  renderAdminGate();
});

nodes.addEvent.addEventListener("click", () => {
  if (!requireAdmin()) return;

  const name = nodes.newEventName.value.trim();
  if (!name) {
    nodes.newEventName.focus();
    return;
  }

  state.events.push(normalizeEvent({
    id: createId(),
    name,
    day: nodes.newEventDay.value.trim() || `Day ${state.events.length + 1}`,
    icon: nodes.newEventIcon.value.trim() || suggestEventIcon(name),
    weight: 1,
    status: "pending",
    medals: { ...emptyMedals },
  }));
  nodes.newEventName.value = "";
  nodes.newEventDay.value = "";
  nodes.newEventIcon.value = "";
  saveState();
  render();
});

nodes.addLog.addEventListener("click", () => {
  if (!requireAdmin()) return;

  const text = nodes.logText.value.trim();
  if (!text) return;

  state.logs.push({
    id: createId(),
    eventId: nodes.logEvent.value,
    text,
    createdAt: new Date().toISOString(),
  });
  nodes.logText.value = "";
  saveState();
  renderLogs();
});

nodes.predictionRound.addEventListener("change", () => {
  renderPredictionEvents();
});

nodes.predictionName.addEventListener("input", () => {
  renderPredictionEvents();
});

nodes.submitPrediction.addEventListener("click", async () => {
  const participant = nodes.predictionName.value.trim();
  const round = nodes.predictionRound.value;

  if (!participant) {
    nodes.predictionName.focus();
    nodes.predictionMessage.textContent = "참가자 이름을 입력해주세요.";
    nodes.predictionMessage.classList.add("error");
    nodes.predictionMessage.classList.remove("success");
    return;
  }

  const picks = {};
  nodes.predictionEvents.querySelectorAll("[data-prediction-event]").forEach((card) => {
    const eventId = card.dataset.predictionEvent;
    picks[eventId] = {};
    card.querySelectorAll("[data-predict-medal]").forEach((select) => {
      picks[eventId][select.dataset.predictMedal] = select.value;
    });
  });

  const nextPrediction = normalizePrediction({
    participant,
    participantKey: participant.toLowerCase(),
    round,
    picks,
    updatedAt: new Date().toISOString(),
  });

  try {
    const row = await fetchRemoteState();
    if (row?.state) state = hydrateSavedState(row.state);
  } catch (error) {
    // Local state still accepts the prediction if the latest remote read fails.
  }

  const existingIndex = state.predictions.findIndex(
    (prediction) => prediction.participantKey === nextPrediction.participantKey && prediction.round === round,
  );

  if (existingIndex >= 0) {
    saveState();
    renderPredictions();
    nodes.predictionMessage.textContent = "이미 제출한 예측입니다. 수정이 필요하면 관리자에게 삭제를 요청해주세요.";
    nodes.predictionMessage.classList.add("error");
    nodes.predictionMessage.classList.remove("success");
    return;
  }

  state.predictions.push(nextPrediction);
  saveState();
  renderPredictions();

  const saved = await saveRemoteState();
  nodes.predictionMessage.textContent = saved ? "예측을 제출했습니다." : "예측은 이 기기에 저장됐지만 서버 저장에 실패했습니다.";
  nodes.predictionMessage.classList.toggle("success", saved);
  nodes.predictionMessage.classList.toggle("error", !saved);
});

nodes.predictionAdminList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-delete-prediction]");
  if (!button) return;
  if (!requireAdmin()) return;

  const prediction = state.predictions.find((item) => item.id === button.dataset.deletePrediction);
  if (!prediction || !confirm(`${prediction.participant}님의 ${predictionRoundLabel(prediction.round)} 예측을 삭제할까요?`)) return;

  state.predictions = state.predictions.filter((item) => item.id !== prediction.id);
  saveState();
  renderPredictions();
  await saveRemoteState();
});

nodes.logList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-log]");
  if (!button) return;
  if (!requireAdmin()) return;

  state.logs = state.logs.filter((log) => log.id !== button.dataset.deleteLog);
  saveState();
  renderLogs();
});

nodes.resetData.addEventListener("click", () => {
  if (!requireAdmin()) return;
  if (!confirm("모든 메달과 진행 기록을 초기화할까요?")) return;
  resetState();
});

nodes.exportData.addEventListener("click", () => {
  if (!requireAdmin()) return;

  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `office-olympics-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

nodes.loadRemoteData.addEventListener("click", () => {
  if (!requireAdmin()) return;
  loadRemoteState();
});

nodes.saveRemoteData.addEventListener("click", () => {
  if (!requireAdmin()) return;
  saveRemoteState();
});

nodes.shareData.addEventListener("click", async () => {
  if (!requireAdmin()) return;

  const url = new URL(window.location.href);
  url.searchParams.set("data", encodeStateForUrl(state));
  url.hash = "";

  try {
    await copyText(url.toString());
    alert("공유 링크를 복사했습니다. 모바일에서 열면 현재 데이터가 그 기기에도 저장됩니다.");
  } catch (error) {
    prompt("이 링크를 복사해서 모바일에서 열어주세요.", url.toString());
  }
});

nodes.importData.addEventListener("change", async (event) => {
  if (!requireAdmin()) {
    event.target.value = "";
    return;
  }

  const [file] = event.target.files;
  if (!file) return;

  try {
    const imported = JSON.parse(await file.text());
    state = hydrateSavedState(imported);
    saveState();
    render();
  } catch (error) {
    alert("불러오기 파일을 읽지 못했습니다.");
  } finally {
    event.target.value = "";
  }
});

render();

loadRemoteState({ showEmptyMessage: false });

if (sharedStateImported) {
  alert("공유 링크 데이터를 이 기기에 저장했습니다.");
}
