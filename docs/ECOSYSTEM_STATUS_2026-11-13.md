# Video and animation ecosystem — status checkpoint

**Snapshot date:** 2026-11-13 (Europe/Athens)  
**Decision:** Defer cross-project integration. Keep the five repositories independently usable and preserve their existing development branches. No merge or integration is approved by this checkpoint.

## What has been verified

| Repository | Working capability and evidence | Known gap | Active/reference branch |
|---|---|---|---|
| [AetherMotion](https://github.com/SaridakisStamatisChristos/AetherMotion) | Versioned JSON scene engine; local 2D and Three.js animation; actual MP4 samples in `samples/`; Kokoro narration, timed SFX, subtitles; [successful CI](https://github.com/SaridakisStamatisChristos/AetherMotion/actions/runs/43398529097) | Current outputs are controlled prototypes; richer general-purpose choreography, art direction, arbitrary-scene quality and live AI director cost measurements remain open | `feature/aethermotion-v0.1` |
| [ClaudeCreate](https://github.com/SaridakisStamatisChristos/ClaudeCreate) | Actual Kokoro+Whisper+HyperFrames+FFmpeg pipeline; portrait/landscape MP4; 15/30/60 **length-class** verification workflows, including [successful 30/60 jobs](https://github.com/SaridakisStamatisChristos/ClaudeCreate/actions/runs/43409912649); [validation](https://github.com/SaridakisStamatisChristos/ClaudeCreate/actions/runs/43410533721) | Demo loops six templates with near-identical props; no arbitrary scene choreography; exact requested duration not guaranteed; manual audiovisual/editorial approval open | `feature/production-verification`; `main` unchanged |
| [AetherRendering](https://github.com/SaridakisStamatisChristos/AetherRendering) | Gemini storyboard router, HyperFrames/Kokoro/FFmpeg exports; richer SVG/GSAP scene branch rendered 29.83-second portrait/landscape 60fps demos in [successful CI](https://github.com/SaridakisStamatisChristos/AetherRendering/actions/runs/43413982958) | No content-specific generated imagery, imported 3D assets or cinematic clips in the documented pipeline; artistic acceptance open | `feature/visual-scenes-v1.1`; `main` remains stable |
| [AetherPaper](https://github.com/SaridakisStamatisChristos/AetherPaper) | Local JSON-to-2D MP4, character rigs, interactions, physics and narrated demo; [successful test/render workflow](https://github.com/SaridakisStamatisChristos/AetherPaper/actions/runs/43415384398) | Visual polish, compositing, lip sync and production-grade art direction remain open | `feature/visual-quality-v0.3` |
| [ClaudeExplainatory](https://github.com/SaridakisStamatisChristos/ClaudeExplainatory) | Full-canvas illustrated explainer implementation, pan/zoom and parallax, independent templates; [passing repository validation](https://github.com/SaridakisStamatisChristos/ClaudeExplainatory/actions/runs/43389985663) | README explicitly states unit/integration workflows primarily use mocks/synthetic audio; true Kokoro+Whisper production and manual visual acceptance not yet established | `main` |

The status above distinguishes **working software** from **finished, production-grade artistic output**. Green CI proves the tests and validations covered by those workflows, not subjective film quality, general script coverage, or cross-repository compatibility.

## AetherMotion-specific status

- Completed prototypes: Stage A core renderer, Stage B reusable engines, Stage C cartoon/Three.js demos, Stage D local narrated scene, as recorded in [PROGRESS.md](PROGRESS.md).
- Existing videos: [pier.mp4](../samples/pier.mp4) (cartoon), [capsule.mp4](../samples/capsule.mp4) (3D), [signal.mp4](../samples/signal.mp4) (speech and captions), and other samples in `samples/`.
- **Not integrated** with ClaudeCreate, AetherRendering, AetherPaper or ClaudeExplainatory. Existing caller contracts in [ADAPTERS.md](ADAPTERS.md) are proposals, not completed integrations.
- The optional Gemini director and compiler are present, but live usage/cost benchmarking and broad visual-quality evaluation remain unverified.

## Next development priorities (no integration yet)

1. Improve the *visual engine itself*: diverse object/character primitives, timeline/choreography, articulated behavior, transitions, camera movement and content-appropriate scene construction.
2. Demonstrate a **new, non-template-driven script** rendered entirely from explicit scene instructions; inspect video output and report real limitations, including repeat-content detection and human artistic review.
3. Add reliable quality gates: deterministic timeline seeking, missing-asset errors, appropriate scene pacing, caption synchronization, full frame decode and representative frame inspection.
4. Only after convincing standalone quality and stable versioned contracts, evaluate ClaudeCreate/AetherRendering integration on separate branches with non-regression tests.

## Preservation rules

- Do not merge or replace stable branches to announce this checkpoint.
- Do not imply prototype code or test fixtures are cinematic-quality production systems.
- Do not change the other repositories during an AetherMotion status-only update.
- Keep all existing samples, source code and test evidence.

**Checkpoint decision:** AetherMotion integration is **deferred pending visual-quality and capability improvements**; development may continue independently.
