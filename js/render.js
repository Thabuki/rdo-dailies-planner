// Rendering module - handles all UI rendering logic
import {
  ROLES,
  DIFFICULTIES,
} from "./api.js";
import {
  state,
  saveCompleted,
  saveSkipped,
  saveRoleDifficulty,
} from "./state.js";

// Helper to create DOM elements
export function el(
  tag,
  attrs = {},
  children = []
) {
  const node =
    document.createElement(tag);
  Object.entries(attrs).forEach(
    ([k, v]) => {
      if (k === "class")
        node.className = v;
      else if (k === "text")
        node.textContent = v;
      else if (
        k.startsWith("on") &&
        typeof v === "function"
      )
        node.addEventListener(
          k.slice(2),
          v
        );
      else node.setAttribute(k, v);
    }
  );
  children.forEach((c) =>
    node.appendChild(c)
  );
  return node;
}

function sortByText(list) {
  try {
    return [...list].sort((a, b) =>
      (a.text || "").localeCompare(
        b.text || "",
        undefined,
        {
          sensitivity: "base",
        }
      )
    );
  } catch (_) {
    return list;
  }
}

function roleDisplayName(role) {
  const map = {
    bounty_hunter: "Bounty Hunter",
    trader: "Trader",
    collector: "Collector",
    moonshiner: "Moonshiner",
    naturalist: "Naturalist",
  };
  return map[role] || role;
}

// Map roles to icon image paths
const ROLE_ICONS = {
  bounty_hunter: "img/role_bh.png",
  trader: "img/role_trader.png",
  collector: "img/role_collector.png",
  moonshiner: "img/role_moonshiner.png",
  naturalist: "img/role_naturalist.png",
};
function roleIconSrc(role) {
  return ROLE_ICONS[role] || "";
}

// Human-readable labels for difficulty selections
const DIFF_LABELS = {
  none: "Rank 0",
  easy: "Rank 1-4",
  med: "Rank 5-14",
  hard: "Rank 15+",
};

function formatGoal(displayType, goal) {
  if (goal == null) return "";
  switch (displayType) {
    case "DISPLAY_CASH":
      return `${(goal / 100).toFixed(
        2
      )}$`;
    case "DISPLAY_MS_TO_MINUTES":
      return `${Math.round(
        goal / 60000
      )} min`;
    case "DISPLAY_AS_BOOL":
      return `1 x`;
    case "DISPLAY_FEET":
      return `${Math.floor(
        goal * 3.28084
      )} ft`;
    default:
      return `${goal} x`;
  }
}

// Return current count of completed role challenges (excludes skipped)
function getCurrentRoleDone() {
  let count = 0;
  ROLES.forEach((role) => {
    const diff =
      state.roleDifficulty[role];
    if (diff === "none") return;
    const items =
      (state.data.roles[role] &&
        state.data.roles[role][diff]) ||
      [];
    items.forEach((rch) => {
      if (
        !state.skipped[rch.id] &&
        state.completed[rch.id]
      )
        count++;
    });
  });
  return count;
}

