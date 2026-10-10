#!/usr/bin/env bash
set -euo pipefail

TOKEN=""
OUTPUT_FILE="push_repos.txt"
LOG_FILE="github_fetch.log"

usage() {
  cat << 'EOF'
Usage:
  ./scripts/list-push-repos.sh [TOKEN] [OUTPUT_FILE] [OPTIONS]

Arguments / Options:
  --token, -t <TOKEN>         GitHub Personal Access Token (or 1st positional arg, or GITHUB_TOKEN env)
  --output, -o <FILE>         Output file path (default: push_repos.txt)
  --log, -l <FILE>            Log file path (default: github_fetch.log)
  -h, --help                  Show this help message

Examples:
  ./scripts/list-push-repos.sh ghp_xxxxxxxxxxxx
  ./scripts/list-push-repos.sh ghp_xxxxxxxxxxxx my_repos.txt
  ./scripts/list-push-repos.sh -t ghp_xxxxxxxxxxxx -o repos.txt
EOF
  exit 1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --token|-t)
      TOKEN="$2"
      shift 2
      ;;
    --output|-o)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    --log|-l)
      LOG_FILE="$2"
      shift 2
      ;;
    -h|--help)
      usage
      ;;
    *)
      if [[ -z "$TOKEN" ]]; then
        TOKEN="$1"
      elif [[ "$OUTPUT_FILE" == "push_repos.txt" ]]; then
        OUTPUT_FILE="$1"
      fi
      shift
      ;;
  esac
done

if [[ -z "$TOKEN" && -n "${GITHUB_TOKEN:-}" ]]; then
  TOKEN="$GITHUB_TOKEN"
fi

if [[ -z "$TOKEN" ]]; then
  echo "Error: GitHub token is required." >&2
  usage
fi

LOG_FILE="$(realpath -m "$LOG_FILE")"
OUTPUT_FILE="$(realpath -m "$OUTPUT_FILE")"

log() {
  local level="$1"
  local msg="$2"
  local ts
  ts="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "[$ts] [$level] $msg"
  echo "[$ts] [$level] $msg" >> "$LOG_FILE"
}

touch "$LOG_FILE"
> "$OUTPUT_FILE"

log "INFO" "Starting repository scan."
log "INFO" "Output file : $OUTPUT_FILE"
log "INFO" "Log file    : $LOG_FILE"

PAGE=1
PER_PAGE=100
TOTAL_MATCHES=0

while :; do
  URL="https://api.github.com/user/repos?per_page=${PER_PAGE}&page=${PAGE}&affiliation=owner,collaborator,organization_member&sort=full_name"
  log "INFO" "Fetching page $PAGE: $URL"

  RESPONSE=$(curl -sS -w "\nHTTP_STATUS:%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "$URL")

  HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d':' -f2)
  BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

  log "INFO" "Page $PAGE returned HTTP $HTTP_STATUS"

  if [[ "$HTTP_STATUS" -ne 200 ]]; then
    log "ERROR" "API error (HTTP $HTTP_STATUS): $BODY"
    echo "Error: GitHub API returned HTTP $HTTP_STATUS. See $LOG_FILE for details." >&2
    exit 1
  fi

  COUNT=$(echo "$BODY" | jq '. | length')
  if [[ "$COUNT" -eq 0 ]]; then
    log "INFO" "Page $PAGE is empty. Finished scanning."
    break
  fi

  MATCHES=$(echo "$BODY" | jq -r '.[] | select(.permissions.push == true or .permissions.admin == true) | .full_name')

  if [[ -n "$MATCHES" ]]; then
    echo "$MATCHES" >> "$OUTPUT_FILE"
    MATCH_COUNT=$(echo "$MATCHES" | wc -l)
    TOTAL_MATCHES=$((TOTAL_MATCHES + MATCH_COUNT))
  else
    MATCH_COUNT=0
  fi

  log "INFO" "Page $PAGE: $COUNT repos scanned, $MATCH_COUNT matching (total matching so far: $TOTAL_MATCHES)"

  if [[ "$COUNT" -lt "$PER_PAGE" ]]; then
    break
  fi

  PAGE=$((PAGE + 1))
done

# Sort unique
sort -u "$OUTPUT_FILE" -o "$OUTPUT_FILE"
FINAL_COUNT=$(wc -l < "$OUTPUT_FILE")

log "INFO" "Done! Found $FINAL_COUNT repositories with push access."
log "INFO" "Results dumped to: $OUTPUT_FILE"

echo "Done. Dumped $FINAL_COUNT repositories to $OUTPUT_FILE"
