# Producing narration, effects and subtitles

The normal render command accepts ready-made local WAVs, including those produced by ClaudeCreate or AetherRendering. To play the verified example:

```sh
node dist/cli/main.js validate examples/signal.json
node dist/cli/main.js render examples/signal.json out/signal.mp4 --backend native
node dist/cli/main.js subtitles examples/signal.json out/signal.srt
node dist/cli/main.js verify examples/signal.json out/signal.mp4
```

The optional film-level audio array contains up to 32 cues, each with a role (narration, music or effect), relative PCM WAV file, startFrame inclusive, endFrame exclusive, optional gain and caption. Times are global frame indices. Narration must fit in full; music and effects stop at their interval end. Cues can overlap. Captioned intervals must be disjoint. Captions are drawn in screen space after all objects and may also be exported as SRT. Effects and narration are resampled to stereo 48 kHz, delayed by an integer sample count, mixed, peak-limited and encoded to AAC. Video is stream-copied. Silent films keep a single video stream. Verification checks both streams and performs a complete decode.

## Optional standalone Kokoro voice adapter
Use existing local speech files directly or synthesize once using Python 3.11–3.13, kokoro-onnx and local model files. Only this optional preprocessing step needs Python ML dependencies.

```sh
python3 -m venv .venv
.venv/bin/pip install kokoro-onnx==0.4.9
mkdir -p models out
curl -fL https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.int8.onnx -o models/kokoro.onnx
curl -fL https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin -o models/voices.bin
.venv/bin/python scripts/narrate.py --model models/kokoro.onnx --voices models/voices.bin --voice af_heart --text "Watch the signal. The third light tells us when to go." out/signal.wav
```

The checked-in sample uses 71680 mono samples at 24 kHz (2.987 s), af_heart, US English and speed 1. The original bell is a damped 880 Hz sinusoid. The adapter reports measured duration and refuses to overwrite files. Place generated WAVs under the JSON file's directory and assign intervals using ceil(duration × fps). Captions are cue-level. The adapter provides no phoneme alignment or automatic mouth tracking.

The model and voice pack are downloaded separately from the [ONNX release](https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0). Consult the [model card](https://huggingface.co/hexgrad/Kokoro-82M) and the installed package notices when redistributing them. Measured SHA-256: model 6e742170d309016e5891a994e1ce1559c702a2ccd0075e67ef7157974f6406cb, voices bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d.
