# PitchCraft

Vinyl harmonic mixing companion for DJs. PitchCraft helps you find harmonically compatible tracks based on real-world turntable pitch changes, with a local SQLite library and fast filtering.

## Features

- Track library stored locally in SQLite
- Harmonic compatibility engine with pitch + key shifting
- Pitch range support (+/- 8% or +/- 16%)
- KCI (Key Compatibility Index) filter
- CSV/XLSX import (replaces library on import)
- Camelot and musical key display toggle
- Library editor with add/edit modal

## Tech Stack

- Tauri (Rust) desktop shell
- React + TypeScript + Tailwind CSS
- SQLite (via Tauri SQL plugin)

## Development

Install dependencies:

```bash
npm install
```

Run the desktop app:

```bash
npm run tauri dev
```

## Import Format

PitchCraft accepts CSV or XLSX. Required columns are:

- `title`
- `artist`
- `bpm`
- `key`

If a header row is not detected, PitchCraft will use the default mapping for the provided Traktor export format:

- column 2: artist
- column 3: title
- column 4: bpm
- column 5: key

Importing replaces the existing library.

## Build

```bash
npm run tauri build
```

Artifacts will be in:

```
src-tauri/target/release/bundle/
```

## Windows Build via GitHub Actions

A GitHub Actions workflow is included for building Windows installers:

- `.github/workflows/windows-build.yml`

Push to `main` or run it manually from the Actions tab to get a Windows build artifact.
