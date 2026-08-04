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

# --- push rules (3 and 4) ----------------------------------------------------
#
# Both are evaluated per *segment* rather than against the whole command line.
# Matching the full string made unrelated tokens leak into the push check: a
# `git commit -F -` in the same `&&` chain read as `-f` (force), and a branch
# name anywhere in the line read as the push destination.

$defaultBranches = @('main', 'master')

# Returns the flags/arguments that belong to a single `git push` invocation.
function Get-PushParts([string]$segment) {
    $after = $segment -replace '^[\s\S]*?git\s+(?:-\S+\s+)*push\b', ''
    $tokens = @($after -split '\s+' | Where-Object { $_ -ne '' })
    return @{
        Flags = @($tokens | Where-Object { $_ -like '-*' })
        Args  = @($tokens | Where-Object { $_ -notlike '-*' -and $_ -notmatch '^[0-9]?>' })
    }
}

# True when the push would land on the repo's default branch. Handles refspecs
# (`HEAD:main`), fully-qualified refs (`refs/heads/main`), and the implicit case
# (`git push` with no ref, which pushes whatever branch is checked out).
function Test-TargetsDefaultBranch($parts, [string]$currentBranch) {
    $isDelete = @($parts.Flags | Where-Object { $_ -eq '--delete' -or $_ -eq '-d' }).Count -gt 0

    $namesDefault = $false
    foreach ($arg in $parts.Args) {
        $dst = ($arg -split ':')[-1]         # right-hand side of a refspec
        $leaf = ($dst -split '/')[-1].TrimStart('+')
        if ($defaultBranches -contains $leaf) { $namesDefault = $true }
    }

    # `git push origin --delete some-feature` never touches the default branch;
    # `git push origin --delete main` very much does.
    if ($isDelete) { return $namesDefault }

    if ($namesDefault) { return $true }

    # No explicit ref (`git push`, `git push origin`): destination is HEAD.
    if ($parts.Args.Count -le 1 -and $defaultBranches -contains $currentBranch) { return $true }

    return $false
}

$segments = @([regex]::Split($cmd, '(?:\|\||&&|;|\||\r?\n)'))
$pushSegments = @($segments | Where-Object { $_ -match 'git\s+(?:-\S+\s+)*push\b' })

# Conservative fallback: if the command mentions `git push` but splitting found
# no segment (unusual quoting), evaluate the whole line rather than allow it.
if ($pushSegments.Count -eq 0 -and $cmd -match 'git\s+(?:-\S+\s+)*push\b') {
    $pushSegments = @($cmd)
}

if ($pushSegments.Count -gt 0) {
    $currentBranch = (git rev-parse --abbrev-ref HEAD 2>$null)
    if ($currentBranch) { $currentBranch = $currentBranch.Trim() }

    foreach ($segment in $pushSegments) {
        $parts = Get-PushParts $segment

        # 3. Never force-push -- rewrites shared history without explicit re-approval.
        #    -cmatch (case-SENSITIVE) so `git commit -F` is not read as `-f`.
        $forced = $false
        foreach ($flag in $parts.Flags) {
            if ($flag -cmatch '^--force(-with-lease)?(=|$)' -or $flag -ceq '-f') { $forced = $true }
        }
        # A leading `+` on a refspec (`git push origin +main`) is also a force push.
        foreach ($arg in $parts.Args) {
            if ($arg.StartsWith('+')) { $forced = $true }
        }
        if ($forced) {
            [Console]::Error.WriteLine("Blocked: force-push requires explicit user approval outside the preflight batch. Ask first.")
            exit 2
        }

        # 4. Never push directly to the repo's default branch (main/master).
        if (Test-TargetsDefaultBranch $parts $currentBranch) {
            [Console]::Error.WriteLine("Blocked: don't push directly to main/master. Use a feature branch + PR.")
            exit 2
        }
    }
}

exit 0
