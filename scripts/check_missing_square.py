"""Check the tile proof and speech alignment in a decoded Missing Square export."""
import argparse
from array import array
import json
from math import sqrt
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
COLORS = {'sand': (241, 197, 142), 'coral': (241, 139, 119),
          'mint': (165, 214, 201), 'gap': (53, 54, 70)}


def decode(path, *args):
    return subprocess.check_output(['ffmpeg', '-nostdin', '-v', 'error', '-xerror',
                                   '-i', str(path), *args, 'pipe:1'])


def check_grid(video, frame, completed):
    width, height = 540, 960
    rgb = decode(video, '-vf', f'select=eq(n\\,{frame})', '-frames:v', '1',
                 '-pix_fmt', 'rgb24', '-f', 'rawvideo')
    if len(rgb) != width * height * 3:
        raise ValueError(f'Incomplete frame {frame}')
    counts = {}
    for row in range(7):
        for col in range(7):
            # Offset from both grid lines and the text inside the unfilled gap.
            x, y = 100 + col * 45 + 10, 300 + row * 45 + 10
            pos = 3 * (width * y + x)
            if row < 4 and col < 4:
                label = 'sand'
            elif row < 4 or col < 4:
                label = 'coral'
            else:
                label = 'mint' if completed else 'gap'
            if max(abs(a-b) for a, b in zip(rgb[pos:pos+3], COLORS[label])) > 20:
                raise ValueError(f'Frame {frame}, cell ({row},{col}) expected {label}')
            counts[label] = counts.get(label, 0) + 1
    return counts


def pcm(path):
    data = array('h')
    data.frombytes(decode(path, '-map', '0:a:0', '-ac', '1', '-ar', '24000',
                          '-c:a', 'pcm_s16le', '-f', 's16le'))
    if sys.byteorder != 'little':
        data.byteswap()
    return data


def envelope(data):
    # RMS per 10 ms makes the test tolerant of AAC compression.
    return [sqrt(sum(x*x for x in data[i:i+240])/240)
            for i in range(0, len(data)-239, 240)]


def speech_alignment(video):
    film = json.loads((ROOT / 'examples/missing-square.json').read_text())
    audio = pcm(video)
    values = []
    for cue in film['audio']:
        voice = pcm(ROOT / 'examples' / cue['file'])
        start = cue['startFrame'] * 24000 // film['fps']
        source = envelope(voice)
        mixed = envelope(audio[start:start+len(voice)])
        if len(mixed) != len(source):
            raise ValueError('Incomplete voice in decoded audio')
        norm = sqrt(sum(x*x for x in source)*sum(x*x for x in mixed))
        similarity = sum(x*y for x, y in zip(source, mixed))/norm if norm else 0
        if similarity < .95:
            raise ValueError(f"{cue['file']} disagrees with its timed source clip")
        values.append(round(similarity, 4))
    return values


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('video', type=Path)
    video = parser.parse_args().video
    print(json.dumps({'frame454': check_grid(video, 454, False),
                      'frame683': check_grid(video, 683, True),
                      'speechEnvelopeSimilarity': speech_alignment(video)}, indent=2))
