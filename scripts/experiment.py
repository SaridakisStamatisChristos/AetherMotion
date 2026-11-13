"""Run three frozen-engine productions on Linux. Python is only a benchmark harness."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import time

def engine_digest():
    digest = hashlib.sha256()
    for path in sorted(list(Path("src").rglob("*.ts")) + list(Path("schemas").glob("*.json"))
                       + list(Path("dist").rglob("*.js")) + [Path("package-lock.json")]):
        digest.update(str(path).encode() + b"\0" + path.read_bytes() + b"\0")
    return digest.hexdigest()

def family_rss_kib(pid):
    # Summed RSS counts shared pages more than once. Short peaks between samples can be missed.
    total = 0
    seen = set()
    pending = [pid]
    while pending:
        current = pending.pop()
        if current in seen:
            continue
        seen.add(current)
        try:
            fields = Path(f"/proc/{current}/statm").read_text().split()
            total += int(fields[1]) * os.sysconf("SC_PAGE_SIZE") // 1024
            for task in Path(f"/proc/{current}/task").iterdir():
                try:
                    pending.extend(map(int, (task / "children").read_text().split()))
                except FileNotFoundError:
                    continue
        except (FileNotFoundError, ProcessLookupError):
            pass
    return total

def main():
    cli = argparse.ArgumentParser()
    cli.add_argument("directory", type=Path)
    cli.add_argument("--backend", choices=["native", "chromium"], default="native")
    args = cli.parse_args()
    args.directory.mkdir(parents=True, exist_ok=True)
    before = engine_digest()
    results = []
    for name in ["light", "courage", "triangles"]:
        scene = Path("examples") / (name + ".json")
        output = args.directory / (name + ".mp4")
        cmd = ["node", "dist/cli/main.js", "render", str(scene), str(output),
               "--backend", args.backend, "--workers", "2", "--batch", "3"]
        with subprocess.Popen(cmd, stdout=subprocess.PIPE, text=True) as proc:
            peak = 0
            while proc.poll() is None:
                peak = max(peak, family_rss_kib(proc.pid))
                time.sleep(0.05)
            report = proc.stdout.read()
            if proc.returncode:
                raise SystemExit(proc.returncode)
        if engine_digest() != before:
            raise RuntimeError("Engine or dependencies changed during the experiment")
        results.append(dict(spec=str(scene), **json.loads(report), sampledTreeRssKiB=peak))
    data = dict(engineDigest=before, modelCalls=0, directorTokens=0,
                engineSourceChanges=0, rssSampleIntervalSeconds=0.05, runs=results)
    (args.directory / "experiment.json").write_text(json.dumps(data, indent=2) + "\n")

if __name__ == "__main__":
    main()
