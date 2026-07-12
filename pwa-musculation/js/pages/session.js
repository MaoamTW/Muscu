import { dbGetAll, dbPut, generateId } from "../db.js";
import { showToast } from "../components/toast.js";
import { navigateTo } from "../router.js";

let timerInterval = null;
let elapsedSeconds = 0;
let currentSession = null; // { id, startedAt, exercises: [{ exerciseId, name, sets: [{ weight, reps }] }] }

function formatTime(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export async function render(container) {
  if (!currentSession) {
    renderIdleState(container);
  } else {
    await renderActiveSession(container);
  }
}

function renderIdleState(container) {
  container.innerHTML = `
    <div class="empty-state" style="margin-top: var(--sp-6);">
      <div class="empty-icon"><span class="icon icon-dumbbell"></span></div>
      <h3>Prêt·e à t'entraîner ?</h3>
      <p>Démarre une séance pour suivre tes exercices, tes séries et tes charges en direct.</p>
      <button class="btn btn-primary" id="start-session">Démarrer une séance</button>
    </div>
  `;
  container.querySelector("#start-session").addEventListener("click", () => {
    currentSession = {
      id: generateId("session"),
      startedAt: new Date().toISOString(),
      exercises: [],
    };
    elapsedSeconds = 0;
    startTimer(container);
    render(container);
  });
}

function startTimer(container) {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    elapsedSeconds += 1;
    const el = document.getElementById("session-timer-value");
    if (el) el.textContent = formatTime(elapsedSeconds);
  }, 1000);
}

async function renderActiveSession(container) {
  const exerciseLibrary = await dbGetAll("exercises");

  container.innerHTML = `
    <div class="session-timer">
      <div class="timer-value" id="session-timer-value">${formatTime(elapsedSeconds)}</div>
      <div class="timer-label">Temps de séance</div>
    </div>

    <div id="exercise-list">
      ${
        currentSession.exercises.length === 0
          ? `<div class="empty-state">
               <p style="margin-bottom:0;">Ajoute un premier exercice pour commencer.</p>
             </div>`
          : currentSession.exercises.map((ex, exIndex) => renderExerciseBlock(ex, exIndex)).join("")
      }
    </div>

    <div class="section">
      <div class="field">
        <label for="exercise-picker">Ajouter un exercice</label>
        <select id="exercise-picker">
          <option value="">Sélectionner un exercice…</option>
          ${exerciseLibrary
            .map((ex) => `<option value="${ex.id}" data-name="${ex.name}">${ex.name} — ${ex.muscleGroup}</option>`)
            .join("")}
        </select>
      </div>
    </div>

    <div class="btn-block-row" style="margin-top: var(--sp-4);">
      <button class="btn btn-secondary" id="cancel-session">Annuler</button>
      <button class="btn btn-primary" id="finish-session">Terminer</button>
    </div>
  `;

  container.querySelector("#exercise-picker").addEventListener("change", (e) => {
    const select = e.target;
    const exerciseId = select.value;
    if (!exerciseId) return;
    const name = select.selectedOptions[0].dataset.name;
    currentSession.exercises.push({ exerciseId, name, sets: [{ weight: "", reps: "" }] });
    render(container);
  });

  container.querySelectorAll("[data-add-set]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const exIndex = Number(btn.dataset.addSet);
      currentSession.exercises[exIndex].sets.push({ weight: "", reps: "" });
      render(container);
    });
  });

  container.querySelectorAll("[data-remove-set]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [exIndex, setIndex] = btn.dataset.removeSet.split("-").map(Number);
      currentSession.exercises[exIndex].sets.splice(setIndex, 1);
      render(container);
    });
  });

  container.querySelectorAll("[data-set-field]").forEach((input) => {
    input.addEventListener("input", (e) => {
      const [exIndex, setIndex, field] = e.target.dataset.setField.split("-");
      currentSession.exercises[exIndex].sets[setIndex][field] = e.target.value;
    });
  });

  container.querySelector("#cancel-session").addEventListener("click", () => {
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

function renderExerciseBlock(exercise, exIndex) {
  return `
    <div class="exercise-block">
      <div class="exercise-block-header">
        <span class="list-row-title">${exercise.name}</span>
        <span class="badge badge-accent">${exercise.sets.length} série${exercise.sets.length > 1 ? "s" : ""}</span>
      </div>
      ${exercise.sets
        .map(
          (set, setIndex) => `
        <div class="set-row">
          <span class="set-index">#${setIndex + 1}</span>
          <input type="number" inputmode="decimal" placeholder="kg" value="${set.weight}"
            data-set-field="${exIndex}-${setIndex}-weight" />
          <input type="number" inputmode="numeric" placeholder="reps" value="${set.reps}"
            data-set-field="${exIndex}-${setIndex}-reps" />
          <button class="icon-btn" data-remove-set="${exIndex}-${setIndex}" aria-label="Supprimer la série">×</button>
        </div>
      `
        )
        .join("")}
      <button class="btn btn-ghost" data-add-set="${exIndex}" style="margin-top: var(--sp-3);">
        <span class="icon icon-plus"></span> Ajouter une série
      </button>
    </div>
  `;
}
