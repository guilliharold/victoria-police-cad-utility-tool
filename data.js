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
// Inline entries use the pipe format: CODE|Name|DivCode|PSA|PSALabel|HWP|HWPLabel|CIU|CIULabel|Services|classification
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
// Format: CODE|Name|DivCode|PSA|PSALabel|HWP|HWPLabel|CIU|CIULabel|Services|classification
function parseStation(s) {
  const p = s.split('|');
  return {
    code:           p[0] || '',
    name:           p[1] || '',
    div:            p[2] || '',
    psa:            p[3] || '',
    psaLabel:       p[4] || '',
    hwp:            p[5] || '',
    hwpLabel:       p[6] || '',
    ciu:            p[7] || '',
    ciuLabel:       p[8] || '',
    services:       p[9] || '',
    classification: p[10] || 'metro_24',
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
  { id: 'hwp',     icon: '🚔', name: 'Highway Patrol',            desc: 'Local HWP — marked cars 610–629, Q cars 630–639.' },
  { id: 'trf',     icon: '🚓', name: 'State Highway Patrol',      desc: 'State HWP — TRF prefix, marked cars 610–629, Q cars 630–639.' },
  { id: 'port',    icon: '🛡️', name: 'PORT',                      desc: 'Public Order Response Team. POR prefix, 600–899.' },
  { id: 'ciu',     icon: '🔍', name: 'CIU',                      desc: 'Criminal Investigation Unit. 500–599.' },
  { id: 'fviu',    icon: '🏠', name: 'FVIU',                     desc: 'Family Violence Investigation Unit. 480–499.' },
  { id: 'socit',   icon: '👶', name: 'SOCIT',                    desc: 'Sexual Offences & Child Investigations. 450–499.' },
  { id: 'rru',     icon: '⚡', name: 'RRU',                      desc: 'Regional Response Unit. 440–449.' },
  { id: 'dog',     icon: '🐕', name: 'Dog Squad',           desc: 'Canine unit. Uses CAN prefix.' },
  { id: 'sar',     icon: '🔦', name: 'Search & Rescue',     desc: 'Search & rescue. RES prefix, 400–459.' },
  { id: 'sog',     icon: '🦅', name: 'SOG',                       desc: 'Special Operations Group. SCY prefix.' },
  { id: 'cirt',    icon: '🎯', name: 'CIRT',                      desc: 'Critical Incident Response Team. CIR prefix, 200–899.' },
  { id: 'hviu',    icon: '🚛', name: 'Heavy Vehicle Unit',  desc: 'Heavy vehicle enforcement. ROA prefix.' },
  { id: 'mounted', icon: '🐴', name: 'Mounted Branch',      desc: 'Mounted unit. MOU prefix, 800–899.' },
  { id: 'cri',     icon: '📷', name: 'Crime Desk',           desc: 'Crime scene coordination, photography & forensics. CRI prefix, 571–579.' },
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
  metro_24:       { cars: 12, vans: 6, hwp: 10, trf: 10, ciu: 10, rru: 5, hwp_solo: 2, trf_solo: 2, fviu: 3, socit: 3, dog: 2, sar: 2, sog: 2, cirt: 2, hviu: 3, mounted: 2, cri: 3 },
  metro_non24:    { cars: 7,  vans: 3, hwp: 5,  trf: 5,  ciu: 5,  rru: 3, hwp_solo: 1, trf_solo: 1, fviu: 2, socit: 2, dog: 1, sar: 1, sog: 1, cirt: 1, hviu: 2, mounted: 1, cri: 2 },
  regional_24:    { cars: 9,  vans: 4, hwp: 7,  trf: 6,  ciu: 7,  rru: 4, hwp_solo: 2, trf_solo: 2, fviu: 2, socit: 2, dog: 2, sar: 2, sog: 2, cirt: 2, hviu: 2, mounted: 2, cri: 2 },
  regional_non24: { cars: 3,  vans: 2, hwp: 2,  trf: 2,  ciu: 2,  rru: 2, hwp_solo: 1, trf_solo: 1, fviu: 1, socit: 1, dog: 1, sar: 1, sog: 1, cirt: 1, hviu: 1, mounted: 1, cri: 1 },
  regional_single:{ cars: 1,  vans: 1, hwp: 1,  trf: 1,  ciu: 1,  rru: 1, hwp_solo: 1, trf_solo: 1, fviu: 1, socit: 1, dog: 1, sar: 1, sog: 1, cirt: 1, hviu: 1, mounted: 1, cri: 1 },
};

// Maximum units each scalable service pool can produce.
// Should match the pool sizes in the builders below.
const MAX_UNITS = {
  cars: 15, vans: 6, hwp: 23, trf: 23, ciu: 11, rru: 5, hwp_solo: 4, trf_solo: 4,
  fviu: 10, socit: 10, dog: 10, sar: 8, sog: 8, cirt: 8, hviu: 6, mounted: 6, cri: 7,
};


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
  // CAD doc: 207=MS anchor, 203=AS anchor, 211=NS anchor. Additional units spread within 200–299.
  const ms = shuffle([207, 208, 209, 204, 205].map(n => ({ cs: c + n, desc: 'Station Car — Morning shift (0700)',   shifts: ['MS'] })));
  const as = shuffle([203, 202, 206, 201, 210].map(n => ({ cs: c + n, desc: 'Station Car — Afternoon shift (1500)', shifts: ['AS'] })));
  const ns = shuffle([211, 212, 213, 214, 215].map(n => ({ cs: c + n, desc: 'Station Car — Night shift (2300)',     shifts: ['NS'] })));
  return interleave(ms, as, ns);
}

