// =============================================================================
// app.js — VicPol CAD Lineup Generator
// Runtime logic: CSV loading, step navigation, generation, rendering, export.
// Depends on data.js being loaded first.
// =============================================================================


// =============================================================================
// APP STATE
// =============================================================================
const S = {
  stationCode:   '',
  stationName:   '',
  regionLabel:   '',
  divisionLabel: '',
  psa:           '',
  hwp:           '',
  ciu:           '',
  role:          'metro_24',
  selected:      new Set(),

};

// Per-service slider overrides (service id → unit count)
const OVERRIDES = {};


// =============================================================================
// CLOCK
// =============================================================================
setInterval(() => {
  document.getElementById('clock').textContent =
    new Date().toLocaleTimeString('en-AU', { hour12: false });
}, 1000);


// =============================================================================
// CSV LOADER
// Fetches stations.csv from the same directory as index.html and populates
// REGION_DATA. Falls back to the inline template in data.js if not found
// (e.g. when running locally by double-clicking index.html).
//
// CSV columns (header row required):
//   code, name, region, region_label, division, div_code,
//   psa, hwp, ciu, classification
// =============================================================================
async function loadCSV() {
  try {
    const res = await fetch('stations.csv');
    if (!res.ok) throw new Error('not found');
    const text = await res.text();
    ingestCSV(text);
    console.log('stations.csv loaded successfully.');
  } catch (e) {
    console.warn('stations.csv not found — using inline template data from data.js.');
  }
  populateRegionDropdown();
}

function parseCSVLine(line) {
  // Handles quoted fields containing commas
  const out = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"')              { inQ = !inQ; }
    else if (ch === ',' && !inQ) { out.push(cur.trim()); cur = ''; }
    else                         { cur += ch; }
  }
  out.push(cur.trim());
  return out;
}

function ingestCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim() && !l.startsWith('#'));
  if (lines.length < 2) return;

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  const idx = h => headers.indexOf(h);

  // Clear existing inline station entries (keep division keys as empty arrays)
  Object.values(REGION_DATA).forEach(reg => {
    Object.keys(reg.divisions).forEach(div => {
      reg.divisions[div] = [];
    });
  });

  for (let i = 1; i < lines.length; i++) {
    const f = parseCSVLine(lines[i]);
    if (f.length < 2) continue;

    const code           = (f[idx('code')]           || '').toUpperCase();
    const name           =  f[idx('name')]            || '';
    const regionKey      = (f[idx('region')]          || '').toUpperCase();
    const regionLabel    =  f[idx('region_label')]    || regionKey;
    const divisionName   =  f[idx('division')]        || 'Unknown Division';
    const divCode        =  f[idx('div_code')]        || '';
    const psa            =  f[idx('psa')]             || '';
    const hwp            =  f[idx('hwp')]             || '';
    const ciu            =  f[idx('ciu')]             || '';
    const classification =  f[idx('classification')]  || 'metro_24';

    if (!code || !name || !regionKey) continue;

    // Create region if new (CSV-defined region not in template)
    if (!REGION_DATA[regionKey]) {
      REGION_DATA[regionKey] = { label: regionLabel, divisions: {} };
      addRegionOption(regionKey, regionLabel);
    }

    // Create division if new
    if (!REGION_DATA[regionKey].divisions[divisionName]) {
      REGION_DATA[regionKey].divisions[divisionName] = [];
    }

    // Push as a pipe-delimited entry matching the format in data.js
    REGION_DATA[regionKey].divisions[divisionName].push(
      `${code}|${name}|${divCode}|${psa}|${hwp}|${ciu}|${classification}`
    );
  }

  // Remove any divisions still empty after CSV load (unfilled template keys)
  Object.values(REGION_DATA).forEach(reg => {
    Object.keys(reg.divisions).forEach(div => {
      if (reg.divisions[div].length === 0) delete reg.divisions[div];
    });
  });
}

function addRegionOption(key, label) {
  const sel = document.getElementById('selRegion');
  if ([...sel.options].some(o => o.value === key)) return; // avoid duplicates
  const o = document.createElement('option');
  o.value = key;
  o.textContent = label;
  sel.appendChild(o);
}

function populateRegionDropdown() {
  // Built-in options are already in the HTML; this catches any CSV-added regions
  Object.keys(REGION_DATA).forEach(key => {
    addRegionOption(key, REGION_DATA[key].label);
  });
}