function renderChallengeRow(ch) {
  const checked =
    !!state.completed[ch.id];
  const isSkipped =
    !!state.skipped[ch.id];
  const isRole =
    !!ch.role &&
    ch.categoryType !== "general";
  const currentRoleDone =
    getCurrentRoleDone();

  let roleTotal = 0;
  if (isRole) {
    ROLES.forEach((role) => {
      const diff =
        state.roleDifficulty[role];
      const items =
        (state.data.roles[role] &&
          state.data.roles[role][
            diff
          ]) ||
        [];
      roleTotal += items.filter(
        (rch) => !state.skipped[rch.id]
      ).length;
    });
  }

  const cb = el("input", {
    type: "checkbox",
  });
  cb.checked = checked;

  if (isRole) {
    const cap = Math.min(
      9,
      roleTotal || 9
    );
    cb.disabled =
      isSkipped ||
      (currentRoleDone >= cap &&
        !checked);
  }

  cb.addEventListener("change", () => {
    if (isRole && cb.checked) {
      const roleDoneNow =
        getCurrentRoleDone();
      let totalNow = 0;
      ROLES.forEach((role) => {
        const diff =
          state.roleDifficulty[role];
        const items =
          (state.data.roles[role] &&
            state.data.roles[role][
              diff
            ]) ||
          [];
        totalNow += items.filter(
          (rch) =>
            !state.skipped[rch.id]
        ).length;
      });
      const capNow = Math.min(
        9,
        totalNow || 9
      );
      if (
        roleDoneNow >= capNow &&
        !checked
      ) {
        cb.checked = false;
        return;
      }
    }

    state.completed[ch.id] =
      cb.checked || undefined;
    if (!cb.checked)
      delete state.completed[ch.id];
    saveCompleted();
    updateSummary();
    if (isRole) {
      renderRoles();
      applyAutoCollapse(ch.id);
    } else {
      applyAutoCollapse();
    }
  });

  const goalText = formatGoal(
    ch.displayType,
    ch.desiredGoal
  );

  const textDiv = el(
    "div",
    { class: "text" },
    [
      el("span", {
        class: "goal",
        text: goalText
          ? goalText + " "
          : "",
      }),
      el("span", {
        class: "desc",
        text: ch.text,
      }),
    ]
  );

  const row = el(
    "div",
    {
      class: "challenge",
    },
    [cb, textDiv]
  );

  if (isSkipped)
    row.classList.add("skipped");

  // Click on text to toggle skip/strike-through
  textDiv.addEventListener(
    "click",
    (e) => {
      e.preventDefault();
      const currentlySkipped =
        !!state.skipped[ch.id];
      if (currentlySkipped) {
        delete state.skipped[ch.id];
        row.classList.remove("skipped");
      } else {
        state.skipped[ch.id] = true;
        row.classList.add("skipped");
        if (
          isRole &&
          state.completed[ch.id]
        ) {
          delete state.completed[ch.id];
          saveCompleted();
          cb.checked = false;
        }
        if (isRole) {
          cb.disabled = true;
        }
      }
      saveSkipped();
      updateSummary();
      if (isRole) {
        renderRoles();
        applyAutoCollapse(ch.id);
      } else {
        applyAutoCollapse();
      }
    }
  );

  // Right-click still works as before for backwards compatibility
  row.addEventListener(
    "contextmenu",
    (e) => {
      e.preventDefault();
      const currentlySkipped =
        !!state.skipped[ch.id];
      if (currentlySkipped) {
        delete state.skipped[ch.id];
        row.classList.remove("skipped");
      } else {
        state.skipped[ch.id] = true;
        row.classList.add("skipped");
        if (
          isRole &&
          state.completed[ch.id]
        ) {
          delete state.completed[ch.id];
          saveCompleted();
          cb.checked = false;
        }
        if (isRole) {
          cb.disabled = true;
        }
      }
      saveSkipped();
      updateSummary();
      if (isRole) {
        renderRoles();
        applyAutoCollapse(ch.id);
      } else {
        applyAutoCollapse();
      }
    }
  );

  return row;
}

export function renderGeneral() {
  const container =
    document.getElementById(
      "general-list"
    );
  container.innerHTML = "";
  sortByText(
    state.data.general
  ).forEach((ch) =>
    container.appendChild(
      renderChallengeRow(ch)
    )
  );
}

export function renderRoleControls() {
  const container =
    document.getElementById(
      "role-controls"
    );
  container.innerHTML = "";
  ROLES.forEach((role) => {
    const select = el(
      "select",
      {
        id: `sel-${role}`,
        title: `Select rank tier for ${roleDisplayName(
          role
        )}`,
      },
      DIFFICULTIES.map((d) => {
        const opt = el("option", {
          value: d,
          text: DIFF_LABELS[d] || d,
        });
        if (
          state.roleDifficulty[role] ===
          d
        )
          opt.selected = true;
        return opt;
      })
    );
    select.addEventListener(
      "change",
      (e) => {
        state.roleDifficulty[role] =
          e.target.value;
        saveRoleDifficulty(
          role,
          e.target.value
        );
        renderRoles();
        updateSummary();
      }
    );

    const block = el(
      "div",
      { class: "role-select" },
      [
        el("img", {
          class: "role-icon",
          src: roleIconSrc(role),
          alt: `${roleDisplayName(
            role
          )} icon`,
          width: 16,
          height: 16,
        }),
        el("span", {
          text: roleDisplayName(role),
        }),
        select,
      ]
    );
    container.appendChild(block);
  });
}

