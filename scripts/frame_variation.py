"""Measure repeated 80 by 45 grayscale thumbnails across a decoded video."""
import argparse
from hashlib import sha256
import json
from pathlib import Path
import subprocess


def frame_variation(path):
    width, height = 80, 45
    command = [
        "ffmpeg", "-nostdin", "-v", "error", "-xerror", "-i", str(path),
        "-map", "0:v:0", "-vf", f"scale={width}:{height}", "-pix_fmt", "gray",
        "-fps_mode", "passthrough", "-f", "rawvideo", "pipe:1",
    ]
    seen = set()
    previous = None
    frames = repeated = run = longest = 0
    with subprocess.Popen(command, stdout=subprocess.PIPE) as decoder:
        while block := decoder.stdout.read(width * height):
            if len(block) != width * height:
                raise ValueError("Incomplete decoded thumbnail")
            digest = sha256(block).digest()
            if digest == previous:
                repeated += 1
                run += 1
            else:
                run = 1
            longest = max(longest, run)
            seen.add(digest)
            previous = digest
            frames += 1
        if decoder.wait():
            raise ValueError("FFmpeg could not decode the video")
    if frames == 0:
        raise ValueError("No video frames were decoded")
    return dict(frames=frames, uniqueThumbnails=len(seen),
                adjacentIdenticalPairs=repeated, longestIdenticalRun=longest)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", type=Path)
    args = parser.parse_args()
    print(json.dumps(frame_variation(args.video), indent=2))
