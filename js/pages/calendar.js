import { dbGetAll } from "../db.js";
import { navigateTo } from "../router.js";

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfMonth(year, month) {
  return new Date(year, month, 1);
}

/** Construit la grille du mois (cases vides avant le 1er, un jour par case). */
function buildMonthGrid(year, month) {
  const first = startOfMonth(year, month);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Lundi = 0 ... Dimanche = 6 (plutôt que le 0=dimanche par défaut de JS).
  const firstWeekday = (first.getDay() + 6) % 7;

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
  return cells;
}

export async function render(container, param) {
  const sessions = await dbGetAll("sessions");

  const today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth();
  if (param) {
    const [y, m] = param.split("-").map(Number);
    if (y && m) {
      year = y;
      month = m - 1;
    }
  }

  const sessionsByDay = new Map();
  for (const s of sessions) {
    const key = dayKey(new Date(s.startedAt));
    if (!sessionsByDay.has(key)) sessionsByDay.set(key, []);
    sessionsByDay.get(key).push(s);
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const cells = buildMonthGrid(year, month);
  const todayKey = dayKey(today);

  const prevDate = new Date(year, month - 1, 1);
  const nextDate = new Date(year, month + 1, 1);
  const prevParam = `${prevDate.getFullYear()}-${prevDate.getMonth() + 1}`;
  const nextParam = `${nextDate.getFullYear()}-${nextDate.getMonth() + 1}`;

  container.innerHTML = `
    <div class="card">
      <div class="header-row">
        <button class="icon-btn" id="prev-month" aria-label="Mois précédent">
          <span class="icon icon-chevron" style="transform: rotate(180deg);"></span>
        </button>
        <div class="card-title" style="text-transform: capitalize;">${monthLabel}</div>
        <button class="icon-btn" id="next-month" aria-label="Mois suivant">
          <span class="icon icon-chevron"></span>
        </button>
      </div>

      <div class="calendar-weekdays">
        ${WEEKDAY_LABELS.map((d) => `<span>${d}</span>`).join("")}
      </div>

      <div class="calendar-grid">
        ${cells
          .map((date) => {
            if (!date) return `<span class="calendar-cell calendar-cell--empty"></span>`;
            const key = dayKey(date);
            const daySessions = sessionsByDay.get(key) || [];
            const hasSession = daySessions.length > 0;
            const isToday = key === todayKey;
            return `
              <button class="calendar-cell ${hasSession ? "has-session" : ""} ${isToday ? "is-today" : ""}"
                data-day="${key}" ${hasSession ? "" : "disabled"}>
                <span class="calendar-cell-number">${date.getDate()}</span>
                ${hasSession ? `<span class="calendar-dot"></span>` : ""}
              </button>
            `;
          })
          .join("")}
      </div>
    </div>

    <div class="section" id="day-detail"></div>
  `;

  container.querySelector("#prev-month").addEventListener("click", () => navigateTo("calendar", prevParam));
  container.querySelector("#next-month").addEventListener("click", () => navigateTo("calendar", nextParam));

  container.querySelectorAll("[data-day]:not([disabled])").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.day;
      const daySessions = sessionsByDay.get(key) || [];
      renderDayDetail(container, key, daySessions);
    });
  });
}

function renderDayDetail(container, key, daySessions) {
  const detail = container.querySelector("#day-detail");
  const dateLabel = new Date(key).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });

  detail.innerHTML = `
    <div class="section-title" style="text-transform: capitalize;">${dateLabel}</div>
    <ul>
      ${daySessions
        .map(
          (s) => `
        <li>
          <a class="list-row" href="#/history/${s.id}">
            <div>
              <div class="list-row-title">${s.dayName || "Séance"}</div>
              <div class="list-row-sub">${s.exercises?.length ?? 0} exercice${(s.exercises?.length ?? 0) > 1 ? "s" : ""}</div>
            </div>
            <span class="icon icon-chevron list-row-chevron"></span>
          </a>
        </li>
      `
        )
        .join("")}
    </ul>
  `;
}