// =============================================================================
// STEP NAVIGATION
// =============================================================================
function go(n) {
  [1, 2, 3].forEach(i => {
    document.getElementById('p' + i).classList.toggle('show', i === n);
    const t = document.getElementById('tab' + i);
    t.classList.remove('active', 'done');
    if (i === n)      t.classList.add('active');
    else if (i < n)   t.classList.add('done');
  });
}


// =============================================================================
// STEP 1 — STATION SELECTION
// =============================================================================
function onRegion() {
  const r = document.getElementById('selRegion').value;
  const dSel = document.getElementById('selDiv');

  dSel.innerHTML = '<option value="">— Select Division —</option>';
  dSel.disabled = !r;
  document.getElementById('selStation').innerHTML = '<option value="">— Select Division first —</option>';
  document.getElementById('selStation').disabled = true;
  document.getElementById('roleCard').style.display = 'none';

  if (r && REGION_DATA[r]) {
    Object.keys(REGION_DATA[r].divisions).forEach(d => {
      const o = document.createElement('option');
      o.value = d;
      o.textContent = d;
      dSel.appendChild(o);
    });
  }
}

function onDiv() {
  const r = document.getElementById('selRegion').value;
  const d = document.getElementById('selDiv').value;
  const sSel = document.getElementById('selStation');

  sSel.innerHTML = '<option value="">— Select Station —</option>';
  sSel.disabled = !d;
  document.getElementById('roleCard').style.display = 'none';

  if (r && d && REGION_DATA[r] && REGION_DATA[r].divisions[d]) {
    REGION_DATA[r].divisions[d].forEach(entry => {
      const st = parseStation(entry);
      const o = document.createElement('option');
      o.value = entry;
      o.textContent = `${st.name} (${st.code})`;
      sSel.appendChild(o);
    });
  }
}

function onStation() {
  const entry = document.getElementById('selStation').value;
  document.getElementById('roleCard').style.display = entry ? 'block' : 'none';
  if (entry) {
    const st = parseStation(entry);
    // Pre-select classification from CSV data if available
    if (st.classification) {
      document.getElementById('knownRole').value = st.classification;
    }
  }
}

function goStep2() {
  const sel = document.getElementById('selStation').value;
  if (!sel) { alert('Please select a station.'); return; }

  const st = parseStation(sel);
  S.stationCode   = st.code;
  S.stationName   = st.name;
  S.psa           = st.psa;
  S.hwp           = st.hwp;
  S.ciu           = st.ciu;
  S.role          = document.getElementById('knownRole').value;

  const r = document.getElementById('selRegion').value;
  S.regionLabel   = r ? REGION_DATA[r].label : '';
  S.divisionLabel = document.getElementById('selDiv').value || '';

  // Clear any selections and slider overrides from a previous session
  S.selected.clear();
  Object.keys(OVERRIDES).forEach(k => delete OVERRIDES[k]);

  buildServiceGrid();
  go(2);
}


// =============================================================================
// STEP 2 — SERVICE SELECTION
// =============================================================================
// Solo cards are injected into the grid immediately after their parent
// when the parent is selected. They behave like regular service cards.
const SOLO_CARDS = {
  hwp: { id: 'hwp_solo', icon: '🏍️', name: 'Highway Patrol Solo',      stateKey: 'hwpSolo' },
  trf: { id: 'trf_solo', icon: '🏍️', name: 'State Highway Patrol Solo', stateKey: 'trfSolo' },
};

function buildServiceGrid() {
  const g = document.getElementById('svcGrid');
  g.innerHTML = '';

  SERVICES.forEach(sv => {
    // Main service card
    const el = document.createElement('div');
    el.className = 'svc-item' + (S.selected.has(sv.id) ? ' on' : '');
    el.dataset.id = sv.id;
    el.innerHTML = `
      <div class="svc-check">${S.selected.has(sv.id) ? '✓' : ''}</div>
      <div class="svc-text">
        <div class="svc-name">${sv.icon} ${sv.name}</div>
      </div>`;
    el.onclick = () => {
      if (S.selected.has(sv.id)) {
        S.selected.delete(sv.id);
        // Also deselect the solo card if the parent is deselected
        if (SOLO_CARDS[sv.id]) S.selected.delete(SOLO_CARDS[sv.id].id);
      } else {
        S.selected.add(sv.id);
      }
      // Rebuild the grid so the solo card appears/disappears in the right position
      buildServiceGrid();
    };
    g.appendChild(el);

    // If this service is selected and has a solo card, inject it right after
    if (SOLO_CARDS[sv.id] && S.selected.has(sv.id)) {
      const solo   = SOLO_CARDS[sv.id];
      const soloOn = S.selected.has(solo.id);
      const soloEl = document.createElement('div');
      soloEl.className = 'svc-item svc-item--solo' + (soloOn ? ' on' : '');
      soloEl.dataset.id = solo.id;
      soloEl.innerHTML = `
        <div class="svc-check">${soloOn ? '✓' : ''}</div>
        <div class="svc-text">
          <div class="svc-name">${solo.icon} ${solo.name}</div>
        </div>`;
      soloEl.onclick = () => {
        if (S.selected.has(solo.id)) {
          S.selected.delete(solo.id);
        } else {
          S.selected.add(solo.id);
        }
        buildServiceGrid();
      };
      g.appendChild(soloEl);
    }
  });
}


