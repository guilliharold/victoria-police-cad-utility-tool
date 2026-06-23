# Victoria Police CAD Lineup Generator

A browser-based tool for generating realistic Victoria Police CAD (Computer Aided Dispatch) callsign lineups. Dispatchers select a station, choose which services are on shift, and the tool produces a correctly-prefixed lineup with shuffled callsigns drawn from documented CAD number ranges.

---

## File Structure

```
index.html       — Page structure and step navigation shells
style.css        — All visual styling
data.js          — Station data, service definitions, pool builders, defaults
app.js           — Runtime logic: CSV loading, generation, rendering, export
stations.csv     — Station reference data (the only file you regularly edit)
README.md        — This file
```

**The only file you need to edit day-to-day is `stations.csv`.** The others only need touching when adding new services or changing how the tool works.

---

## How to Run

The tool runs entirely in the browser with no server or install required. Open `index.html` directly — Chrome and Edge both work. Firefox may block the CSV fetch when running from a local file; if stations don't load, run it through a simple local server or use Chrome/Edge.

---

## stations.csv — Adding and Updating Stations

This is your primary working file. Add one row per station as you encounter them in practice. Lines starting with `#` are ignored. The header row must stay exactly as written.

### Column reference

| Column | Required | Description |
|---|---|---|
| `code` | Yes | Station callsign prefix. Uppercase, 2–5 chars. e.g. `ESP`, `NMW` |
| `name` | Yes | Station display name. Do not include "Police Station" |
| `region` | Yes | Single letter: `N`, `S`, `E`, or `W` |
| `region_label` | Yes | Full region name e.g. `Eastern` |
| `division` | Yes | Division name shown in dropdown e.g. `Goulburn Valley (ED3)` |
| `div_code` | Yes | Short division code e.g. `ED3` |
| `psa` | No | PSA code covering this station e.g. `NML` |
| `psa_label` | No | Human-readable PSA name e.g. `Melbourne` |
| `hwp` | No | HWP prefix for this station e.g. `NML`, `EWT` |
| `hwp_label` | No | Human-readable HWP name e.g. `Melbourne`, `Wangaratta` |
| `ciu` | No | CIU code serving this station e.g. `NMW` |
| `ciu_label` | No | Human-readable CIU name e.g. `Moreland` |
| `services` | No | Space-separated list of allowed service IDs (blank = all allowed) |
| `classification` | Yes | Station type — see below |

### Classification values

| Value | Meaning |
|---|---|
| `metro_24` | Metropolitan, 24-hour continuous coverage |
| `metro_non24` | Metropolitan, non-24-hour public counter |
| `regional_24` | Regional, 24-hour hub station |
| `regional_non24` | Regional, non-24-hour coverage |
| `regional_single` | Regional, single officer station |

### Example row

```
ESP,Shepparton,E,Eastern,Goulburn Valley (ED3),ED3,ESP,Shepparton,ESP,Shepparton,ESP,Shepparton,cars vans hwp ciu fviu socit cri,regional_24
```

### HWP and CIU prefixes

The `hwp` column is used as the **callsign prefix** for Highway Patrol units generated for that station — not just a display label. Metro stations typically use a PSA code rather than their own station code:

- Melbourne West (`NMW`) → HWP prefix `NML` → generates `NML611`, `NML617` etc.
- Wangaratta (`EWT`) → HWP prefix `EWT` → generates `EWT611`, `EWT617` etc.

The same applies to `ciu` — the CIU column is used as the prefix for CIU callsigns (e.g. `NMW507`).

### Restricting services per station

The `services` column takes a space-separated list of service IDs. If set, any service not listed will be greyed out and unselectable when that station is chosen. Leave blank to allow all services.

Available service IDs:
```
cars  vans  hwp  trf  port  ciu  fviu  socit  rru  dog  sar  sog  cirt  hviu  mounted  cri
```

Solo motorcycle cards (`hwp_solo`, `trf_solo`) follow their parent automatically — if `hwp` is not in the list, `hwp_solo` is also unavailable.

### Tips

- Leave optional fields blank rather than writing `N/A` — just keep the comma.
- Stations appear in the dropdown in the order they appear in this file.
- Multiple stations in the same division are grouped together in the dropdown.
- TBC placeholder rows are ignored in the dropdown once real stations exist in that division.

---

## Updating Default Unit Counts

Default counts control how many units each service starts with when a lineup is generated, based on station classification. They live in `data.js` in the `DEFAULTS` object:

```javascript
const DEFAULTS = {
  metro_24:       { cars: 12, vans: 6, hwp: 10, ciu: 10, ... },
  metro_non24:    { cars: 7,  vans: 3, hwp: 5,  ciu: 5,  ... },
  regional_24:    { cars: 9,  vans: 4, hwp: 7,  ciu: 7,  ... },
  regional_non24: { cars: 3,  vans: 2, hwp: 2,  ciu: 2,  ... },
  regional_single:{ cars: 1,  vans: 1, hwp: 1,  ciu: 1,  ... },
};
```

Change any value here and it takes effect immediately on next generation. Users can always override with the sliders on the output page.

---

## Adding a New Service

Adding a new service type requires changes to both `data.js` and `app.js`.

### Step 1 — Add to SERVICES in data.js

```javascript
{ id: 'myservice', icon: '🔵', name: 'My Service', desc: 'Brief description. PREFIX prefix, range.' },
```

### Step 2 — Add a pool builder in data.js

Build the unit pool following the same pattern as existing builders. Tag units with their shift type — `MS`, `AS`, `NS`, `SUP` (supervisor — lifted to Command & Supervision), or `FIXED` (base station — always shown, not counted):