function buildVanPool(c) {
  // CAD doc: 307=MS anchor, 303=AS anchor, 311=NS anchor.
  const ms = shuffle([307, 308].map(n => ({ cs: c + n, desc: 'Divisional Van — Morning shift (0700)',   shifts: ['MS'] })));
  const as = shuffle([303, 304].map(n => ({ cs: c + n, desc: 'Divisional Van — Afternoon shift (1500)', shifts: ['AS'] })));
  const ns = shuffle([311, 312].map(n => ({ cs: c + n, desc: 'Divisional Van — Night shift (2300)',     shifts: ['NS'] })));
  return interleave(ms, as, ns);
}

// buildHWPPool — patrol cars, Q cars, special duties, SGT/S/SGT.
// Pattern: MS, AS, NS, Q repeating (1 Q per 3 marked).
// SGT/S/SGT tagged SUP so they are lifted into Command & Supervision.
// Special duties appear at higher counts.
function buildHWPPool(c) {
  // CAD doc ranges: 610–629 marked cars, 630–639 Q cars (unmarked),
  // 650–659 SGT, 660–669 S/SGT, 670–699 special duties.
  // No NS sub-range is defined — 610–629 spans all shifts.
  const marked = shuffle([611, 612, 613, 614, 615, 616, 617, 618, 619, 620, 621, 622, 623, 624, 625, 626].map(
    n => ({ cs: c + n, desc: 'HWP Marked Car', shifts: ['MS', 'AS', 'NS'] })
  ));
  const q   = shuffle([630, 631, 632, 633, 634, 635].map(n => ({ cs: c + n, desc: 'HWP Q Car (unmarked)',    shifts: ['MS', 'AS'] })));
  const spd = shuffle([670, 671, 672, 673, 674, 675].map(n => ({ cs: c + n, desc: 'HWP Special Duties',     shifts: ['MS', 'AS'] })));
  const sgt = [
    { cs: c + '650', desc: 'HWP Sergeant',        shifts: ['SUP'] },
    { cs: c + '651', desc: 'HWP Sergeant',        shifts: ['SUP'] },
    { cs: c + '660', desc: 'HWP Senior Sergeant', shifts: ['SUP'] },
  ];
  return [
    marked[0], marked[1], marked[2], marked[3], q[0],   //  1–5  : core patrol
    marked[4], marked[5], marked[6], marked[7], q[1],   //  6–10
    marked[8], marked[9], marked[10], marked[11], q[2], // 11–15
    marked[12], marked[13], q[3],                       // 16–18 : extended patrol
    ...sgt,                                             // 19–21 : supervisors (lifted to Command & Supervision)
    spd[0], spd[1],                                     // 22–23 : special duties
    { cs: c + '906', desc: 'HWP Base Station (fixed)', shifts: ['FIXED'] },
  ];
}

// HWP solo — built separately; appended only when user opts in.
// Uses hwpPrefix (same as main HWP pool) so metro stations get NML600, not NMW600.
function buildHWPSoloUnits(hwpPrefix) {
  return shuffle([600, 601, 602, 603]).map(n => ({ cs: hwpPrefix + n, desc: 'HWP Solo Motorcycle', shifts: ['MS', 'AS'] }));
}

