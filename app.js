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
  hwpSolo:       false,  // include HWP solo motorcycle units
  trfSolo:       false,  // include TRF solo motorcycle units
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

// Refresh the open/closed state of all sub-panels based on current selection.
// Called whenever a service is toggled.
function updateSubPanels() {
  document.querySelectorAll('.svc-subpanel').forEach(panel => {
    const parentId = panel.dataset.parent;
    panel.classList.toggle('open', S.selected.has(parentId));
  });
}

// Rebuild a single sub-option's visual state (checked/unchecked).
function refreshSubOption(stateKey) {
  const el = document.querySelector(`.svc-suboption[data-key="${stateKey}"]`);
  if (!el) return;
  const on = !!S[stateKey];
  el.classList.toggle('on', on);
  el.querySelector('.svc-subcheck').textContent = on ? '✓' : '';
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

  buildServiceGrid();
  go(2);
}


// =============================================================================
// STEP 2 — SERVICE SELECTION
// =============================================================================
// Sub-panel definitions — services that have additional options shown inline.
// Each entry: the parent service id, a header label, and an array of options.
// Each option: stateKey (on S), icon, name, desc.
const SUBPANELS = {
  hwp: {
    label: 'Highway Patrol — Additional Options',
    options: [
      {
        stateKey: 'hwpSolo',
        icon: '🏍️',
        name: 'Include Solo Motorcycle',
        desc: 'Adds station-based HWP solo motorcycle unit(s) to the lineup.',
      },
    ],
  },
  trf: {
    label: 'State Highway Patrol — Additional Options',
    options: [
      {
        stateKey: 'trfSolo',
        icon: '🏍️',
        name: 'Include Solo Motorcycle',
        desc: 'Adds State Highway Patrol solo motorcycle unit(s) to the lineup.',
      },
    ],
  },
};