```javascript
function buildMyServicePool() {
  const units = shuffle([200, 201, 202].map(n => ({ cs: 'MYS' + n, desc: 'My Service Unit', shifts: ['MS', 'AS'] })));
  return [
    ...units,
    { cs: 'MYS250', desc: 'My Service Sergeant', shifts: ['SUP'] },
  ];
}
```

### Step 3 — Add to DEFAULTS and MAX_UNITS in data.js

```javascript
// In DEFAULTS, add to each classification row:
metro_24: { ..., myservice: 3 },

// In MAX_UNITS, add the total pool size:
const MAX_UNITS = { ..., myservice: 8 };
```

### Step 4 — Add a service section in app.js

In `buildOutput()`, after the existing specialist service blocks:

```javascript
if (S.selected.has('myservice')) {
  const pool = buildMyServicePool();
  sections.push({
    id: 'myservice',
    outputName: 'My Service (MYS)',
    icon: '🔵',
    name: 'My Service',
    units: pool,
    scalable: true,
    note: 'Brief note about CAD ranges and conventions.',
  });
}
```

### Step 5 — Add supervisors to the harvest block in app.js

In the supervision harvesting block inside `buildOutput()`:

```javascript
...(S.selected.has('myservice') ? [
  { cs: 'MYS250', desc: 'My Service Sergeant', shifts: ['SUP'] },
] : []),
```

### Step 6 — Update stations.csv comment block

Add `myservice` to the available IDs list in the `services` column comment.

---

## Removing a Service

1. Remove its entry from `SERVICES` in `data.js`
2. Remove its `pool builder` function from `data.js`
3. Remove it from every row in `DEFAULTS` in `data.js`
4. Remove it from `MAX_UNITS` in `data.js`
5. Remove its supervision harvest entries from `app.js`
6. Remove its `if (S.selected.has(...))` section block from `app.js`
7. Remove it from the `services` column comment in `stations.csv`

---

## The Pipe Format

Stations are stored internally as pipe-delimited strings between `stations.csv` and `parseStation()` in `data.js`. The current format is:

```
CODE|Name|DivCode|PSA|PSALabel|HWP|HWPLabel|CIU|CIULabel|Services|classification
```

This is built by `ingestCSV()` in `app.js` and read back by `parseStation()` in `data.js`. If a new column is ever added to `stations.csv`, both functions need updating together — `ingestCSV` to read and include the new field, and `parseStation` to read it from the correct pipe position.

> **Important:** Every time a new field is added to the pipe, all existing pipe position indexes shift. Always update `parseStation` and `ingestCSV` together and verify `classification` is still reading from the last position.

---

## Station Support Links

The Station Support Links card on the output page shows the PSA, HWP, and CIU associated with a station. Each has a code and an optional human-readable label:

| CSV columns | Display result |
|---|---|
| `psa=NML`, `psa_label=Melbourne` | Melbourne (NML) |
| `hwp=EWT`, `hwp_label=Wangaratta` | Wangaratta (EWT) |
| `ciu=NMW`, `ciu_label=` *(blank)* | Falls back to resolving NMW as a station name, or raw code |

Labels are optional — if blank, the tool tries to resolve the code as a known station name. If that also fails, it shows the raw code.

---

## CAD Number Ranges Reference

All ranges are sourced from the official Victoria Police CAD reference document.

| Service | Prefix | Range | Notes |
|---|---|---|---|
| Station Cars | Station code | 200–299 | MS anchor: x07, AS: x03, NS: x11 |
| Divisional Vans | Station code | 300–399 | MS anchor: x07, AS: x03, NS: x11 |
| Highway Patrol — Marked | HWP prefix | 610–629 | All shifts |
| Highway Patrol — Q Cars | HWP prefix | 630–639 | Unmarked |
| Highway Patrol — SGT | HWP prefix | 650–659 | |
| Highway Patrol — S/SGT | HWP prefix | 660–669 | |
| Highway Patrol — Special Duties | HWP prefix | 670–699 | |
| Highway Patrol — Solo | HWP prefix | 600–609 | Motorcycles |
| State Highway Patrol | TRF | 610–699 | Same structure as local HWP |
| CIU | CIU prefix | 500–599 | MS: x507, AS: x503/x520, NS: x541–546 |
| PORT | POR | 600–899 | |
| RRU | Station code | 440–449 | |
| FVIU | Station code | 480–499 | SGT: 480, DET/S/SGT: 490, CLO: 499 |
| SOCIT | Station code | 450–499 | SGT: 450–459, S/SGT: 460–469 |
| Dog Squad | CAN | 200–799 | CAN700 narcotics, CAN710–714 courts |
| Search & Rescue | RES | 400–459 | |
| SOG | SCY | State-wide | |
| CIRT | CIR | 200–899 | |
| Heavy Vehicle | ROA | 501–560 | |
| Mounted Branch | MOU | 800–899 | |
| Crime Desk | CRI | 570–579 | SGT: 571–572, units: 573–579, office: 570 |

---

## Known Conventions

**Shift anchors** — The trailing digit of a unit number indicates its shift start: numbers ending in `7` = morning (0700), `3` = afternoon (1500), `1` = night (2300). This applies to station cars, vans, and CIU.

**Supervisor units** — Tagged `SUP` in pool builders. They are always lifted out of the service block and grouped into the Command & Supervision section at the top of the output. They do not count toward the slider total for their service.

**Fixed units** — Tagged `FIXED`. Always shown at the bottom of their section. Not included in the unit count or slider.

**Solo cards** — HWP Solo and TRF Solo appear as sub-cards beneath their parent in the service selection grid, visible only when the parent is selected.
