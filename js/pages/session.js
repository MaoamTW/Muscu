import { dbPut, dbGetAll, generateId } from "../db.js";
import { getProfile } from "../state.js";
import { ensureProgramForObjective } from "../engine/programGenerator.js";
import { getWeightRecommendation, analyzeSessionAndUpdateSuggestions } from "../engine/progressionEngine.js";
import { getEquipmentInfo, EQUIPMENT_LABELS } from "../data/equipment.js";
import { pickReplacement } from "../engine/substitutionEngine.js";
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

/**
 * Construit l'état initial des exercices d'une séance à partir d'un jour de
 * programme. Pour les exercices "en répétitions" et "en durée", va chercher
 * l'équipement associé (js/data/equipment.js), utile pour l'illustration et
 * le bouton "Machine indisponible". Pour les exercices "en répétitions",
 * va aussi chercher la suggestion de charge du moteur de progression.
 */
async function buildExercisesFromDay(day, objectiveId, bodyWeightKg) {
  const exercises = [];

  for (const ex of day.exercises) {
    if (ex.durationMinutes != null) {
      exercises.push({
        type: "duration",
        name: ex.name,
        originalName: ex.name,
        triedNames: [ex.name],
        equipment: getEquipmentInfo(ex.name).equipment,
        durationMinutes: ex.durationMinutes,
        note: ex.note || null,
        validated: false,
      });
      continue;
    }

    if (ex.holdSeconds != null) {
      exercises.push({
        type: "hold",
        name: ex.name,
        note: ex.note || null,
        sets: Array.from({ length: ex.sets }, (_, i) => ({
          index: i,
          targetLabel: `${ex.holdSeconds}s`,
          weight: "",
          validated: false,
        })),
      });
      continue;
    }

    const suggestion = await getWeightRecommendation(objectiveId, ex.name, bodyWeightKg);
    const prefillWeight = suggestion ? String(suggestion.suggestedWeight) : "";

    exercises.push({
      type: "reps",
      name: ex.name,
      originalName: ex.name,
      triedNames: [ex.name],
      equipment: getEquipmentInfo(ex.name).equipment,
      restSeconds: ex.restSeconds || null,
      suggestion,
      sets: Array.from({ length: ex.sets }, (_, i) => ({
        index: i,
        targetLabel: ex.reps,
        weight: prefillWeight,
        status: null, // null | "easy" | "hard" | "failed"
      })),
    });
  }

  return exercises;
}

export async function render(container) {
  const profile = await getProfile();

  // Si une séance était en cours mais que l'objectif a changé depuis (ex : changement
  // de programme sans avoir annulé/terminé la séance), elle n'est plus valide : on
  // l'abandonne pour proposer directement le nouveau programme.
  if (currentSession && currentSession.objectiveId !== profile.objective) {
    clearInterval(timerInterval);
    currentSession = null;
  }

  if (currentSession) {
    renderActiveSession(container);
    return;
  }

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
  await renderDayPicker(container, profile, program);
}

/**
 * Détermine l'index du "prochain type de séance" dans la rotation du
 * programme, à partir de la dernière séance effectuée sur cet objectif.
 * Permet de proposer directement la séance suivante une fois la séance du
 * jour terminée (ex : après "Push", "Pull" est recommandé la fois d'après),
 * sans jamais bloquer le choix libre d'un autre type de séance.
 */
function getRecommendedDayIndex(program, allSessions) {
  if (program.days.length <= 1) return 0;

  const relevant = allSessions
    .filter((s) => s.objectiveId === program.objectiveId)
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

  if (relevant.length === 0) return 0;

  const lastIndex = program.days.findIndex((d) => d.name === relevant[0].dayName);
  if (lastIndex === -1) return 0;

  return (lastIndex + 1) % program.days.length;
}

