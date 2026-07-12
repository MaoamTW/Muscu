import { getProfile } from "../state.js";
import { navigateTo } from "../router.js";
import { ensureProgramForObjective, generateProgram } from "../engine/programGenerator.js";
import { showToast } from "../components/toast.js";

function formatExercise(ex) {
  if (ex.durationMinutes) {
    return `${ex.durationMinutes} min`;
  }
  if (ex.holdSeconds) {
    return `${ex.sets} x ${ex.holdSeconds}s maintien`;
  }
  const parts = [`${ex.sets} x ${ex.reps}`];
  if (ex.restSeconds) parts.push(`repos ${ex.restSeconds}s`);
  return parts.join(" · ");
}

export async function render(container) {
  const profile = await getProfile();

  if (!profile.objective) {
    container.innerHTML = `
      <div class="empty-state" style="margin-top: var(--sp-6);">
        <div class="empty-icon"><span class="icon icon-target"></span></div>
        <h3>Aucun objectif défini</h3>
        <p>Choisis un objectif pour recevoir automatiquement un programme adapté.</p>
        <button class="btn btn-primary" id="go-onboarding">Choisir un objectif</button>
      </div>
    `;
    container.querySelector("#go-onboarding").addEventListener("click", () => navigateTo("onboarding"));
    return;
  }

  const program = await ensureProgramForObjective(profile.objective);

  container.innerHTML = `
    <div class="card">
      <div class="header-row">
        <div>
          <span class="page-eyebrow">Objectif actuel</span>
          <div class="card-title">${program.objectiveLabel}</div>
          <div class="card-sub">${program.frequencyLabel}</div>
        </div>
        <button class="icon-btn" id="change-objective" aria-label="Changer d'objectif">
          <span class="icon icon-target"></span>
        </button>
      </div>
      <p class="card-sub" style="margin-top: var(--sp-3);">${program.description}</p>
    </div>

    <div class="section">
      <div class="section-title">Programme généré</div>
      ${program.days
        .map(
          (day) => `
        <div class="exercise-block">
          <div class="exercise-block-header">
            <span class="list-row-title">${day.name}</span>
            <span class="badge badge-steel">${day.exercises.length} exercice${day.exercises.length > 1 ? "s" : ""}</span>
          </div>
          <ul>
            ${day.exercises
              .map(
                (ex) => `
              <li class="list-row">
                <div>
                  <div class="list-row-title">${ex.name}${ex.note ? ` <span class="card-sub">(${ex.note})</span>` : ""}</div>
                  <div class="list-row-sub">${formatExercise(ex)}</div>
                </div>
              </li>
            `
              )
              .join("")}
          </ul>
        </div>
      `
        )
        .join("")}
    </div>

    ${
      program.note
        ? `<div class="section">
             <div class="empty-state" style="text-align:left; padding: var(--sp-4);">
               <p style="margin-bottom:0;">💡 ${program.note}</p>
             </div>
           </div>`
        : ""
    }

    <div class="section">
      <button class="btn btn-secondary" id="regenerate-program">Régénérer le programme</button>
    </div>
  `;

  container.querySelector("#change-objective").addEventListener("click", () => navigateTo("onboarding"));

  container.querySelector("#regenerate-program").addEventListener("click", async () => {
    await generateProgram(profile.objective);
    showToast("Programme régénéré");
    render(container);
  });
}
