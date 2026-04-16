#!/usr/bin/env python3
"""
parse_data.py — LILA BLACK telemetry pipeline
Converts .nakama-0 parquet files → public/data.json for the browser visualizer

Usage:
    python parse_data.py --input ./player_data --output ./public/data.json

Requirements:
    pip install pyarrow pandas
"""

import argparse, os, json, re
import pyarrow.parquet as pq
import pandas as pd

MAP_CONFIGS = {
    'AmbroseValley': {'scale': 900,  'origin_x': -370, 'origin_z': -473},
    'GrandRift':     {'scale': 581,  'origin_x': -290, 'origin_z': -290},
    'Lockdown':      {'scale': 1000, 'origin_x': -500, 'origin_z': -500},
}

EVENT_CODES = {
    'Position': 0, 'BotPosition': 1, 'Loot': 2,
    'Kill': 3, 'Killed': 4, 'BotKill': 5, 'BotKilled': 6, 'KilledByStorm': 7,
}

DAYS = ['February_10', 'February_11', 'February_12', 'February_13', 'February_14']


def world_to_pixel(x, z, map_id):
    cfg = MAP_CONFIGS[map_id]
    u = (x - cfg['origin_x']) / cfg['scale']
    v = (z - cfg['origin_z']) / cfg['scale']
    return round(float(u * 1024), 1), round(float((1 - v) * 1024), 1)


def is_bot(user_id):
    return not bool(re.match(r'^[0-9a-f]{8}-', str(user_id)))


def load_all(base_path):
    frames = []
    for day in DAYS:
        day_path = os.path.join(base_path, day)
        if not os.path.exists(day_path):
            continue
        files = os.listdir(day_path)
        print(f"  {day}: {len(files)} files")
        for f in files:
            filepath = os.path.join(day_path, f)
            try:
                df = pq.read_table(filepath).to_pandas()
                df['event'] = df['event'].apply(
                    lambda x: x.decode('utf-8') if isinstance(x, bytes) else str(x)
                )
                df['is_bot'] = df['user_id'].apply(is_bot)
                df['day'] = day
                frames.append(df)
            except Exception as e:
                pass  # skip corrupt/empty files
    return pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()


def build_output(df):
    df['ts_ms'] = df['ts'].astype('int64')

    # Compute pixel coords
    def get_px_py(row):
        if row['map_id'] in MAP_CONFIGS:
            return world_to_pixel(row['x'], row['z'], row['map_id'])
        return (0.0, 0.0)

    coords = df.apply(get_px_py, axis=1)
    df['px'] = [c[0] for c in coords]
    df['py'] = [c[1] for c in coords]

    # Build match metadata
    match_meta = df.groupby('match_id').agg(
        map_id=('map_id', 'first'),
        day=('day', 'first'),
        ts_start=('ts_ms', 'min'),
        ts_end=('ts_ms', 'max'),
        n_players=('user_id', 'nunique'),
    ).reset_index()
    match_meta['duration_ms'] = match_meta['ts_end'] - match_meta['ts_start']

    # Only keep multi-player matches (>=3 players) — solo sessions are noise
    good = match_meta[match_meta['n_players'] >= 3].sort_values('ts_start')

    # Encode events
    df['ev'] = df['event'].map(EVENT_CODES).fillna(0).astype(int)
    df['bot'] = df['is_bot'].astype(int)

    good_ids = set(good['match_id'])
    events_df = df[df['match_id'].isin(good_ids)][
        ['user_id', 'match_id', 'ev', 'bot', 'px', 'py', 'ts_ms']
    ].copy()

    matches_out = good.to_dict(orient='records')
    events_out = events_df.values.tolist()

    return {
        'maps': list(MAP_CONFIGS.keys()),
        'days': DAYS,
        'mapConfigs': {k: {'scale': v['scale'], 'originX': v['origin_x'], 'originZ': v['origin_z']}
                       for k, v in MAP_CONFIGS.items()},
        'eventCols': ['user_id', 'match_id', 'ev', 'bot', 'px', 'py', 'ts_ms'],
        'eventCodes': EVENT_CODES,
        'matches': matches_out,
        'events': events_out,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input',  default='./player_data', help='Path to player_data folder')
    parser.add_argument('--output', default='./public/data.json', help='Output JSON path')
    args = parser.parse_args()

    print(f"Loading from {args.input}...")
    df = load_all(args.input)
    print(f"Loaded {len(df):,} events from {df['match_id'].nunique()} matches")

    print("Building output...")
    out = build_output(df)
    print(f"Matches: {len(out['matches'])}, Events: {len(out['events'])}")

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, 'w') as f:
        json.dump(out, f, separators=(',', ':'))

    size_mb = os.path.getsize(args.output) / 1024 / 1024
    print(f"Written to {args.output} ({size_mb:.2f} MB)")


if __name__ == '__main__':
    main()
