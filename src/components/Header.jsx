import { useStore, MAP_CONFIGS } from '../store';

export default function Header() {
  const { selectedMap, selectedDay, selectedMatch } = useStore();
  return (
    <div className="header">
      <div className="header-logo">LILA BLACK</div>
      <div className="header-divider"/>
      <div className="header-subtitle">Player Journey Visualizer · Level Design Intelligence</div>
      <div className="header-spacer"/>
      {selectedMatch && (
        <div style={{fontFamily:'var(--font-data)',fontSize:'0.62rem',color:'var(--text-dim)',letterSpacing:'0.08em'}}>
          {selectedMap} &nbsp;·&nbsp; {selectedDay?.replace('_',' ')} &nbsp;·&nbsp;
          <span style={{color:'var(--text-secondary)'}}>{selectedMatch.n_players} players</span>
        </div>
      )}
      <div className="header-divider"/>
      <div className="header-status">
        <div className="status-dot"/>
        REAL DATA
      </div>
    </div>
  );
}
