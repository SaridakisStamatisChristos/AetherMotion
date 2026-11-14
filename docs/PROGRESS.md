# Development progress
|Milestone|Verified revision|Evidence|
|---|---|---|
|Reconnaissance and architecture|5be5d34dc9138733ddddcbe09f8dc6f140fdb7bb|Pinned fork/upstream at identical commit, source inspection and license map|
|Stage A|dd083db957755e7c1b26d0dd00f2ce9e3a542365|Local tests and 30-second MP4. Both [GitHub jobs](https://github.com/SaridakisStamatisChristos/AetherMotion/actions/runs/43390387799) produced and verified a film.|
|Stage B engines|0254d177109a72ea38c6db5d91ae1c986cc679cb|Eight test groups locally; [CI](https://github.com/SaridakisStamatisChristos/AetherMotion/actions/runs/43390694177) passed.|
|Stage B experiment|127a16a49bc2c2263166ee0671b00fd5c30b3ddf|Three locally encoded films, independent probes and full decodes, visual review, machine-readable measurements and recorded engine digest.|
|Stage C|77cd1a248b5d18bca358ac4f4ffc3aba83528713, framing revision 876671a2b2f4491c25cf08db711dad1b9cb57e87|Cartoon and Three.js outputs. WebGL pixel assertions, local mesh preflight, camera and model seek tests.|
|Stage D|876671a2b2f4491c25cf08db711dad1b9cb57e87|Kokoro speech generated locally, two-stream MP4, timed effects, burned-in captions, SRT and documented caller contracts.|

The optional Gemini transport, compact storyboard compiler and offline integration tests are included. Live Gemini usage and billing measurement are open. Neither external application has been modified or integrated. All development is on feature/aethermotion-v0.1.

## Ecosystem status — 2026-11-13

An updated cross-repository readiness assessment is recorded in [ECOSYSTEM_STATUS_2026-11-13.md](ECOSYSTEM_STATUS_2026-11-13.md). AetherMotion's sample videos are real and its renderer is functional, but this remains a **prototype rather than a finished script-to-film production system**. **Integration with ClaudeCreate or AetherRendering is explicitly deferred** pending richer standalone visual capabilities, representative original-scene renders and manual artistic review. Existing [ADAPTERS.md](ADAPTERS.md) defines prospective contracts only, not delivered integration. Preserve all current work and continue on the feature branch.

## Standalone narrated production

Revision `05cd99344a09fa43a26169213ebe6c83d6da40e5` adds the produce command, nested groups, polygons, radial glows and shot fades. The original eclipse scene uses these primitives for three distinct views. One local invocation synthesized the voice, timed the captions, rendered the shots and published a verified 30-second MP4. This production used an explicitly authored scene with zero Gemini calls. Independent artistic review, live director evaluation and comparisons of authoring cost are open. [Film](../samples/eclipse.mp4) · [Verification](VERIFICATION.md#inside-an-eclipse)

## Second standalone production using the eclipse runtime

At `dd758420ccb91271252a85b993cc1b2079f9f449`, an original geometry film moves from landscape astronomy to a portrait tile dissection using only new scene JSON and three voice clips for production. The test fixture independently samples 49 cells in two decoded frames and checks speech against the WAVs. The native replay produced byte-identical media with a different worker count. [The Missing Square](../samples/missing-square.mp4) · [Measured results](VERIFICATION.md#portrait-reuse--the-missing-square)

## Director motion input and offline compilation

Revision `2f5414fdd0c75df2b9f68d2d4af69089124f2ec4` lets the optional director and an offline CLI compile the same motion storyboard into a standard scene. The verified night mail film uses three weighted shots and grouped shape movement. Its one-worker replay matched the original two-worker MP4 byte for byte. Live Gemini schema acceptance and authoring-token measurements remain open. [Film](../samples/night-post.mp4) · [Scene instructions](../examples/night-post/board.json)

## Explicit stage dimensions

Motion boards can specify a vertical stage. The 15-second balloon example uses depth ordering, moving clouds and a rising balloon. Local tests passed with 24 successes and one WebGL check reserved for Chromium CI. Independent artistic review and live Gemini evaluation remain open.

## Graphics refinement

Curved vector shapes, linear gradients, outlines and soft shadows now work through ordinary scene JSON. The Ascent sample replaces the earlier flat balloon composition with original shaded artwork at 720×1280. Provider generation is deferred by user instruction. Focus further work on graphics, composition, animation and rendering quality. See docs/GRAPHICS.md for the API and reproduction commands.

## Illustrated character study

An optional illustrated actor design now supplies curved clothing, profile facial detail, shaded limbs and shaped shoes. It reuses the established walk and gesture controls. The courtyard example combines the rig with gradient architecture, citrus foliage, a butterfly and depth ordering. The silent 12-second export passed full decode. Further gait polish, broader expression controls and character variants remain open.

## Illustrated movement refinement

The illustrated rig now has its own walk with a level stance sole and straighter resting legs, plus a keyed wave blend. Two palette variants exchange a greeting in the new courtyard sample. The existing classic gait keeps its earlier implementation. Matching stride, phase and travel is documented. Automatic foot locking during arbitrary travel remains open.

## Illustrated reactions

Keyed torso lean, head tilt and blinking now add small reactions to the illustrated rig. The curiosity example demonstrates these controls with a stationary character and butterfly. Foot-region and blink pixel regressions pass. Broader expressions, full head turns and automatic motion coordination remain future work.
