#!/usr/bin/env bash
set -euo pipefail

# Default values
TOKEN="${GITHUB_TOKEN:-}"
TARGET_REPO=""
REPOS_FILE=""
COMMIT_MESSAGES=()
MESSAGES_FILE=""
SINCE_DATE=""
UNTIL_DATE=""
LOG_FILE="remove_commits.log"
FAILED_FILE="failed_push_repos.txt"
DRY_RUN=false

SUCCESS_COUNT=0
FAILED_COUNT=0
SKIPPED_COUNT=0

usage() {
  cat << 'EOF'
Usage:
  ./scripts/remove-commits.sh [OPTIONS]

Finds the oldest commit matching the criteria, resets the branch to the
commit immediately preceding it, and force-pushes the updated branch.
Repos where force push fails (e.g. branch protection, missing workflow scope)
are saved to failed_push_repos.txt.

Required:
  --token, -t <TOKEN>             GitHub Personal Access Token (or export GITHUB_TOKEN)
  --message, -m <PATTERN>         Commit message pattern to match (can specify multiple times)
     OR
  --messages-file <FILE>          File containing commit messages to match (one per line)

  --repo, -r <OWNER/REPO>         Single repository to target (for testing)
     OR
  --file, -f <FILE>               File containing list of repositories (one per line)

Optional:
  --after, --since <DATE>         Start of time window (e.g. "2026-01-01" or "2026-01-01T00:00:00Z")
  --before, --until <DATE>        End of time window (e.g. "2026-10-01" or "2026-10-01T23:59:59Z")
  --failed-file <FILE>            File to record repos that failed to push (default: failed_push_repos.txt)
  --dry-run                       Inspect target reset point without resetting or pushing
  --log, -l <FILE>                Log file path (default: remove_commits.log)
  -h, --help                      Show this help message

Examples:
  # Test with 1 repo (dry-run):
  ./scripts/remove-commits.sh -t ghp_xxx -r owner/repo -m "wip" --since "2026-01-01" --dry-run

  # Execute on 1 repo and push:
  ./scripts/remove-commits.sh -t ghp_xxx -r owner/repo -m "wip" --since "2026-01-01"

  # Execute across all repos from file:
  ./scripts/remove-commits.sh -t ghp_xxx -f repos.txt -m "wip" --since "2026-01-01"
EOF
  exit 1
}

# Parse CLI options
while [[ $# -gt 0 ]]; do
  case "$1" in
    --token|-t)
      TOKEN="$2"
      shift 2
      ;;
    --repo|-r)
      TARGET_REPO="$2"
      shift 2
      ;;
    --file|-f)
      REPOS_FILE="$2"
      shift 2
      ;;
    --message|-m)
      COMMIT_MESSAGES+=("$2")
      shift 2
      ;;
    --messages-file)
      MESSAGES_FILE="$2"
      shift 2
      ;;
    --after|--since)
      SINCE_DATE="$2"
      shift 2
      ;;
    --before|--until)
      UNTIL_DATE="$2"
      shift 2
      ;;
    --failed-file)
      FAILED_FILE="$2"
      shift 2
      ;;
    --log|-l)
      LOG_FILE="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      ;;
  esac
done

