// =============================================================================
// data.js — VicPol CAD Lineup Generator
// Static data: region/station structure, service definitions, unit pool
// builders, and default unit counts.
//
// To add stations:        edit stations.csv (loaded at runtime by app.js)
// To add a service type:  add an entry to SERVICES and a block in app.js
// To adjust unit counts:  edit DEFAULTS below
// =============================================================================


// =============================================================================
// REGION DATA — structural fallback template
// Real station entries are populated at runtime from stations.csv.
// Inline entries use the pipe format: CODE|Name|DivCode|PSA|HWP|CIU|classification
// =============================================================================
const REGION_DATA = {
  N: {
    label: 'North West Metro',
    divisions: {
      'Melbourne (ND1)':     ['TBC|Station TBC|ND1||||metro_24', 'TBC|Station TBC|ND1||||metro_24'],
      'Westgate (ND2)':      ['TBC|Station TBC|ND2||||metro_24', 'TBC|Station TBC|ND2||||metro_24'],
      'Brimbank (ND3)':      ['TBC|Station TBC|ND3||||metro_24', 'TBC|Station TBC|ND3||||metro_24'],
      'Fawkner (ND4)':       ['TBC|Station TBC|ND4||||metro_24', 'TBC|Station TBC|ND4||||metro_24'],
      'Diamond Creek (ND5)': ['TBC|Station TBC|ND5||||metro_24', 'TBC|Station TBC|ND5||||metro_24'],
    }
  },
  S: {
    label: 'Southern Metro',
    divisions: {
      'Prahran (SD1)':   ['TBC|Station TBC|SD1||||metro_24', 'TBC|Station TBC|SD1||||metro_24'],
      'Moorabbin (SD2)': ['TBC|Station TBC|SD2||||metro_24', 'TBC|Station TBC|SD2||||metro_24'],
      'Dandenong (SD3)': ['TBC|Station TBC|SD3||||metro_24', 'TBC|Station TBC|SD3||||metro_24'],
      'Frankston (SD4)': ['TBC|Station TBC|SD4||||metro_24', 'TBC|Station TBC|SD4||||metro_24'],
    }
  },
  E: {
    label: 'Eastern',
    divisions: {
      'Nunawading (ED1)':      ['TBC|Station TBC|ED1||||metro_24', 'TBC|Station TBC|ED1||||metro_24'],
      'Knox (ED2)':            ['TBC|Station TBC|ED2||||metro_24', 'TBC|Station TBC|ED2||||metro_24'],
      'Goulburn Valley (ED3)': ['TBC|Station TBC|ED3||||regional_24', 'TBC|Station TBC|ED3||||regional_24'],
      'Wangaratta (ED4)':      ['TBC|Station TBC|ED4||||regional_24', 'TBC|Station TBC|ED4||||regional_24'],
      'Morwell (ED5)':         ['TBC|Station TBC|ED5||||regional_24', 'TBC|Station TBC|ED5||||regional_24'],
      'Bairnsdale (ED6)':      ['TBC|Station TBC|ED6||||regional_24', 'TBC|Station TBC|ED6||||regional_24'],
    }
  },
  W: {
    label: 'Western',
    divisions: {
      'Geelong (WD1)':     ['TBC|Station TBC|WD1||||regional_24', 'TBC|Station TBC|WD1||||regional_24'],
      'Warrnambool (WD2)': ['TBC|Station TBC|WD2||||regional_24', 'TBC|Station TBC|WD2||||regional_24'],
      'Ballarat (WD3)':    ['TBC|Station TBC|WD3||||regional_24', 'TBC|Station TBC|WD3||||regional_24'],
      'Horsham (WD4)':     ['TBC|Station TBC|WD4||||regional_non24', 'TBC|Station TBC|WD4||||regional_non24'],
      'Bendigo (WD5)':     ['TBC|Station TBC|WD5||||regional_24', 'TBC|Station TBC|WD5||||regional_24'],
      'Mildura (WD6)':     ['TBC|Station TBC|WD6||||regional_24', 'TBC|Station TBC|WD6||||regional_24'],
    }
  }
};

