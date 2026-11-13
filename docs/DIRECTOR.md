# Optional Gemini director
The director asks a model for a compact storyboard (2–6 beats). AetherMotion compiles each beat into existing whiteboard or infographic objects, validates the complete film, and writes the scene JSON. The renderer uses no API key. The v0.1 director supports landscape and portrait, 6–180 whole seconds, fixed 24 fps and optional short narration, with equal-length shots. More elaborate 3D and cartoon direction is currently available by authoring scene JSON directly.

```sh
export GEMINI_MODEL="your-structured-output-capable-model"
read -rsp "Gemini API key: " GEMINI_API_KEY
export GEMINI_API_KEY
node dist/cli/main.js direct "Why eclipses are infrequent" out/eclipse.json \
  --seconds 30 --format portrait --style whiteboard --tokens 2048 --retries 1 > out-director-report.json
node dist/cli/main.js render out/eclipse.json out/eclipse.mp4 --backend native
```

Set --model explicitly to override GEMINI_MODEL. The adapter uses generateContent, responseMimeType application/json and responseJsonSchema. A small provider schema limits titles, explanatory copy and labels. The local validator still checks the generated document. An existing output path fails before contacting Gemini. The output cap is per request. A retry count of 1 allows up to two requests. Reported usage metadata includes provider counts for completed responses, when available. Missing provider usage is recorded as null. Authorization errors, unsupported model errors and exhausted token budgets surface directly. Transient errors and invalid JSON get bounded retries. The billing total can include input and other provider-specific token categories.

Add --narration to include spoken lines. The report lists text, relative WAV files and frame windows. Synthesize each line with the local Kokoro adapter or the caller's existing TTS and put its WAV at the declared path relative to the film. Validate before rendering. A clip that exceeds its allocated time raises an error; adjust its wording or scene duration. The model does not create audio files.

## Other providers
Implement the TypeScript Director.generate(prompt,schema) interface in src/ai/director.ts and return text plus optional usage. direct(brief,provider,retries) applies the shared validation, repair and compilation logic. Tests exercise Gemini request fields, error classes, usage accounting, both layout selection and the real offline export path with a controlled response. A live provider call still requires the operator's own key and an available compatible model. [Google structured-output reference](https://ai.google.dev/gemini-api/docs/structured-output).

After generating JSON with --narration, run `node dist/cli/main.js produce out/eclipse.json out/eclipse-production --backend native` to synthesize its missing voice clips, measure their durations and export the MP4. See [production setup](PRODUCE.md).

## Motion storyboards

Use `--layout motion` to ask the director for illustrated shots. The default `labels` layout keeps the original whiteboard and infographic behaviour. The motion layout takes the same brief options. Style guides the provider's illustration choices. The storyboard supplies the actual colours and marks.

```sh
# Direct a topic with your configured Gemini model and capture the editable storyboard.
mkdir -p out
node dist/cli/main.js direct "A letter travels on a night train" out/directed.json \
  --layout motion --seconds 30 --format landscape --style infographic \
  --tokens 8192 --retries 1 --narration > out/director-report.json
node dist/cli/main.js compile-board out/director-report.json out/recompiled.json
```

The director report includes a versioned `storyboard` containing `version: "1"`, `brief` and `board`. Save it to reproduce the scene or edit its instructions. The offline compiler also accepts those three fields directly. Both routes use the same validator and return a regular v0.1 scene. For local WAVs, the compiled JSON's directory is the root for paths such as `voice/shot-1.wav`.

|Instruction|Meaning|
|---|---|
|Shot|A title, background, ink colour, positive integer duration weight, ordered layers, and a narration line when requested. One to eight shots. Cumulative weighted boundaries round to frames so the requested total is exact.|
|Stage|100 units wide and 48 high. Both orientations use the same scale on both axes and mask objects at the stage boundary. The title sits above the stage and captions use screen space. A portrait film uses a centred horizontal illustration.|
|Layer|A unique name, one or more marks, and poses. Marks paint in array order relative to the layer origin. Layers paint in shot order.|
|Mark|A disc with centre and radius, a box with top-left and dimensions, a filled polygon, or a stroked polyline. Colours use six-digit hex.|
|Pose|An `at` fraction from 0 to 1, x and y translation, optional clockwise angle in degrees, opacity and easing. The first and last poses hold outside their interval. Each pose supplies its own defaults of zero degrees and full opacity. Easing belongs to the starting pose. Pose times must map to strictly increasing frame indices.|

After building, reproduce the checked-in fictional night train film offline:

```sh
mkdir -p out/night-input
cp -r examples/night-post/voice out/night-input/
node dist/cli/main.js compile-board examples/night-post/board.json out/night-input/film.json
node dist/cli/main.js produce out/night-input/film.json out/night-post --backend native --workers 2
node dist/cli/main.js verify out/night-post/film.json out/night-post/film.mp4
```

The sample storyboard was authored in this development session. Its three Flite voice clips ship with it. A live Gemini run still requires a key and model that accepts the response schema. The test suite checks the provider request and bounded repair offline.