# Load messages from file if provided
if [[ -n "$MESSAGES_FILE" ]]; then
  if [[ ! -f "$MESSAGES_FILE" ]]; then
    echo "Error: Messages file '$MESSAGES_FILE' does not exist." >&2
    exit 1
  fi
  while IFS= read -r line || [[ -n "$line" ]]; do
    trimmed="$(echo "$line" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
    if [[ -n "$trimmed" && ! "$trimmed" =~ ^# ]]; then
      COMMIT_MESSAGES+=("$trimmed")
    fi
  done < "$MESSAGES_FILE"
fi

# Validation
if [[ -z "$TOKEN" ]]; then
  echo "Error: GitHub token is required (use --token or export GITHUB_TOKEN)" >&2
  exit 1
fi

if [[ ${#COMMIT_MESSAGES[@]} -eq 0 ]]; then
  echo "Error: At least one commit message pattern is required (--message / -m or --messages-file)" >&2
  exit 1
fi

if [[ -z "$TARGET_REPO" && -z "$REPOS_FILE" ]]; then
  echo "Error: Specify either a single repo (--repo) or a repo list file (--file)" >&2
  exit 1
fi

if [[ -n "$TARGET_REPO" && -n "$REPOS_FILE" ]]; then
  echo "Error: Cannot specify both --repo and --file. Choose one." >&2
  exit 1
fi

if [[ -n "$REPOS_FILE" && ! -f "$REPOS_FILE" ]]; then
  echo "Error: Repos file '$REPOS_FILE' does not exist." >&2
  exit 1
fi

ORIGINAL_DIR="$(pwd)"
LOG_FILE="$(realpath -m "$LOG_FILE")"
FAILED_FILE="$(realpath -m "$FAILED_FILE")"
[[ -n "$REPOS_FILE" && -f "$REPOS_FILE" ]] && REPOS_FILE="$(realpath "$REPOS_FILE")"
[[ -n "$MESSAGES_FILE" && -f "$MESSAGES_FILE" ]] && MESSAGES_FILE="$(realpath "$MESSAGES_FILE")"

log() {
  local level="$1"
  local msg="$2"
  local ts
  ts="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "[$ts] [$level] $msg"
  echo "[$ts] [$level] $msg" >> "$LOG_FILE"
}

process_repo() {
  local repo="$1"
  log "INFO" "=========================================="
  log "INFO" "Processing repository: $repo"

  local temp_dir
  temp_dir="$(mktemp -d -t "repo_reset_${repo//\//_}_XXXXXX")"

  local clone_url="https://x-access-token:${TOKEN}@github.com/${repo}.git"
  log "INFO" "Cloning $repo into $temp_dir..."

  if ! git clone --quiet "$clone_url" "$temp_dir/repo" >> "$LOG_FILE" 2>&1; then
    log "ERROR" "Failed to clone $repo. Adding to failure list."
    echo "$repo" >> "$FAILED_FILE"
    FAILED_COUNT=$((FAILED_COUNT + 1))
    rm -rf "$temp_dir"
    return 1
  fi

  cd "$temp_dir/repo"

  local branch
  branch="$(git rev-parse --abbrev-ref HEAD)"
  log "INFO" "Current default branch: $branch"

  # Build git log filters (multiple --grep flags act as logical OR)
  local git_log_args=()
  for msg in "${COMMIT_MESSAGES[@]}"; do
    git_log_args+=(--grep="$msg")
  done

  if [[ -n "$SINCE_DATE" ]]; then
    git_log_args+=(--after="$SINCE_DATE")
  fi
  if [[ -n "$UNTIL_DATE" ]]; then
    git_log_args+=(--before="$UNTIL_DATE")
  fi

  # Find the oldest matching commit on this branch
  local oldest_match
  oldest_match="$(git log --reverse "${git_log_args[@]}" --format="%H" | head -n 1 || true)"

  if [[ -z "$oldest_match" ]]; then
    log "INFO" "No matching commits found on branch '$branch' in $repo."
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    cd "$ORIGINAL_DIR"
    rm -rf "$temp_dir"
    return 0
  fi

  local oldest_info
  oldest_info="$(git log -1 --format="%h | %ci | %s" "$oldest_match")"
  log "INFO" "Oldest matching commit: $oldest_info"

  # Find parent commit immediately preceding the oldest match
  local parent_commit
  parent_commit="$(git rev-parse --verify "${oldest_match}^" 2>/dev/null || true)"

  if [[ -z "$parent_commit" ]]; then
    log "WARN" "The oldest matching commit is the root (initial) commit of the repository. Cannot reset before initial commit. Skipping."
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    cd "$ORIGINAL_DIR"
    rm -rf "$temp_dir"
    return 0
  fi

  local parent_info
  parent_info="$(git log -1 --format="%h | %ci | %s" "$parent_commit")"
  log "INFO" "Reset target (parent commit to keep): $parent_info"

  local commits_to_drop
  commits_to_drop="$(git rev-list --count "${parent_commit}..HEAD")"
  log "INFO" "Commits to be dropped from branch '$branch': $commits_to_drop commit(s)"

  if [[ "$DRY_RUN" == true ]]; then
    log "INFO" "[DRY RUN] Would reset '$branch' to $parent_commit and force push."
    cd "$ORIGINAL_DIR"
    rm -rf "$temp_dir"
    return 0
  fi

  log "INFO" "Resetting '$branch' to $parent_commit..."
  git reset --hard "$parent_commit" >> "$LOG_FILE" 2>&1

  log "INFO" "Force-pushing '$branch' to remote..."
  local push_output
  if push_output=$(git push origin "$branch" --force 2>&1); then
    echo "$push_output" >> "$LOG_FILE"
    log "INFO" "Successfully reset and pushed $repo ($branch)."
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo "$push_output" >> "$LOG_FILE"
    log "ERROR" "Failed to force push $repo ($branch)."

    if echo "$push_output" | grep -qi -E "without.*workflow.*scope"; then
      log "WARN" "Personal Access Token requires the 'workflow' scope to update .github/workflows files."
    elif echo "$push_output" | grep -qi -E "protected|GH006|hook declined|pre-receive hook declined"; then
      log "WARN" "Branch protection or rule prevented force push on $repo ($branch)."
    fi

    # Append to failed repos file (avoid duplicate entries if already present)
    if ! grep -Fxq "$repo" "$FAILED_FILE" 2>/dev/null; then
      echo "$repo" >> "$FAILED_FILE"
    fi
    FAILED_COUNT=$((FAILED_COUNT + 1))
  fi

  cd "$ORIGINAL_DIR"
  rm -rf "$temp_dir"
}

touch "$LOG_FILE"
touch "$FAILED_FILE"

log "INFO" "Starting commit reset script."
log "INFO" "Message patterns (${#COMMIT_MESSAGES[@]} specified):"
for msg in "${COMMIT_MESSAGES[@]}"; do
  log "INFO" "  * $msg"
done
log "INFO" "Since date  : ${SINCE_DATE:-None}"
log "INFO" "Until date  : ${UNTIL_DATE:-None}"
log "INFO" "Dry run     : $DRY_RUN"
log "INFO" "Log file    : $LOG_FILE"
log "INFO" "Failed file : $FAILED_FILE"

if [[ -n "$TARGET_REPO" ]]; then
  process_repo "$TARGET_REPO"
elif [[ -n "$REPOS_FILE" ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    repo="$(echo "$line" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
    if [[ -z "$repo" || "$repo" =~ ^# ]]; then
      continue
    fi
    process_repo "$repo"
  done < "$REPOS_FILE"
fi

log "INFO" "=========================================="
log "INFO" "SUMMARY:"
log "INFO" "  Successfully reset and pushed: $SUCCESS_COUNT"
log "INFO" "  Failed force pushes           : $FAILED_COUNT"
log "INFO" "  Skipped / No matching commits : $SKIPPED_COUNT"

if [[ "$FAILED_COUNT" -gt 0 ]]; then
  log "WARN" "List of repositories that failed to push has been saved to: $FAILED_FILE"
  log "WARN" "You can address those repos and rerun with:"
  log "WARN" "  ./scripts/remove-commits.sh -t <TOKEN> -f \"$FAILED_FILE\" [OPTIONS]"
fi

log "INFO" "All done."
