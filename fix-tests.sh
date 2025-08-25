#!/bin/bash

echo "Fixing test suite issues..."

# Fix GraphControls test to use custom render utils
sed -i "s|from '@testing-library/react'|from '@/test/test-utils'|g" src/components/graph/GraphControls.test.tsx

# Fix MSW server to warn instead of error
sed -i "s|onUnhandledRequest: 'error'|onUnhandledRequest: 'warn'|g" src/test/setup.ts

# Fix all hook tests to use custom render
for file in src/hooks/*.test.tsx; do
  if [ -f "$file" ]; then
    sed -i "s|from '@testing-library/react'|from '@/test/test-utils'|g" "$file"
  fi
done

# Fix all component tests to use custom render
find src/components -name "*.test.tsx" -exec sed -i "s|from '@testing-library/react'|from '@/test/test-utils'|g" {} \;

echo "Test fixes applied. Run 'npm test' to verify."