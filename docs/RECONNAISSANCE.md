# Lemo-Opuscar reconnaissance
Inspected the fork and upstream at 3a7132b996be0241c1ea0ab180d519f06e6f10b6. [Pinned reference tree](https://github.com/SaridakisStamatisChristos/lemo-opuscar/tree/3a7132b996be0241c1ea0ab180d519f06e6f10b6).

|Source examined|Reusable technique|Decision for AetherMotion|
|---|---|---|
|TECHNIQUE.md, core/lib.js|Absolute sample times, track(), monotone(), easing, seeded variation|Use integer frame positions with original scalar interpolation; support random access.|
|DIRECTOR.md, plugin/skills/lemo-opuscar/SKILL.md and scripts/setup.sh|Staged shot review, independent timing, setup tiers|Retain contact sheets and decoded-output checks. The plugin installs a filmmaking environment and directs an agent; keep that outside the renderer.|
|core/render/page.mjs, video.mjs|Playwright starts a film page, waits for assets, samples render(t), pipes screenshots into H.264 encoders, concatenates worker segments|Use an owned Canvas entry point, inert JSON and a single ordered encoder. Limit frames in flight to bound memory.|
|styles/whiteboard/{STYLE.md,demo/engine/wb.js,demo/film.js}|Paths, marker geometry and camera travel generalize. The drawing order, layout, lines and subject belong to this film.|Design original length-based stroke reveals and reusable drawing objects. Do not import handwriting font data.|
|styles/dataviz/demo/{engine,film,timeline}.js|applyCam, w2s, s2w, pencilStroke, dataDot and inkLine are candidate building blocks. Year tracking, palette scales and a specific dataset are tied to the film.|Expose camera and numeric tracks. Accept chart data in the scene.|
|styles/teardown/demo/src, core/three/post.js|Layered meshes, scene lighting and camera motion. Board geometry and shot cues are specific to a model.|Reserve a versioned backend for Three.js; do not copy part data.|
|core/audio/sfx.py, core/tts/tts.py, core/render/srt.py and mux.sh|Timestamped cues, audio mixing, measured narration clips and subtitle files|Future production adapter can exchange timed WAV clips. Core frame rendering has no voice dependency.|

The reference uses Node 20+, playwright-core, Three.js, Chromium, FFmpeg, and optional Python DSP, Kokoro/ONNX and ASR dependencies. Some demos require extra fonts, datasets, online voices or downloads. A browser page that assumes a shared server root and film-specific JavaScript cannot serve directly as a portable data-only scene.

## Provenance
The fork's LICENSE, LICENSES/, REUSE.toml and demo CREDITS govern individual files. Most original toolkit code is MIT. Markdown and specified prompts are CC BY-NC 4.0, with extra permission for making films. Demo footage and derived stills are generally CC BY 4.0 with exceptions. Fonts, samples, datasets, voices and trademarked imagery have separate conditions. See the [pinned license map](https://github.com/lemomo-ai/lemo-opuscar/blob/3a7132b996be0241c1ea0ab180d519f06e6f10b6/LICENSE). No reference code, prompts, assets or demo frames are distributed here. All illustrations are generated from original scene geometry. New dependencies retain their package licenses.
