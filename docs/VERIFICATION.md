# Stage A verification
The 720-frame 960×540 24 fps physics film passed FFprobe frame counting and a separate FFmpeg -xerror full decode. Three frames from the resulting MP4 were inspected for text, geometry and shot progression. See samples/wave.mp4, samples/wave-contact.jpg and benchmarks/wave.json for the output and measured values. The render used Node 24.22.1, Linux x86-64, FFmpeg 7.1.5, native Canvas, two workers and batches of three frames per worker. Time includes preflight, encoding and decoding. RSS is per Node process; it excludes FFmpeg.

Reproduce with npm ci, npm test and `node dist/cli/main.js render examples/wave.json out/wave.mp4 --backend native --workers 2 --batch 3`. Run the independent verify command from README. Chromium has its own CI matrix job. Local system Chromium was prevented from opening its startup socket on this host.

Tests include schema and semantic rejection, frame intervals, easing, pixel compositing and seek order, asset containment, decoded portrait video, corruption detection, and byte equality across worker schedules under the same installed backend.

## Reuse experiment
With engine commit 0254d177109a72ea38c6db5d91ae1c986cc679cb, run `python3 scripts/experiment.py out/reuse` after building. The SHA-256 over TypeScript, schema, compiled JavaScript and dependency lock was 7e3aa8819e4a2e3fe1b449a21e4d8319e9e10e0e346f593098ade68ff78b4a67 before and after each render. Only the JSON film input changed. All three productions used the same whiteboard and infographic implementations. No content assets were required.

|Film|Frames at 24 fps|Time including verification|Peak Node RSS (KiB)|MP4 bytes|
|---|---:|---:|---:|---:|
|Light and distance|720|8.88 s|242764|161259|
|Courage and counterexamples|720|9.88 s|236956|604822|
|Triangular numbers|720|9.61 s|237264|191672|

benchmarks/reuse.json includes each output hash and a separate 50 ms sampled RSS sum for visible process descendants. Measurements depend on the host. Every output passed FFprobe dimension, codec, rate, duration and frame-count checks and a complete FFmpeg decode. samples/reuse-contact.jpg uses frames 205, 445 and 685 from each decoded film. The director made zero model calls during rendering. Tokens used to author JSON in development were not metered. These experiments establish reuse and local rendering; comparison with per-film coding costs requires separately measured authoring workflows.
