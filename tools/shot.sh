#!/usr/bin/env bash
# Test helper: tools/shot.sh <name> '<js run against the game>'  → exports/shots/<name>.png
# (uses headless Chrome and tools/shot.html; the local server must be running on port 8090)
name="$1"; js="$2"
root="$(cd "$(dirname "$0")/.." && pwd -W 2>/dev/null || pwd)"
mkdir -p "$root/exports/shots"
enc=$(printf '%s' "$js" | od -An -tx1 | tr -d ' \n' | sed 's/\(..\)/%\1/g')
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars \
  --user-data-dir="$TEMP/saqer-shot-profile" --window-size=1280,1010 --virtual-time-budget=25000 \
  --screenshot="$root/exports/shots/$name.png" "http://localhost:8090/tools/shot.html?js=$enc" 2>&1 | grep -i "written" || echo "no screenshot"
