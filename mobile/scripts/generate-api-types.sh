#!/bin/bash
# Generate TypeScript types from subscriber-api OpenAPI spec
# Usage: npm run generate-types

SUBSCRIBER_API_URL="${SUBSCRIBER_API_URL:-http://localhost:8001}"

echo "Fetching OpenAPI spec from $SUBSCRIBER_API_URL/openapi.json..."
npx openapi-typescript "$SUBSCRIBER_API_URL/openapi.json" \
  --output src/api/types.ts \
  --export-type

echo "Types generated at src/api/types.ts"
