LILA BLACK - Player Journey Visualizer

Live Deployment: https://lila-player-journey-kyce3pa8z-aayushivats-projects.vercel.app
Repository: https://github.com/aayushivats/lila-player-journey

Product Overview
A high-performance telemetry dashboard built to empower LILA Games Level Designers. It translates raw, dense game data into an interactive visual format to identify map flow issues, AI pathing behaviors, and player engagement hotspots. 

Quick Start (Local Setup)
1. Clone the repository
2. Run 'npm install'
3. Run 'npm run dev'
4. Open 'http://localhost: 5173'

Features & Walkthrough
1. Select a Map & Date: Use the left sidebar to select a map (e.g., Grand Rift) and a date.
2. Select a Match: Click a match ID in the sidebar to load specific telemetry.
3. Scrub the Timeline: Use the playback controls at the bottom of the screen to watch player paths draw dynamically over time.
4. Toggle Heatmaps: Switch the View Mode to "HEAT" to see aggregate data for Traffic, Kills, Deaths, and Loot.
5. Filter by Player Type: Toggle "Human Players" or "Bots" in the sidebar to isolate specific behavioral signals.

Delivered Scope & Requirements
- [x] Live URL: Fully hosted and accessible.
- [x] Data Integrity: World-to-minimap coordinate translation with anomaly sanitization.
- [x] Filtering Pipeline: Toggleable Human vs. Bot data, plus Map/Date/Match isolation.
- [x] Playback Tools: Global timeline scrubber with sparklines.
- [x] Advanced Overlays: High-contrast Heatmaps (Traffic, Kills, Deaths).
- [x] Walkthrough: Covered in the section above and fully explorable via the intuitive UI.

Required Documentation Included
* 'Architecture.md': Technical stack, setup steps, product rationale, trade-offs, and coordinate mapping approach.
* 'INSIGHTS.md': Three cross-functional, actionable takeaways derived directly from the visualizer.
