import { useStore, MAPS, DAYS, DAY_LABELS } from '../store';

const MAP_COLORS = { AmbroseValley: '#c0392b', GrandRift: '#2980b9', Lockdown: '#8e44ad' };
const MAP_LABELS = { AmbroseValley: 'Ambrose Valley', GrandRift: 'Grand Rift', Lockdown: 'Lockdown' };

const HEATMAP_OPTIONS = [
  { id: 'kills',   label: 'Kill Zones',       color: '#ff4040' },
  { id: 'deaths',  label: 'Death Zones',      color: '#4080ff' },
  { id: 'traffic', label: 'Traffic Density',  color: '#30ff90' },
  { id: 'loot',    label: 'Loot Hotspots',    color: '#ffa030' },
  { id: 'storm',   label: 'Storm Deaths',     color: '#c060ff' },
];

const EVENT_FILTERS = [
  { key: 'kill',  label: 'Kills',        color: '#ff4040', shape: 'cross' },
  { key: 'death', label: 'Deaths',       color: '#4080ff', shape: 'circle' },
  { key: 'loot',  label: 'Loot',         color: '#ffa030', shape: 'square' },
  { key: 'storm', label: 'Storm Deaths', color: '#c060ff', shape: 'diamond' },
];

function ShapeIcon({ shape, color }) {
  const s = { width: 10, height: 10, display: 'inline-block', flexShrink: 0 };
  if (shape === 'cross') return (
    <svg width="10" height="10" viewBox="0 0 10 10" style={s}>
      <line x1="0" y1="5" x2="10" y2="5" stroke={color} strokeWidth="2"/>
      <line x1="5" y1="0" x2="5" y2="10" stroke={color} strokeWidth="2"/>
    </svg>
  );
  if (shape === 'square') return <div style={{ ...s, background: color, borderRadius: 2 }}/>;
  if (shape === 'diamond') return (
    <svg width="10" height="10" viewBox="0 0 10 10" style={s}>
      <polygon points="5,0 10,5 5,10 0,5" fill={color}/>
    </svg>
  );
  return <div style={{ ...s, background: color, borderRadius: '50%' }}/>;
}

