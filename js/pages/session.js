import { dbPut, generateId } from "../db.js";
import { getProfile } from "../state.js";
import { ensureProgramForObjective } from "../engine/programGenerator.js";
import { showToast } from "../components/toast.js";
import { navigateTo } from "../router.js";

let timerInterval = null;
let elapsedSeconds = 0;
let currentSession = null; // { id, objectiveId, objectiveLabel, dayName, startedAt, exercises: [...] }

function formatTime(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

/** Construit l'état initial des exercices d'une séance à partir d'un jour de programme. */
function buildExercisesFromDay(day) {
  return day.exercises.map((ex) => {
    if (ex.durationMinutes != null) {
      return {
        type: "duration",
        name: ex.name,
        durationMinutes: ex.durationMinutes,
        note: ex.note || null,
        validated: false,
      };
    }
    if (ex.holdSeconds != null) {
      return {
        type: "hold",
        name: ex.name,
        note: ex.note || null,
        sets: Array.from({ length: ex.sets }, (_, i) => ({
          index: i,
          targetLabel: `${ex.holdSeconds}s`,
          weight: "",
          validated: false,
        })),
      };
    }
    return {
      type: "reps",
      name: ex.name,
      restSeconds: ex.restSeconds || null,
      sets: Array.from({ length: ex.sets }, (_, i) => ({
        index: i,
        targetLabel: ex.reps,
        weight: "",
        validated: false,
      })),
    };
  });
}

export async function render(container) {
  if (currentSession) {
    renderActiveSession(container);
    return;
  }

  const profile = await getProfile();

  if (!profile.objective) {
    container.innerHTML = `
      <div class="empty-state" style="margin-top: var(--sp-6);">
        <div class="empty-icon"><span class="icon icon-target"></span></div>
        <h3>Aucun objectif défini</h3>
        <p>Choisis un objectif pour recevoir un programme, puis lancer une séance à partir de celui-ci.</p>
        <button class="btn btn-primary" id="go-onboarding">Choisir un objectif</button>
      </div>
    `;
    container.querySelector("#go-onboarding").addEventListener("click", () => navigateTo("onboarding"));
    return;
  }

  const program = await ensureProgramForObjective(profile.objective);
  renderDayPicker(container, profile, program);
}

function renderDayPicker(container, profile, program) {
  container.innerHTML = `
    <div class="card">
      <span class="page-eyebrow">Objectif actuel</span>
      <div class="card-title">${program.objectiveLabel}</div>
      <div class="card-sub">${program.frequencyLabel}</div>
    </div>

    <div class="section">
      <div class="section-title">${program.days.length > 1 ? "Choisis la séance du jour" : "Séance du jour"}</div>
      ${program.days
        .map(
          (day, index) => `
        <button class="card day-picker-card" data-start-day="${index}" style="margin-top: var(--sp-3);">
          <div>
            <div class="card-title">${day.name}</div>
            <div class="day-picker-sub">${day.exercises.length} exercice${day.exercises.length > 1 ? "s" : ""}</div>
          </div>
          <span class="icon icon-chevron"></span>
        </button>
      `
        )
        .join("")}
    </div>
  `;

  container.querySelectorAll("[data-start-day]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const day = program.days[Number(btn.dataset.startDay)];
      currentSession = {
        id: generateId("session"),
        objectiveId: program.objectiveId,
        objectiveLabel: program.objectiveLabel,
        dayName: day.name,
        startedAt: new Date().toISOString(),
        exercises: buildExercisesFromDay(day),
      };
      elapsedSeconds = 0;
      startTimer();
      render(container);
    });
  });
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    elapsedSeconds += 1;
    const el = document.getElementById("session-timer-value");
    if (el) el.textContent = formatTime(elapsedSeconds);
  }, 1000);
}

function isExerciseComplete(ex) {
  if (ex.type === "duration") return ex.validated;
  return ex.sets.every((s) => s.validated);
}

