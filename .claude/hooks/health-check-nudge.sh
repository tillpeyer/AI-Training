#!/usr/bin/env bash
# Portable launcher for health-check-nudge.ps1 -- same pwsh/powershell.exe
# fallback pattern as the other hooks.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if command -v pwsh >/dev/null 2>&1; then
  exec pwsh -NoProfile -File "$DIR/health-check-nudge.ps1"
elif command -v powershell.exe >/dev/null 2>&1; then
  exec powershell.exe -NoProfile -File "$DIR/health-check-nudge.ps1"
else
  exit 0
fi
