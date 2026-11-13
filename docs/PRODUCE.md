# Produce a self-contained narrated film

The produce command accepts a director-generated scene JSON file or a hand-authored one. It stages local assets, reuses existing WAVs, and synthesizes any missing narration from its caption using a single local Kokoro session. It measures each clip and exports a replayable production directory.

```sh
npm ci && npm run build
# With the clips already provided, base installation is enough.
node dist/cli/main.js produce examples/signal.json out/signal-production --backend native

# For a new film, first install the local voice model and Python dependencies
# using docs/AUDIO.md. The sample below uses that guide's file locations.
export KOKORO_PYTHON="$PWD/.venv/bin/python"
export KOKORO_MODEL="$PWD/models/kokoro.onnx"
export KOKORO_VOICES="$PWD/models/voices.bin"
node dist/cli/main.js produce examples/eclipse.json out/eclipse --backend native --workers 2
node dist/cli/main.js verify out/eclipse/film.json out/eclipse/film.mp4
```

KOKORO_VOICE defaults to af_heart. Keep machine paths in your shell environment. A missing sound effect, music file, or narration without a caption raises an error. Supply a fresh output directory. The backend defaults to Chromium; use native for CPU-based 2D export. Three.js requires Chromium.

## Timing and output

For the production command, narration occupies one cue per shot and starts at its authored local offset. Each caption ends at the first frame boundary at or after the measured speech end. The shot retains its authored length when the voice fits. A longer line extends that shot. Nested animation keys are stretched proportionally, later shots move forward, and effect/music intervals follow their original shot boundaries. Plain render continues to enforce its exact authored duration.

The published directory contains film.mp4, film.json, local media, report.json and, for captioned films, captions.srt. The report includes requested and actual frame totals, measured clip durations, synthesis count, encode/verification metrics and MP4 SHA-256. Its media.elapsedSeconds covers rendering and verification after synthesis. Replay the film from the published JSON and clips on an offline host. The CLI stages all files in a sibling temporary directory and publishes only after a successful full decode. If a machine stops mid-production, remove the matching .produce-lock directory and abandoned temporary directory after checking that the process has ended.

## Scene choreography

A group applies its local x/y, scale, rotation and opacity to its children in order. Opacity multiplies through parent and child transforms per drawable. Groups may nest up to 12 drawable levels, with at most 2048 drawables in one shot and unique ids throughout. A polygon fills a closed list of at least three points. A glow draws a radial fade from the given hex color to transparent at radius. All share the existing pose tracks. Shot fade accepts a color and inFrames, outFrames or both. A fade spans at least two frames including endpoints; the sum of the fade lengths must fit inside the shot. This is a fade through color. Captions stay in screen space above it.

In examples/eclipse.json the ground view moves an occluding lunar disc across a solar glow above two mountain silhouettes. The section view reveals the light and shadow cones between three bodies. The orbital view moves the Moon along a tilted projected orbit toward a node. Geometry and timing are explicit JSON. The engine has no eclipse-specific drawing code.
