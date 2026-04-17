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

Assumptions & Data Ambiguities: During development, I identified several data ambiguities and made the following strategic assumptions to ensure the tool provides high-integrity insights for Level Designers:
1. Handling the (0,0) Coordinate Anomaly: 
The Ambiguity: A significant volume of events (Kills/Loot) were recorded at the world origin (0,0).
The Assumption: I assumed these represented "Null" values or server-side telemetry glitches rather than actual gameplay.
The Handling: I implemented a Coordinate Sanitizer to filter these out. This prevents "false hotspots" from appearing at the corner of the map, ensuring designers only see real player interactions.

2. Match Timeline Normalization:
The Ambiguity: Raw data used absolute Unix timestamps (ts_ms), making it impossible to compare different matches side-by-side.
The Assumption: I assumed the first recorded event for any Match ID is the "Start" point (T=0).
The Handling: I normalized all timelines to start at 00:00. This allows a designer to look at "Minute 5" of any match to analyze mid-game rotations consistently.

3. Entity Weighting (Humans vs. Bots):
The Ambiguity: The data tracks both player types, but doesn't define which is more "important" for heatmaps.
The Assumption: I assumed that for analyzing map lethality and chokepoints, a death is a valid signal regardless of the entity type.
The Handling: I include both in the aggregate Heatmaps by default but built a Toggle Filter to allow designers to isolate human-only "high-skill" meta-patterns.

4. Spatial Coordinate Scaling:
The Ambiguity: No "World Bounds" metadata was provided to link game units to pixels.
The Assumption: I assumed a standard Cartesian grid where the provided minimap images represent the full playable boundary defined by the data's min/max values.
The Handling: I developed a dynamic Coordinate Mapper that scales raw units to the 1024 x 1024 resolution of the minimap, ensuring accurate placement of markers.

### Project Trade-offs:

| Decision | Trade-off | Rationale |
| :--- | :--- | :--- |
| **Data Loading** | Load time vs. Speed | Prioritized zero-latency timeline scrubbing over initial load. |
| **Canvas vs SVG** | Dev speed vs. Performance | Canvas scales to 10k+ points; essential for pro-grade analytics. |
| **State Mgmt** | Logic vs. Sync | Used Zustand to ensure Map and Sidebar stay perfectly in sync. |
