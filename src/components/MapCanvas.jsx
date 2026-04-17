import { useRef, useEffect, useState, useCallback } from 'react';
import { useStore, MAP_CONFIGS } from '../store';
import { renderHeatmap } from '../utils/heatmap';
import { isKill, isDeath, isLoot, isStorm, isMovement, eventLabel } from '../data/realData';

const CANVAS_SIZE = 640;
const MINIMAP_SIZE = 1024;
const SCALE = CANVAS_SIZE / MINIMAP_SIZE;

const EVENT_COLORS = {
  kill: '#ff4040', death: '#4080ff', loot: '#ffa030', storm: '#c060ff', move: '#30ff90',
};

function getEventCategory(ev) {
  if (isKill(ev))      return 'kill';
  if (isDeath(ev))     return 'death';
  if (isLoot(ev))      return 'loot';
  if (isStorm(ev))     return 'storm';
  return 'move';
}

function sc(px, py) {
  return { cx: px * SCALE, cy: py * SCALE };
}

export default function MapCanvas() {
  // 1. ALL HOOKS AT THE TOP
  const {
    selectedMap, selectedMatch, matchEvents, mapDayEvents,
    activeView, heatmapType,
    showBots, showHumans, eventFilters, currentTime,
  } = useStore();

  const containerRef = useRef(null);
  const heatmapRef = useRef(null);
  const eventCanvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef(null);

  const minimapSrc = MAP_CONFIGS[selectedMap]?.minimap || '';

  const passes = useCallback((is_bot) => {
    if (is_bot && !showBots) return false;
    if (!is_bot && !showHumans) return false;
    return true;
  }, [showBots, showHumans]);

  const getVisibleEvents = useCallback(() => {
    return matchEvents.filter(e => {
      if (e.ts_ms > currentTime) return false;
      if (!passes(e.is_bot)) return false;
      const cat = getEventCategory(e.ev);
      return eventFilters[cat] !== false;
    });
  }, [matchEvents, currentTime, passes, eventFilters]);

  const getHeatPoints = useCallback(() => {
    const fn = {
      kills:   e => isKill(e.ev),
      deaths:  e => isDeath(e.ev),
      traffic: e => isMovement(e.ev),
      loot:    e => isLoot(e.ev),
      storm:   e => isStorm(e.ev),
    }[heatmapType] || (() => false);
    return mapDayEvents.filter(e => passes(e.is_bot) && fn(e));
  }, [mapDayEvents, heatmapType, passes]);

  // 2. RENDERING EFFECTS
  useEffect(() => {
    if (activeView !== 'heatmap') return;
    const canvas = heatmapRef.current;
    if (!canvas) return;
    const pts = getHeatPoints().map(e => ({ px: e.px * SCALE, py: e.py * SCALE, weight: 1 }));
    renderHeatmap(canvas, pts, {
      width: CANVAS_SIZE, height: CANVAS_SIZE,
      radius: heatmapType === 'traffic' ? 14 : 22,
      maxOpacity: 0.85, colorScheme: heatmapType,
    });
  }, [activeView, heatmapType, getHeatPoints]);

  useEffect(() => {
    const canvas = eventCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    if (activeView === 'heatmap') return;
    const events = getVisibleEvents();
    if (!events.length) return;
    if (activeView === 'paths') drawPaths(ctx, events);
    else drawEvents(ctx, events);
  }, [activeView, getVisibleEvents]);

  // 3. INTERNAL DRAWING FUNCTIONS
  function drawPaths(ctx, events) {
    const byPlayer = {};
    for (const e of events) {
      if (!byPlayer[e.user_id]) byPlayer[e.user_id] = [];
      byPlayer[e.user_id].push(e);
    }

    for (const [, evs] of Object.entries(byPlayer)) {
      const isBot = evs[0].is_bot;
      const sorted = [...evs].sort((a, b) => a.ts_ms - b.ts_ms);

      if (sorted.length > 1) {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = isBot ? '#ff6020' : '#00c8ff';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 1.0;
        ctx.setLineDash([]);
        
        const first = sc(sorted[0].px, sorted[0].py);
        ctx.moveTo(first.cx, first.cy);

        for (let i = 1; i < sorted.length; i++) {
          const p = sc(sorted[i].px, sorted[i].py);
          ctx.lineTo(p.cx, p.cy);
        }
        ctx.stroke();
        ctx.restore();
      }

      for (const e of evs) {
        const cat = getEventCategory(e.ev);
        if (cat === 'move' || !eventFilters[cat]) continue;
        const { cx, cy } = sc(e.px, e.py);
        drawMarker(ctx, cat, cx, cy, isBot, 4);
      }
    }
  }

  function drawEvents(ctx, events) {
    for (const e of events) {
      const cat = getEventCategory(e.ev);
      if (cat === 'move' || !eventFilters[cat]) continue;
      const { cx, cy } = sc(e.px, e.py);
      drawMarker(ctx, cat, cx, cy, e.is_bot, 5);
    }
  }

  function drawMarker(ctx, cat, cx, cy, isBot, size) {
    const color = EVENT_COLORS[cat] || '#fff';
    ctx.save(); ctx.translate(cx, cy);
    ctx.shadowBlur = 5; ctx.shadowColor = color;
    ctx.fillStyle = color; ctx.strokeStyle = color;
    if (cat === 'kill') {
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(-size,0); ctx.lineTo(size,0);
      ctx.moveTo(0,-size); ctx.lineTo(0,size); ctx.stroke();
    } else if (cat === 'death') {
      ctx.globalAlpha = 0.82; ctx.beginPath(); ctx.arc(0,0,size,0,Math.PI*2); ctx.fill();
    } else if (cat === 'loot') {
      ctx.globalAlpha = 0.78; ctx.fillRect(-size/2,-size/2,size,size);
    } else if (cat === 'storm') {
      ctx.globalAlpha = 0.85; ctx.beginPath();
      ctx.moveTo(0,-size); ctx.lineTo(size,0); ctx.lineTo(0,size); ctx.lineTo(-size,0);
      ctx.closePath(); ctx.fill();
    } else {
      ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(0,0,size/2,0,Math.PI*2); ctx.fill();
    }
    if (isBot) {
      ctx.globalAlpha = 0.45; ctx.strokeStyle = '#ff6020'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(0,0,size+2,0,Math.PI*2); ctx.stroke();
    }
    ctx.restore();
  }

  // 4. INTERACTION HANDLERS
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const fn = (e) => { e.preventDefault(); setZoom(z => Math.max(0.5, Math.min(5, z * (e.deltaY < 0 ? 1.12 : 0.9)))); };
    el.addEventListener('wheel', fn, { passive: false });
    return () => el.removeEventListener('wheel', fn);
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }, [pan]);

  const handleMouseMove = useCallback((e) => {
    if (isPanning && panStart.current) {
      setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
      return;
    }
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = (e.clientX - rect.left - rect.width/2 - pan.x) / zoom + CANVAS_SIZE/2;
    const cy = (e.clientY - rect.top  - rect.height/2 - pan.y) / zoom + CANVAS_SIZE/2;
    const px1024 = cx / SCALE, py1024 = cy / SCALE;
    const visible = getVisibleEvents().filter(e => !isMovement(e.ev));
    let nearest = null, nearestDist = Infinity;
    for (const ev of visible) {
      const d = Math.hypot(ev.px - px1024, ev.py - py1024);
      if (d < nearestDist) { nearestDist = d; nearest = ev; }
    }
    if (nearest && nearestDist < 40) {
      setTooltip({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 20, event: nearest });
    } else setTooltip(null);
  }, [isPanning, getVisibleEvents, pan, zoom]);

  const handleMouseUp = useCallback(() => { setIsPanning(false); panStart.current = null; }, []);

  const liveHumanIds = new Set(
    matchEvents.filter(e => e.ts_ms <= currentTime && !e.is_bot && isMovement(e.ev)).map(e => e.user_id)
  );

  return (
    <div ref={containerRef} className="map-container"
      onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
      style={{ cursor: isPanning ? 'grabbing' : 'crosshair' }}>
      <div className="map-corner tl"/><div className="map-corner tr"/>
      <div className="map-corner bl"/><div className="map-corner br"/>
      <div className="map-canvas-wrapper" style={{
        transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
        transformOrigin: 'center center', width: CANVAS_SIZE, height: CANVAS_SIZE, position: 'relative',
      }}>
        {minimapSrc && <img src={minimapSrc} width={CANVAS_SIZE} height={CANVAS_SIZE}
          className="minimap-img" alt={selectedMap} draggable={false}/>}
        <canvas ref={heatmapRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="overlay-canvas"
          style={{ opacity: activeView === 'heatmap' ? 1 : 0 }}/>
        <canvas ref={eventCanvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="event-canvas"
          style={{ opacity: activeView !== 'heatmap' ? 1 : 0 }}/>
      </div>
      {tooltip && (
        <div className="map-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          <div className="tooltip-title">{getEventCategory(tooltip.event.ev).toUpperCase()} · {eventLabel(tooltip.event.ev)}</div>
          <div>Type: {tooltip.event.is_bot ? '🤖 Bot' : '👤 Human'}</div>
          <div>Player: {tooltip.event.user_id.toString().slice(0,12)}…</div>
        </div>
      )}
      <div className="zoom-controls">
        <button className="zoom-btn" onClick={() => setZoom(z => Math.min(5, z*1.25))}>+</button>
        <button className="zoom-btn" onClick={() => { setZoom(1); setPan({x:0,y:0}); }}>⌖</button>
        <button className="zoom-btn" onClick={() => setZoom(z => Math.max(0.5, z*0.8))}>−</button>
      </div>
      <div className="coord-display">{selectedMap.toUpperCase()} · ZOOM {zoom.toFixed(1)}×</div>
      {selectedMatch && (
        <div className="player-count-badge">
          <span className="badge-value">{liveHumanIds.size}</span> humans · {selectedMatch.n_players} total
        </div>
      )}
    </div>
  );
}
