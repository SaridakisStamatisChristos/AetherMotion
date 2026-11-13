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

## Early Stage C
Eight seconds of cartoon motion from examples/pier.json were encoded at 720×406, 24 fps (192 frames), and fully decoded. Inspection of frames 21, 84 and 151 shows the actor moving, the signal changing, and a final gesture with a keyed mouth and dialogue label. The gait regression tests alternating limb lift, rest and random-access frame identity. No narrated speech, automatic lip synchronization or production-grade rig assessment has been performed. See benchmarks/pier.json and samples/pier-contact.jpg.

## Three.js and production
[GitHub Actions run 43397992965](https://github.com/SaridakisStamatisChristos/AetherMotion/actions/runs/43397992965) rendered the final 3D capsule at revision 876671a2b2f4491c25cf08db711dad1b9cb57e87. Headless Chromium used SwiftShader WebGL 2 and two workers. The downloaded MP4 passed a second local probe and decode. Frames 12, 85 and 175 show the lit imported housing, base and two separate rings. The initial framing cropped the upper ring; the checked-in revision widens the field of view. The final file has 192 frames, 720×406 pixels, 24 fps and eight seconds of H.264 video. See benchmarks/capsule.json for the measured SHA, size and elapsed time. No consumer GPU benchmark was run.

Kokoro ONNX synthesized examples/audio/signal.wav from the text in docs/AUDIO.md. The eight-second signal sample mixes this speech plus three bell cues with the cartoon. A separate decode verified 192 video frames and a 48 kHz stereo AAC stream of 8.000 seconds. Frames 24, 82 and 168 were inspected; subtitles appear during narration and disappear afterward. tests/audio.test.mjs checks silence and signal amplitude on opposite sides of a delayed cue, as well as invalid timing and path rejection. See benchmarks/signal.json, samples/signal.srt and samples/signal-contact.jpg.

## Director verification boundary
The transport and compiler tests use injected HTTP/provider responses. A six-second compiled storyboard was rendered and fully decoded through the regular CLI backend API. Tests exercise the Gemini request contract, validation repair, token cap configuration and per-attempt usage propagation. No Gemini key was available for a live request. Provider-side schema acceptance, creative quality and real token consumption still require a live run.
