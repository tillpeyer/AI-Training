# PostToolUse hook: after a Maven test run, if it failed, nudge toward the
# story's Definition of Done checklist instead of letting the failure pass
# by unremarked. Stringifies the whole payload rather than assuming an exact
# tool_response field name/shape, since that schema isn't guaranteed stable.
$stdin = [Console]::In.ReadToEnd() | ConvertFrom-Json
$cmd = $stdin.tool_input.command

if (-not $cmd) { exit 0 }
if ($cmd -notmatch 'mvnw?(\.cmd)?\s+.*\btest\b') { exit 0 }

$payload = $stdin | ConvertTo-Json -Depth 20 -Compress

$failed = $payload -match 'BUILD FAILURE' `
    -or $payload -match '(?s)Tests run:.*?Failures:\s*[1-9]' `
    -or $payload -match '(?s)Tests run:.*?Errors:\s*[1-9]'

if ($failed) {
    $context = "mvnw test failed. Before iterating further, re-check the current story's Definition of Done (CLAUDE.md > Definition of Done) -- all ACs and tests must pass before the PR is opened."
    $output = @{ hookSpecificOutput = @{ hookEventName = 'PostToolUse'; additionalContext = $context } } | ConvertTo-Json -Compress
    Write-Output $output
}

exit 0
