# 🚔 Victoria Police CAD Tool

Generate semi-realistic Victoria Police CAD lineups for **MissionChief Australia** and other emergency services simulation games.

The tool replicates:

- 🚓 Victoria Police callsign structures
- 🏢 Station classifications and hierarchy
- 👮 Supervision chains
- 🚨 Operational unit types
- 🔢 Realistic callsign numbering logic

**No installation required.**

Hosted via GitHub Pages and runs entirely in your browser.

---

## ✨ Features

### 🚔 Realistic Unit Generation

Generate station-specific lineups using Victoria Police-inspired operational structures.

### 🏢 Station Hierarchy Support

Supports:

- Metropolitan (24 Hours)
- Metropolitan (Non-24 Hours)
- Regional (24 Hours)
- Regional (Non-24 Hours)
- Regional (Single Member)

### 🎛️ Adjustable Unit Counts

Use sliders to dynamically control:

- Station Cars
- Divisional Vans
- Highway Patrol
- State Highway Patrol
- CIU
- PORT
- RRU

### 👮 Automatic Supervision

Command and supervision units are automatically added based on station classification.

### 📋 Export Ready

Generate a clean text export suitable for:

- MissionChief Australia
- Notes applications
- Documentation
- Scenario planning

---

## 🚀 Quick Start

### 1️⃣ Select a Station

Choose:

- Region
- Division
- Station

The tool automatically loads station information from `stations.csv`.

### 2️⃣ Select Services

Choose the operational units you want included in the lineup.

Examples:

- 🚓 Station Cars
- 🚐 Divisional Vans
- 🚨 Highway Patrol
- 🔍 CIU
- 🐕 Dog Squad
- 🚁 Air Wing

### 3️⃣ Generate Lineup

The tool produces a complete CAD-style unit lineup with:

- Callsigns
- Shift allocations
- Service groupings
- Unit descriptions

---

## 🗂️ Repository Structure

| File | Purpose |
|--------|---------|
| `index.html` | User interface |
| `style.css` | Styling |
| `data.js` | Static data and defaults |
| `app.js` | Application logic |
| `stations.csv` | Station database |
| `README.md` | Documentation |
| `LICENSE` | Licence |

---

## 📊 Supported Services

| Service | Description |
|----------|-------------|
| 🚓 Station Cars | General duties patrol units |
| 🚐 Divisional Vans | Prisoner transport and response vans |
| 🚨 Highway Patrol | Traffic enforcement |
| 🚔 State Highway Patrol | Statewide traffic operations |
| 🔍 CIU | Criminal Investigation Unit |
| 👨‍👩‍👧 FVIU | Family Violence Investigation Unit |
| 🐕 Dog Squad | Canine operations |
| 🚁 Air Wing | Aviation support |
| 🛡️ PORT | Public Order Response Team |
| ⚡ SOG | Special Operations Group |
| 🎯 CIRT | Critical Incident Response Team |
| 🐎 Mounted Branch | Mounted operations |

---

## 💡 Why Use This Tool?

- Generates realistic Victoria Police-inspired CAD lineups
- Supports station-specific callsign structures
- Automatically applies supervision hierarchies
- Fully browser-based with no installation required
- Easily customised through CSV configuration files
- Ideal for MissionChief Australia players and emergency services enthusiasts

---

## ⚙️ How It Works

The tool operates as a simple three-step wizard:

### Step 1 — Select a Station

Choose a Region, Division, and Station from the dropdown menus.

The tool automatically loads station data from `stations.csv`.

### Step 2 — Select Services

Choose which operational services should be included in the generated lineup.

### Step 3 — Generate

The tool builds a realistic CAD-style unit list using:

- Station classification
- Selected services
- Callsign numbering rules
- Supervision requirements

Each generation randomises callsign allocations within valid ranges to ensure no two lineups are identical.

> [!NOTE]
> Callsign numbers vary between generations while remaining within the appropriate operational numbering ranges.

---

## 🛠️ Customisation

Most configuration changes can be made without editing any JavaScript.

### Modify Station Data

Edit:

```text
stations.csv
```

### Change Default Unit Counts

Edit:

```text
data.js
```

and update the `DEFAULTS` object.

### Adjust Styling

Edit:

```text
style.css
```

to customise:

- Colours
- Fonts
- Layout spacing
- Card appearance
- Responsive behaviour

> [!TIP]
> All station management is handled through `stations.csv`, making the tool easy to maintain and expand.

---

## 🌐 GitHub Pages Deployment

1. Create a new GitHub repository
2. Upload all project files to the repository root
3. Open **Settings → Pages**
4. Select **Deploy from a branch**
5. Choose:
   - Branch: `main`
   - Folder: `/ (root)`
6. Click **Save**

Your deployment should be available within approximately one minute.

---

## ⚠️ Important Notes

> [!WARNING]
> The `stations.csv` header row must remain unchanged.

> [!WARNING]
> Each station row must contain exactly 10 fields (9 commas).

> [!TIP]
> Lines beginning with `#` are treated as comments and ignored by the tool.

---

## 📜 Disclaimer

This project is intended for:

- Simulation
- Gaming
- Educational
- Enthusiast

purposes only.

It is **not affiliated with, endorsed by, or connected to Victoria Police or any government agency**.

All operational structures, callsigns, and conventions are based on publicly available information and are reproduced solely for recreational simulation use.
