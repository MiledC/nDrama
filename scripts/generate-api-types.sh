#!/bin/bash
# Generate TypeScript types from subscriber-api OpenAPI spec.
# Usage: ./scripts/generate-api-types.sh
#
# Requires: subscriber-api running at localhost:8001
# Installs: openapi-typescript (npx, no global install needed)

set -euo pipefail

API_URL="${API_URL:-http://localhost:8001}"
OUTPUT="mobile/src/api/types.ts"

echo "Fetching OpenAPI spec from ${API_URL}/openapi.json..."
npx openapi-typescript "${API_URL}/openapi.json" -o "${OUTPUT}"
echo "Types generated at ${OUTPUT}"
