import React, { useEffect } from 'react';
import { useStore } from './store';
import Sidebar from './components/Sidebar';
import MapCanvas from './components/MapCanvas';
import Timeline from './components/Timeline';
import StatsBar from './components/StatsBar';
import Header from './components/Header';
import HelpOverlay from './components/HelpOverlay';
import './App.css';

export default function App() {
  const { init, initialized } = useStore();

  useEffect(() => {
    init();
  }, []);

  if (!initialized) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-logo">LILA BLACK</div>
          <div className="loading-sub">Player Journey Visualizer</div>
          <div className="loading-bar">
            <div className="loading-fill" />
          </div>
          <div className="loading-text">Parsing telemetry data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <HelpOverlay />
      <Header />
      <div className="main-layout">
        <Sidebar />
        <div className="center-panel">
          <StatsBar />
          <MapCanvas />
          <Timeline />
        </div>
      </div>
    </div>
  );
}