// Parse a pipe-delimited station entry string into a station object.
// Format: CODE|Name|DivCode|PSA|HWP|CIU|classification
function parseStation(s) {
  const p = s.split('|');
  return {
    code:           p[0] || '',
    name:           p[1] || '',
    div:            p[2] || '',
    psa:            p[3] || '',
    hwp:            p[4] || '',
    ciu:            p[5] || '',
    classification: p[6] || 'metro_24',
  };
}


// =============================================================================
// SERVICES — available unit types shown in step 2
// id:   unique key used throughout the app
// icon: emoji shown in the service selection grid
// name: display label
// desc: short description shown under the name
// =============================================================================
const SERVICES = [
  { id: 'cars',    icon: '🚗', name: 'Station Cars',             desc: 'General duties sedans. 200–299.' },
  { id: 'vans',    icon: '🚐', name: 'Divisional Vans',          desc: 'Cage vans for prisoner transport. 300–399.' },
  { id: 'hwp',     icon: '🚔', name: 'Highway Patrol',            desc: 'Local HWP — marked & unmarked cars. Station code, 610–669.' },
  { id: 'trf',     icon: '🚓', name: 'State Highway Patrol',      desc: 'State HWP — marked & unmarked cars. TRF prefix, 610–669.' },
  { id: 'port',    icon: '🛡️', name: 'PORT',                      desc: 'Public Order Response Team. POR prefix, 600–899.' },
  { id: 'dss',     icon: '🔰', name: 'District Support Services',  desc: 'Support & special duties units. Station code, 700–899.' },
  { id: 'ciu',     icon: '🔍', name: 'CIU',                      desc: 'Criminal Investigation Unit. 500–599.' },
  { id: 'fviu',    icon: '🏠', name: 'FVIU',                     desc: 'Family Violence Investigation Unit. 480–499.' },
  { id: 'socit',   icon: '👶', name: 'SOCIT',                    desc: 'Sexual Offences & Child Investigations. 450–499.' },
  { id: 'rru',     icon: '⚡', name: 'RRU',                      desc: 'Regional Response Unit. 440–449.' },
  { id: 'dog',     icon: '🐕', name: 'Dog Squad',           desc: 'Canine unit. Uses CAN prefix.' },
  { id: 'sar',     icon: '🔦', name: 'Search & Rescue',     desc: 'Search & rescue. RES prefix, 400–459.' },
  { id: 'sog',     icon: '🦅', name: 'SOG',                       desc: 'Special Operations Group. SCY prefix.' },
  { id: 'cirt',    icon: '🎯', name: 'CIRT',                      desc: 'Critical Incident Response Team. CIR prefix, 200–899.' },
  { id: 'polair',  icon: '🚁', name: 'Air Wing',                   desc: 'Helicopters and fixed wing aircraft.' },
  { id: 'hviu',    icon: '🚛', name: 'Heavy Vehicle Unit',  desc: 'Heavy vehicle enforcement. ROA prefix.' },
  { id: 'mounted', icon: '🐴', name: 'Mounted Branch',      desc: 'Mounted unit. MOU prefix, 800–899.' },
];


// =============================================================================
// DEFAULT UNIT COUNTS — per classification, per scalable service
// Adjust these to change how many units are generated by default.
// Users can always override with the sliders on the output page.
// =============================================================================
// metro_24      — Metropolitan, 24-hour station (e.g. Box Hill, Dandenong)
// metro_non24   — Metropolitan, non-24-hour station (e.g. Brunswick, Rowville)
// regional_24   — Regional, 24-hour hub station (e.g. Bendigo, Geelong)
// regional_non24— Regional, non-24-hour station (e.g. Bright, Yarrawonga)
const DEFAULTS = {
  metro_24:       { cars: 12, vans: 6, hwp: 10, trf: 10, ciu: 10, rru: 5 },
  metro_non24:    { cars: 7,  vans: 3, hwp: 5,  trf: 5,  ciu: 5,  rru: 3 },
  regional_24:    { cars: 9,  vans: 4, hwp: 7,  trf: 6,  ciu: 7,  rru: 4 },
  regional_non24: { cars: 3,  vans: 2, hwp: 2,  trf: 2,  ciu: 2,  rru: 2 },
  regional_single:{ cars: 1,  vans: 1, hwp: 1,  trf: 1,  ciu: 1,  rru: 1 },
};

