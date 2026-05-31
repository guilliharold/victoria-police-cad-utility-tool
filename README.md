# VicPol CAD Lineup Generator

A single-page web tool for generating realistic Victoria Police CAD radio lineups for use in MissionChief and similar simulation games. Built to reflect real VicPol operational structure, callsign numbering conventions, and station hierarchy.

Hosted on GitHub Pages — no server, no login, no install required.

---

## What This Tool Does

The generator walks you through three steps to produce a suggested vehicle lineup for any police station in Victoria:

1. **Select a station** — choose a region, division, and station from the dropdown menus
2. **Select services** — tick which unit types operate from that station (e.g. Station Cars, Highway Patrol, CIU, Dog Squad)
3. **Generate and adjust** — the tool produces a recommended lineup across all three shifts, with sliders on each service block so you can fine-tune the number of units up or down

The output shows every unit's callsign, its role description, and which shift it belongs to (morning, afternoon, night, or fixed/always-on). A formatted export can be copied to clipboard for pasting into MissionChief or any notes app.

---

## How to Use It

### Step 1 — Station

Select your **Region**, then **Division**, then **Station** from the cascading dropdowns.

Once a station is selected, a **Station Classification** card appears. Set this to match the station's real-world role:

| Classification | When to use |
|---|---|
| Small / Outer Station | Small rural or remote stations with limited resources |
| General Suburban | Standard metro or regional suburban stations |
| Divisional HQ | The primary station for a division — adds Senior SGT, Div Supervisor |
| Regional HQ | The headquarters station for a full region — adds Superintendent, Duty Officer |

Classification affects the default number of units generated for each service — a Regional HQ will produce more cars and CIU units than a small outer station.

### Step 2 — Services

Tick any combination of the available service types. You can select as many or as few as you like.

| Service | Callsign Range | Notes |
|---|---|---|
| Station Cars | 200–299 | General duties sedans |
| Divisional Vans | 300–399 | Cage vans, typically 2UP |
| Highway Patrol | 600–699 | Cars, motorcycles, Q cars, supervisors |
| PORT / District Support | 700–799 | Foot patrol, events, licensing, bicycle, guards |
| CIU | 500–599 | Criminal Investigation Unit |
| FVIU | 480–499 | Family Violence Investigation Unit |
| SOCIT | 450–499 | Sexual Offences & Child Investigations (REG prefix) |
| Crime Desk (CRI) | 570–579 | Scene examination and forensics (CRI prefix) |
| RRU | 440–449 | Regional Response Unit |
| Dog Squad | CAN prefix | Canine units |
| PACER / MHaP | 290–292 | Mental health co-response |
| Search & Rescue | RES prefix | Missing persons, bush, maritime |
| Transit Police | TST prefix | Public transport policing |
| SOG / CIRT | SCY / CIR prefix | Special Operations / Critical Incident Response |
| POLAIR | POLAIR prefix | Air wing — helicopters and fixed wing |
| Heavy Vehicle Unit | ROA prefix | Heavy vehicle compliance |
| Mounted Branch | MOU prefix | Mounted unit, 800–899 |

Command and Supervision units (Station SGT, District Patrol SGT) are always added automatically — you don't need to select them.

### Step 3 — Lineup

The generated lineup shows all units grouped by service. Each unit displays:

- **Callsign** — e.g. `ESP311`
- **Description** — role and shift
- **Shift tag** — `MS` (0700), `AS` (1500), `NS` (2300), or `FIXED` (base/always-on)

**Callsign numbers are randomised on each generation** within the valid range for each shift, so running the generator twice on the same station will produce a different but equally valid set of numbers.

#### Adjusting Unit Counts

Each scalable service block (Station Cars, Vans, HWP, CIU, PORT, RRU) has a **unit count slider**. Drag it left to reduce or right to increase the number of units shown. The slider always maintains a balanced spread across morning, afternoon, and night shifts — reducing from 9 cars to 3 will give you one of each shift, not three morning units.

#### Exporting

At the bottom of the output page is a formatted text export. Click **Copy to Clipboard** and paste it wherever you need it. The export updates live as you adjust sliders.

---

## Callsign Number Logic

Victoria Police callsigns follow a structured numbering system. Understanding this helps when reviewing or tweaking generated lineups.

### Station Code

Every callsign starts with the station code — a 2–4 character prefix derived from the region letter and a short form of the station name.

```
Region letter + Station abbreviation

N  = North West Metro
S  = Southern Metro
E  = Eastern
W  = Western

Examples:
  Shepparton    → ESP   (Eastern + SP)
  Bendigo       → WBI   (Western + BI)
  Melbourne North → NMN (North + MN)
```

### Number Ranges by Unit Type

```
100       Superintendent
150       Duty Officer (Inspector) — region-wide
200–299   Station Cars (general duties sedans)
250       Station Sergeant
251–252   District Patrol Supervisor (SGT)
260       Senior Sergeant
265       Divisional Supervisor (S/SGT)
290–292   PACER / MHaP
300–399   Divisional Vans
440–449   Regional Response Unit (RRU)
450–499   SOCIT / FVIU
500–599   CIU
570–579   Crime Desk (CRI)
600–699   Highway Patrol
700–799   District Support Services / PORT
800–899   Mounted Branch
900–929   Fixed base stations
```

### Shift Number Convention

For Station Cars and Divisional Vans, the trailing digit indicates shift start time:

```
x07  →  Morning shift   (0700 start)
x03  →  Afternoon shift (1500 start)
x11  →  Night shift     (2300 start)
```

