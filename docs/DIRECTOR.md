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