// =============================================================================
// STEP 3 — GENERATION
// =============================================================================
function defaultCount(svcId) {
  const d = DEFAULTS[S.role] || DEFAULTS.metro_24;
  return d[svcId] || 3;
}

function generate() {
  if (S.selected.size === 0) { alert('Please select at least one service.'); return; }
  // Reset slider overrides to classification defaults
  S.selected.forEach(id => { OVERRIDES[id] = defaultCount(id); });
  buildOutput();
  go(3);
}

function buildOutput() {
  const c         = S.stationCode;
  const role      = S.role;
  const roleLabel = {
    metro_24:       'Metropolitan (24 Hours)',
    metro_non24:    'Metropolitan (Non-24 Hours)',
    regional_24:    'Regional (24 Hours)',
    regional_non24: 'Regional (Non-24 Hours)',
    regional_single:  'Regional (Single Member)',
  }[role] || 'Metropolitan (24 Hours)';
  const sections  = [];

  // ── Build all scalable pools once ─────────────────────────────────────────
  // Pools are built here so the same shuffled callsigns are used both when
  // harvesting SUP units for Command & Supervision and when rendering the
  // service sections. Building twice would produce different random callsigns.
  const POOLS = {
    cars:  buildCarPool(c),
    vans:  buildVanPool(c),
    hwp:   buildHWPPool(c),
    trf:   buildTRFPool(),
    ciu:   buildCIUPool(c),
    port:  buildPORTPool(),
    rru:   buildRRUPool(c),
  };

  // ── Supervision ────────────────────────────────────────────────────────────
  // Base station supervisors first, then SUP-tagged units from every selected
  // service (harvested from the already-built pools and fixed service lists).
  {
    const is24hr         = (role === 'metro_24' || role === 'regional_24');
    const isLarge        = (role === 'metro_24' || role === 'regional_24');
    const isSingleMember = (role === 'regional_single');
    const superRequired  = document.getElementById('superRequired').value === 'yes';

    let supUnits = [];
    let supNote  = '';

    if (superRequired) {
      if (isSingleMember) {
        supUnits = [
          { cs: c + '251', desc: 'District Patrol Supervisor (SGT)', shifts: ['MS', 'AS', 'NS'] },
        ];
        supNote = 'Single member stations carry a single District Patrol SGT (251). There is no on-site Station SGT — supervision is coordinated from the nearest regional hub.';
      } else {
        supUnits = [
          { cs: c + '250', desc: 'Station Sergeant',                 shifts: ['MS', 'AS', 'NS'] },
          { cs: c + '251', desc: 'District Patrol Supervisor (SGT)', shifts: ['MS', 'AS', 'NS'] },
        ];
        if (is24hr) {
          supUnits.push({ cs: c + '252', desc: 'District Patrol Supervisor (SGT)', shifts: ['MS', 'AS', 'NS'] });
        }
        if (isLarge) {
          supUnits.push({ cs: c + '260', desc: 'Senior Sergeant',               shifts: ['MS', 'AS'] });
          supUnits.push({ cs: c + '265', desc: 'Divisional Supervisor (S/SGT)', shifts: ['MS'] });
        }
        supNote = is24hr
          ? 'Station SGT (250) attends incidents at the request of units already in attendance. District Patrol SGT (251/252) remains on mobile patrol for the duration of the shift.'
            + (isLarge ? ' S/SGT (265) holds command and control responsibility.' : '')
          : 'Station SGT (250) attends incidents at the request of units already in attendance. Non-24-hour stations operate a single District Patrol SGT (251) across available shifts, subject to staffing.';
      }
    }

    // Harvest SUP units from the already-built pools (scalable services)
    // and from the inline fixed-service unit lists.
    const serviceSupSources = [
      ...Object.entries(POOLS).filter(([id]) => S.selected.has(id)).flatMap(([, pool]) => pool),
      ...(S.selected.has('fviu')    ? [
        { cs: c + '480', desc: 'FVIU Sergeant',                  shifts: ['SUP'] },
        { cs: c + '490', desc: 'FVIU Detective Senior Sergeant', shifts: ['SUP'] },
      ] : []),
      ...(S.selected.has('socit')   ? [
        { cs: c + '450', desc: 'SOCIT Sergeant',        shifts: ['SUP'] },
        { cs: c + '460', desc: 'SOCIT Senior Sergeant', shifts: ['SUP'] },
      ] : []),
      ...(S.selected.has('sar')     ? [{ cs: 'RES451', desc: 'SAR Sergeant',                   shifts: ['SUP'] }] : []),
      ...(S.selected.has('sog')     ? [{ cs: 'SCY250', desc: 'SOG Sergeant',                   shifts: ['SUP'] }] : []),
      ...(S.selected.has('cirt')    ? [{ cs: 'CIR250', desc: 'CIRT Sergeant',                  shifts: ['SUP'] }] : []),
      ...(S.selected.has('polair')  ? [
        { cs: 'AIR451', desc: 'Air Wing Sergeant',        shifts: ['SUP'] },
        { cs: 'AIR452', desc: 'Air Wing Sergeant',        shifts: ['SUP'] },
        { cs: 'AIR46',  desc: 'Air Wing Senior Sergeant', shifts: ['SUP'] },
      ] : []),
      ...(S.selected.has('hviu')    ? [{ cs: 'ROA550', desc: 'Heavy Vehicle Supervisor',       shifts: ['SUP'] }] : []),
      ...(S.selected.has('mounted') ? [{ cs: 'MOU850', desc: 'Mounted Sergeant',               shifts: ['SUP'] }] : []),
      ...(S.selected.has('cri')     ? [
        { cs: 'CRI571', desc: 'Crime Desk Sergeant', shifts: ['SUP'] },
        { cs: 'CRI572', desc: 'Crime Desk Sergeant', shifts: ['SUP'] },
      ] : []),
    ];

    const serviceSups = serviceSupSources.filter(u => u.shifts.includes('SUP'));
    supUnits = supUnits.concat(serviceSups);

    if (supUnits.length > 0) {
      if (serviceSups.length > 0 && supNote) supNote += ' Supervisors from selected specialist services are listed below.';
      else if (serviceSups.length > 0)       supNote = 'Supervisors from selected specialist services.';
      sections.push({ id: '_sup', icon: '⭐', name: 'Command & Supervision', units: supUnits, pool: null, note: supNote });
    }
  }

  // ── Scalable services ──────────────────────────────────────────────────────
  const svcDefs = [
    {
      id: 'cars', icon: '🚗', name: 'Station Cars',
      note: `Sedans use 200–299. Trailing digit reflects shift start: ${c}20<strong>7</strong>=0700, ${c}20<strong>3</strong>=1500, ${c}21<strong>1</strong>=2300. Additional units increment from those bases.`,
    },
    {
      id: 'vans', icon: '🚐', name: 'Divisional Vans',
      note: `Vans use 300–399. Shift convention mirrors cars: 30<strong>7</strong>=morning, 30<strong>3</strong>=afternoon, 31<strong>1</strong>=night. Typically crewed by 2 officers and carry a prisoner cage.`,
    },
    {
      id: 'hwp', icon: '🚔', name: 'Highway Patrol',
      note: `Local Highway Patrol uses the station code prefix. Marked cars 610–629, Q Cars 630–639 (1 per ~4 marked). Special Duties 670–699 at higher counts. SGT (650–659) and S/SGT (660–669) shown in Command & Supervision.`,
    },
    {
      id: 'trf', icon: '🚓', name: 'State Highway Patrol',
      note: `State Highway Patrol uses the <strong>TRF</strong> prefix. Marked cars TRF610–629, Q Cars TRF630–639, Special Duties TRF670–699 at higher counts. SGT (TRF650–659) and S/SGT (TRF660–669) shown in Command & Supervision. State-level unit — no dedicated base station callsign.`,
    },
    {
      id: 'ciu', outputName: 'CIU (Criminal Investigation Unit)', icon: '🔍', name: 'CIU',
      note: `CIU investigates serious crime. Morning: ${c}507. Afternoon: ${c}503 / ${c}520. Night: ${c}541–546 with night supervisor at ${c}550.`,
    },
    {
      id: 'port', outputName: 'PORT (Public Order Response Team)', icon: '🛡️', name: 'PORT',
      note: `PORT (Public Order Response Team) uses the <strong>POR</strong> prefix — not the station code. General units 600–649, SGT/S/SGT shown in Command & Supervision. Region-wide asset, not station-specific.`,
    },
    {
      id: 'rru', outputName: 'RRU (Regional Response Unit)', icon: '⚡', name: 'RRU',
      note: `RRU (440–449) provides operational support, allocated to specific operations or tasks.`,
    },
  ];

  svcDefs.forEach(def => {
    if (!S.selected.has(def.id)) return;
    const count = OVERRIDES[def.id] || defaultCount(def.id);

    // Use the pre-built pool; filter out FIXED and SUP units — both handled elsewhere
    const pool = POOLS[def.id].filter(u => !u.shifts.includes('FIXED') && !u.shifts.includes('SUP'));

    sections.push({ ...def, units: pool, activeCount: count, scalable: true });

    // Solo section — pushed immediately after the parent, scalable with its own slider
    if (def.id === 'hwp' && S.selected.has('hwp_solo')) {
      const soloPool = buildHWPSoloUnits(c);
      sections.push({
        id: 'hwp_solo', icon: '🏍️', name: 'Highway Patrol Solo',
        units: soloPool, activeCount: OVERRIDES['hwp_solo'] || defaultCount('hwp_solo'),
        scalable: true,
        note: 'Station-based HWP solo motorcycle units use the station code prefix, range 600–609.',
      });
    }
    if (def.id === 'trf' && S.selected.has('trf_solo')) {
      const soloPool = buildTRFSoloUnits();
      sections.push({
        id: 'trf_solo', icon: '🏍️', name: 'State Highway Patrol Solo',
        units: soloPool, activeCount: OVERRIDES['trf_solo'] || defaultCount('trf_solo'),
        scalable: true,
        note: 'State Highway Patrol solo motorcycle units use the <strong>TRF</strong> prefix, range 600–609.',
      });
    }
  });

  // ── Specialist services — scalable within documented CAD ranges ───────────
  if (S.selected.has('fviu')) {
    const pool = buildFVIUPool(c);
    sections.push({
      id: 'fviu', outputName: 'FVIU (Family Violence Investigation Unit)', icon: '🏠', name: 'FVIU',
      units: pool, scalable: true,
      note: 'Secondary response to family violence incidents within the PSA. Day/afternoon shifts only — no dedicated night unit. Units 481–489 (MS anchor: 487, AS anchor: 483). SGT (480) and DET/S/SGT (490) shown in Command & Supervision. Court Liaison at 499.',
    });
  }

  if (S.selected.has('socit')) {
    const pool = buildSOCITPool(c);
    sections.push({
      id: 'socit', outputName: 'SOCIT (Sexual Offences & Child Investigations Team)', icon: '👶', name: 'SOCIT',
      units: pool, scalable: true,
      note: 'Initial response to sexual/physical assaults on children or families. Uses station prefix. General units 470–499 (MS anchor: 477, AS anchor: 473, NS anchor: 471). SGT (450–459) and S/SGT (460–469) shown in Command & Supervision.',
    });
  }

  if (S.selected.has('dog')) {
    const pool = buildDogPool();
    sections.push({
      id: 'dog', outputName: 'CAN (Dog Squad)', icon: '🐕', name: 'Dog Squad (CAN)',
      units: pool, scalable: true,
      note: 'CAN prefix regardless of station. General duties 200–299. CAN700 = narcotics/training specialty. CAN710–714 = court security (SFK courts).',
    });
  }

  if (S.selected.has('sar')) {
    const pool = buildSARPool();
    sections.push({
      id: 'sar', outputName: 'RES (Search & Rescue)', icon: '🔦', name: 'Search & Rescue (RES)',
      units: pool, scalable: true,
      note: 'RES prefix, range 400–459. Responds to missing persons, bushland searches and maritime incidents. SGT (RES451) shown in Command & Supervision. Often activated on callout.',
    });
  }

  if (S.selected.has('sog')) {
    const pool = buildSOGPool();
    sections.push({
      id: 'sog', outputName: 'SOG (Special Operations Group)', icon: '🦅', name: 'SOG (Special Operations Group)',
      units: pool, scalable: true,
      note: 'SCY prefix. State-wide specialist tactical resource — deployed as required, not station-specific. SGT (SCY250) shown in Command & Supervision.',
    });
  }

  if (S.selected.has('cirt')) {
    const pool = buildCIRTPool();
    sections.push({
      id: 'cirt', outputName: 'CIRT (Critical Incident Response Team)', icon: '🎯', name: 'CIRT (Critical Incident Response Team)',
      units: pool, scalable: true,
      note: 'CIR prefix, range 200–899. Deployed for critical incidents requiring specialist negotiation and response capability. SGT (CIR250) shown in Command & Supervision. Region-wide asset.',
    });
  }

  if (S.selected.has('polair')) {
    const pool = buildPOLAIRPool();
    sections.push({
      id: 'polair', outputName: 'POLAIR (Air Wing)', icon: '🚁', name: 'Air Wing',
      units: pool, scalable: true,
      note: 'POLAIR30–32 (rotary wing), POLAIR35 (fixed wing). Used for patrol, traffic enforcement, search/rescue, fire observation and urgent transport. SGT: AIR451/AIR452. S/SGT: AIR46. State-wide asset.',
    });
  }

  if (S.selected.has('hviu')) {
    const pool = buildHVIUPool();
    sections.push({
      id: 'hviu', outputName: 'ROA (Heavy Vehicle Unit)', icon: '🚛', name: 'Heavy Vehicle Unit (ROA)',
      units: pool, scalable: true,
      note: 'ROA prefix. Patrol units 501–505, specialist at 560. Supervisor (ROA550) shown in Command & Supervision. Compliance and enforcement targeting heavy vehicles on Victorian roads.',
    });
  }

  if (S.selected.has('mounted')) {
    const pool = buildMountedPool();
    sections.push({
      id: 'mounted', outputName: 'MOU (Mounted Branch)', icon: '🐴', name: 'Mounted Branch (MOU)',
      units: pool, scalable: true,
      note: 'MOU prefix, range 800–899. High-visibility patrol and crowd control. SGT (MOU850) shown in Command & Supervision. State-wide asset.',
    });
  }

  if (S.selected.has('cri')) {
    const pool = buildCRIPool();
    sections.push({
      id: 'cri', outputName: 'CRI (Crime Desk)', icon: '📷', name: 'Crime Desk (CRI)',
      units: pool, scalable: true,
      note: 'CRI prefix. Coordinates CSOs at events, scene photography and forensic examination. Units 573–579 (MS: CRI577, AS: CRI573, NS: CRI575). SGTs (CRI571–572) shown in Command & Supervision. Office at CRI570. Region-wide asset.',
    });
  }

  renderOutput(c, role, roleLabel, sections);
}


