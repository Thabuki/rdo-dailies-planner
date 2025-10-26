// Main entry point - bootstraps the application
import {
  fetchDailies,
  shapeData,
} from "./api.js";
import {
  state,
  loadSettings,
  STORAGE_PREFIX,
  saveCompleted,
  saveSkipped,
} from "./state.js";
import {
  render,
  applyAutoCollapse,
} from "./render.js";

function attachActions() {
  // Reset button removed from UI
  const resetBtn =
    document.getElementById(
      "reset-day"
    );
  if (resetBtn) {
    resetBtn.addEventListener(
      "click",
      () => {
        state.completed = {};
        state.skipped = {};
        saveCompleted();
        saveSkipped();
        render();
      }
    );
  }

  // Display option toggles
  const autoCollapseToggle =
    document.getElementById(
      "auto-collapse-toggle"
    );
  if (autoCollapseToggle) {
    autoCollapseToggle.checked =
      state.autoCollapse;
    autoCollapseToggle.addEventListener(
      "change",
      () => {
        state.autoCollapse =
          autoCollapseToggle.checked;
        localStorage.setItem(
          `${STORAGE_PREFIX}:autoCollapse`,
          state.autoCollapse
        );
        applyAutoCollapse();
      }
    );
  }

  const lighterThemeToggle =
    document.getElementById(
      "light-mode-toggle"
    );
  if (lighterThemeToggle) {
    lighterThemeToggle.checked =
      state.lighterTheme;
    lighterThemeToggle.addEventListener(
      "change",
      () => {
        state.lighterTheme =
          lighterThemeToggle.checked;
        localStorage.setItem(
          `${STORAGE_PREFIX}:lighterTheme`,
          state.lighterTheme
        );
        document.body.classList.toggle(
          "lighter-theme",
          state.lighterTheme
        );
      }
    );
  }

  const compactModeToggle =
    document.getElementById(
      "compact-mode-toggle"
    );
  if (compactModeToggle) {
    compactModeToggle.checked =
      state.compactMode;
    compactModeToggle.addEventListener(
      "change",
      () => {
        state.compactMode =
          compactModeToggle.checked;
        localStorage.setItem(
          `${STORAGE_PREFIX}:compactMode`,
          state.compactMode
        );
        document.body.classList.toggle(
          "compact-mode",
          state.compactMode
        );
      }
    );
  }
}

function updateResetTimer() {
  const now = Date.now();
  const nextReset = new Date(
    now - 21600000
  );
  nextReset.setUTCHours(24, 0, 0, 0);
  const msUntilReset =
    nextReset.getTime() +
    21600000 -
    now;
  const hoursUntilReset = Math.floor(
    msUntilReset / 3600000
  );
  const minutesUntilReset = Math.floor(
    (msUntilReset % 3600000) / 60000
  );

  const timerEl =
    document.getElementById(
      "reset-timer"
    );
  if (timerEl) {
    timerEl.textContent = `(resets in ${hoursUntilReset}h ${minutesUntilReset}m)`;
  }
}

async function start() {
  loadSettings();
  document.getElementById(
    "daily-date"
  ).textContent = state.dateKey;
  updateResetTimer();
  setInterval(updateResetTimer, 60000); // Update every minute
  attachActions();

  try {
    const raw = await fetchDailies();
    state.data = shapeData(raw);
    render();
  } catch (err) {
    const container =
      document.querySelector(
        ".container"
      );
    const msg =
      document.createElement("div");
    msg.className = "section";
    msg.innerHTML = `<h2>Unable to load dailies</h2><p class="hint">${err.message}</p>`;
    container.prepend(msg);
  }
}

start();
