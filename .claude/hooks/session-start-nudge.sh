#!/usr/bin/env bash
# SessionStart hook: inject a reminder into context so environment drift
# (stale BMAD/ELCAi version, missing MCP servers, un-wired safety hooks,
# gitignore coverage gaps) surfaces at the start of every session instead
# of only when someone remembers to ask.
cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"Before doing other work this session, run the check-training-env command to verify this repo's BMAD/ELCAi environment (MCP servers, safety-hook wiring, version pins, story-loop presence, gitignore coverage). Only skip it if the user's first message already makes clear they want something else done immediately."}}
JSON
