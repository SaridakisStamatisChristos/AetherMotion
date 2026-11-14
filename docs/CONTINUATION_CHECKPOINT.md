# Resume AetherMotion v0.1
Fetch feature/aethermotion-v0.1 and use README for the local install. Earlier frozen 2D experiment artifacts live at 127a16a49bc2c2263166ee0671b00fd5c30b3ddf. The Three.js implementation was added at 77cd1a248b5d18bca358ac4f4ffc3aba83528713. The audio milestone and revised 3D framing were published at 876671a2b2f4491c25cf08db711dad1b9cb57e87. Current samples, checksums and metrics are in samples/ and benchmarks/.

1. Run npm ci and npm test. For full WebGL coverage, install Playwright Chromium and run TEST_BACKEND=chromium AETHER_WEBGL=software npm test. CI covers both backends.
2. Render examples/capsule.json and examples/signal.json using the README commands. Verify both MP4s with the CLI. Use docs/AUDIO.md to regenerate speech independently. Use docs/DIRECTOR.md to generate new scenes and capture provider usage metadata.
3. Next empirical milestone: run the optional director on one real topic with an operator-provided model/key. Retain usage metadata, storyboard and rendered film. Token savings versus per-film coding remain unmeasured. Check content accuracy and whether the chosen layout communicates the topic.
4. Client integration into ClaudeCreate and AetherRendering requires a separate campaign. See docs/ADAPTERS.md for proposed mappings. Preserve main until explicit merge approval.

## Resume after the eclipse production

Fetch the feature branch. The production implementation is at `05cd99344a09fa43a26169213ebe6c83d6da40e5`. Start with `npm ci && npm test`, then `node dist/cli/main.js verify examples/eclipse.json samples/eclipse.mp4`. Follow [PRODUCE.md](PRODUCE.md) to regenerate the three local voice clips and the film in a new output directory. Run `python3 scripts/frame_variation.py samples/eclipse.mp4` for the repeat-frame measurements. See [VERIFICATION.md](VERIFICATION.md#inside-an-eclipse) for measured timings and the six decoded frames.

For the next standalone milestone, obtain an independent artistic and listening review, particularly of the 57-frame hold, caption legibility during narration, and depth in the orbital view. Use a different topic to test whether these primitives support another composition unchanged. Live Gemini direction and token measurements still require a configured key. Keep any cross-repository integration in a separately authorized campaign.

## Resume after the portrait reuse test

Film inputs and decoded-content checks are at `dd758420ccb91271252a85b993cc1b2079f9f449`. The TypeScript runtime matches the eclipse revision. Run the reproduction commands in [VERIFICATION.md](VERIFICATION.md#portrait-reuse--the-missing-square). The three WAVs in examples/audio allow immediate offline replay. The native one-worker replay yielded the same MP4 SHA-256 as the two-worker production.

The strongest remaining unverified step is directing varied films from a topic alone. The two narrated films used explicitly authored scenes. Before measuring real Gemini tokens, check which compositions the current storyboard compiler can express. A useful next test is a storyboard that names reusable shapes, timed group motion and an output aspect ratio, with budget, validation and reproducible offline replay. Independent viewer feedback on both films remains open.

## Resume after motion storyboard compilation

The motion compiler and runnable example are at `2f5414fdd0c75df2b9f68d2d4af69089124f2ec4`. Run `npm ci && npm test`, then follow [the offline commands](DIRECTOR.md#motion-storyboards) for the night mail film. The three WAVs are included in the repository. Both a saved director report and a standalone version-1 bundle are accepted by compile-board.

The next empirical step is to run direct with --layout motion on a new topic using a configured Gemini key and model, preserve its raw report, and compile it again offline. Compare the result with the brief, inspect caption layout, and record provider usage by attempt. The existing sample establishes the compiler and rendering path. It does not measure live model quality or savings. Portrait uses a centred wide stage, so full-height portrait choreography remains an extension.

## Resume after vertical stages

Run npm test and the balloon commands in docs/DIRECTOR.md. Motion boards accept optional stage width and height, with legacy dimensions preserved when omitted. The silent portrait sample and measured report are in samples/balloon.mp4 and benchmarks/balloon.json. Further capability work can add scene camera direction or reusable illustration assets. Live model evaluation still needs a configured provider key.

## Resume graphics refinement

The user has deferred live Gemini creation. Continue with graphics and rendering. Run npm test and render examples/ascent.json using docs/GRAPHICS.md. The checked-in 12-second silent sample demonstrates the shape primitive with cubic curves, gradients, outlines and shadow support. The broader engine still needs richer character artwork and movement, transitions, material effects and artistic assessment. Keep all work on feature/aethermotion-v0.1.

## Resume after the illustrated courtyard

Continue graphics work. The courtyard example uses actor design illustrated and a silent 720×1280 composition. Run npm test and render examples/courtyard.json. Review samples/courtyard-contact.jpg and docs/STYLES.md. The actor retains the existing keyed controls, with a new drawing implementation. Improve foot contact and natural rest posture, broaden gestures and add character variants. Live Gemini remains deferred.

## Resume after the greeting

Render examples/greeting.json and review samples/greeting.mp4. The illustrated rig now uses illustratedGait, with 60% stance and 40% swing, plus optional wave. See docs/STYLES.md for matching travel and cycle speed. Next refinements can add torso weight shifts and head direction, and improve motion through starts and stops. The user has approved the courtyard visual style and deferred live Gemini work. Continue graphics and animation on the feature branch.

## Resume after character reactions

Run npm test and render examples/curiosity.json. Illustrated actors now accept lean, headTilt and blink, all keyed through the existing scalar system. Feet retain their anchor during upper-body lean. See docs/STYLES.md for bounds and transform order. Next development can improve starts/stops, introduce new environments, and develop longer interactions. Live Gemini remains deferred.

## Resume after the complete lantern film

The travel and attachment implementation is `1002914cf2b68ea8280d34d6893aa9872122cdf9`. Run npm test and reproduce examples/evening-delivery.json using docs/CHOREOGRAPHY.md. The film is 30 seconds in three landscape shots. Sample frames and metrics are preserved beside the MP4.

The next substantial animation campaign can implement automatic prop transfer using named scene targets, improve foot contact through acceleration/deceleration, and add a second character silhouette. Travel currently supports horizontal ground only. Held props follow the near hand. Release positions and lighting changes are authored. Continue on feature/aethermotion-v0.1. Live Gemini and other-repository integration remain deferred.
