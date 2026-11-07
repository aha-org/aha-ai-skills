#!/bin/bash
# One-time setup for the footage tools (transcribing and cutting interviews). Run from the project folder.
set -e
cd "$(dirname "$0")/.."
python3 -m venv .venv
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -q faster-whisper librosa noisereduce pedalboard soundfile numpy edge-tts
echo "Footage tools ready. The first transcription downloads the Whisper model (a few hundred MB)."