// Maximum units each scalable service pool can produce.
// Should match the pool sizes in the builders below.
const MAX_UNITS = { cars: 15, vans: 6, hwp: 24, trf: 24, ciu: 10, rru: 5 };


// =============================================================================
// HELPERS — used by pool builders
// =============================================================================

// Fisher-Yates in-place shuffle. Returns the same array.
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Interleave three shift buckets into MS → AS → NS → MS → AS → NS order.
// 'fixed' items are always appended at the end, unchanged.
function interleave(ms, as, ns, fixed = []) {
  const out = [];
  const max = Math.max(ms.length, as.length, ns.length);
  for (let i = 0; i < max; i++) {
    if (i < ms.length) out.push(ms[i]);
    if (i < as.length) out.push(as[i]);
    if (i < ns.length) out.push(ns[i]);
  }
  return out.concat(fixed);
}


// =============================================================================
// UNIT POOL BUILDERS
// Each function builds the full pool for a given scalable service.
// Numbers within each shift bucket are shuffled on every call so each
// generation produces a different but valid lineup.
// The interleaved MS → AS → NS ordering is always preserved so the slider
// gives a balanced spread across all shifts at any count.
// =============================================================================

function buildCarPool(c) {
  const ms = shuffle([201, 204, 207, 208, 205].map(n => ({ cs: c + n, desc: 'Station Car — Morning shift (0700)',   shifts: ['MS'] })));
  const as = shuffle([203, 206, 209, 202, 210].map(n => ({ cs: c + n, desc: 'Station Car — Afternoon shift (1500)', shifts: ['AS'] })));
  const ns = shuffle([211, 214, 217, 212, 215].map(n => ({ cs: c + n, desc: 'Station Car — Night shift (2300)',     shifts: ['NS'] })));
  return interleave(ms, as, ns);
}

function buildVanPool(c) {
  const ms = shuffle([307, 308].map(n => ({ cs: c + n, desc: 'Divisional Van — Morning shift (0700)',   shifts: ['MS'] })));
  const as = shuffle([303, 304].map(n => ({ cs: c + n, desc: 'Divisional Van — Afternoon shift (1500)', shifts: ['AS'] })));
  const ns = shuffle([311, 312].map(n => ({ cs: c + n, desc: 'Divisional Van — Night shift (2300)',     shifts: ['NS'] })));
  return interleave(ms, as, ns);
}