// =============================================================================
// RENDER — output page
// =============================================================================

// Look up a station code and return "Name (CODE)".
// Falls back to the raw code if not found (station not yet in CSV).
function resolveStationLabel(code) {
  if (!code) return '';
  for (const reg of Object.values(REGION_DATA)) {
    for (const entries of Object.values(reg.divisions)) {
      for (const entry of entries) {
        const st = parseStation(entry);
        if (st.code === code) return `${st.name} (${code})`;
      }
    }
  }
  return code;
}

function renderOutput(code, role, roleLabel, sections) {
  const totalVisible = sections.reduce((a, sec) => {
    const displayUnits = sec.units.filter(u => !u.shifts.includes('FIXED'));
    return a + (sec.scalable ? (OVERRIDES[sec.id] || defaultCount(sec.id)) : displayUnits.length);
  }, 0);

  // Narrative intro paragraph
  const roleDesc = {
    metro_24:       'a metropolitan 24-hour station providing continuous operational coverage within a high-density urban area',
    metro_non24:    'a metropolitan station maintaining ongoing policing coverage without continuous 24-hour public counter staffing',
    regional_24:    'a regional 24-hour hub providing continuous operational coverage across a large geographic area',
    regional_non24: 'a regional station maintaining policing coverage through mobile patrols and nearby hub station support',
    regional_single:  'a single member station providing a local policing presence, typically staffed by one officer operating a single vehicle',
  }[role] || 'a general duties station';

  let narr = `For an ideal configuration at <strong>${S.stationName} Police Station (${code})</strong>, ${roleDesc}`;
  if (S.divisionLabel) narr += ` for the <strong>${S.divisionLabel}</strong> division`;
  if (S.regionLabel)   narr += ` in the <strong>${S.regionLabel} Region</strong>`;
  narr += `, the following vehicle lineup is suggested. Units are listed across all shifts — morning (0700), afternoon (1500) and night (2300) crews may appear together. Use the <strong>unit count sliders</strong> on each service block to adjust numbers up or down.`;

  // Station support links card
  let linksHtml = '';
  if (S.psa || S.hwp || S.ciu) {
    const linkItems = [
      S.psa ? `<div class="link-item"><div class="link-key">Police Service Area (PSA)</div><div class="link-val">${resolveStationLabel(S.psa)}</div></div>` : '',
      S.hwp ? `<div class="link-item"><div class="link-key">Highway Patrol (HWP)</div><div class="link-val">${resolveStationLabel(S.hwp)}</div></div>` : '',
      S.ciu ? `<div class="link-item"><div class="link-key">Crime Investigation Unit (CIU)</div><div class="link-val">${resolveStationLabel(S.ciu)}</div></div>` : '',
    ].filter(Boolean).join('');
    linksHtml = `<div class="card" style="margin-bottom:14px">
      <div class="card-head"><div class="dot"></div>Station Support Links</div>
      <div class="card-body"><div class="links-grid">${linkItems}</div></div>
    </div>`;
  }

  // Service blocks
  let blocksHtml = '';
  sections.forEach(sec => {
    const isScalable = !!sec.scalable;
    // Strip FIXED base station units and SUP supervisor units from section display
    const displayUnits = sec.units.filter(u => !u.shifts.includes('FIXED') && !u.shifts.includes('SUP'));
    const count      = isScalable ? (OVERRIDES[sec.id] || defaultCount(sec.id)) : displayUnits.length;
    const maxCount   = isScalable ? (MAX_UNITS[sec.id] || displayUnits.length) : displayUnits.length;

    let rows = '';
    displayUnits.forEach((u, i) => {
      const hidden = isScalable && i >= count;
      rows += `<div class="unit-row${hidden ? ' hidden-unit' : ''}" id="urow-${sec.id}-${i}">
        <span class="u-cs">${u.cs}</span>
        <span class="u-desc">${u.desc}</span>
      </div>`;
    });

    const sliderHtml = isScalable ? `
      <div class="slider-row">
        <span class="slider-label">Units</span>
        <div class="slider-wrap">
          <input type="range" min="1" max="${maxCount}" value="${count}"
            oninput="onSlider('${sec.id}', this.value)" id="sl-${sec.id}">
          <span class="slider-val" id="slv-${sec.id}">${count}</span>
        </div>
      </div>` : '';

    blocksHtml += `<div class="svc-block">
      <div class="svc-block-head">
        <span class="svc-block-icon">${sec.icon}</span>
        <span class="svc-block-name">${sec.outputName || sec.name}</span>
        <span class="svc-block-count" id="sc-${sec.id}">${count} unit${count !== 1 ? 's' : ''}</span>
      </div>
      <div class="svc-block-body">
        ${sliderHtml}
        <div class="unit-table" id="ut-${sec.id}">${rows}</div>
        <div class="svc-note">${sec.note}</div>
      </div>
    </div>`;
  });

  // Export text (plain)
  const exp = buildExportText(code, role, roleLabel, sections);
  const expDisplay = highlightExport(exp);

  document.getElementById('output').innerHTML = `
    <div class="out-header">
      <div class="out-stn">${S.stationName} Police Station</div>
      <div class="out-sub">${code} · ${S.divisionLabel || ''} ${S.regionLabel ? '· ' + S.regionLabel : ''} · ${roleLabel}</div>
      <div class="out-meta">
        <div class="out-meta-item"><div class="out-meta-label">Station Code</div><div class="out-meta-val">${code}</div></div>
        <div class="out-meta-item"><div class="out-meta-label">Classification</div><div class="out-meta-val">${roleLabel}</div></div>
        <div class="out-meta-item"><div class="out-meta-label">Total Units</div><div class="out-meta-val" id="totalCount">${totalVisible}</div></div>
        <div class="out-meta-item"><div class="out-meta-label">Services</div><div class="out-meta-val">${sections.length}</div></div>
      </div>
    </div>
    <div class="narrative">${narr}</div>
    ${linksHtml}
    ${blocksHtml}
    <div class="export-box">
      <div class="export-head">
        <h3>Export / Copy</h3>
        <button class="btn-copy" onclick="copyExport()">Copy to Clipboard</button>
      </div>
      <div class="export-pre" id="expPre">${expDisplay}</div>
    </div>
    <div style="display:none" id="expRaw">${exp}</div>`;

  // Store sections reference for live slider updates
  window._sections = sections;
}


