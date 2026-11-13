"""Synthesize a local mono PCM narration clip using Kokoro ONNX."""
import argparse
import json
import os
from pathlib import Path
import tempfile
import wave

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--voices", type=Path, required=True)
    parser.add_argument("--voice", default="af_heart")
    parser.add_argument("--lang", default="en-us")
    parser.add_argument("--speed", type=float, default=1.0)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--text")
    group.add_argument("--jobs", type=Path, help="JSON array of text/output jobs for one loaded voice model")
    parser.add_argument("output", type=Path, nargs="?")
    args = parser.parse_args()
    if not 0.5 <= args.speed <= 2 or bool(args.text) != bool(args.output):
        parser.error("single-clip mode takes --text and output; speed must be between 0.5 and 2")
    jobs = json.loads(args.jobs.read_text()) if args.jobs else [{"text": args.text, "output": str(args.output)}]
    for job in jobs:
        if not job["text"].strip() or Path(job["output"]).exists():
            parser.error("each job requires nonempty text and a fresh output path")
    from kokoro_onnx import Kokoro
    import numpy as np
    engine = Kokoro(str(args.model), str(args.voices))
    for job in jobs:
        output = Path(job["output"])
        samples, rate = engine.create(job["text"], voice=args.voice, speed=args.speed, lang=args.lang)
        if not len(samples) or not np.isfinite(samples).all() or not np.any(samples):
            raise ValueError("Kokoro returned an empty or invalid clip")
        pcm = np.rint(np.clip(samples, -1, 1) * 32767).astype("<i2")
        output.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(dir=output.parent, suffix=".wav") as temp:
            with wave.open(temp.name, "wb") as out:
                out.setparams((1, 2, rate, 0, "NONE", ""))
                out.writeframes(pcm.tobytes())
            os.link(temp.name, output)
        print(f"{output}: {len(samples)} samples at {rate} Hz, {len(samples)/rate:.3f} seconds")

if __name__ == "__main__":
    main()
