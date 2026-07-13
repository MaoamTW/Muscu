import { OBJECTIVE_GROUPS, findObjectiveById } from "../data/objectives.js";
import { getProfile, updateProfile } from "../state.js";
import { navigateTo } from "../router.js";
import { showToast } from "../components/toast.js";
import { generateProgram } from "../engine/programGenerator.js";

function weightOptions(selectedWeight) {
  const options = [];
  for (let w = 40; w <= 150; w += 5) {
    options.push(`<option value="${w}" ${w === selectedWeight ? "selected" : ""}>${w} kg</option>`);
  }
  return options.join("");
}

export async function render(container) {
  const profile = await getProfile();
  let selected = profile.objective;
  const defaultWeight = profile.bodyWeightKg || 70;

  container.innerHTML = `
    <div class="onboarding-intro">
      <div class="brand-mark"></div>
      <h1>Choisis ton objectif</h1>
      <p>Un programme complet est généré automatiquement selon ton choix, avec des charges de départ adaptées à ton poids.</p>
    </div>

    <div class="field">
      <label for="body-weight">Ton poids</label>
      <select id="body-weight">
        ${weightOptions(defaultWeight)}
      </select>
    </div>

    ${OBJECTIVE_GROUPS.map(
      (group) => `
      <div class="objective-group-title">${group.title}</div>
      <div class="objective-grid" data-group>
        ${group.items
          .map(
            (item) => `
          <button class="objective-card ${selected === item.id ? "is-selected" : ""}" data-objective="${item.id}">
            <span class="obj-emoji">${item.emoji}</span>
            <span class="obj-name">${item.label}</span>
          </button>
        `
          )
          .join("")}
      </div>
    `
    ).join("")}

    <div style="height: 96px;"></div>

    <div class="onboarding-footer">
      <button class="btn btn-primary" id="confirm-objective" ${selected ? "" : "disabled"}>
        Continuer
      </button>
    </div>
  `;

  container.querySelectorAll("[data-objective]").forEach((card) => {
    card.addEventListener("click", () => {
      selected = card.dataset.objective;
      container.querySelectorAll("[data-objective]").forEach((c) => c.classList.remove("is-selected"));
      card.classList.add("is-selected");
      const confirmBtn = container.querySelector("#confirm-objective");
      confirmBtn.disabled = false;
    });
  });

  container.querySelector("#confirm-objective").addEventListener("click", async () => {
    const objective = findObjectiveById(selected);
    const bodyWeightKg = Number(container.querySelector("#body-weight").value);
    await updateProfile({ objective: selected, objectiveLabel: objective?.label ?? selected, bodyWeightKg });
    await generateProgram(selected);
    showToast(`Objectif "${objective?.label}" enregistré — programme généré`);
    navigateTo("program");
  });
}
