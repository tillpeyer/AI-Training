#!/usr/bin/env bash
# Cross-platform "Claude Code needs your attention" popup + sound.
# Picks a native notifier per OS; no-ops quietly if none is available
# rather than failing the hook.
MSG="Claude Code needs your attention"
TITLE="Claude Code"

case "$(uname -s)" in
  Darwin)
    # `sound name` plays one of macOS's built-in alert sounds alongside the banner.
    osascript -e "display notification \"$MSG\" with title \"$TITLE\" sound name \"Glass\"" 2>/dev/null
    ;;
  Linux)
    command -v notify-send >/dev/null 2>&1 && notify-send "$TITLE" "$MSG"
    if command -v paplay >/dev/null 2>&1; then
      for f in /usr/share/sounds/freedesktop/stereo/complete.oga \
               /usr/share/sounds/freedesktop/stereo/dialog-information.oga; do
        [ -f "$f" ] && { paplay "$f" 2>/dev/null & break; }
      done
    fi
    ;;
  MINGW*|MSYS*|CYGWIN*)
    # Play the sound first (fire-and-forget) since MessageBox blocks until dismissed.
    powershell.exe -NoProfile -Command "[System.Media.SystemSounds]::Asterisk.Play()" 2>/dev/null
    powershell.exe -NoProfile -Command \
      "\$null = [System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); [System.Windows.Forms.MessageBox]::Show('$MSG', '$TITLE') | Out-Null" \
      2>/dev/null
    ;;
esac

exit 0
