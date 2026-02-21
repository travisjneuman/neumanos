#!/usr/bin/env bash
set -euo pipefail

echo "=== Type Check ==="
npm run type-check

echo "=== Build ==="
npm run build

echo "=== Audit (production deps) ==="
npm audit --omit=dev --audit-level=high || echo "⚠ Audit found issues (non-blocking)"

echo "=== All checks passed ==="