export default function Sidebar() {
  const {
    selectedMap, setMapFilter,
    selectedDay, setDayFilter,
    filteredMatches, selectedMatchId, setMatchFilter,
    activeView, setActiveView,
    heatmapType, setHeatmapType,
    showBots, toggleBots, showHumans, toggleHumans,
    eventFilters, toggleEventFilter,
    mapStats,
  } = useStore();

  const days = DAYS.filter(d => DAY_LABELS[d]);

  return (
    <div className="sidebar">
      {/* Map */}
      <div className="sidebar-section">
        <div className="sidebar-label">Map</div>
        <div className="map-tabs">
          {MAPS.map(map => (
            <button key={map} className={`map-tab ${selectedMap === map ? 'active' : ''}`}
              onClick={() => setMapFilter(map)}>
              <div className="map-tab-dot" style={{ background: MAP_COLORS[map] }}/>
              {MAP_LABELS[map]}
            </button>
          ))}
        </div>
      </div>

      {/* Day */}
      <div className="sidebar-section">
        <div className="sidebar-label">Date</div>
        <div className="date-grid">
          {days.map(day => (
            <button key={day} className={`date-btn ${selectedDay === day ? 'active' : ''}`}
              onClick={() => setDayFilter(day)}>
              {DAY_LABELS[day]}
            </button>
          ))}
        </div>
      </div>

      {/* Match */}
      <div className="sidebar-section">
        <div className="sidebar-label">Match ({filteredMatches.length})</div>
        <div className="match-list">
          {filteredMatches.length === 0 && (
            <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
              No matches for this day
            </div>
          )}
          {filteredMatches.map((m, i) => (
            <button key={m.match_id}
              className={`match-item ${selectedMatchId === m.match_id ? 'active' : ''}`}
              onClick={() => setMatchFilter(m.match_id)}>
              <span style={{ color: 'var(--text-dim)' }}>#{String(i+1).padStart(2,'0')}</span>
              {'  '}
              <span style={{ color: 'var(--text-secondary)' }}>{m.n_players}p</span>
              {'  '}
              <span style={{ color: 'var(--text-dim)', fontSize: '0.6rem' }}>{m.duration_ms}ms</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-scroll">
        {/* View mode */}
        <div className="sidebar-section">
          <div className="sidebar-label">View Mode</div>
          <div className="view-modes">
            {[{id:'heatmap',label:'HEAT'},{id:'paths',label:'PATHS'},{id:'events',label:'EVENTS'}].map(v => (
              <button key={v.id} className={`view-btn ${activeView === v.id ? 'active' : ''}`}
                onClick={() => setActiveView(v.id)}>{v.label}</button>
            ))}
          </div>
        </div>

        {/* Heatmap layer */}
        {activeView === 'heatmap' && (
          <div className="sidebar-section">
            <div className="sidebar-label">Heatmap Layer</div>
            <div className="heatmap-types">
              {HEATMAP_OPTIONS.map(opt => (
                <button key={opt.id}
                  className={`heatmap-btn ${heatmapType === opt.id ? 'active' : ''}`}
                  onClick={() => setHeatmapType(opt.id)}
                  style={heatmapType === opt.id ? {
                    background: `rgba(${hexRgb(opt.color)},0.08)`,
                    borderColor: `rgba(${hexRgb(opt.color)},0.5)`,
                  } : {}}>
                  <div className="heatmap-swatch" style={{ background: opt.color, opacity: heatmapType === opt.id ? 1 : 0.5 }}/>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Event filters */}
        {activeView !== 'heatmap' && (
          <div className="sidebar-section">
            <div className="sidebar-label">Event Types</div>
            <div className="legend-list">
              {EVENT_FILTERS.map(ef => (
                <div key={ef.key}
                  className={`legend-item ${!eventFilters[ef.key] ? 'disabled' : ''}`}
                  onClick={() => toggleEventFilter(ef.key)}>
                  <ShapeIcon shape={ef.shape} color={ef.color}/>
                  {ef.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Player type filter */}
        <div className="sidebar-section">
          <div className="sidebar-label">Player Type</div>
          <div className="legend-list">
            <div className={`legend-item ${!showHumans ? 'disabled' : ''}`} onClick={toggleHumans}>
              <div className="legend-dot" style={{ background: '#00c8ff' }}/>
              Human Players
            </div>
            <div className={`legend-item ${!showBots ? 'disabled' : ''}`} onClick={toggleBots}>
              <div className="legend-dot" style={{ background: '#ff6020' }}/>
              Bots
            </div>
          </div>
        </div>

        {/* Map stats */}
        {mapStats && (
          <div className="sidebar-section">
            <div className="sidebar-label">Map Totals (all days)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {[
                { label: 'Kills',    value: mapStats.kills,       color: '#ff4040' },
                { label: 'Deaths',   value: mapStats.deaths,      color: '#4080ff' },
                { label: 'Storm',    value: mapStats.stormDeaths, color: '#c060ff' },
                { label: 'Loot',     value: mapStats.loots,       color: '#ffa030' },
                { label: 'Humans',   value: mapStats.humans,      color: '#00c8ff' },
                { label: 'Bots',     value: mapStats.bots,        color: '#ff6020' },
              ].map(s => (
                <div key={s.label} style={{ padding: '5px 6px', background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)', borderRadius: 2 }}>
                  <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.9rem',
                    color: s.color, fontWeight: 700 }}>{s.value.toLocaleString()}</div>
                  <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.58rem',
                    color: 'var(--text-dim)', letterSpacing: '0.08em' }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="sidebar-section">
          <div className="sidebar-label">Legend</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {EVENT_FILTERS.map(ef => (
              <div key={ef.key} style={{ display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: 'var(--font-ui)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                <ShapeIcon shape={ef.shape} color={ef.color}/> {ef.label}
              </div>
            ))}
            <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font-ui)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%',
                border: '1px solid #ff6020', background: 'transparent', flexShrink: 0 }}/> Bot ring indicator
            </div>
          </div>
        </div>

        <div className="sidebar-section">
          <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.6rem',
            color: 'var(--text-dim)', lineHeight: 1.7 }}>
            Scroll to zoom · Drag to pan<br/>
            Hover events for details<br/>
            Toggle layers to isolate signals
          </div>
        </div>
      </div>
    </div>
  );
}

function hexRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}
