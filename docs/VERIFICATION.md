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

## Inside an eclipse

The production implementation at `05cd99344a09fa43a26169213ebe6c83d6da40e5` rendered the three-shot eclipse specification. Kokoro produced three local WAVs lasting 4.992, 6.720 and 6.613333 seconds. All fit the authored ten-second shots. Captions occupy frames [12,132), [252,414) and [492,651). The automated timing test also covers a longer narration that extends the first shot and moves the second one.

FFprobe counted 720 H.264 frames at 960×540 and 24 fps. FFmpeg decoded the entire 30-second file, including its stereo AAC track. The native render and verification took 11.73 seconds with two workers. Peak Node RSS was 265576 KiB. Both measurements exclude the earlier Kokoro step. The output is 604596 bytes. The report includes the SHA-256 and raw measurements. [Production report](../benchmarks/eclipse.json)

The contact sheet samples frames 40, 171, 276, 415, 528 and 662 from the exported video. They show the Moon moving in front of the Sun, the appearance of the shadow cones and the Moon reaching the projected orbital crossing. The titles and captions remain readable at full frame size. The diagrams use enlarged distances and bodies. The orbital diagram uses projection and omits perspective depth cues. The captions are timed by utterance. Independent human artistic and listening review remains open. [Decoded frames](../samples/eclipse-contact.jpg)

`python3 scripts/frame_variation.py samples/eclipse.mp4` measures exact repeats after reducing decoded frames to 80×45 grayscale. It found 585 distinct thumbnails, 100 identical adjacent pairs and a longest hold of 57 frames (2.375 seconds). This measurement is sensitive to compression and scale. It cannot identify repetitive storytelling or establish artistic quality.

To reproduce, follow [the production guide](PRODUCE.md). To verify the published artifact independently:
```sh
npm ci && npm run build
node dist/cli/main.js verify examples/eclipse.json samples/eclipse.mp4
python3 scripts/frame_variation.py samples/eclipse.mp4
sha256sum samples/eclipse.mp4
```

## Portrait reuse — The Missing Square

The portrait film uses the eclipse runtime at `1805f161ff9a0904306a0864ff0938f75cd70aad`. Its TypeScript source tree, schema, dependency lock, production CLI and local render pipeline are identical. The 540×960 composition was authored in JSON with three original, locally synthesized PCM WAVs. The sample uses FFmpeg's Flite filter, voice `slt`. Generating these files was a separate content-authoring step. The ordinary production command uses the bundled audio offline. No language-model calls were made during production and authoring tokens were unmetered.

At 24 fps, the encoded H.264 video has 720 frames and the stereo AAC track lasts 30 seconds. FFprobe and a strict FFmpeg decode passed. The native render and verification took 23.70 seconds with two workers and peaked at 260648 KiB Node RSS. The measured voice durations are 5.545, 5.670 and 6.415 seconds. Their captions end on the first frame boundary at or after the measured end of each WAV.

The six-frame review led to two scene edits: moving the equation above the captions and drawing dimensions beside the gap during the second shot. The final 80×45 grayscale check found 711 distinct thumbnails and eight identical adjacent pairs, with a longest run of four frames. Small line movements can change that measurement. Independent human review of narration and pacing remains open.

The fixture check reads pixels from the **exported MP4** and counts the tile colours. At frame 454 it finds 16 sand cells, 24 coral cells and a nine-cell hole. At frame 683 the nine cells are mint and the 7×7 square is complete. It also compares the decoded audio energy envelope against each local WAV at its scripted onset. This catches a dropped or misplaced clip. It does not assess pronunciation or word alignment.

```sh
npm ci && npm test
node dist/cli/main.js produce examples/missing-square.json out/missing-square --backend native --workers 2
node dist/cli/main.js verify examples/missing-square.json out/missing-square/film.mp4
python3 scripts/check_missing_square.py out/missing-square/film.mp4
python3 scripts/frame_variation.py out/missing-square/film.mp4
node dist/cli/main.js render out/missing-square/film.json out/square-replay.mp4 --backend native --workers 1 --batch 3
sha256sum out/missing-square/film.mp4 out/square-replay.mp4
```

