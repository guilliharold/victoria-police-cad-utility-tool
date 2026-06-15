# Victoria Police CAD Tool

A web-based tool for generating semi-realistic Victoria Police CAD lineups for use in [MissionChief](https://www.missionchief-australia.com/) and similar emergency services simulation games. Built to reflect real Victoria Police operational structure, callsign numbering conventions, and station hierarchy.

Hosted on GitHub Pages — no server, no login, no installation required.

---

## Table of Contents

1. [Repository Structure](#repository-structure)
2. [How to Use the Tool](#how-to-use-the-tool)
3. [Station Classifications](#station-classifications)
4. [Callsign Number Logic](#callsign-number-logic)
5. [Available Services](#available-services)
6. [Hosting on GitHub Pages](#hosting-on-github-pages)
7. [Managing Stations](#managing-stations)
8. [Making Changes to the Tool](#making-changes-to-the-tool)
9. [Disclaimer](#disclaimer)

---

## Repository Structure

```
index.html       Page structure — HTML only, no logic
style.css        All visual styling
data.js          Static data: station template, service definitions, unit pool builders, default counts
app.js           Runtime logic: CSV loading, step navigation, generation, rendering, export
stations.csv     Station database — the main file you will edit regularly
README.md        This file
LICENSE          Project licence
```

The tool loads `stations.csv` automatically on startup. If the CSV is missing or unavailable (e.g. when running locally by double-clicking `index.html`), it falls back to the placeholder station template built into `data.js` so the tool still opens without errors.

---

## How to Use the Tool

The tool runs as a three-step wizard.

### Step 1 — Station

Select your **Region**, then **Division**, then **Station** from the cascading dropdowns. These are populated from `stations.csv` at load time.

Once a station is selected, the **Station Classification** card appears. This is pre-filled from the CSV but can be overridden here before generating. See [Station Classifications](#station-classifications) for a full description of each type.

The **Supervisor Required** toggle controls whether Command & Supervision units are included in the output. Set to *No* for a unit-only lineup with no supervision entries.

### Step 2 — Services

Tick the unit types you want to include at this station. Each service type occupies one tile in the grid. Ticking a service includes it in the generated lineup.

For **Highway Patrol** and **State Highway Patrol**, a sub-panel slides open beneath the relevant tile when selected. This contains an option to include solo motorcycle units. Solo motorcycles are off by default — they are uncommon relative to patrol cars and are added only when you specifically opt in.

Command & Supervision units are added automatically based on the station classification — you do not need to select them separately. If HWP or State Highway Patrol is selected and Supervisor Required is Yes, the relevant highway patrol supervisors are also added to the Command & Supervision block.

### Step 3 — Lineup

The generated output shows all units grouped by service type. Each entry displays a callsign and a description of the unit's role.

**Callsign numbers vary on each generation** within the valid ranges for each service. This reflects the flexibility Victoria Police allows in unit numbering and means no two lineups look identical.

#### Adjusting Unit Counts

Each scalable service (Station Cars, Divisional Vans, Highway Patrol, State Highway Patrol, CIU, PORT, RRU) has a **unit count slider**. Drag it to increase or decrease the number of units shown.

The slider always maintains a balanced spread across morning (0700), afternoon (1500), and night (2300) shifts. For Highway Patrol and State Highway Patrol, reducing the count keeps the 3-marked-to-1-unmarked ratio intact at any value.

#### Station Support Links

If PSA, HWP, and CIU codes are populated for the selected station in `stations.csv`, a Station Support Links card appears in the output showing the full station name and code for each.

#### Exporting

A formatted plain-text export appears at the bottom of the output. Click **Copy to Clipboard** to copy it to your clipboard for pasting into MissionChief or any notes application. The export updates live as you adjust sliders.

---

## Station Classifications

Classifications control the default number of units generated per service and the supervision structure applied. They are set in `stations.csv` and can be overridden in Step 1 before generating.

### Metropolitan (24 Hours) — `metro_24`

Metropolitan police stations providing continuous 24/7 operational policing coverage within high-density urban areas. These stations support rapid response capability, manage high call volumes, and typically service large suburban populations. They function as core nodes within the metropolitan policing network and often coordinate with nearby stations for incident response and specialist tasking.

**Examples:** Box Hill, Dandenong, Melbourne West, Sunshine, Werribee

**Supervision:** 250 (Station SGT), 251, 252 (District Patrol SGT), 260 (Senior SGT), 265 (Div Supervisor S/SGT), 100 (Superintendent)

---

### Metropolitan (Non-24 Hours) — `metro_non24`

Metropolitan or inner-urban stations that maintain ongoing policing coverage through patrol structures but do not provide continuous 24-hour public counter or on-site station staffing. Operational response is maintained 24/7 via nearby hub stations or patrol units.

**Examples:** Brunswick, Epping, Mornington, Rowville, Springvale

**Supervision:** 250 (Station SGT), 251 (District Patrol SGT — single unit, subject to staffing)

---

### Regional (24 Hours) — `regional_24`

Regional police stations providing continuous 24/7 operational coverage across large geographic areas outside metropolitan Melbourne. These stations act as key regional hubs, often supporting surrounding smaller towns and rural communities.

**Examples:** Bendigo, Geelong, Morwell, Swan Hill, Warragul

**Supervision:** 250 (Station SGT), 251, 252 (District Patrol SGT), 260 (Senior SGT), 265 (Div Supervisor S/SGT), 100 (Superintendent)

---

### Regional (Non-24 Hours) — `regional_non24`

Regional or rural stations that maintain policing coverage through mobile patrols and nearby hub stations but do not operate a full-time staffed station or 24-hour public counter.

**Examples:** Bright, Echuca, Horsham, Portland, Yarrawonga

**Supervision:** 250 (Station SGT), 251 (District Patrol SGT — single unit, subject to staffing)

---

### Regional (Single Member) — `regional_single`

Small single-officer stations providing a local policing presence in rural communities. Typically one officer operating one vehicle — either a station car or divisional van. Operational response is coordinated from the nearest regional hub.

**Examples:** Dookie, Elmore, Katamatite, Sea Lake, Tungamah

**Supervision:** 251 only (no on-site Station SGT)

---

## Callsign Number Logic

### Station Code Format

Every callsign starts with the station code — a 2–5 character prefix built from a region letter and a station abbreviation.

```
[Region letter] + [Station abbreviation]

N = North West Metro     S = Southern Metro
E = Eastern              W = Western

Examples:
  E + SP  →  ESP    Shepparton
  W + GL  →  WGL    Geelong
  N + MN  →  NMN    Melbourne North
  S + FK  →  SFK    Frankston
```

### Number Ranges by Unit Type

```
100           Superintendent
200–299       Station Cars
250           Station Sergeant
251           District Patrol Supervisor (SGT)
252           District Patrol Supervisor (SGT)
260           Senior Sergeant
265           Divisional Supervisor (S/SGT)
290–292       PACER / MHaP
300–399       Divisional Vans
440–449       RRU
450–499       SOCIT / FVIU
500–599       CIU
600–609       HWP / TRF Solo Motorcycle
610–629       HWP / TRF Marked Patrol Car
630–639       HWP / TRF Q Car (unmarked)
650–659       HWP / TRF Sergeant
660–669       HWP / TRF Senior Sergeant
700–799       District Support Services
800–899       Mounted Branch
900–929       Fixed base stations
CAN           Dog Squad (prefix, not station-based)
POR           PORT (prefix, not station-based)
RES           Search & Rescue
SCY           Special Operations Group (SOG)
CIR           Critical Incident Response Team (CIRT)
TRF           State Highway Patrol
ROA           Heavy Vehicle Unit
MOU           Mounted Branch
REG           SOCIT (regional prefix)
POLAIR        Air Wing
```

### Shift Number Convention

For Station Cars and Divisional Vans, the trailing digit indicates shift start time:

```
x07  →  Morning shift    (0700)   e.g. ESP207, ESP307
x03  →  Afternoon shift  (1500)   e.g. ESP203, ESP303
x11  →  Night shift      (2300)   e.g. ESP211, ESP311
```

Additional units on the same shift increment outward from those bases.

### Highway Patrol Unmarked Ratio

Both local HWP and State Highway Patrol (TRF) pools follow a strict pattern — every third unit is a Q Car (unmarked). At any slider count you get approximately one unmarked car for every two marked cars.

---

## Available Services

| Service | Prefix | Number Range | Notes |
|---|---|---|---|
| Station Cars | Station code | 200–299 | General duties sedans |
| Divisional Vans | Station code | 300–399 | Cage vans, typically crewed by 2 officers |
| Highway Patrol | Station code | 600–669 | Marked cars, Q cars, optional solo motorcycle |
| State Highway Patrol | TRF | 600–669 | Marked cars, Q cars, optional solo motorcycle |
| PORT | POR | 600–899 | Public Order Response Team — not station-specific |
| CIU | Station code | 500–599 | Criminal Investigation Unit |
| FVIU | Station code | 480–499 | Family Violence Investigation Unit — day/afternoon only |
| SOCIT | REG | 450–499 | Sexual Offences & Child Investigations — regional asset |
| RRU | Station code | 440–449 | Regional Response Unit |
| Dog Squad | CAN | — | Canine units — prefix independent of station code |
| Search & Rescue | RES | 400–459 | Missing persons, bush, maritime — often callout-based |
| SOG | SCY | 200+ | Special Operations Group — state-wide asset |
| CIRT | CIR | 200–899 | Critical Incident Response Team — region-wide asset |
| Air Wing | POLAIR | — | Helicopters (POLAIR30–32) and fixed wing (POLAIR35) |
| Heavy Vehicle Unit | ROA | 501–505 | Heavy vehicle compliance and enforcement |
| Mounted Branch | MOU | 800–899 | High-visibility patrol and crowd control |

Command & Supervision (250, 251, 252, 260, 265, 100) are added automatically when *Supervisor Required* is set to *Yes*.

---

## Hosting on GitHub Pages

1. Create a new GitHub repository
2. Upload all six files to the repository root: `index.html`, `style.css`, `data.js`, `app.js`, `stations.csv`, `README.md`
3. Go to **Settings → Pages**
4. Under **Source**, select `Deploy from a branch`
5. Set branch to `main`, folder to `/ (root)`, then click **Save**
6. Your tool will be live at `https://yourusername.github.io/repo-name` within about 60 seconds

All six files must be in the same folder. The tool fetches `stations.csv` relative to `index.html`, and `index.html` loads `data.js` and `app.js` from the same directory.

To update anything after deploying, edit the relevant file directly in GitHub's web editor and commit — no local tools or build steps are required.

---

## Managing Stations

All station data lives in `stations.csv`. This is the file you will edit most often.

### Column Reference

| Column | Required | Description | Example |
|---|---|---|---|
| `code` | Yes | Station callsign prefix — uppercase, 2–5 characters | `ESP` |
| `name` | Yes | Station display name — do not include "Police Station" | `Shepparton` |
| `region` | Yes | Single region letter: `N`, `S`, `E`, or `W` | `E` |
| `region_label` | Yes | Full region name shown in the dropdown | `Eastern` |
| `division` | Yes | Division name — stations with the same value are grouped | `Goulburn Valley (ED3)` |
| `div_code` | No | Short division reference code, internal only | `ED3` |
| `psa` | No | Code of the Police Service Area covering this station | `ESP` |
| `hwp` | No | Code of the Highway Patrol unit servicing this station | `ESP` |
| `ciu` | No | Code of the CIU servicing this station | `ESP` |
| `classification` | Yes | Station type — see values below | `regional_24` |

**Valid classification values:**

| Value | Meaning |
|---|---|
| `metro_24` | Metropolitan, 24-hour continuous coverage |
| `metro_non24` | Metropolitan, non-24-hour public counter |
| `regional_24` | Regional, 24-hour continuous coverage |
| `regional_non24` | Regional, non-24-hour public counter |
| `regional_single` | Regional, single member station |

**Rules:**
- Lines beginning with `#` are comments and are ignored
- Leave optional fields blank rather than writing `N/A` — just keep the comma
- Stations appear in the dropdown in the order they appear in the file
- The header row must remain exactly as written

### Adding a Station

```csv
# ── EASTERN — Goulburn Valley (ED3)
ESP,Shepparton,E,Eastern,Goulburn Valley (ED3),ED3,ESP,ESP,ESP,regional_24
EMO,Mooroopna,E,Eastern,Goulburn Valley (ED3),ED3,ESP,ESP,ESP,regional_non24
EKB,Kyabram,E,Eastern,Goulburn Valley (ED3),ED3,ESP,ESP,ESP,regional_non24
```

### Adding a New Division

Use a new value in the `division` column — the tool creates the dropdown group automatically:

```csv
EWA,Wangaratta,E,Eastern,Wangaratta (ED4),ED4,EWA,EWA,EWA,regional_24
EBN,Benalla,E,Eastern,Wangaratta (ED4),ED4,EWA,EWA,EWA,regional_non24
```

### Adding a New Region

**Step 1** — Use a new single-letter key in the `region` column of `stations.csv`:

```csv
CBG,Castlemaine,C,Central,Loddon Campaspe,LC,CBG,CBG,CBG,regional_24
```

**Step 2** — Add a matching `<option>` to the Region dropdown in `index.html`. Find `id="selRegion"` and add:

```html
<option value="C">Central</option>
```

The `value` must exactly match the letter used in `stations.csv`.

### Quick Checklist

- [ ] Every data row has exactly **9 commas** (10 fields)
- [ ] `region` is a single uppercase letter matching a known region key
- [ ] `classification` is one of the five valid values, spelled exactly as shown
- [ ] The header row is unchanged
- [ ] After uploading, reload the tool and confirm the station appears correctly

---

## Making Changes to the Tool

| What you want to change | File to edit | Where |
|---|---|---|
| Add or update stations | `stations.csv` | Any data row |
| Default unit counts per classification | `data.js` | `DEFAULTS` object |
| Maximum slider count per service | `data.js` | `MAX_UNITS` object |
| Add a new service type | `data.js` + `app.js` | `SERVICES` array + `buildOutput` fixed-services section |
| Change unit pool numbers | `data.js` | Relevant `build*Pool` function |
| Adjust colours, fonts, spacing | `style.css` | Relevant section (numbered 1–19) |
| Add a new region to the dropdown | `index.html` | `id="selRegion"` select element |
| Change generation or rendering logic | `app.js` | Relevant function |

### Adjusting Default Unit Counts

Open `data.js` and edit the `DEFAULTS` object:

```javascript
const DEFAULTS = {
  metro_24:       { cars: 12, vans: 6, hwp: 10, trf: 10, ciu: 10, rru: 5 },
  metro_non24:    { cars: 7,  vans: 3, hwp: 5,  trf: 5,  ciu: 5,  rru: 3 },
  regional_24:    { cars: 9,  vans: 4, hwp: 7,  trf: 6,  ciu: 7,  rru: 4 },
  regional_non24: { cars: 3,  vans: 2, hwp: 2,  trf: 2,  ciu: 2,  rru: 2 },
  regional_single:{ cars: 1,  vans: 1, hwp: 1,  trf: 1,  ciu: 1,  rru: 1 },
};
```

If you raise a value above the corresponding `MAX_UNITS` entry, raise `MAX_UNITS` to match so the slider can reach it.

### Adding a New Service Type

**1.** Add an entry to `SERVICES` in `data.js`:

```javascript
{ id: 'myunit', icon: '🚔', name: 'My Unit', desc: 'Short description.' },
```

**2.** Add a generation block in `app.js` inside the `buildOutput` function, following the pattern of existing fixed-size services:

```javascript
if (S.selected.has('myunit')) sections.push({
  id: 'myunit', icon: '🚔', name: 'My Unit', pool: null,
  units: [
    { cs: c + '700', desc: 'My Unit — Morning shift',   shifts: ['MS'] },
    { cs: c + '701', desc: 'My Unit — Afternoon shift', shifts: ['AS'] },
  ],
  note: 'Brief note about callsign range and role.',
});
```

For scalable services with a slider, add the entry to the `svcDefs` array instead and add a corresponding entry to both `DEFAULTS` and `MAX_UNITS` in `data.js`.

---

## Disclaimer

This tool is built for simulation and enthusiast purposes only. It is not affiliated with, endorsed by, or connected to Victoria Police or any government agency. All callsign conventions and operational structures are based on publicly available information and are used for recreational simulation purposes only.
