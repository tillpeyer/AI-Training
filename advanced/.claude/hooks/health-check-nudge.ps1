# PostToolUse hook: when `mvnw spring-boot:run` is launched in the background,
# poll /actuator/health and report the result -- automates the DoD checklist's
# "boots cleanly, /actuator/health returns UP" step instead of relying on
# someone remembering to curl it by hand.
#
# Only fires for backgrounded launches: a foreground spring-boot:run blocks the
# Bash tool call until the process exits, so by the time PostToolUse runs the
# server (if it was up at all) is already down again -- nothing useful to check.
$stdin = [Console]::In.ReadToEnd() | ConvertFrom-Json
$cmd = $stdin.tool_input.command
$isBackground = $stdin.tool_input.run_in_background

if (-not $cmd) { exit 0 }
if ($cmd -notmatch 'spring-boot:run') { exit 0 }
if (-not $isBackground) { exit 0 }

# 45s budget: assumes dependencies are already cached (mvnw test runs earlier
# in the DoD checklist), so this is covering JVM start + Spring context init,
# not a cold Maven download -- but that alone can still take 15-30s+.
$maxAttempts = 45
$delaySeconds = 1
$status = $null

for ($i = 0; $i -lt $maxAttempts; $i++) {
    Start-Sleep -Seconds $delaySeconds
    try {
        $resp = Invoke-RestMethod -Uri 'http://localhost:8080/actuator/health' -TimeoutSec 2 -ErrorAction Stop
        $status = $resp.status
        if ($status) { break }
    } catch {
        continue
    }
}

if ($status -eq 'UP') {
    $context = "spring-boot:run booted cleanly -- /actuator/health returned UP. DoD health-check step satisfied."
} elseif ($status) {
    $context = "spring-boot:run's /actuator/health returned '$status' (not UP) -- investigate before marking the DoD health-check step done."
} else {
    $context = "spring-boot:run: /actuator/health did not respond within $($maxAttempts * $delaySeconds)s of launching -- check the app actually booted (port conflict, startup error) before marking the DoD health-check step done."
}

$output = @{ hookSpecificOutput = @{ hookEventName = 'PostToolUse'; additionalContext = $context } } | ConvertTo-Json -Compress
Write-Output $output
exit 0