export function renderRoles() {
  const grid =
    document.getElementById("roles");

  // Preserve the open/closed state of each role card before re-rendering
  const roleStates = {};
  grid
    .querySelectorAll(
      ".role-card details"
    )
    .forEach((details) => {
      const summaryText =
        details.querySelector(
          "summary span"
        )?.textContent || "";
      // Extract role name from text like "Naturalist (hard)"
      const roleName = summaryText
        .split("(")[0]
        .trim();
      roleStates[roleName] =
        details.hasAttribute("open");
    });

  grid.innerHTML = "";
  ROLES.forEach((role) => {
    const diff =
      state.roleDifficulty[role];
    if (diff === "none") return;

    const list = sortByText(
      state.data.roles[role][diff] || []
    );

    // Determine if this role card should be open
    // Default to true for first render, otherwise use preserved state
    const roleName =
      roleDisplayName(role);
    const shouldBeOpen =
      roleStates[roleName] !== undefined
        ? roleStates[roleName]
        : true;

    const detailsAttrs = shouldBeOpen
      ? { open: true }
      : {};

    const card = el(
      "div",
      { class: "role-card" },
      [
        el("details", detailsAttrs, [
          el(
            "summary",
            { class: "role-summary" },
            [
              el("img", {
                class: "role-icon",
                src: roleIconSrc(role),
                alt: `${roleName} icon`,
                width: 18,
                height: 18,
              }),
              el("span", {
                text: `${roleName} (${
                  DIFF_LABELS[diff] ||
                  diff
                })`,
              }),
            ]
          ),
          list.length
            ? el(
                "div",
                { class: "list" },
                list.map((ch) =>
                  renderChallengeRow(ch)
                )
              )
            : el("div", {
                class: "hint",
                text: "No challenges",
              }),
        ]),
      ]
    );
    grid.appendChild(card);
  });
}

export function render() {
  document.getElementById(
    "daily-date"
  ).textContent = state.dateKey;
  renderGeneral();
  renderRoleControls();
  renderRoles();
  updateSummary();
  applyAutoCollapse();
}

export function setBadge(
  el,
  kind,
  text
) {
  el.classList.remove(
    "ok",
    "warn",
    "fail"
  );
  el.classList.add(kind);
  el.textContent = text;
}

export function updateSummary() {
  // General (exclude skipped)
  const gUnskipped =
    state.data.general.filter(
      (ch) => !state.skipped[ch.id]
    );
  const gDone = gUnskipped.filter(
    (ch) => state.completed[ch.id]
  ).length;
  const gTotal = gUnskipped.length;
  const generalCountEl =
    document.getElementById(
      "general-count"
    );
  if (generalCountEl)
    generalCountEl.textContent = `${gDone}/${gTotal}`;
  const generalBadge =
    document.getElementById(
      "general-done"
    );
  const gRequired = Math.min(7, gTotal);
  const gComplete = gDone >= gRequired;
  if (generalBadge) {
    setBadge(
      generalBadge,
      gComplete ? "ok" : "fail",
      gComplete
        ? "Complete"
        : "Not done"
    );
  }

  // Roles
  let rList = [];
  ROLES.forEach((role) => {
    const diff =
      state.roleDifficulty[role];
    if (diff === "none") return;
    const items =
      (state.data.roles[role] &&
        state.data.roles[role][diff]) ||
      [];
    rList = rList.concat(
      items.filter(
        (ch) => !state.skipped[ch.id]
      )
    );
  });
  const rDone = rList.filter(
    (ch) => state.completed[ch.id]
  ).length;
  const rAvailable = Math.min(
    rList.length,
    9
  );
  const roleCountEl =
    document.getElementById(
      "role-count"
    );
  if (roleCountEl)
    roleCountEl.textContent = `${Math.min(
      rDone,
      rAvailable
    )}/${rAvailable}`;

  const need = rAvailable;
  const roleBadge =
    document.getElementById(
      "role-badge"
    );
  if (roleBadge) {
    setBadge(
      roleBadge,
      rDone >= need
        ? "ok"
        : rDone > 0
        ? "warn"
        : "fail",
      rDone >= need
        ? "done"
        : `${Math.max(
            need - rDone,
            0
          )} to go`
    );
  }
}

