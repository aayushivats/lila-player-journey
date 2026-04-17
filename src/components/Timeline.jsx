import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import { isKill, isDeath } from '../data/realData';

function fmt(ms) {
  const s = Math.floor(Math.abs(ms) / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

export default function Timeline() {
  const {
    selectedMatch, matchEvents, currentTime, matchDuration,
    isPlaying, playbackSpeed, setCurrentTime, setPlaying, setPlaybackSpeed, stepTime,
  } = useStore();

  const rafRef = useRef(null);
  const lastTick = useRef(null);
  const sparkRef = useRef(null);

  // Playback loop - real data has ~500ms duration so play slowly
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTick.current = null; return;
    }
    const tick = (now) => {
      if (!lastTick.current) { lastTick.current = now; rafRef.current = requestAnimationFrame(tick); return; }
      const dt = (now - lastTick.current) * playbackSpeed * 0.5; // slow playback to match real data density
      lastTick.current = now;
      stepTime(dt);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying, playbackSpeed, stepTime]);

  // Sparkline
  useEffect(() => {
    const canvas = sparkRef.current;
    if (!canvas || !matchEvents.length || !matchDuration || !selectedMatch) return;
    const W = canvas.width, H = canvas.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,W,H);
    const bins = 100;
    const binMs = matchDuration / bins;
    if (binMs <= 0) return;
    const killB = new Float32Array(bins);
    const deathB = new Float32Array(bins);
    const t0 = selectedMatch.ts_start;
    for (const e of matchEvents) {
      const b = Math.min(bins-1, Math.floor((e.ts_ms - t0) / binMs));
      if (isKill(e.ev)) killB[b]++;
      if (isDeath(e.ev)) deathB[b]++;
    }
    const mx = Math.max(...killB, ...deathB, 1);
    ctx.beginPath(); ctx.strokeStyle = 'rgba(255,64,64,0.7)'; ctx.lineWidth = 1;
    for (let i=0;i<bins;i++) { const x=(i/bins)*W, h=(killB[i]/mx)*H; i===0?ctx.moveTo(x,H-h):ctx.lineTo(x,H-h); }
    ctx.stroke();
    ctx.beginPath(); ctx.strokeStyle = 'rgba(64,128,255,0.55)'; ctx.lineWidth = 1;
    for (let i=0;i<bins;i++) { const x=(i/bins)*W, h=(deathB[i]/mx)*H; i===0?ctx.moveTo(x,H-h):ctx.lineTo(x,H-h); }
    ctx.stroke();
  }, [matchEvents, matchDuration, selectedMatch]);

    const handleScrub = useCallback((e) => {
    const t = parseFloat(e.target.value);
    setCurrentTime(selectedMatch.ts_start + t * matchDuration);
  }, [selectedMatch, matchDuration, setCurrentTime]);

  if (!selectedMatch) return (
    <div className="timeline" style={{ display: 'flex', alignItems: 'center', padding: '12px 16px' }}>
      <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
        SELECT A MATCH TO USE TIMELINE
      </div>
    </div>
  );

  const elapsed = currentTime - selectedMatch.ts_start;
  const progress = matchDuration > 0 ? Math.max(0, Math.min(1, elapsed / matchDuration)) : 0;

  const liveKills = matchEvents.filter(e => e.ts_ms <= currentTime && isKill(e.ev)).length;
  const liveDeath = matchEvents.filter(e => e.ts_ms <= currentTime && isDeath(e.ev)).length;

  return (
    <div className="timeline">
      <div className="timeline-top">
        <div className="timeline-label">TIMELINE</div>
        <button className={`play-btn ${isPlaying ? 'playing' : ''}`}
          onClick={() => setPlaying(!isPlaying)}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <div className="timeline-time">{fmt(elapsed)}</div>
        <div style={{ fontFamily:'var(--font-data)',fontSize:'0.62rem',color:'var(--text-dim)' }}>
          / {fmt(matchDuration)}
        </div>
        <div className="speed-btns">
          {[0.5,1,2,5].map(s => (
            <button key={s} className={`speed-btn ${playbackSpeed===s?'active':''}`}
              onClick={() => setPlaybackSpeed(s)}>{s}×</button>
          ))}
        </div>
        <div className="timeline-spacer"/>
        <div style={{ fontFamily:'var(--font-data)',fontSize:'0.62rem',color:'var(--text-dim)',letterSpacing:'0.06em' }}>
          <span style={{color:'#ff4040'}}>{liveKills}</span> kills &nbsp;
          <span style={{color:'#4080ff'}}>{liveDeath}</span> deaths
        </div>
        <div className="timeline-spacer"/>
        <div style={{ fontFamily:'var(--font-data)',fontSize:'0.6rem',color:'var(--text-dim)' }}>
          Match: {selectedMatch.match_id.slice(0,8)}…
        </div>
      </div>
      <div className="timeline-track-wrap">
        <canvas ref={sparkRef} className="event-sparkline" width={800} height={18} style={{width:'100%'}}/>
        <input type="range" className="timeline-track" min={0} max={1} step={0.001}
          value={progress} onChange={handleScrub}
          style={{'--progress': `${progress*100}%`}}/>
      </div>
    </div>
  );
}
