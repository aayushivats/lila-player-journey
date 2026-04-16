import { useState } from 'react';

const STEPS = [
  {
    title: 'Select a Map',
    body: 'Choose between Ashfall Basin, Ironveil Docks, or Nether Plateau in the left panel. Each map has 5 days of match data.',
    icon: '🗺️',
  },
  {
    title: 'Pick a View Mode',
    body: 'HEAT shows density heatmaps across all matches for the day. PATHS renders individual player routes. EVENTS plots kill, death, loot, and storm markers.',
    icon: '👁️',
  },
  {
    title: 'Filter by Player Type',
    body: 'Toggle Human / Bot visibility. Bots are shown in orange, humans in cyan. Always check bot-filtered views before making design decisions.',
    icon: '🤖',
  },
  {
    title: 'Use the Timeline',
    body: 'Select a match then scrub the timeline to watch it unfold. Play at 0.5×–5× speed. The sparkline shows kill/death activity over time.',
    icon: '⏱️',
  },
  {
    title: 'Zoom & Pan',
    body: 'Scroll to zoom, drag to pan. Hover over event markers to see details — weapon used, player type, zone phase.',
    icon: '🔍',
  },
];

export default function HelpOverlay() {
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState(0);

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-dim)',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-data)',
          fontSize: '0.8rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Show help"
      >?</button>
    );
  }

  const current = STEPS[step];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(4, 6, 10, 0.75)',
      zIndex: 900,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-dim)',
        borderRadius: 4,
        padding: '32px',
        maxWidth: 440,
        width: '90vw',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.7rem',
          color: 'var(--text-dim)',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginBottom: 20,
        }}>
          LILA BLACK · Player Journey Visualizer
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 2,
              background: i <= step ? 'var(--accent-primary)' : 'var(--bg-elevated)',
              borderRadius: 1,
              transition: 'background 0.2s',
            }} />
          ))}
        </div>

        {/* Icon */}
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>{current.icon}</div>

        {/* Content */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1rem',
          color: 'var(--accent-primary)',
          marginBottom: 10,
          letterSpacing: '0.05em',
        }}>
          {current.title}
        </div>
        <div style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.88rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: 28,
        }}>
          {current.body}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={() => setVisible(false)}
            style={{
              padding: '7px 16px',
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 2,
              color: 'var(--text-dim)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Skip
          </button>
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{
                padding: '7px 16px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-dim)',
                borderRadius: 2,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              Back
            </button>
          )}
          <button
            onClick={() => {
              if (step < STEPS.length - 1) setStep(s => s + 1);
              else setVisible(false);
            }}
            style={{
              padding: '7px 20px',
              background: 'rgba(0, 200, 255, 0.1)',
              border: '1px solid var(--border-active)',
              borderRadius: 2,
              color: 'var(--accent-primary)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {step < STEPS.length - 1 ? 'Next →' : 'Start Exploring'}
          </button>
        </div>
      </div>
    </div>
  );
}