// buildTRFPool — same structure as HWP but with TRF prefix.
// SGT/S/SGT tagged SUP so they are lifted into Command & Supervision.
// Special duties appear at higher counts.
// Note: TRF is a state-level unit; no dedicated base station callsign exists in the CAD doc.
function buildTRFPool() {
  // CAD doc ranges: 610–629 marked cars, 630–639 Q cars,
  // 650–659 SGT, 660–669 S/SGT, 670–699 special duties.
  const marked = shuffle([611, 612, 613, 614, 615, 616, 617, 618, 619, 620, 621, 622, 623, 624, 625, 626].map(
    n => ({ cs: 'TRF' + n, desc: 'State Highway Patrol — Marked Car', shifts: ['MS', 'AS', 'NS'] })
  ));
  const q   = shuffle([630, 631, 632, 633, 634, 635].map(n => ({ cs: 'TRF' + n, desc: 'State Highway Patrol — Q Car (unmarked)',    shifts: ['MS', 'AS'] })));
  const spd = shuffle([670, 671, 672, 673, 674, 675].map(n => ({ cs: 'TRF' + n, desc: 'State Highway Patrol — Special Duties',     shifts: ['MS', 'AS'] })));
  const sgt = [
    { cs: 'TRF650', desc: 'State Highway Patrol — Sergeant',        shifts: ['SUP'] },
    { cs: 'TRF651', desc: 'State Highway Patrol — Sergeant',        shifts: ['SUP'] },
    { cs: 'TRF660', desc: 'State Highway Patrol — Senior Sergeant', shifts: ['SUP'] },
  ];
  return [
    marked[0], marked[1], marked[2], marked[3], q[0],
    marked[4], marked[5], marked[6], marked[7], q[1],
    marked[8], marked[9], marked[10], marked[11], q[2],
    marked[12], marked[13], q[3],
    ...sgt,
    spd[0], spd[1],
  ];
}

// TRF solo — built separately; appended only when user opts in
function buildTRFSoloUnits() {
  return shuffle([600, 601, 602, 603]).map(n => ({
    cs: 'TRF' + n, desc: 'State Highway Patrol Solo — Motorcycle', shifts: ['MS', 'AS'],
  }));
}