So `ESP207` is a Shepparton morning shift sedan, `ESP303` is an afternoon Div Van, and `ESP211` is a night shift sedan.

Additional units on the same shift increment outward from those bases (204, 208, 201 for morning; 206, 209, 202 for afternoon; 214, 217, 212 for night).

---

## Hosting on GitHub Pages

1. Create a new GitHub repository (or use an existing one)
2. Upload `index.html` (and optionally this `README.md`) to the repository root
3. Go to **Settings → Pages**
4. Under **Source**, select `Deploy from a branch`
5. Set branch to `main`, folder to `/ (root)`, then click **Save**
6. Your tool will be live at `https://yourusername.github.io/repo-name` within about 60 seconds

To update the tool after making changes, simply replace `index.html` in the repository. You can also edit it directly in GitHub's web editor without needing any software installed locally.

---

## Adding and Editing Stations

All station data is stored in a single block near the top of `index.html`. Open the file in any plain-text editor (Notepad, VS Code, Notepad++, TextEdit) and search for:

```
const REGION_DATA = {
```

Everything between that line and the matching closing `};` is the station database. Nothing else needs to be changed.

### Data Structure

Stations are organised into three levels:

```
Region  →  Division  →  Stations (array of strings)
```

### Station String Format

Each station is written as a single string with eight fields separated by the pipe character `|`:

```
'CODE|Name|DivCode|BackedBy|PSA|CIU|CRI|HWP'
```

| Position | Field | Description | Example |
|---|---|---|---|
| 1 | `CODE` | Station callsign prefix — uppercase, 2–5 characters | `ESP` |
| 2 | `Name` | Station display name | `Shepparton` |
| 3 | `DivCode` | Division code (internal reference only) | `GV` |
| 4 | `BackedBy` | Comma-separated codes of stations that back this one | `EMO,ECO` |
| 5 | `PSA` | Code of the Primary Support Area station | `ESP` |
| 6 | `CIU` | Code of the CIU that services this station | `ESP` |
| 7 | `CRI` | Code of the Crime Desk that services this station | `ESP` |
| 8 | `HWP` | Code of the HWP that services this station | `ESP` |

If a field is unknown or not applicable, **leave it blank but keep the pipe** so the field count stays at exactly 7 pipes (8 fields):

```
'EYW|Yarrawonga|GV||ESP|ESP|ESP|ESP'
                 ↑
         BackedBy is blank — pipe is still there
```

---

### Adding a New Station to an Existing Division

Find the relevant division array and add a new line. For example, adding **Kyabram** (`EKB`) to the Goulburn Valley division:

```javascript
'Goulburn Valley': [
  'ESP|Shepparton|GV||ESP|ESP|ESP|ESP',
  'EYW|Yarrawonga|GV||ESP|ESP|ESP|ESP',
  'EMO|Mooroopna|GV||ESP|ESP|ESP|ESP',
  'ENH|Nagambie|GV||ESP|ESP|ESP|ESP',
  'ECO|Cobram|GV||ESP|ESP|ESP|ESP',
  'EKB|Kyabram|GV||ESP|ESP|ESP|ESP',    ← add this line
],
```

Save the file and reload — Kyabram will appear in the Station dropdown when Goulburn Valley is selected.

---

### Adding a New Division to an Existing Region

Inside the relevant region's `divisions` object, add a new key and array. The key string is what appears in the Division dropdown.

```javascript
'Ovens & Murray': [
  'EWA|Wangaratta|OM||EWA|EWA|EWA|EWA',
  'EBN|Benalla|OM||EWA|EWA|EWA|EWA',
  'EMY|Myrtleford|OM||EWA|EWA|EWA|EWA',
],
```

You can include a division code in the key if you want it shown in the dropdown:
`'Ovens & Murray (E403)'` — it's just a display label.

---

### Adding a Whole New Region

This requires two small changes.

**1. Add the region data** inside `const REGION_DATA = { ... }`:

```javascript
C: {
  label: 'Central',
  divisions: {
    'Loddon Campaspe': [
      'CBG|Castlemaine|LC||CBG|CBG|CBG|CBG',
      'CMT|Maryborough|LC||CBG|CBG|CBG|CBG',
    ],
  }
},
```

**2. Add the dropdown option** in the HTML — search for `id="selRegion"` and add a new `<option>`:

```html
<select id="selRegion" onchange="onRegion()">
  <option value="">— Select —</option>
  <option value="N">North West Metro</option>
  <option value="S">Southern Metro</option>
  <option value="E">Eastern</option>
  <option value="W">Western</option>
  <option value="C">Central</option>    ← add this
</select>
```

The `value` attribute (`"C"`) must exactly match the key used in `REGION_DATA`.

---

### Editing an Existing Station

To change any field, just edit the relevant string in place. For example, correcting the PSA code for Warrandyte (field 5):

```javascript
// Before
'EWY|Warrandyte|E401|EDC|EMG|EMG|EBH|ENG',

// After
'EWY|Warrandyte|E401|EDC|EWH|EMG|EBH|ENG',
```

---

### Removing a Station

Delete the entire line, including the trailing comma.

---

### Quick Checklist Before Saving

- Each station string has exactly **7 pipe characters** (`|`), producing 8 fields
- The station code is **2–5 uppercase letters**
- Every line inside an array ends with a **comma** (`,`) — except the very last entry
- After saving, open `index.html` in a browser and verify the dropdowns populate correctly

---

## Disclaimer

This tool is built for simulation and enthusiast purposes only. It is not affiliated with, endorsed by, or connected to Victoria Police or any government agency.
