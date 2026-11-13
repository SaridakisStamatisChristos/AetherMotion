# AetherMotion
Render an animated film locally from a versioned JSON file. The supplied 30-second physics film animates rotation, projection and period in three shots. Its graphics and camera are evaluated at exact frame indices. No API key is needed.

![Three decoded frames](samples/wave-contact.jpg)

## Install on Ubuntu or Linux Mint
Install Node.js 22.12 or later (including npm) via your usual Node version manager. Check both versions before installing dependencies.

```sh
sudo apt update
sudo apt install git ffmpeg fonts-liberation fonts-dejavu-core
git clone --branch feature/aethermotion-v0.1 https://github.com/SaridakisStamatisChristos/AetherMotion.git
cd AetherMotion
node --version
npm ci
npm run build
npm test
node dist/cli/main.js validate examples/wave.json
node dist/cli/main.js render examples/wave.json out/wave.mp4 --backend native
node dist/cli/main.js verify examples/wave.json out/wave.mp4
```

Native Canvas uses Skia on CPU. The default backend runs the same painter in headless Chromium. Install a Playwright browser once with `npx playwright-core install --with-deps chromium` or point `CHROMIUM_PATH` at a working system Chrome/Chromium executable. On Mint the system executable can be easier to install than Playwright's distribution-specific system packages.

```sh
node dist/cli/main.js render examples/wave.json out/wave-browser.mp4 --backend chromium --workers 2 --batch 3
```

The render command prints JSON metrics to standard output. Choose a fresh output filename. A failed render can be retried at the same destination. If Chromium reports a socket or sandbox startup failure in a container, use the native backend. For missing encoders check `ffmpeg -encoders` for libx264. For missing libraries on a new install, use the supported Node version and install optional npm dependencies. System fonts affect layout. Match fonts and toolchain versions when reproducing pixels.

## Authoring and extension
Copy an example JSON file, change its contents and run validate, render and verify. The schema rejects unknown actions. [Scene format and API](docs/SCENE.md) · [Architecture](docs/ARCHITECTURE.md) · [Reference and licensing](docs/RECONNAISSANCE.md) · [Verification](docs/VERIFICATION.md) · [Development status](docs/PROGRESS.md) · [Continuation](docs/CONTINUATION_CHECKPOINT.md).