function buildCIUPool(c) {
  // CAD doc: MS=507, AS=503/520, NS=541–546, night supervisor=550, base=905.
  const ms = [{ cs: c + '507', desc: 'CIU — Morning shift',   shifts: ['MS'] }];
  const as = shuffle([503, 520].map(n =>        ({ cs: c + n, desc: 'CIU — Afternoon shift', shifts: ['AS'] })));
  const ns = shuffle([541, 542, 543, 544, 545, 546].map(n => ({ cs: c + n, desc: 'CIU — Night shift', shifts: ['NS'] })));
  const fixed = [
    { cs: c + '550', desc: 'CIU Night Supervisor',     shifts: ['SUP'] },
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
    { cs: 'POR650', desc: 'PORT Sergeant',       shifts: ['SUP'] },
    { cs: 'POR651', desc: 'PORT Sergeant',        shifts: ['SUP'] },
    { cs: 'POR660', desc: 'PORT Senior Sergeant', shifts: ['SUP'] },
    { cs: 'POR700', desc: 'PORT Base (fixed)',    shifts: ['FIXED'] },
  ];
  return interleave(ms, as, ns, fixed);
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

function buildFVIUPool(c) {
  // CAD doc: SGT 480, DET/S/SGT 490, Court Liaison 499.
  // Units 481–489: MS anchor 487, AS anchor 483. No night shift.
  const ms = [{ cs: c + '487', desc: 'FVIU Unit — Morning shift',   shifts: ['MS'] }];
  const as = [{ cs: c + '483', desc: 'FVIU Unit — Afternoon shift', shifts: ['AS'] }];
  const extra = shuffle([481, 482, 484, 485, 486, 488, 489].map(n => ({ cs: c + n, desc: 'FVIU Unit — Additional', shifts: ['MS', 'AS'] })));
  return [
    ms[0], as[0],
    ...extra,
    { cs: c + '499', desc: 'FVIU Court Liaison Officer',     shifts: ['MS', 'AS'] },
    { cs: c + '480', desc: 'FVIU Sergeant',                  shifts: ['SUP'] },
    { cs: c + '490', desc: 'FVIU Detective Senior Sergeant', shifts: ['SUP'] },
  ];
}

function buildSOCITPool(c) {
  // CAD doc: SGT 450–459, S/SGT 460–469, general units 470–499.
  // MS anchor 477, AS anchor 473, NS anchor 471.
  const ms = [{ cs: c + '477', desc: 'SOCIT Unit — Morning shift',   shifts: ['MS'] }];
  const as = [{ cs: c + '473', desc: 'SOCIT Unit — Afternoon shift', shifts: ['AS'] }];
  const ns = [{ cs: c + '471', desc: 'SOCIT Unit — Night shift',     shifts: ['NS'] }];
  const extra = shuffle([472, 474, 475, 476, 478, 479, 470].map(n => ({ cs: c + n, desc: 'SOCIT Unit — Additional', shifts: ['MS', 'AS', 'NS'] })));
  return [
    ms[0], as[0], ns[0],
    ...extra,
    { cs: c + '450', desc: 'SOCIT Sergeant',        shifts: ['SUP'] },
    { cs: c + '460', desc: 'SOCIT Senior Sergeant', shifts: ['SUP'] },
  ];
}

function buildDogPool() {
  // CAD doc: CAN prefix, 200–799. General 200–299, narcotics/training 700, courts 710–714.
  const general = shuffle([200, 201, 202, 203, 204, 205].map(n => ({ cs: 'CAN' + n, desc: 'Canine Unit — General duties', shifts: ['MS', 'AS', 'NS'] })));
  const specialty = [
    { cs: 'CAN700', desc: 'Canine — Narcotics / Training specialty',  shifts: ['MS', 'AS'] },
    { cs: 'CAN710', desc: 'Canine — Court security specialty (SFK)',  shifts: ['MS', 'AS'] },
    { cs: 'CAN711', desc: 'Canine — Court security specialty (SFK)',  shifts: ['MS', 'AS'] },
    { cs: 'CAN712', desc: 'Canine — Court security specialty (SFK)',  shifts: ['MS', 'AS'] },
  ];
  return [...general, ...specialty];
}

function buildSARPool() {
  // CAD doc: RES prefix, 400–459.
  const units = shuffle([400, 401, 402, 410, 411, 412, 420, 430].map(n => ({ cs: 'RES' + n, desc: 'SAR Unit', shifts: ['MS', 'AS', 'NS'] })));
  return [
    ...units,
    { cs: 'RES451', desc: 'SAR Sergeant', shifts: ['SUP'] },
  ];
}

function buildSOGPool() {
  // CAD doc: SCY prefix. State-wide tactical resource.
  const units = shuffle([200, 201, 202, 203, 210, 211, 212, 220].map(n => ({ cs: 'SCY' + n, desc: 'Special Operations Group Unit', shifts: ['MS', 'AS', 'NS'] })));
  return [
    ...units,
    { cs: 'SCY250', desc: 'SOG Sergeant', shifts: ['SUP'] },
  ];
}

function buildCIRTPool() {
  // CAD doc: CIR prefix, 200–899.
  const units = shuffle([200, 201, 202, 210, 211, 220, 230, 240].map(n => ({ cs: 'CIR' + n, desc: 'CIRT Unit', shifts: ['MS', 'AS', 'NS'] })));
  return [
    ...units,
    { cs: 'CIR250', desc: 'CIRT Sergeant', shifts: ['SUP'] },
  ];
}

function buildHVIUPool() {
  // CAD doc: ROA prefix, patrol 501–505, supervisor 550, specialist 560.
  const units = shuffle([501, 502, 503, 504, 505].map(n => ({ cs: 'ROA' + n, desc: 'Heavy Vehicle Unit', shifts: ['MS', 'AS'] })));
  return [
    ...units,
    { cs: 'ROA560', desc: 'Heavy Vehicle Specialist Unit', shifts: ['MS', 'AS'] },
    { cs: 'ROA550', desc: 'Heavy Vehicle Supervisor',      shifts: ['SUP'] },
  ];
}

function buildMountedPool() {
  // CAD doc: MOU prefix, 800–899.
  const units = shuffle([800, 801, 810, 811, 820, 830].map(n => ({ cs: 'MOU' + n, desc: 'Mounted Unit', shifts: ['MS', 'AS'] })));
  return [
    ...units,
    { cs: 'MOU850', desc: 'Mounted Sergeant', shifts: ['SUP'] },
  ];
}

function buildCRIPool() {
  // CAD doc: CRI prefix. Units 573–579 (MS: 577, AS: 573, NS: 575). SGTs 571–572. Office 570 (fixed).
  const ms    = [{ cs: 'CRI577', desc: 'Crime Desk Unit — Morning shift',   shifts: ['MS'] }];
  const as    = [{ cs: 'CRI573', desc: 'Crime Desk Unit — Afternoon shift', shifts: ['AS'] }];
  const ns    = [{ cs: 'CRI575', desc: 'Crime Desk Unit — Night shift',     shifts: ['NS'] }];
  const extra = shuffle([574, 576, 578, 579].map(n => ({ cs: 'CRI' + n, desc: 'Crime Desk Unit — Additional', shifts: ['MS', 'AS', 'NS'] })));
  return [
    ms[0], as[0], ns[0],
    ...extra,
    { cs: 'CRI571', desc: 'Crime Desk Sergeant', shifts: ['SUP'] },
    { cs: 'CRI572', desc: 'Crime Desk Sergeant', shifts: ['SUP'] },
    { cs: 'CRI570', desc: 'Crime Desk Office',   shifts: ['FIXED'] },
  ];
}