function buildServiceGrid() {
  const g = document.getElementById('svcGrid');
  g.innerHTML = '';

  SERVICES.forEach(sv => {
    // Each service lives in a wrapper that occupies exactly one grid cell.
    // The sub-panel stacks below the card inside the wrapper — never in
    // the grid itself — so it can't push other cards out of position.
    const wrapper = document.createElement('div');
    wrapper.className = 'svc-wrapper';

    // Main service card
    const el = document.createElement('div');
    el.className = 'svc-item' + (S.selected.has(sv.id) ? ' on' : '');
    el.dataset.id = sv.id;
    el.innerHTML = `
      <div class="svc-check">${S.selected.has(sv.id) ? '✓' : ''}</div>
      <div class="svc-text">
        <div class="svc-name">${sv.icon} ${sv.name}</div>
        <div class="svc-desc">${sv.desc}</div>
      </div>`;
    el.onclick = () => {
      if (S.selected.has(sv.id)) {
        S.selected.delete(sv.id);
        el.classList.remove('on');
        el.querySelector('.svc-check').textContent = '';
      } else {
        S.selected.add(sv.id);
        el.classList.add('on');
        el.querySelector('.svc-check').textContent = '✓';
      }
      updateSubPanels();
    };
    wrapper.appendChild(el);

    // Sub-panel sits inside the wrapper, below the card (not in the grid)
    if (SUBPANELS[sv.id]) {
      const def = SUBPANELS[sv.id];
      const panel = document.createElement('div');
      panel.className = 'svc-subpanel' + (S.selected.has(sv.id) ? ' open' : '');
      panel.dataset.parent = sv.id;

      const optionsHtml = def.options.map(opt => `
        <div class="svc-suboption${S[opt.stateKey] ? ' on' : ''}" data-key="${opt.stateKey}">
          <div class="svc-subcheck">${S[opt.stateKey] ? '✓' : ''}</div>
          <div>
            <div class="svc-suboption-name">${opt.icon} ${opt.name}</div>
            <div class="svc-suboption-desc">${opt.desc}</div>
          </div>
        </div>`).join('');

      panel.innerHTML = `
        <div class="svc-subpanel-head">
          <span class="svc-subpanel-head-icon">⚙</span>
          <span class="svc-subpanel-head-label">${def.label}</span>
        </div>
        <div class="svc-subpanel-body">${optionsHtml}</div>`;

      panel.querySelectorAll('.svc-suboption').forEach(optEl => {
        optEl.onclick = (e) => {
          e.stopPropagation();
          const key = optEl.dataset.key;
          S[key] = !S[key];
          refreshSubOption(key);
        };
      });

      wrapper.appendChild(panel);
    }

    g.appendChild(wrapper);
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

  // ── Supervision ────────────────────────────────────────────────────────────
  if (document.getElementById('superRequired').value === 'yes') {
    const is24hr  = (role === 'metro_24' || role === 'regional_24');
    const isLarge = (role === 'metro_24' || role === 'regional_24');
    const isSingleMember = (role === 'regional_single');

    let supUnits;
    let supNote;
    if (isSingleMember) {
      // Single member stations carry a 251 only — no 250, no 252, no senior ranks
      supUnits = [
        { cs: c + '251', desc: 'District Patrol Supervisor (SGT)', shifts: ['MS', 'AS', 'NS'] },
      ];
      supNote = 'Single member stations carry a single District Patrol SGT (251). There is no on-site Station SGT — supervision is coordinated from the nearest regional hub.';
    } else {
      supUnits = [
        { cs: c + '250', desc: 'Station Sergeant',                shifts: ['MS', 'AS', 'NS'] },
        { cs: c + '251', desc: 'District Patrol Supervisor (SGT)', shifts: ['MS', 'AS', 'NS'] },
      ];
      // 252 only for 24-hour stations — non-24hr runs a single 251 subject to staffing
      if (is24hr) {
        supUnits.push({ cs: c + '252', desc: 'District Patrol Supervisor (SGT)', shifts: ['MS', 'AS', 'NS'] });
      }
      // Senior ranks for 24-hour stations
      if (isLarge) {
        supUnits.push({ cs: c + '260', desc: 'Senior Sergeant',               shifts: ['MS', 'AS'] });
        supUnits.push({ cs: c + '265', desc: 'Divisional Supervisor (S/SGT)', shifts: ['MS'] });
        supUnits.push({ cs: c + '100', desc: 'Superintendent',                shifts: ['MS'] });
      }
      supNote = is24hr
        ? 'Station SGT (250) attends incidents at the request of units already in attendance. District Patrol SGT (251/252) remains on mobile patrol for the duration of the shift.'
          + (isLarge ? ' S/SGT (265) holds command and control responsibility.' : '')
        : 'Station SGT (250) attends incidents at the request of units already in attendance. Non-24-hour stations operate a single District Patrol SGT (251) across available shifts, subject to staffing.';
    }

    // Specialist supervisors — appended when relevant services are selected
    if (S.selected.has('hwp')) {
      supUnits.push({ cs: c + '650', desc: 'HWP Sergeant',        shifts: ['MS', 'AS'] });
      supUnits.push({ cs: c + '651', desc: 'HWP Sergeant',        shifts: ['NS'] });
      supUnits.push({ cs: c + '661', desc: 'HWP Senior Sergeant', shifts: ['MS'] });
    }
    if (S.selected.has('trf')) {
      supUnits.push({ cs: 'TRF650', desc: 'State Highway Patrol — Sergeant',        shifts: ['MS', 'AS'] });
      supUnits.push({ cs: 'TRF651', desc: 'State Highway Patrol — Sergeant',        shifts: ['NS'] });
      supUnits.push({ cs: 'TRF661', desc: 'State Highway Patrol — Senior Sergeant', shifts: ['MS'] });
    }

    sections.push({ id: '_sup', icon: '⭐', name: 'Command & Supervision', units: supUnits, pool: null, note: supNote });
  }

  // ── Scalable services ──────────────────────────────────────────────────────
  const svcDefs = [
    {
      id: 'cars', icon: '🚗', name: 'Station Cars', pool: buildCarPool(c),
      note: `Sedans use 200–299. Trailing digit reflects shift start: ${c}20<strong>7</strong>=0700, ${c}20<strong>3</strong>=1500, ${c}21<strong>1</strong>=2300. Additional units increment from those bases.`,
    },
    {
      id: 'vans', icon: '🚐', name: 'Divisional Vans', pool: buildVanPool(c),
      note: `Vans use 300–399. Shift convention mirrors cars: 30<strong>7</strong>=morning, 30<strong>3</strong>=afternoon, 31<strong>1</strong>=night. Typically crewed by 2 officers and carry a prisoner cage.`,
    },
    {
      id: 'hwp', icon: '🚔', name: 'Highway Patrol',
      pool: S.hwpSolo ? [...buildHWPPool(c), ...buildHWPSoloUnits(c)] : buildHWPPool(c),
      note: `Local Highway Patrol uses the station code prefix. Marked cars 610–629, Q Cars (unmarked) 630–639 — one Q Car per three marked cars. Supervisors (SGT 650, S/SGT 661) appear in <strong>Command & Supervision</strong> above.${S.hwpSolo ? ' Solo motorcycle units (600–601) are included.' : ''}`,
    },
    {
      id: 'trf', icon: '🚓', name: 'State Highway Patrol',
      pool: S.trfSolo ? [...buildTRFPool(), ...buildTRFSoloUnits()] : buildTRFPool(),
      note: `State Highway Patrol uses the <strong>TRF</strong> prefix. Marked cars TRF610–629, Q Cars (unmarked) TRF630–639 — one Q Car per three marked cars. Supervisors (TRF650, TRF661) appear in <strong>Command & Supervision</strong> above.${S.trfSolo ? ' Solo motorcycle units (TRF600–603) are included.' : ''}`,
    },
    {
      id: 'ciu', icon: '🔍', name: 'CIU', pool: buildCIUPool(c),
      note: `CIU investigates serious crime. Morning: ${c}507. Afternoon: ${c}503/${c}520. Night: ${c}541–546 with supervisor at ${c}550. Fixed base at ${c}905.`,
    },
    {
      id: 'port', icon: '🛡️', name: 'PORT', pool: buildPORTPool(),
      note: `PORT (Public Order Response Team) uses the <strong>POR</strong> prefix — not the station code. General units 600–649, SGT 650–659, S/SGT 660–669. POR units operate across the region and are not station-specific.`,
    },
    {
      id: 'dss', icon: '🔧', name: 'District Support Services', pool: buildDSSPool(c),
      note: `District Support uses the station code prefix, range 700–799. Special duties 700–709, regional taskforces 700–729, events/emergency 730–739, foot patrol 740–744, licensing 745–749, bicycle 780–782, court/hospital guards 783–786.`,
    },
    {
      id: 'rru', icon: '⚡', name: 'RRU', pool: buildRRUPool(c),
      note: `RRU (440–449) provides operational support, allocated to specific operations or tasks. Fixed base at ${c}904.`,
    },
  ];

  svcDefs.forEach(def => {
    if (!S.selected.has(def.id)) return;
    const count = OVERRIDES[def.id] || defaultCount(def.id);
    sections.push({ ...def, units: def.pool, activeCount: count, scalable: true });
  });

  // ── Fixed-size services ────────────────────────────────────────────────────
  if (S.selected.has('pacer')) sections.push({
    id: 'pacer', icon: '🧠', name: 'PACER / MHaP', pool: null,
    units: [
      { cs: c + '290', desc: 'PACER / MHaP — Morning shift',   shifts: ['MS'] },
      { cs: c + '291', desc: 'PACER / MHaP — Afternoon shift', shifts: ['AS'] },
      { cs: c + '292', desc: 'PACER / MHaP — Night shift',     shifts: ['NS'] },
    ],
    note: 'Secondary unit for mental health related incidents. Provides on-site clinical assessment, de-escalation advice and referral support. Requested by the initial attending unit. Uses 290–292.',
  });

  if (S.selected.has('fviu')) sections.push({
    id: 'fviu', icon: '🏠', name: 'FVIU', pool: null,
    units: [
      { cs: c + '480', desc: 'FVIU Sergeant',                 shifts: ['MS', 'AS'] },
      { cs: c + '487', desc: 'FVIU Unit — Morning shift',     shifts: ['MS'] },
      { cs: c + '483', desc: 'FVIU Unit — Afternoon shift',   shifts: ['AS'] },
      { cs: c + '481', desc: 'FVIU Unit — Additional',        shifts: ['MS', 'AS'] },
      { cs: c + '490', desc: 'FVIU Detective Senior Sergeant',shifts: ['MS', 'AS'] },
      { cs: c + '499', desc: 'FVIU Court Liaison Officer',    shifts: ['MS', 'AS'] },
    ],
    note: 'Secondary response to family violence incidents within the PSA. Day/afternoon shifts only — no dedicated night unit. SGT at 480, S/SGT at 490, units 481–489, Court Liaison at 499.',
  });

  if (S.selected.has('socit')) sections.push({
    id: 'socit', icon: '👶', name: 'SOCIT', pool: null,
    units: [
      { cs: 'REG477', desc: 'SOCIT Unit — Morning shift',   shifts: ['MS'] },
      { cs: 'REG473', desc: 'SOCIT Unit — Afternoon shift', shifts: ['AS'] },
      { cs: 'REG471', desc: 'SOCIT Unit — Night shift',     shifts: ['NS'] },
      { cs: 'REG450', desc: 'SOCIT Sergeant',               shifts: ['MS', 'AS'] },
      { cs: 'REG460', desc: 'SOCIT Senior Sergeant',        shifts: ['MS', 'AS'] },
    ],
    note: 'SOCIT provides initial response to sexual/physical assaults on children or families. Regional (REG) prefix. Units 470–499, SGT 450–459, S/SGT 460–469.',
  });

  if (S.selected.has('dog')) sections.push({
    id: 'dog', icon: '🐕', name: 'Dog Squad (CAN)', pool: null,
    units: [
      { cs: 'CAN207', desc: 'Canine Unit — Morning shift',           shifts: ['MS'] },
      { cs: 'CAN203', desc: 'Canine Unit — Afternoon shift',         shifts: ['AS'] },
      { cs: 'CAN211', desc: 'Canine Unit — Night shift',             shifts: ['NS'] },
      { cs: 'CAN700', desc: 'Canine — Narcotics / Training specialty', shifts: ['MS', 'AS'] },
    ],
    note: 'CAN prefix regardless of station. Numbers follow standard shift convention. CAN700 = narcotics/training specialty.',
  });

  if (S.selected.has('sar')) sections.push({
    id: 'sar', icon: '🔦', name: 'Search & Rescue (RES)', pool: null,
    units: [
      { cs: 'RES400', desc: 'SAR Unit — General',  shifts: ['MS', 'AS'] },
      { cs: 'RES410', desc: 'SAR Field Team',       shifts: ['MS', 'AS', 'NS'] },
      { cs: 'RES451', desc: 'SAR Sergeant',         shifts: ['MS', 'AS'] },
    ],
    note: 'RES prefix, range 400–459. Responds to missing persons, bushland searches and maritime incidents. Often activated on callout.',
  });

  if (S.selected.has('transit')) sections.push({
    id: 'transit', icon: '🚆', name: 'Transit Police (TST)', pool: null,
    units: [
      { cs: 'TST271', desc: 'Transit Unit',                    shifts: ['MS', 'AS'] },
      { cs: 'TST275', desc: 'Transit Unit',                    shifts: ['AS', 'NS'] },
      { cs: 'TST250', desc: 'Transit Sergeant',                shifts: ['MS', 'AS'] },
      { cs: 'TST260', desc: 'Transit Senior Sergeant',         shifts: ['MS'] },
      { cs: 'TST910', desc: 'Metrol Control Centre (fixed)',   shifts: ['FIXED'] },
      { cs: 'TST912', desc: 'Tram Control Centre (fixed)',     shifts: ['FIXED'] },
    ],
    note: 'TST prefix. Units 270–389, SGT 250–259, S/SGT 260–269. Fixed bases: TST910 (Metrol), TST912 (Tram).',
  });

  if (S.selected.has('sog')) sections.push({
    id: 'sog', icon: '🦅', name: 'SOG (Special Operations Group)', pool: null,
    units: [
      { cs: 'SCY200', desc: 'Special Operations Group Unit',            shifts: ['MS', 'AS', 'NS'] },
      { cs: 'SCY210', desc: 'Special Operations Group Unit',            shifts: ['MS', 'AS', 'NS'] },
      { cs: 'SCY250', desc: 'SOG Sergeant',                            shifts: ['MS', 'AS'] },
    ],
    note: 'SOG uses the SCY prefix. State-wide specialist tactical resource — deployed as required, not station-specific.',
  });

  if (S.selected.has('cirt')) sections.push({
    id: 'cirt', icon: '🎯', name: 'CIRT (Critical Incident Response Team)', pool: null,
    units: [
      { cs: 'CIR200', desc: 'CIRT Unit', shifts: ['MS', 'AS', 'NS'] },
      { cs: 'CIR210', desc: 'CIRT Unit', shifts: ['MS', 'AS', 'NS'] },
      { cs: 'CIR250', desc: 'CIRT Sergeant', shifts: ['MS', 'AS'] },
    ],
    note: 'CIRT uses the CIR prefix, range 200–899. Deployed for critical incidents requiring specialist negotiation and response capability. Region-wide asset.',
  });

  if (S.selected.has('polair')) sections.push({
    id: 'polair', icon: '🚁', name: 'POLAIR', pool: null,
    units: [
      { cs: 'POLAIR30', desc: 'Rotary Wing (Helicopter) — Primary',   shifts: ['MS', 'AS', 'NS'] },
      { cs: 'POLAIR31', desc: 'Rotary Wing (Helicopter) — Secondary', shifts: ['AS', 'NS'] },
      { cs: 'POLAIR35', desc: 'Fixed Wing (Plane)',                    shifts: ['MS', 'AS'] },
      { cs: 'AIR451',   desc: 'Air Sergeant',                         shifts: ['MS', 'AS'] },
      { cs: 'AIR46',    desc: 'Air Senior Sergeant',                   shifts: ['MS'] },
    ],
    note: 'POLAIR30–32 (rotary), POLAIR35 (fixed wing). Used for patrol, traffic, search/rescue, fire observation and urgent transport. State-wide asset.',
  });

  if (S.selected.has('hviu')) sections.push({
    id: 'hviu', icon: '🚛', name: 'Heavy Vehicle Unit (ROA)', pool: null,
    units: [
      { cs: 'ROA501', desc: 'Heavy Vehicle Unit',       shifts: ['MS', 'AS'] },
      { cs: 'ROA503', desc: 'Heavy Vehicle Unit',       shifts: ['AS'] },
      { cs: 'ROA550', desc: 'Heavy Vehicle Supervisor', shifts: ['MS'] },
    ],
    note: 'ROA prefix, range 501–505. Compliance and enforcement targeting heavy vehicles.',
  });

  if (S.selected.has('mounted')) sections.push({
    id: 'mounted', icon: '🐴', name: 'Mounted Branch (MOU)', pool: null,
    units: [
      { cs: 'MOU800', desc: 'Mounted Unit — Primary',   shifts: ['MS', 'AS'] },
      { cs: 'MOU810', desc: 'Mounted Unit — Secondary', shifts: ['AS'] },
      { cs: 'MOU850', desc: 'Mounted Sergeant',         shifts: ['MS', 'AS'] },
    ],
    note: 'MOU prefix, range 800–899. High-visibility patrol and crowd control. State-wide asset.',
  });

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
    return a + (sec.scalable ? (OVERRIDES[sec.id] || defaultCount(sec.id)) : sec.units.length);
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
    const count      = isScalable ? (OVERRIDES[sec.id] || defaultCount(sec.id)) : sec.units.length;
    const maxCount   = isScalable ? (MAX_UNITS[sec.id] || sec.units.length) : sec.units.length;

    let rows = '';
    sec.units.forEach((u, i) => {
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
        <span class="svc-block-name">${sec.name}</span>
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
    return a + (s.scalable ? (OVERRIDES[s.id] || defaultCount(s.id)) : s.units.length);
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
  exp += `Role     : ${roleLabel}\nUnits    : ${sections.reduce((a, s) => a + (s.scalable ? (OVERRIDES[s.id] || defaultCount(s.id)) : s.units.length), 0)}\n${'─'.repeat(46)}\n\n`;

  sections.forEach(sec => {
    const count = sec.scalable ? (OVERRIDES[sec.id] || defaultCount(sec.id)) : sec.units.length;
    exp += `${sec.name.toUpperCase()}\n`;
    sec.units.slice(0, count).forEach(u => { exp += `  ${u.cs.padEnd(12)} ${u.desc}\n`; });
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