// =============================================================================
// SLIDER — live update without full re-render
// =============================================================================
function onSlider(svcId, rawVal) {
  const n = parseInt(rawVal, 10);
  OVERRIDES[svcId] = n;

  document.getElementById('slv-' + svcId).textContent = n;
  document.getElementById('sc-' + svcId).textContent = n + ' unit' + (n !== 1 ? 's' : '');

  // Show/hide unit rows
  const sec = window._sections.find(s => s.id === svcId);
  if (!sec) return;
  sec.units.forEach((_, i) => {
    const row = document.getElementById('urow-' + svcId + '-' + i);
    if (row) row.classList.toggle('hidden-unit', i >= n);
  });

  // Update total count in header
  const total = window._sections.reduce((a, s) => {
    const du = s.units.filter(u => !u.shifts.includes('FIXED'));
    return a + (s.scalable ? (OVERRIDES[s.id] || defaultCount(s.id)) : du.length);
  }, 0);
  const tc = document.getElementById('totalCount');
  if (tc) tc.textContent = total;

  rebuildExport();
}


// =============================================================================
// EXPORT
// =============================================================================
function buildExportText(code, role, roleLabel, sections) {
  let exp = `VICTORIA POLICE — CAD LINEUP\n${'═'.repeat(46)}\n`;
  exp += `Station  : ${S.stationName} Police Station (${code})\n`;
  if (S.divisionLabel) exp += `Division : ${S.divisionLabel}\n`;
  if (S.regionLabel)   exp += `Region   : ${S.regionLabel}\n`;
  exp += `Role     : ${roleLabel}\nUnits    : ${sections.reduce((a, s) => { const du = s.units.filter(u => !u.shifts.includes('FIXED')); return a + (s.scalable ? (OVERRIDES[s.id] || defaultCount(s.id)) : du.length); }, 0)}\n${'─'.repeat(46)}\n\n`;

  sections.forEach(sec => {
    const exportUnits = sec.units.filter(u => !u.shifts.includes('FIXED') && !u.shifts.includes('SUP'));
    const count = sec.scalable ? (OVERRIDES[sec.id] || defaultCount(sec.id)) : exportUnits.length;
    exp += `${(sec.outputName || sec.name).toUpperCase()}\n`;
    exportUnits.slice(0, count).forEach(u => { exp += `  ${u.cs.padEnd(12)} ${u.desc}\n`; });
    exp += '\n';
  });

  if (S.psa || S.hwp || S.ciu) {
    exp += `STATION SUPPORT LINKS\n`;
    if (S.psa) exp += `  Police Service Area (PSA)     : ${resolveStationLabel(S.psa)}\n`;
    if (S.hwp) exp += `  Highway Patrol (HWP)          : ${resolveStationLabel(S.hwp)}\n`;
    if (S.ciu) exp += `  Crime Investigation Unit (CIU) : ${resolveStationLabel(S.ciu)}\n`;
  }

  return exp;
}

