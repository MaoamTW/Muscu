import { getProfile, updateProfile } from "../state.js";
import { exportAllData, importAllData, dbResetAll } from "../db.js";
import { clearProfileCache } from "../state.js";
import { showToast } from "../components/toast.js";
import { navigateTo } from "../router.js";

export async function render(container) {
  const profile = await getProfile();
  const initial = (profile.firstName || "?").charAt(0).toUpperCase();

  container.innerHTML = `
    <div class="profile-avatar">${initial}</div>

    <div class="card">
      <div class="field">
        <label for="first-name">Prénom</label>
        <input type="text" id="first-name" value="${profile.firstName || ""}" placeholder="Ton prénom" />
      </div>

      <div class="field">
        <label>Unité de poids</label>
        <div class="segmented">
          <button data-unit="kg" class="${profile.unit === "kg" ? "is-active" : ""}">kg</button>
          <button data-unit="lb" class="${profile.unit === "lb" ? "is-active" : ""}">lb</button>
        </div>
      </div>

      <button class="btn btn-primary" id="save-profile">Enregistrer</button>
    </div>

    <div class="section">
      <div class="section-title">Objectif</div>
      <div class="card">
        <div class="header-row">
          <div>
            <div class="card-title">${profile.objectiveLabel ?? "Non défini"}</div>
            <div class="card-sub">Modifie ton objectif à tout moment</div>
          </div>
          <button class="btn-ghost" id="change-objective">Changer</button>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Données locales</div>
      <p class="card-sub" style="margin-bottom: var(--sp-4);">
        Toutes tes données restent uniquement sur cet appareil. Utilise l'export pour en garder une copie de sauvegarde.
      </p>
      <div class="btn-block-row">
        <button class="btn btn-secondary" id="export-data"><span class="icon icon-export"></span> Exporter</button>
        <button class="btn btn-secondary" id="import-data"><span class="icon icon-import"></span> Importer</button>
      </div>
      <input type="file" id="import-file" accept="application/json" style="display:none;" />
    </div>

    <div class="section">
      <button class="btn btn-danger" id="reset-data">Réinitialiser toutes les données</button>
    </div>
  `;

  container.querySelectorAll("[data-unit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      container.querySelectorAll("[data-unit]").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
    });
  });

  container.querySelector("#save-profile").addEventListener("click", async () => {
    const firstName = container.querySelector("#first-name").value.trim();
    const unit = container.querySelector(".is-active")?.dataset.unit || "kg";
    await updateProfile({ firstName, unit });
    showToast("Profil enregistré");
    render(container);
  });

  container.querySelector("#change-objective").addEventListener("click", () => navigateTo("onboarding"));

  container.querySelector("#export-data").addEventListener("click", async () => {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `forge-sauvegarde-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Export généré");
  });

  const importInput = container.querySelector("#import-file");
  container.querySelector("#import-data").addEventListener("click", () => importInput.click());
  importInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importAllData(data);
      clearProfileCache();
      showToast("Import réussi");
      navigateTo("home");
    } catch (err) {
      showToast("Fichier invalide");
    }
  });

  container.querySelector("#reset-data").addEventListener("click", async () => {
    const confirmed = window.confirm(
      "Cette action supprime définitivement toutes les données enregistrées sur cet appareil. Continuer ?"
    );
    if (!confirmed) return;
    await dbResetAll();
    clearProfileCache();
    showToast("Données réinitialisées");
    navigateTo("onboarding");
  });
}
