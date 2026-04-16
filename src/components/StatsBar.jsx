import { useStore } from '../store';
import { isKill, isDeath, isMovement } from '../data/realData';

export default function StatsBar() {
  const { mapStats, selectedMatch, matchEvents, currentTime } = useStore();
  if (!mapStats) return null;

  const liveEvs   = matchEvents.filter(e => e.ts_ms <= currentTime);
  const liveKills = liveEvs.filter(e => isKill(e.ev)).length;
  const liveDeaths = liveEvs.filter(e => isDeath(e.ev)).length;
  const liveHumans = new Set(liveEvs.filter(e => !e.is_bot && isMovement(e.ev)).map(e => e.user_id)).size;

  const stats = [
    { label: 'KILLS',       value: mapStats.kills.toLocaleString(),       color: '#ff4040' },
    { label: 'DEATHS',      value: mapStats.deaths.toLocaleString(),      color: '#4080ff' },
    { label: 'STORM',       value: mapStats.stormDeaths.toLocaleString(), color: '#c060ff' },
    { label: 'LOOT',        value: mapStats.loots.toLocaleString(),       color: '#ffa030' },
    { label: 'HUMANS',      value: mapStats.humans.toLocaleString(),      color: '#00c8ff' },
    { label: 'BOTS',        value: mapStats.bots.toLocaleString(),        color: '#ff6020' },
    { label: 'MATCHES',     value: mapStats.totalMatches,                 color: '#30ff90' },
    { label: 'MATCH KILLS', value: liveKills,  color: '#ff4040', dim: true },
    { label: 'MATCH DEATHS',value: liveDeaths, color: '#4080ff', dim: true },
    { label: 'HUMANS LIVE', value: liveHumans, color: '#00c8ff', dim: true },
  ];

  return (
    <div className="stats-bar">
      {stats.map(s => (
        <div key={s.label} className="stat-item" style={{ opacity: s.dim ? 0.65 : 1 }}>
          <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          <div className="stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