function highlightExport(exp) {
  return exp
    .replace(/^(VICTORIA POLICE.*)/gm,               '<span class="ex-head">$1</span>')
    .replace(/^([═─]+)/gm,                           '<span class="ex-cmt">$1</span>')
    .replace(/^(Station|Division|Region|Role|Units)(\s*.*)/gm, '<span class="ex-cmt">$1$2</span>')
    .replace(/^([A-Z][A-Z &\/\(\)]+\n)/gm,           '<span class="ex-sec">$1</span>')
    .replace(/\b([A-Z]{2,7}[0-9]{2,4})\b/g,          '<span class="ex-cs">$1</span>');
}

function rebuildExport() {
  const code      = S.stationCode;
  const role      = S.role;
  const roleLabel = {
    metro_24:       'Metropolitan (24 Hours)',
    metro_non24:    'Metropolitan (Non-24 Hours)',
    regional_24:    'Regional (24 Hours)',
    regional_non24: 'Regional (Non-24 Hours)',
    regional_single:  'Regional (Single Member)',
  }[role] || 'Metropolitan (24 Hours)';
  const sections  = window._sections;

  const exp = buildExportText(code, role, roleLabel, sections);

  const raw = document.getElementById('expRaw');
  if (raw) raw.textContent = exp;

  const pre = document.getElementById('expPre');
  if (pre) pre.innerHTML = highlightExport(exp);
}

function copyExport() {
  navigator.clipboard.writeText(document.getElementById('expRaw').textContent).then(() => {
    const b = document.querySelector('.btn-copy');
    b.textContent = '✓ Copied!';
    setTimeout(() => b.textContent = 'Copy to Clipboard', 2000);
  });
}