export function applyAutoCollapse(
  interactedChallengeId = null
) {
  if (!state.autoCollapse) return;

  const generalSection =
    document.querySelector(
      ".section--general details"
    );
  if (generalSection) {
    const gUnskipped =
      state.data.general.filter(
        (ch) => !state.skipped[ch.id]
      );
    const gDone = gUnskipped.filter(
      (ch) => state.completed[ch.id]
    ).length;
    const gRequired = Math.min(
      7,
      gUnskipped.length
    );
    if (
      gDone >= gRequired &&
      gUnskipped.length > 0
    ) {
      generalSection.removeAttribute(
        "open"
      );
    }
  }

  // Collapse individual role cards when all their tasks are done
  // But only collapse the card that was just interacted with, or cards that are already closed
  let allRoleCardsCompleted = true;
  const roleCards =
    document.querySelectorAll(
      ".role-card details"
    );

  // Find which role the interacted challenge belongs to
  let interactedRole = null;
  if (interactedChallengeId) {
    ROLES.forEach((role) => {
      const diff =
        state.roleDifficulty[role];
      if (diff === "none") return;
      const items =
        state.data.roles[role][diff] ||
        [];
      if (
        items.some(
          (ch) =>
            ch.id ===
            interactedChallengeId
        )
      ) {
        interactedRole = role;
      }
    });
  }

  roleCards.forEach((roleDetails) => {
    const roleCard =
      roleDetails.closest(".role-card");
    const challenges = Array.from(
      roleCard.querySelectorAll(
        ".challenge"
      )
    );

    if (challenges.length === 0) {
      // Empty role card doesn't count as incomplete
      return;
    }

    // Check if all non-skipped challenges in this role are completed
    const allCompleted =
      challenges.every(
        (challengeEl) => {
          const checkbox =
            challengeEl.querySelector(
              'input[type="checkbox"]'
            );
          const isSkipped =
            challengeEl.classList.contains(
              "skipped"
            );
          return (
            isSkipped ||
            (checkbox &&
              checkbox.checked)
          );
        }
      );

    if (allCompleted) {
      // Get the role name from the summary text
      const summaryText =
        roleDetails.querySelector(
          "summary span"
        )?.textContent || "";
      const isInteractedCard =
        interactedRole &&
        summaryText
          .toLowerCase()
          .includes(
            interactedRole.toLowerCase()
          );

      // Only collapse if:
      // 1. This is the card being interacted with, OR
      // 2. The card was already closed (not manually opened by user)
      const isOpen =
        roleDetails.hasAttribute(
          "open"
        );

      if (isInteractedCard || !isOpen) {
        roleDetails.removeAttribute(
          "open"
        );
      }
    } else {
      allRoleCardsCompleted = false;
    }
  });

  // Collapse the main Role Dailies section if all role cards are completed
  const rolesSection =
    document.querySelector(
      ".section--roles details"
    );
  if (
    rolesSection &&
    roleCards.length > 0
  ) {
    // Check if 9 role dailies are completed
    let rList = [];
    ROLES.forEach((role) => {
      const diff =
        state.roleDifficulty[role];
      if (diff === "none") return;
      const items =
        (state.data.roles[role] &&
          state.data.roles[role][
            diff
          ]) ||
        [];
      rList = rList.concat(
        items.filter(
          (ch) => !state.skipped[ch.id]
        )
      );
    });
    const rDone = rList.filter(
      (ch) => state.completed[ch.id]
    ).length;
    const rAvailable = Math.min(
      rList.length,
      9
    );

    // Collapse if all cards completed OR all available (capped at 9) are done
    if (
      allRoleCardsCompleted ||
      rDone >= rAvailable
    ) {
      rolesSection.removeAttribute(
        "open"
      );
    }
  }
}
