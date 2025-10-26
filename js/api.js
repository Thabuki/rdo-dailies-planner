// API module - handles fetching and shaping dailies data
export const API_URL =
  "https://pepegapi.jeanropke.net/v3/rdo/dailies";

export const ROLES = [
  "bounty_hunter",
  "trader",
  "collector",
  "moonshiner",
  "naturalist",
];

export const DIFFICULTIES = [
  "none",
  "easy",
  "med",
  "hard",
];

export async function fetchDailies() {
  const res = await fetch(API_URL, {
    cache: "no-store",
  });
  if (!res.ok)
    throw new Error(
      `Failed to load dailies (${res.status})`
    );
  const json = await res.json();
  return json;
}

function normalizeChallenge(
  ch,
  categoryType,
  role
) {
  const id = ch.id;
  const desiredGoal = Number.isFinite(
    ch.desiredGoal
  )
    ? ch.desiredGoal
    : 1;
  const displayType =
    ch.displayType || "DISPLAY_DEFAULT";
  const text =
    (ch.description &&
      (ch.description.localized ||
        ch.description
          .localizedFull)) ||
    id;
  return {
    id,
    text,
    desiredGoal,
    displayType,
    categoryType,
    role,
  };
}

export function shapeData(raw) {
  // Expected structure:
  // raw = { date: 'YYYY-MM-DD', data: { general: {...}, easy: [...], med: [...], hard: [...] } }
  const shaped = {
    date: raw.date,
    general: [],
    roles: {},
  };

  // Initialize roles containers
  ROLES.forEach((r) => {
    shaped.roles[r] = {
      easy: [],
      med: [],
      hard: [],
    };
  });

  // Parse general challenges
  if (
    raw.data &&
    raw.data.general &&
    raw.data.general.challenges
  ) {
    shaped.general =
      raw.data.general.challenges.map(
        (ch) =>
          normalizeChallenge(
            ch,
            "general",
            null
          )
      );
  }

  // Parse role challenges by difficulty
  ["easy", "med", "hard"].forEach(
    (diff) => {
      if (
        raw.data &&
        Array.isArray(raw.data[diff])
      ) {
        raw.data[diff].forEach(
          (roleObj) => {
            // Each roleObj has role property and challenges array
            const roleName =
              roleObj.role
                ? roleObj.role
                    .toLowerCase()
                    .replace(
                      "character_rank_",
                      ""
                    )
                : null;
            if (
              roleName &&
              ROLES.includes(
                roleName
              ) &&
              Array.isArray(
                roleObj.challenges
              )
            ) {
              roleObj.challenges.forEach(
                (ch) => {
                  shaped.roles[
                    roleName
                  ][diff].push(
                    normalizeChallenge(
                      ch,
                      diff,
                      roleName
                    )
                  );
                }
              );
            }
          }
        );
      }
    }
  );

  return shaped;
}
