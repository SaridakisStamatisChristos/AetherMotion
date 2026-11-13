# Resume AetherMotion v0.1
Fetch feature/aethermotion-v0.1 and use README for the local install. Earlier frozen 2D experiment artifacts live at 127a16a49bc2c2263166ee0671b00fd5c30b3ddf. The Three.js implementation was added at 77cd1a248b5d18bca358ac4f4ffc3aba83528713. The audio milestone and revised 3D framing were published at 876671a2b2f4491c25cf08db711dad1b9cb57e87. Current samples, checksums and metrics are in samples/ and benchmarks/.

1. Run npm ci and npm test. For full WebGL coverage, install Playwright Chromium and run TEST_BACKEND=chromium AETHER_WEBGL=software npm test. CI covers both backends.
2. Render examples/capsule.json and examples/signal.json using the README commands. Verify both MP4s with the CLI. Use docs/AUDIO.md to regenerate speech independently. Use docs/DIRECTOR.md to generate new scenes and capture provider usage metadata.
3. Next empirical milestone: run the optional director on one real topic with an operator-provided model/key. Retain usage metadata, storyboard and rendered film. Token savings versus per-film coding remain unmeasured. Check content accuracy and whether the chosen layout communicates the topic.
4. Client integration into ClaudeCreate and AetherRendering requires a separate campaign. See docs/ADAPTERS.md for proposed mappings. Preserve main until explicit merge approval.