// buildHWPPool — patrol cars, Q cars, complaints, special duties, SGT/S/SGT.
// Pattern: MS, AS, NS, Q repeating (1 Q per 3 marked).
// Supervisors, complaints and special duties appear at progressively higher counts.
function buildHWPPool(c) {
  const ms  = shuffle([611, 612, 613, 614].map(n => ({ cs: c + n, desc: 'HWP Marked Car',          shifts: ['MS'] })));
  const as  = shuffle([616, 617, 618, 619].map(n => ({ cs: c + n, desc: 'HWP Marked Car',          shifts: ['AS'] })));
  const ns  = shuffle([621, 622, 623, 624].map(n => ({ cs: c + n, desc: 'HWP Marked Car',          shifts: ['NS'] })));
  const q   = shuffle([630, 631, 632, 633].map(n => ({ cs: c + n, desc: 'HWP Q Car (unmarked)',    shifts: ['MS', 'AS'] })));
  const cmp = shuffle([640, 641, 642, 643].map(n => ({ cs: c + n, desc: 'HWP Complaints',          shifts: ['MS', 'AS'] })));
  const spd = shuffle([670, 671, 672, 673, 674, 675].map(n => ({ cs: c + n, desc: 'HWP Special Duties', shifts: ['MS', 'AS'] })));
  const sgt = [
    { cs: c + shuffle([650, 651, 652, 653])[0], desc: 'HWP Sergeant',        shifts: ['MS', 'AS'] },
    { cs: c + shuffle([654, 655, 656, 657])[0], desc: 'HWP Sergeant',        shifts: ['NS'] },
    { cs: c + shuffle([660, 661, 662, 663])[0], desc: 'HWP Senior Sergeant', shifts: ['MS'] },
  ];
  return [
    ms[0], as[0], ns[0], q[0],   //  1–4  : core patrol
    ms[1], as[1], ns[1], q[1],   //  5–8
    ms[2], as[2], ns[2], q[2],   //  9–12
    ms[3], as[3], ns[3], q[3],   // 13–16 : extended patrol
    ...sgt,                       // 17–19 : supervisors
    cmp[0], cmp[1],              // 20–21 : complaints
    spd[0], spd[1],              // 22–23 : special duties
    { cs: c + '906', desc: 'HWP Base Station (fixed)', shifts: ['FIXED'] },
  ];
}

// HWP solo — built separately; appended only when user opts in
function buildHWPSoloUnits(c) {
  return shuffle([600, 601, 602, 603]).map(n => ({ cs: c + n, desc: 'HWP Solo Motorcycle', shifts: ['MS', 'AS'] }));
}

// buildTRFPool — same structure as HWP but with TRF prefix.
// Supervisors, complaints and special duties at higher slider counts.
function buildTRFPool() {
  const ms  = shuffle([611, 612, 613, 614].map(n => ({ cs: 'TRF' + n, desc: 'State Highway Patrol — Marked Car',          shifts: ['MS'] })));
  const as  = shuffle([616, 617, 618, 619].map(n => ({ cs: 'TRF' + n, desc: 'State Highway Patrol — Marked Car',          shifts: ['AS'] })));
  const ns  = shuffle([621, 622, 623, 624].map(n => ({ cs: 'TRF' + n, desc: 'State Highway Patrol — Marked Car',          shifts: ['NS'] })));
  const q   = shuffle([630, 631, 632, 633].map(n => ({ cs: 'TRF' + n, desc: 'State Highway Patrol — Q Car (unmarked)',    shifts: ['MS', 'AS'] })));
  const cmp = shuffle([640, 641, 642, 643].map(n => ({ cs: 'TRF' + n, desc: 'State Highway Patrol — Complaints',          shifts: ['MS', 'AS'] })));
  const spd = shuffle([670, 671, 672, 673, 674, 675].map(n => ({ cs: 'TRF' + n, desc: 'State Highway Patrol — Special Duties', shifts: ['MS', 'AS'] })));
  const sgt = [
    { cs: 'TRF' + shuffle([650, 651, 652, 653])[0], desc: 'State Highway Patrol — Sergeant',        shifts: ['MS', 'AS'] },
    { cs: 'TRF' + shuffle([654, 655, 656, 657])[0], desc: 'State Highway Patrol — Sergeant',        shifts: ['NS'] },
    { cs: 'TRF' + shuffle([660, 661, 662, 663])[0], desc: 'State Highway Patrol — Senior Sergeant', shifts: ['MS'] },
  ];
  return [
    ms[0], as[0], ns[0], q[0],
    ms[1], as[1], ns[1], q[1],
    ms[2], as[2], ns[2], q[2],
    ms[3], as[3], ns[3], q[3],
    ...sgt,
    cmp[0], cmp[1],
    spd[0], spd[1],
    { cs: 'TRF906', desc: 'State Highway Patrol Base (fixed)', shifts: ['FIXED'] },
  ];
}

