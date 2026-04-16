/**
 * Real data loader for LILA BLACK telemetry
 * Fetches pre-processed JSON built from actual .nakama-0 parquet files
 *
 * Schema (from README):
 *   user_id   string  - UUID=human, numeric=bot
 *   match_id  string  - match identifier
 *   map_id    string  - AmbroseValley | GrandRift | Lockdown
 *   x,y,z    float32 - world coords; y=elevation, use x+z for 2D map
 *   ts        ms      - time elapsed within match context
 *   event     bytes   - Position|BotPosition|Kill|Killed|BotKill|BotKilled|KilledByStorm|Loot
 *
 * Map coordinate formula (from README):
 *   u = (x - origin_x) / scale
 *   v = (z - origin_z) / scale
 *   pixel_x = u * 1024
 *   pixel_y = (1 - v) * 1024   ← Y flipped
 */

export const MAP_CONFIGS = {
  AmbroseValley: { scale: 900,  originX: -370, originZ: -473, minimap: '/AmbroseValley_Minimap.png' },
  GrandRift:     { scale: 581,  originX: -290, originZ: -290, minimap: '/GrandRift_Minimap.png'     },
  Lockdown:      { scale: 1000, originX: -500, originZ: -500, minimap: '/Lockdown_Minimap.jpg'      },
};

export const EVENT_CODES = {
  Position: 0,
  BotPosition: 1,
  Loot: 2,
  Kill: 3,
  Killed: 4,
  BotKill: 5,
  BotKilled: 6,
  KilledByStorm: 7,
};

// Reverse lookup
export const CODE_TO_EVENT = Object.fromEntries(
  Object.entries(EVENT_CODES).map(([k, v]) => [v, k])
);

export const MAPS = Object.keys(MAP_CONFIGS);
export const DAYS = ['February_10', 'February_11', 'February_12', 'February_13', 'February_14'];
export const DAY_LABELS = {
  February_10: 'Feb 10',
  February_11: 'Feb 11',
  February_12: 'Feb 12',
  February_13: 'Feb 13',
  February_14: 'Feb 14',
};

let _cache = null;

export async function loadData() {
  if (_cache) return _cache;
  const res = await fetch('/data.json');
  const raw = await res.json();

  // Parse events array into typed objects for fast access
  // Cols: ['user_id','match_id','ev','bot','px','py','ts_ms']
  const cols = raw.eventCols;
  const UI = cols.indexOf('user_id');
  const MI = cols.indexOf('match_id');
  const EV = cols.indexOf('ev');
  const BI = cols.indexOf('bot');
  const PX = cols.indexOf('px');
  const PY = cols.indexOf('py');
  const TI = cols.indexOf('ts_ms');

  const events = raw.events.map(r => ({
    user_id:  r[UI],
    match_id: r[MI],
    ev:       r[EV],       // numeric event code
    is_bot:   r[BI] === 1,
    px:       r[PX],       // already mapped to 1024x1024 pixel space
    py:       r[PY],
    ts_ms:    r[TI],
  }));

  _cache = {
    matches: raw.matches,   // [{match_id, map_id, day, ts_start, ts_end, duration_ms, n_players}]
    events,
    maps: raw.maps,
    days: raw.days,
  };

  return _cache;
}

export function worldToPixel(x, z, mapId) {
  const cfg = MAP_CONFIGS[mapId];
  if (!cfg) return { px: 0, py: 0 };
  const u = (x - cfg.originX) / cfg.scale;
  const v = (z - cfg.originZ) / cfg.scale;
  return {
    px: u * 1024,
    py: (1 - v) * 1024,
  };
}

// Event type helpers
export function isMovement(ev) { return ev === 0 || ev === 1; }
export function isKill(ev)     { return ev === 3 || ev === 5; } // Kill or BotKill
export function isDeath(ev)    { return ev === 4 || ev === 6; } // Killed or BotKilled
export function isStorm(ev)    { return ev === 7; }
export function isLoot(ev)     { return ev === 2; }
export function eventLabel(ev) { return CODE_TO_EVENT[ev] || 'Unknown'; }
