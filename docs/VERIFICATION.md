# Stage A verification
The 720-frame 960×540 24 fps physics film passed FFprobe frame counting and a separate FFmpeg -xerror full decode. Three frames from the resulting MP4 were inspected for text, geometry and shot progression. See samples/wave.mp4, samples/wave-contact.jpg and benchmarks/wave.json for the output and measured values. The render used Node 24.22.1, Linux x86-64, FFmpeg 7.1.5, native Canvas, two workers and batches of three frames per worker. Time includes preflight, encoding and decoding. RSS is per Node process; it excludes FFmpeg.

Reproduce with npm ci, npm test and `node dist/cli/main.js render examples/wave.json out/wave.mp4 --backend native --workers 2 --batch 3`. Run the independent verify command from README. Chromium has its own CI matrix job. Local system Chromium was prevented from opening its startup socket on this host.

Tests include schema and semantic rejection, frame intervals, easing, pixel compositing and seek order, asset containment, decoded portrait video, corruption detection, and byte equality across worker schedules under the same installed backend.
