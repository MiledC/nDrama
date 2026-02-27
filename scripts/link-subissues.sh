#!/usr/bin/env bash
# Usage: ./scripts/link-subissues.sh EPIC_NUMBER STORY_NUMBER [STORY_NUMBER...]
# Example: ./scripts/link-subissues.sh 1 2 3 4 5 6

set -euo pipefail

REPO="MiledC/nDrama"
EPIC_NUM=$1
shift
STORY_NUMS=("$@")

# Get Epic node ID
EPIC_ID=$(gh issue view "$EPIC_NUM" --repo "$REPO" --json id -q '.id')
echo "Epic #$EPIC_NUM node ID: $EPIC_ID"

for STORY_NUM in "${STORY_NUMS[@]}"; do
  STORY_ID=$(gh issue view "$STORY_NUM" --repo "$REPO" --json id -q '.id')
  echo "Linking Story #$STORY_NUM ($STORY_ID) to Epic #$EPIC_NUM..."

  gh api graphql -f query="
    mutation {
      addSubIssue(input: {issueId: \"$EPIC_ID\", subIssueId: \"$STORY_ID\"}) {
        issue { id title }
        subIssue { id title }
      }
    }
  "
  echo "  Done #$STORY_NUM"
done

echo "All stories linked to Epic #$EPIC_NUM"
