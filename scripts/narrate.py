"""Synthesize a local mono PCM narration clip using Kokoro ONNX."""
import argparse
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
    parser.add_argument("--text", required=True)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if not args.text.strip() or not 0.5 <= args.speed <= 2:
        parser.error("provide nonempty text and speed between 0.5 and 2")
    if args.output.exists():
        parser.error("output already exists")
    from kokoro_onnx import Kokoro
    import numpy as np
    engine = Kokoro(str(args.model), str(args.voices))
    samples, rate = engine.create(args.text, voice=args.voice, speed=args.speed, lang=args.lang)
    if not len(samples) or not np.isfinite(samples).all() or not np.any(samples):
        raise ValueError("Kokoro returned an empty or invalid clip")
    pcm = np.rint(np.clip(samples, -1, 1) * 32767).astype("<i2")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=args.output.parent, suffix=".wav") as temp:
        with wave.open(temp.name, "wb") as out:
            out.setparams((1, 2, rate, 0, "NONE", ""))
            out.writeframes(pcm.tobytes())
        os.link(temp.name, args.output)
    print(f"{args.output}: {len(samples)} samples at {rate} Hz, {len(samples)/rate:.3f} seconds")

if __name__ == "__main__":
    main()