async function renderDayPicker(container, profile, program) {
  const allSessions = await dbGetAll("sessions");
  const recommendedIndex = getRecommendedDayIndex(program, allSessions);
  const hasRotation = program.days.length > 1;

  const orderedDays = program.days
    .map((day, index) => ({ day, index }))
    .sort((a, b) => (a.index === recommendedIndex ? -1 : b.index === recommendedIndex ? 1 : 0));

  container.innerHTML = `
    <div class="card">
      <span class="page-eyebrow">Objectif actuel</span>
      <div class="card-title">${program.objectiveLabel}</div>
      <div class="card-sub">${program.frequencyLabel}</div>
    </div>

    <div class="section">
      <div class="section-title">${hasRotation ? "Choisis la séance du jour" : "Séance du jour"}</div>
      ${orderedDays
        .map(
          ({ day, index }) => `
        <button class="card day-picker-card" data-start-day="${index}" style="margin-top: var(--sp-3);">
          <div>
            ${
              hasRotation && index === recommendedIndex
                ? `<span class="badge badge-accent" style="margin-bottom: var(--sp-2); display:inline-flex;">Recommandé aujourd'hui</span>`
                : ""
            }
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
    btn.addEventListener("click", async () => {
      const day = program.days[Number(btn.dataset.startDay)];
      const exercises = await buildExercisesFromDay(day, program.objectiveId, profile.bodyWeightKg);
      currentSession = {
        id: generateId("session"),
        objectiveId: program.objectiveId,
        objectiveLabel: program.objectiveLabel,
        dayName: day.name,
        startedAt: new Date().toISOString(),
        exercises,
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
  if (ex.type === "hold") return ex.sets.every((s) => s.validated);
  return ex.sets.every((s) => s.status !== null);
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

function renderSuggestionBanner(exercise) {
  const s = exercise.suggestion;
  if (!s) return "";

  if (s.source === "initial") {
    return `
      <div class="suggestion-banner">
        <span>⚖️</span>
        <span>
          Charge de départ recommandée : <strong>${s.suggestedWeight} kg</strong>,
          estimée à partir de ton poids et de ton objectif. Ajuste-la si besoin.
        </span>
      </div>
    `;
  }

  const outcomeLabel = { easy: "facile 📈", hard: "difficile ➡️", failed: "ratée 📉" }[s.outcome] || "";

  return `
    <div class="suggestion-banner">
      <span>💡</span>
      <span>
        Suggestion basée sur ta dernière séance (<strong>${outcomeLabel}</strong>) :
        <strong>${s.suggestedWeight} kg</strong> conseillés aujourd'hui (précédemment ${s.lastWeight} kg).
      </span>
    </div>
  `;
}

/**
 * Bandeau illustrant l'équipement requis (icône générique par catégorie,
 * voir js/data/equipment.js) + bouton "Machine indisponible", pour les
 * exercices "en répétitions" et "en durée" (musculation avec charge / cardio).
 * Comme l'application ne peut pas intégrer de vraies photos de matériel
 * (hors ligne + droits d'auteur, voir cahier des charges), deux liens
 * externes ouvrent une recherche photo/vidéo pour identifier la machine.
 */
function equipmentSearchLinks(exerciseName) {
  const query = encodeURIComponent(`${exerciseName} musculation exercice`);
  const videoQuery = encodeURIComponent(`${exerciseName} comment faire exercice technique`);
  return {
    photoUrl: `https://www.google.com/search?tbm=isch&q=${query}`,
    videoUrl: `https://www.youtube.com/results?search_query=${videoQuery}`,
  };
}

function renderEquipmentRow(exercise, exIndex) {
  const label = EQUIPMENT_LABELS[exercise.equipment] || "Équipement";
  const { photoUrl, videoUrl } = equipmentSearchLinks(exercise.name);
  return `
    <div class="equipment-row">
      <div class="equipment-icon-wrap">
        <span class="equipment-icon" data-equip="${exercise.equipment}"></span>
      </div>
      <div class="equipment-label">
        <strong>${label}</strong>
        ${exercise.isSubstituted ? `<span class="substitution-note">Remplace : ${exercise.originalName}</span>` : "Matériel nécessaire"}
      </div>
      <button class="btn-unavailable" data-substitute="${exIndex}">Machine indisponible</button>
    </div>
    <div class="equipment-links">
      <a class="equipment-link" href="${photoUrl}" target="_blank" rel="noopener noreferrer">
        <span class="icon icon-photo"></span> Voir une photo
      </a>
      <a class="equipment-link" href="${videoUrl}" target="_blank" rel="noopener noreferrer">
        <span class="icon icon-video"></span> Voir une vidéo
      </a>
    </div>
  `;
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

        ${renderEquipmentRow(exercise, exIndex)}

        <div class="duration-row">
          <span class="duration-label">${complete ? "Terminé" : "À faire"}</span>
          <button class="set-validate-btn ${complete ? "is-active" : ""}" data-toggle-duration="${exIndex}" aria-label="Valider">
            <span class="icon icon-check"></span>
          </button>
        </div>
      </div>
    `;
  }

  if (exercise.type === "hold") {
    return `
      <div class="exercise-block ${complete ? "is-complete" : ""}">
        <div class="exercise-block-header">
          <div>
            <span class="list-row-title">${exercise.name}</span>
            ${exercise.note ? `<div class="exercise-sub">${exercise.note}</div>` : ""}
          </div>
          <span class="badge badge-accent">${exercise.sets.length} série${exercise.sets.length > 1 ? "s" : ""}</span>
        </div>
        ${exercise.sets
          .map(
            (set) => `
          <div class="set-row ${set.validated ? "is-validated" : ""}">
            <span class="set-index">#${set.index + 1}</span>
            <span class="set-target">${set.targetLabel} maintien</span>
            <span></span>
            <button class="set-validate-btn ${set.validated ? "is-active" : ""}"
              data-toggle-hold="${exIndex}-${set.index}" aria-label="Valider la série">
              <span class="icon icon-check"></span>
            </button>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  // Exercice "en répétitions" : équipement + suggestion de charge + statut par série
  return `
    <div class="exercise-block ${complete ? "is-complete" : ""}">
      <div class="exercise-block-header">
        <div>
          <span class="list-row-title">${exercise.name}</span>
          ${exercise.restSeconds ? `<div class="exercise-sub">Repos conseillé : ${exercise.restSeconds}s</div>` : ""}
        </div>
        <span class="badge badge-accent">${exercise.sets.length} série${exercise.sets.length > 1 ? "s" : ""}</span>
      </div>

      ${renderEquipmentRow(exercise, exIndex)}
      ${renderSuggestionBanner(exercise)}

      ${exercise.sets
        .map(
          (set) => `
        <div class="set-card ${set.status ? "is-done" : ""}">
          <div class="set-card-top">
            <span class="set-index">#${set.index + 1}</span>
            <span class="set-target">${set.targetLabel} reps</span>
            <input type="number" inputmode="decimal" placeholder="kg" value="${set.weight}"
              data-set-field="${exIndex}-${set.index}" />
          </div>
          <div class="set-status-group">
            <button class="set-status-btn status-failed ${set.status === "failed" ? "is-active" : ""}"
              data-set-status="${exIndex}-${set.index}-failed">Ratée</button>
            <button class="set-status-btn status-hard ${set.status === "hard" ? "is-active" : ""}"
              data-set-status="${exIndex}-${set.index}-hard">Difficile</button>
            <button class="set-status-btn status-easy ${set.status === "easy" ? "is-active" : ""}"
              data-set-status="${exIndex}-${set.index}-easy">Facile</button>
          </div>
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

  container.querySelectorAll("[data-set-status]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [exIndex, setIndex, status] = btn.dataset.setStatus.split("-");
      const set = currentSession.exercises[Number(exIndex)].sets[Number(setIndex)];
      // Cliquer à nouveau sur le même statut le désélectionne (retour à "non renseigné").
      set.status = set.status === status ? null : status;
      renderActiveSession(container);
    });
  });

  container.querySelectorAll("[data-toggle-hold]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [exIndex, setIndex] = btn.dataset.toggleHold.split("-").map(Number);
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

  container.querySelectorAll("[data-substitute]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const exIndex = Number(btn.dataset.substitute);
      const ex = currentSession.exercises[exIndex];

      const nextName = pickReplacement(ex.name, ex.triedNames);
      if (!nextName) {
        showToast("Aucun exercice de remplacement disponible pour cet exercice.");
        return;
      }

      ex.triedNames.push(nextName);
      ex.name = nextName;
      ex.equipment = getEquipmentInfo(nextName).equipment;
      ex.isSubstituted = true;

      if (ex.type === "reps") {
        const profile = await getProfile();
        const suggestion = await getWeightRecommendation(currentSession.objectiveId, nextName, profile.bodyWeightKg);
        const prefillWeight = suggestion ? String(suggestion.suggestedWeight) : "";
        ex.suggestion = suggestion;
        ex.sets = ex.sets.map((s) => ({ ...s, weight: prefillWeight, status: null }));
      }

      showToast(`Remplacé par : ${nextName}`);
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
    await analyzeSessionAndUpdateSuggestions(sessionToSave);
    currentSession = null;
    showToast("Séance enregistrée — progression mise à jour");
    navigateTo("history");
  });
}