[Production and replay metrics](../benchmarks/missing-square.json) · [Film](../samples/missing-square.mp4) · [Decoded frames](../samples/missing-square-contact.jpg) · [Timed captions](../samples/missing-square.srt)

## The last train to Bellwater

The offline CLI compiled an original motion storyboard into three shots of 240, 216 and 264 frames. They use the existing 2D renderer. No Gemini credentials were available. Tests exercised provider schema selection and recovery from an unsupported mark. The example was explicitly authored, and its WAVs were synthesized separately with Flite.

The final export contains 720 frames of 960×540 H.264 at 24 fps and 30 seconds of stereo AAC. Two native workers rendered and fully verified the MP4 in 21.39 seconds. Peak Node RSS was 253460 KiB. The production report records speech lengths of 4.690, 5.175 and 4.275 seconds. Full decoding verified both streams. The first frame review caught the train running beyond the panel. The revised compiler masks offstage geometry. Six decoded frames show the train leaving, the stamp descending, the envelope reaching the mailbox and the window illuminated.

The 80×45 grayscale comparison found 701 distinct thumbnails, 19 identical adjacent pairs and a longest identical run of ten frames (0.42 s). These measurements describe pixel changes. Independent viewer and listening reviews remain open. No provider token measurement was made.

Use the [director guide](DIRECTOR.md#motion-storyboards) to compile and produce the film. From the repository root, run `python3 scripts/frame_variation.py samples/night-post.mp4` and `node dist/cli/main.js verify out/night-post/film.json samples/night-post.mp4` after production. [Film](../samples/night-post.mp4) · [Decoded frames](../samples/night-post-contact.jpg) · [Benchmark](../benchmarks/night-post.json)

## Vertical balloon stage

The explicitly authored 60×90 stage compiled into a 540×960 film with 360 frames at 24 fps. FFprobe and full FFmpeg decode passed. The silent H.264 export took 4.94 seconds including verification with two native workers and peaked at 237408 KiB Node RSS. Samples at frames 12, 175 and 345 show the balloon rising from behind the foreground hills, crossing behind a cloud and reaching the upper sky. The source uses the same uniform scale on both axes. The output has no narration. [Film](../samples/balloon.mp4) · [Frames](../samples/balloon-contact.jpg) · [Metrics](../benchmarks/balloon.json)

## Revised curved artwork

The 12-second Ascent study rendered at 720×1280, 24 fps and 288 frames, using two native workers. Rendering and full verification took 11.06 seconds. Peak Node RSS was 282028 KiB and the MP4 is 240925 bytes. FFprobe and a full FFmpeg decode passed. Frames 12, 144 and 275 show a rising balloon, moving cloud wisps and terrain parallax. A decoded full-size midpoint was also inspected for typography, fabric shading and basket detail.

The local suite passed 26 tests and skipped the browser-only WebGL test. New pixel tests check gradient direction, curve fill bounds and frame-seek repeatability. Invalid geometry headers, invisible shapes and malformed gradients are rejected. The sample is silent. Independent artistic review remains open. [Film](../samples/ascent.mp4) · [Frames](../samples/ascent-contact.jpg) · [Raw measurements](../benchmarks/ascent.json)

## Illustrated courtyard character

The final silent 12-second courtyard sample has 288 H.264 frames at 720×1280 and 24 fps. FFprobe and full FFmpeg decoding passed. Native rendering and verification used two workers, took 8.09 seconds and peaked at 274808 KiB Node RSS. The exported MP4 is 204510 bytes. Three decoded samples at frames 16, 100 and 183 show walking, stopping and reaching. A larger decoded frame was inspected for hand placement, face and clothing detail.

The local suite passed 27 tests, with one browser-only WebGL check skipped. The illustrated fixture verifies palette use, changed gesture pixels, facing and exact seek restoration. Classic rig tests also passed. This is a stylized prototype. Independent viewer assessment, naturalistic gait and prop attachment remain open. [Film](../samples/courtyard.mp4) · [Frames](../samples/courtyard-contact.jpg) · [Measurements](../benchmarks/courtyard.json)
