// State management - handles application state and localStorage persistence
import { ROLES } from "./api.js";

export const STORAGE_PREFIX =
  "rdo-dailies";

export const state = {
  dateKey: null,
  data: null,
  roleDifficulty: {}, // per-role difficulty selection
  completed: {}, // challengeId -> true
  skipped: {}, // challengeId -> true (will not do)
  autoCollapse: false,
  lighterTheme: false,
  compactMode: false,
};

export function effectiveDateString() {
  // Align with RDOMap logic (6h UTC shift)
  const d = new Date(
    Date.now() - 21600000
  );
  return d.toISOString().split("T")[0];
}

export function loadSettings() {
  state.dateKey = effectiveDateString();
  // Reset storage when day changes
  const lastDate = localStorage.getItem(
    `${STORAGE_PREFIX}:lastDate`
  );
  if (lastDate !== state.dateKey) {
    // Drop per-day completion and skips
    Object.keys(localStorage).forEach(
      (k) => {
        if (
          k.startsWith(
            `${STORAGE_PREFIX}:completed:`
          )
        )
          localStorage.removeItem(k);
        if (
          k.startsWith(
            `${STORAGE_PREFIX}:skipped:`
          )
        )
          localStorage.removeItem(k);
      }
    );
    localStorage.setItem(
      `${STORAGE_PREFIX}:lastDate`,
      state.dateKey
    );
  }

  // Load saved completions
  try {
    const saved = localStorage.getItem(
      `${STORAGE_PREFIX}:completed:${state.dateKey}`
    );
    state.completed = saved
      ? JSON.parse(saved)
      : {};
  } catch (_) {
    state.completed = {};
  }

  // Load saved skips
  try {
    const savedSkipped =
      localStorage.getItem(
        `${STORAGE_PREFIX}:skipped:${state.dateKey}`
      );
    state.skipped = savedSkipped
      ? JSON.parse(savedSkipped)
      : {};
  } catch (_) {
    state.skipped = {};
  }

  // Load per-role difficulty
  ROLES.forEach((r) => {
    const saved = localStorage.getItem(
      `${STORAGE_PREFIX}:roleDiff:${r}`
    );
    state.roleDifficulty[r] =
      saved || "hard";
  });

  // Load display options
  state.autoCollapse =
    localStorage.getItem(
      `${STORAGE_PREFIX}:autoCollapse`
    ) === "true";
  state.lighterTheme =
    localStorage.getItem(
      `${STORAGE_PREFIX}:lighterTheme`
    ) === "true";
  state.compactMode =
    localStorage.getItem(
      `${STORAGE_PREFIX}:compactMode`
    ) === "true";

  // Apply theme/mode classes
  if (state.lighterTheme)
    document.body.classList.add(
      "lighter-theme"
    );
  if (state.compactMode)
    document.body.classList.add(
      "compact-mode"
    );
}

export function saveCompleted() {
  localStorage.setItem(
    `${STORAGE_PREFIX}:completed:${state.dateKey}`,
    JSON.stringify(state.completed)
  );
}

export function saveRoleDifficulty(
  role,
  diff
) {
  localStorage.setItem(
    `${STORAGE_PREFIX}:roleDiff:${role}`,
    diff
  );
}

export function saveSkipped() {
  localStorage.setItem(
    `${STORAGE_PREFIX}:skipped:${state.dateKey}`,
    JSON.stringify(state.skipped)
  );
}