// TRF solo — built separately; appended only when user opts in
function buildTRFSoloUnits() {
  return shuffle([600, 601, 602, 603]).map(n => ({
    cs: 'TRF' + n, desc: 'State Highway Patrol Solo — Motorcycle', shifts: ['MS', 'AS'],
  }));
}

function buildCIUPool(c) {
  const ms = shuffle([507, 508].map(n =>        ({ cs: c + n, desc: 'CIU — Morning shift',   shifts: ['MS'] })));
  const as = shuffle([503, 504, 520].map(n =>   ({ cs: c + n, desc: 'CIU — Afternoon shift', shifts: ['AS'] })));
  const ns = shuffle([541, 542, 543].map(n =>   ({ cs: c + n, desc: 'CIU — Night shift',     shifts: ['NS'] })));
  const fixed = [
    { cs: c + '550', desc: 'CIU Night Supervisor',     shifts: ['NS'] },
    { cs: c + '905', desc: 'CIU Base Station (fixed)', shifts: ['FIXED'] },
  ];
  return interleave(ms, as, ns, fixed);
}

// PORT uses the POR prefix (not station code) — range 600–899
function buildPORTPool() {
  const ms = shuffle([601, 602, 603].map(n => ({ cs: 'POR' + n, desc: 'PORT Unit — General duties', shifts: ['MS', 'AS'] })));
  const as = shuffle([610, 611, 612].map(n => ({ cs: 'POR' + n, desc: 'PORT Unit — General duties', shifts: ['AS', 'NS'] })));
  const ns = shuffle([620, 621].map(n =>       ({ cs: 'POR' + n, desc: 'PORT Unit — General duties', shifts: ['NS'] })));
  const fixed = [
    { cs: 'POR650', desc: 'PORT Sergeant',       shifts: ['MS', 'AS'] },
    { cs: 'POR651', desc: 'PORT Sergeant',        shifts: ['NS'] },
    { cs: 'POR660', desc: 'PORT Senior Sergeant', shifts: ['MS'] },
    { cs: 'POR700', desc: 'PORT Base (fixed)',    shifts: ['FIXED'] },
  ];
  return interleave(ms, as, ns, fixed);
}

// District Support Services uses station code — range 700–899
function buildDSSPool(c) {
  const ms    = shuffle([700, 710, 750].map(n => ({ cs: c + n, desc: 'Special Duties',                       shifts: ['MS', 'AS'] })));
  const as    = shuffle([730, 731].map(n =>       ({ cs: c + n, desc: 'Special Events / Emergency Response', shifts: ['AS', 'NS'] })));
  const mixed = shuffle([740, 741, 745, 780].map(n => ({
    cs: c + n,
    desc: n === 740 || n === 741 ? 'Foot Patrol' : n === 745 ? 'Licensing Unit' : 'Bicycle Patrol',
    shifts: n === 741 ? ['AS'] : ['MS', 'AS'],
  })));
  const fixed = [
    { cs: c + '783', desc: 'Court Security Guard',                       shifts: ['MS', 'AS'] },
    { cs: c + '785', desc: 'Hospital Guard',                             shifts: ['MS', 'AS', 'NS'] },
    { cs: c + '920', desc: 'DOSO — District Operational Support Office', shifts: ['MS'] },
  ];
  return interleave(ms, as, mixed, fixed);
}

function buildRRUPool(c) {
  const ms = [{ cs: c + '440', desc: 'RRU — Morning shift',   shifts: ['MS'] }];
  const as = [{ cs: c + '441', desc: 'RRU — Afternoon shift', shifts: ['AS'] }];
  const ns = [{ cs: c + '442', desc: 'RRU — Night shift',     shifts: ['NS'] }];
  const fixed = [
    { cs: c + '443', desc: 'RRU — Additional unit',        shifts: ['MS', 'AS'] },
    { cs: c + '904', desc: 'RRU Base Station (fixed)',      shifts: ['FIXED'] },
  ];
  return interleave(ms, as, ns, fixed);
}
