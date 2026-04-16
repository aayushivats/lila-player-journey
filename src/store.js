import { create } from 'zustand';
import { loadData, MAPS, DAYS, DAY_LABELS, MAP_CONFIGS, isKill, isDeath, isStorm, isLoot } from './data/realData';

export { MAPS, DAYS, DAY_LABELS, MAP_CONFIGS };

export const useStore = create((set, get) => ({
  allMatches: [],
  allEvents: [],
  selectedMap: 'AmbroseValley',
  selectedDay: 'February_10',
  selectedMatchId: null,
  filteredMatches: [],
  selectedMatch: null,
  matchEvents: [],
  mapDayEvents: [],
  activeView: 'heatmap',
  heatmapType: 'kills',
  showBots: true,
  showHumans: true,
  eventFilters: { kill: true, death: true, loot: true, storm: true, move: false },
  isPlaying: false,
  currentTime: 0,
  matchDuration: 0,
  playbackSpeed: 2,
  mapStats: null,
  initialized: false,
  loading: false,

  async init() {
    set({ loading: true });
    try {
      const data = await loadData();
      const { matches, events } = data;
      const initialMap = 'AmbroseValley';
      const initialDay = 'February_10';
      const filteredMatches = matches.filter(m => m.map_id === initialMap && m.day === initialDay);
      const selectedMatch = filteredMatches[0] || null;
      set({ allMatches: matches, allEvents: events, filteredMatches, selectedMatch,
            selectedMatchId: selectedMatch?.match_id, selectedMap: initialMap,
            selectedDay: initialDay, initialized: true, loading: false });
      if (selectedMatch) get()._loadMatchEvents(selectedMatch, events);
      get()._computeMapStats(initialMap, events);
      get()._computeMapDayEvents(initialMap, initialDay, matches, events);
    } catch(e) {
      console.error(e);
      set({ loading: false, initialized: true });
    }
  },

  setMapFilter(mapId) {
    const { allMatches, allEvents, selectedDay } = get();
    const filteredMatches = allMatches.filter(m => m.map_id === mapId && m.day === selectedDay);
    const selectedMatch = filteredMatches[0] || null;
    set({ selectedMap: mapId, filteredMatches, selectedMatch, selectedMatchId: selectedMatch?.match_id });
    if (selectedMatch) get()._loadMatchEvents(selectedMatch, allEvents);
    get()._computeMapStats(mapId, allEvents);
    get()._computeMapDayEvents(mapId, selectedDay, allMatches, allEvents);
  },

  setDayFilter(day) {
    const { allMatches, allEvents, selectedMap } = get();
    const filteredMatches = allMatches.filter(m => m.map_id === selectedMap && m.day === day);
    const selectedMatch = filteredMatches[0] || null;
    set({ selectedDay: day, filteredMatches, selectedMatch, selectedMatchId: selectedMatch?.match_id });
    if (selectedMatch) get()._loadMatchEvents(selectedMatch, allEvents);
    get()._computeMapDayEvents(selectedMap, day, allMatches, allEvents);
  },

  setMatchFilter(matchId) {
    const { filteredMatches, allEvents } = get();
    const selectedMatch = filteredMatches.find(m => m.match_id === matchId) || null;
    set({ selectedMatchId: matchId, selectedMatch });
    if (selectedMatch) get()._loadMatchEvents(selectedMatch, allEvents);
  },

  _loadMatchEvents(match, allEvents) {
    const matchEvents = allEvents.filter(e => e.match_id === match.match_id)
                                 .sort((a,b) => a.ts_ms - b.ts_ms);
    set({ matchEvents, currentTime: match.ts_start, matchDuration: match.duration_ms, isPlaying: false });
  },

  _computeMapDayEvents(mapId, day, allMatches, allEvents) {
    const ids = new Set(allMatches.filter(m => m.map_id === mapId && m.day === day).map(m => m.match_id));
    set({ mapDayEvents: allEvents.filter(e => ids.has(e.match_id)) });
  },

  _computeMapStats(mapId, allEvents) {
    const { allMatches } = get();
    const ids = new Set(allMatches.filter(m => m.map_id === mapId).map(m => m.match_id));
    const evs = allEvents.filter(e => ids.has(e.match_id));
    set({ mapStats: {
      kills:       evs.filter(e => isKill(e.ev)).length,
      deaths:      evs.filter(e => isDeath(e.ev)).length,
      stormDeaths: evs.filter(e => isStorm(e.ev)).length,
      loots:       evs.filter(e => isLoot(e.ev)).length,
      humans:      new Set(evs.filter(e => !e.is_bot).map(e => e.user_id)).size,
      bots:        new Set(evs.filter(e => e.is_bot).map(e => e.user_id)).size,
      totalMatches: ids.size,
    }});
  },

  setActiveView(v) { set({ activeView: v }); },
  setHeatmapType(t) { set({ heatmapType: t }); },
  toggleBots()   { set(s => ({ showBots: !s.showBots })); },
  toggleHumans() { set(s => ({ showHumans: !s.showHumans })); },
  toggleEventFilter(k) { set(s => ({ eventFilters: { ...s.eventFilters, [k]: !s.eventFilters[k] } })); },
  setCurrentTime(t) { set({ currentTime: t }); },
  setPlaybackSpeed(s) { set({ playbackSpeed: s }); },
  setPlaying(v) { set({ isPlaying: v }); },
  stepTime(dt) {
    const { currentTime, selectedMatch } = get();
    if (!selectedMatch) return;
    const next = Math.min(currentTime + dt, selectedMatch.ts_end);
    set({ currentTime: next, isPlaying: next < selectedMatch.ts_end });
  },
}));