function renderActiveSession(container) {
  container.innerHTML = `
    <div class="card">
      <span class="page-eyebrow">${currentSession.objectiveLabel}</span>
      <div class="card-title">${currentSession.dayName}</div>
    </div>

    <div class="session-timer">
      <div class="timer-value" id="session-timer-value">${formatTime(elapsedSeconds)}</div>
      <div class="timer-label">Temps de séance</div>
    </div>

    <div id="exercise-list">
      ${currentSession.exercises.map((ex, exIndex) => renderExerciseBlock(ex, exIndex)).join("")}
    </div>

    <div class="btn-block-row" style="margin-top: var(--sp-4);">
      <button class="btn btn-secondary" id="cancel-session">Annuler</button>
      <button class="btn btn-primary" id="finish-session">Terminer la séance</button>
    </div>
  `;

  bindActiveSessionEvents(container);
}

function renderExerciseBlock(exercise, exIndex) {
  const complete = isExerciseComplete(exercise);

  if (exercise.type === "duration") {
    return `
      <div class="exercise-block ${complete ? "is-complete" : ""}">
        <div class="exercise-block-header">
          <div>
            <span class="list-row-title">${exercise.name}</span>
            ${exercise.note ? `<div class="exercise-sub">${exercise.note}</div>` : ""}
          </div>
          <span class="badge badge-steel">${exercise.durationMinutes} min</span>
        </div>
        <div class="duration-row">
          <span class="duration-label">${complete ? "Terminé" : "À faire"}</span>
          <button class="set-validate-btn ${complete ? "is-active" : ""}" data-toggle-duration="${exIndex}" aria-label="Valider">
            <span class="icon icon-check"></span>
          </button>
        </div>
      </div>
    `;
  }

  const isHold = exercise.type === "hold";

  return `
    <div class="exercise-block ${complete ? "is-complete" : ""}">
      <div class="exercise-block-header">
        <div>
          <span class="list-row-title">${exercise.name}</span>
          ${
            exercise.restSeconds
              ? `<div class="exercise-sub">Repos conseillé : ${exercise.restSeconds}s</div>`
              : exercise.note
              ? `<div class="exercise-sub">${exercise.note}</div>`
              : ""
          }
        </div>
        <span class="badge badge-accent">${exercise.sets.length} série${exercise.sets.length > 1 ? "s" : ""}</span>
      </div>
      ${exercise.sets
        .map(
          (set) => `
        <div class="set-row ${set.validated ? "is-validated" : ""}">
          <span class="set-index">#${set.index + 1}</span>
          <span class="set-target">${set.targetLabel}${isHold ? " maintien" : " reps"}</span>
          <input type="number" inputmode="decimal" placeholder="kg" value="${set.weight}"
            data-set-field="${exIndex}-${set.index}" ${set.validated ? "disabled" : ""} />
          <button class="set-validate-btn ${set.validated ? "is-active" : ""}"
            data-toggle-set="${exIndex}-${set.index}" aria-label="Valider la série">
            <span class="icon icon-check"></span>
          </button>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

function bindActiveSessionEvents(container) {
  container.querySelectorAll("[data-set-field]").forEach((input) => {
    input.addEventListener("input", (e) => {
      const [exIndex, setIndex] = e.target.dataset.setField.split("-").map(Number);
      currentSession.exercises[exIndex].sets[setIndex].weight = e.target.value;
    });
  });

  container.querySelectorAll("[data-toggle-set]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [exIndex, setIndex] = btn.dataset.toggleSet.split("-").map(Number);
      const set = currentSession.exercises[exIndex].sets[setIndex];
      set.validated = !set.validated;
      renderActiveSession(container);
    });
  });

  container.querySelectorAll("[data-toggle-duration]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const exIndex = Number(btn.dataset.toggleDuration);
      const ex = currentSession.exercises[exIndex];
      ex.validated = !ex.validated;
      renderActiveSession(container);
    });
  });

  container.querySelector("#cancel-session").addEventListener("click", () => {
    const confirmed = window.confirm("Annuler cette séance ? Les données saisies ne seront pas enregistrées.");
    if (!confirmed) return;
    clearInterval(timerInterval);
    currentSession = null;
    render(container);
  });

  container.querySelector("#finish-session").addEventListener("click", async () => {
    clearInterval(timerInterval);
    const sessionToSave = {
      ...currentSession,
      finishedAt: new Date().toISOString(),
      durationSeconds: elapsedSeconds,
    };
    await dbPut("sessions", sessionToSave);
    currentSession = null;
    showToast("Séance enregistrée");
    navigateTo("history");
  });
}
