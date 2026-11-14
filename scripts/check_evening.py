"""Check the decoded lantern handoff and delayed sound cue in the evening fixture."""
import argparse
from array import array
import json
from math import sqrt
from pathlib import Path
import subprocess
import sys

def decoded(video, *args):
    return subprocess.check_output(['ffmpeg', '-nostdin', '-v', 'error', '-xerror',
                                   '-i', str(video), *args, 'pipe:1'])

def check(video):
    frames = decoded(video, '-vf',
                     r'select=eq(n\,429)+eq(n\,430),crop=48:36:824:514',
                     '-fps_mode', 'passthrough', '-pix_fmt', 'rgb24', '-f', 'rawvideo')
    size = 48 * 36 * 3
    if len(frames) != 2 * size:
        raise ValueError('Missing handoff frames at 1280 by 720')
    error = sum(abs(a-b) for a, b in zip(frames[:size], frames[size:])) / size
    samples = array('h', decoded(video, '-map', '0:a:0', '-ac', '1', '-ar', '16000',
                                '-f', 's16le'))
    if sys.byteorder != 'little':
        samples.byteswap()
    def rms(start, end):
        window = samples[int(start * 16000):int(end * 16000)]
        if not window:
            raise ValueError('Missing decoded audio interval')
        return sqrt(sum(v*v for v in window) / len(window))
    before, bell = rms(16, 17), rms(17.94, 18.25)
    if error >= 8:
        raise ValueError(f'Lamp appearance changed during release, mean pixel error {error:.3f}')
    if before > 1 or bell <= 10:
        raise ValueError('Expected silence before the handoff and an audible bell at release')
    return dict(handoffCropMeanAbsoluteByteDifference=error, preCueRms=before, bellRms=bell)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('video', type=Path)
    args = parser.parse_args()
    print(json.dumps(check(args.video), indent=2))
