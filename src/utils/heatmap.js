/**
 * Heatmap renderer using canvas
 * Gaussian kernel density estimation for smooth heatmaps
 */

export function renderHeatmap(canvas, points, options = {}) {
  const {
    width = canvas.width,
    height = canvas.height,
    radius = 24,
    maxOpacity = 0.85,
    colorScheme = 'kills',
  } = options;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);

  if (!points || points.length === 0) return;

  // Build intensity map
  const grid = new Float32Array(width * height);
  const r = radius;

  for (const { px, py, weight = 1 } of points) {
    const x0 = Math.max(0, Math.floor(px - r));
    const x1 = Math.min(width - 1, Math.ceil(px + r));
    const y0 = Math.max(0, Math.floor(py - r));
    const y1 = Math.min(height - 1, Math.ceil(py + r));

    for (let gy = y0; gy <= y1; gy++) {
      for (let gx = x0; gx <= x1; gx++) {
        const dx = gx - px;
        const dy = gy - py;
        const dist2 = dx * dx + dy * dy;
        if (dist2 <= r * r) {
          const intensity = weight * (1 - dist2 / (r * r));
          grid[gy * width + gx] += intensity;
        }
      }
    }
  }

  // Normalize
  let maxVal = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] > maxVal) maxVal = grid[i];
  }
  if (maxVal === 0) return;

  // Render with color scheme
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  const schemes = {
    kills: (t) => {
      // Dark → yellow → red → white
      if (t < 0.33) return lerpColor([20, 0, 0], [180, 60, 0], t / 0.33);
      if (t < 0.66) return lerpColor([180, 60, 0], [255, 80, 0], (t - 0.33) / 0.33);
      return lerpColor([255, 80, 0], [255, 220, 180], (t - 0.66) / 0.34);
    },
    deaths: (t) => {
      if (t < 0.5) return lerpColor([0, 10, 30], [30, 80, 200], t / 0.5);
      return lerpColor([30, 80, 200], [180, 220, 255], (t - 0.5) / 0.5);
    },
    traffic: (t) => {
      if (t < 0.33) return lerpColor([0, 20, 10], [0, 140, 60], t / 0.33);
      if (t < 0.66) return lerpColor([0, 140, 60], [120, 220, 0], (t - 0.33) / 0.33);
      return lerpColor([120, 220, 0], [255, 255, 180], (t - 0.66) / 0.34);
    },
    loot: (t) => {
      if (t < 0.5) return lerpColor([20, 10, 0], [180, 120, 0], t / 0.5);
      return lerpColor([180, 120, 0], [255, 220, 50], (t - 0.5) / 0.5);
    },
    storm: (t) => {
      if (t < 0.5) return lerpColor([20, 0, 30], [120, 0, 180], t / 0.5);
      return lerpColor([120, 0, 180], [220, 100, 255], (t - 0.5) / 0.5);
    },
  };

  const colorFn = schemes[colorScheme] || schemes.kills;

  for (let i = 0; i < grid.length; i++) {
    const t = grid[i] / maxVal;
    if (t < 0.01) continue;
    const [r2, g, b] = colorFn(Math.pow(t, 0.6)); // gamma for visibility
    const alpha = Math.min(255, Math.floor(t * maxOpacity * 255));
    const idx = i * 4;
    data[idx] = r2;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = alpha;
  }

  ctx.putImageData(imageData, 0, 0);
}

function lerpColor(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

/**
 * Map world coordinates to canvas/image pixel coordinates
 * World: 0–8192 in both axes
 * Image: 0–imageWidth, 0–imageHeight (Y axis may be flipped)
 */
export function worldToPixel(worldX, worldY, imageWidth, imageHeight, worldSize = 8192) {
  const px = (worldX / worldSize) * imageWidth;
  const py = (worldY / worldSize) * imageHeight; // Y is top-down in both world and image
  return { px, py };
}

export function pixelToWorld(px, py, imageWidth, imageHeight, worldSize = 8192) {
  return {
    x: (px / imageWidth) * worldSize,
    y: (py / imageHeight) * worldSize,
  };
}
