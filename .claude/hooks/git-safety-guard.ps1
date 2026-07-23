$stdin = [Console]::In.ReadToEnd() | ConvertFrom-Json
$rawCmd = $stdin.tool_input.command

if (-not $rawCmd) { exit 0 }

# Strip heredoc bodies (e.g. `git commit -m "$(cat <<'EOF' ... EOF)"`) before
# matching -- otherwise prose that merely *mentions* a trigger phrase (a commit
# message describing "gh pr merge", a doc excerpt with "git push --force")
# false-positives as if it were an actual invocation.
$heredocPattern = "(?s)<<-?~?\s*['`"]?(\w+)['`"]?.*?\r?\n\s*\1\b"
$cmd = [regex]::Replace($rawCmd, $heredocPattern, '<<HEREDOC_STRIPPED>>')

# 1. Don't let BMAD installer output (.agents/, _bmad/, unshipped .claude/*) get staged.
if ($cmd -match 'git\s+add' -and $cmd -notmatch '\-\-dry-run') {
    $leaked = git status --porcelain --ignored=no --untracked-files=all -- .agents _bmad .claude 2>$null |
        Where-Object { $_ -match '^\?\? (\.agents/|_bmad/(?!custom/config\.toml)|\.claude/(?!skills/install-story-loop/|skills/bmad-elcai-story-loop/|hooks/(git-safety-guard\.(ps1|sh)|test-failure-nudge\.(ps1|sh)|health-check-nudge\.(ps1|sh)|session-start-nudge\.sh|notify\.sh)$|settings\.json$|commands/(elcai-check-env|check-training-env)\.md$))' }
    if ($leaked) {
        [Console]::Error.WriteLine("Blocked: git add would stage BMAD installer output (.agents/, _bmad/, or unshipped .claude/ paths). Check .gitignore before proceeding.")
        exit 2
    }
}

# 2. Never merge a PR from inside Claude Code -- that's a human decision (CLAUDE.md, story-loop invariant).
if ($cmd -match 'gh\s+pr\s+merge') {
    [Console]::Error.WriteLine("Blocked: merging a PR is a human decision. Ask the user to merge it themselves.")
    exit 2
}

# 3. Never force-push -- rewrites shared history without explicit re-approval.
if ($cmd -match 'git\s+push' -and $cmd -match '(--force(-with-lease)?|(?<!\S)-f(?!\S))') {
    [Console]::Error.WriteLine("Blocked: force-push requires explicit user approval outside the preflight batch. Ask first.")
    exit 2
}

# 4. Never push directly to the repo's default branch (main/master).
if ($cmd -match 'git\s+push') {
    $currentBranch = (git rev-parse --abbrev-ref HEAD 2>$null).Trim()
    $targetsDefault = $cmd -match '\b(origin\s+)?(main|master)\b'
    if ($targetsDefault -or ($currentBranch -in @('main', 'master') -and $cmd -notmatch '\b(main|master)\b.*:.*')) {
        [Console]::Error.WriteLine("Blocked: don't push directly to main/master. Use a feature branch + PR.")
        exit 2
    }
}

exit 0
