#!/usr/bin/env bash
# Portable launcher for git-safety-guard.ps1 -- the guard logic is plain
# PowerShell (no Windows-only cmdlets), so pwsh (PowerShell 7+, cross-platform)
# runs it unchanged on macOS/Linux. Falls back to Windows PowerShell, then
# no-ops if neither is installed rather than blocking every Bash call.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if command -v pwsh >/dev/null 2>&1; then
  exec pwsh -NoProfile -File "$DIR/git-safety-guard.ps1"
elif command -v powershell.exe >/dev/null 2>&1; then
  exec powershell.exe -NoProfile -File "$DIR/git-safety-guard.ps1"
else
  exit 0
fi
