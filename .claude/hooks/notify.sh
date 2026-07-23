#!/usr/bin/env bash
# Cross-platform "Claude Code needs your attention" popup.
# Picks a native notifier per OS; no-ops quietly if none is available
# rather than failing the hook.
MSG="Claude Code needs your attention"
TITLE="Claude Code"

case "$(uname -s)" in
  Darwin)
    osascript -e "display notification \"$MSG\" with title \"$TITLE\"" 2>/dev/null
    ;;
  Linux)
    command -v notify-send >/dev/null 2>&1 && notify-send "$TITLE" "$MSG"
    ;;
  MINGW*|MSYS*|CYGWIN*)
    powershell.exe -NoProfile -Command \
      "[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); [System.Windows.Forms.MessageBox]::Show('$MSG', '$TITLE')" \
      2>/dev/null
    ;;
esac

exit 0
