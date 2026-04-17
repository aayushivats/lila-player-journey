Architecture & Product Logic

Technical Rationale:
The core challenge was translating 10,000+ telemetry points into a seamless browser experience. I selected **React with HTML5 Canvas** to ensure the UI remains responsive at 60FPS during timeline scrubbing.
While SVG rendering is easier to implement, it creates DOM-bottlenecks that would frustrate a Level Designer attempting to analyze large matches.

Data Pipeline:
1. Normalization: Raw '.parquet' files were processed into a lightweight 'data.json'.
2. State Management: Used Zustand to create a centralized store. This ensures that when a user filters for "Bots," the Map, Timeline, and Sidebar update simultaneously with zero latency.
3. Rendering Loop: The 'MapCanvas' component uses a 'requestAnimationFrame' loop to draw data based on the current 'ts_ms' (timestamp) selected on the timeline.

Coordinate Mapping Approach:
The most critical technical hurdle was mapping world coordinates to the minimap image:
Normalization: Raw game coordinates were translated to the minimap's native 1024 x 1024 resolution.
Scaling:  A dynamic scale factor of 0.625 (640px / 1024px) was applied to fit the canvas into a standard web viewport.
Transformations: Implemented a CSS Transform Matrix for Pan and Zoom, allowing the canvas context to remain crisp without constant recalculation of raw data points.

Risk Mitigation & Edge Cases:
(0,0) Telemetry Glitch: Identified an anomaly where corrupted/missing data points defaulted to '(0,0)', creating false hotspots. I implemented a coordinate sanitizer to strip these from the render loop to protect data integrity.
Null Match States: Designed the UI to gracefully handle days with zero match data (e.g., Feb 12), providing clear user feedback rather than an empty/broken map.

### Project Trade-offs:

| Decision | Trade-off | Rationale |
| :--- | :--- | :--- |
| **Data Loading** | Load time vs. Speed | Prioritized zero-latency timeline scrubbing over initial load. |
| **Canvas vs SVG** | Dev speed vs. Performance | Canvas scales to 10k+ points; essential for pro-grade analytics. |
| **State Mgmt** | Logic vs. Sync | Used Zustand to ensure Map and Sidebar stay perfectly in sync. |
