# RDO Dailies Planner

Track your Red Dead Online daily challenges with ease. Uses the [RDOMap](https://jeanropke.github.io/RDOMap/) API.

**Live Demo:** [https://thabuki.github.io/rdo-dailies-planner](https://thabuki.github.io/rdo-dailies-planner)

## Features

### Challenge Tracking

- **General Dailies:** Track up to 7 general challenges (requires 7 to complete)
- **Role Dailies:** Track up to 9 role-specific challenges across 5 roles
- **Smart Counters:** Displays x/available format based on active challenges

### Role Management

- **5 Roles:** Bounty Hunter, Trader, Collector, Moonshiner, Naturalist
- **Rank Tiers:** Select your rank for each role (Rank 0, Rank 1-4, Rank 5-14, Rank 15+)
- **Dynamic Challenges:** Role challenges adjust based on selected rank tier
- **Role Icons:** Visual icons for quick identification

### Interaction & UI

- **Click Checkbox:** Mark challenge as completed
- **Click Text:** Skip/unskip challenge (strikethrough)
- **Auto-Collapse:** Automatically collapse completed sections (optional)
- **Smart State:** Preserves manually opened/closed sections during updates

### Display Options

- **Compact Mode:** Reduced spacing for smaller screens
- **Lighter Theme:** Alternative color scheme
- **Mobile-Friendly:** Responsive layout optimized for touch interactions

### Data Management

- **Local Storage:** All progress saved locally in your browser
- **Daily Reset:** Automatically resets at 6 AM UTC (aligned with RDO reset time)
- **No Backend:** Privacy-focused, no data leaves your device

---

**API Source:** [https://pepegapi.jeanropke.net/v3/rdo/dailies](https://pepegapi.jeanropke.net/v3/rdo/dailies)
