import { dbGetAll, dbPut, generateId } from "../db.js";
import { showToast } from "../components/toast.js";

export async function render(container) {
  const exercises = await dbGetAll("exercises");
  exercises.sort((a, b) => a.muscleGroup.localeCompare(b.muscleGroup) || a.name.localeCompare(b.name));

  const groups = {};
  for (const ex of exercises) {
    groups[ex.muscleGroup] = groups[ex.muscleGroup] || [];
    groups[ex.muscleGroup].push(ex);
  }

  container.innerHTML = `
    <div class="field">
      <input type="search" id="exercise-search" placeholder="Rechercher un exercice…" />
    </div>

    <div id="exercise-groups">
      ${
        exercises.length === 0
          ? `<div class="empty-state">
               <div class="empty-icon"><span class="icon icon-dumbbell"></span></div>
               <h3>Aucun exercice pour l'instant</h3>
               <p>Ajoute ton premier exercice ci-dessous.</p>
             </div>`
          : Object.entries(groups)
              .map(
                ([group, items]) => `
            <div class="section">
              <div class="section-title">${group}</div>
              <ul>
                ${items
                  .map(
                    (ex) => `
                  <li class="list-row" data-exercise-name="${ex.name.toLowerCase()}">
                    <div>
                      <div class="list-row-title">${ex.name}</div>
                      ${ex.isCustom ? `<div class="list-row-sub">Exercice personnalisé</div>` : ""}
                    </div>
                  </li>
                `
                  )
                  .join("")}
              </ul>
            </div>
          `
              )
              .join("")
      }
    </div>

    <div class="section">
      <button class="btn btn-secondary" id="add-exercise">
        <span class="icon icon-plus"></span> Ajouter un exercice
      </button>
    </div>

    <div id="add-exercise-form" style="display:none;" class="card">
      <div class="field">
        <label for="new-ex-name">Nom de l'exercice</label>
        <input type="text" id="new-ex-name" placeholder="Ex: Rowing unilatéral" />
      </div>
      <div class="field">
        <label for="new-ex-group">Groupe musculaire</label>
        <select id="new-ex-group">
          <option>Pectoraux</option>
          <option>Dos</option>
          <option>Jambes</option>
          <option>Épaules</option>
          <option>Bras</option>
          <option>Abdominaux</option>
          <option>Cardio</option>
        </select>
      </div>
      <button class="btn btn-primary" id="save-exercise">Enregistrer</button>
    </div>
  `;

  container.querySelector("#exercise-search").addEventListener("input", (e) => {
    const query = e.target.value.trim().toLowerCase();
    container.querySelectorAll("[data-exercise-name]").forEach((row) => {
      row.style.display = row.dataset.exerciseName.includes(query) ? "" : "none";
    });
  });

  container.querySelector("#add-exercise").addEventListener("click", () => {
    container.querySelector("#add-exercise-form").style.display = "block";
  });

  container.querySelector("#save-exercise").addEventListener("click", async () => {
    const name = container.querySelector("#new-ex-name").value.trim();
    const muscleGroup = container.querySelector("#new-ex-group").value;
    if (!name) {
      showToast("Merci de renseigner un nom");
      return;
    }
    await dbPut("exercises", {
      id: generateId("ex"),
      name,
      muscleGroup,
      isCustom: true,
      createdAt: new Date().toISOString(),
    });
    showToast("Exercice ajouté");
    render(container);
  });
}
