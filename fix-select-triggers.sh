#!/bin/bash

# Fix all SelectTrigger usage in the codebase
# This script removes SelectTrigger wrappers and updates Select components

echo "Fixing SelectTrigger usage in all components..."

# Files that need fixing (excluding the ui/select.tsx itself)
files=(
  "src/components/sidebar/PuzzleFilters.tsx"
  "src/components/sidebar/CharacterFilters.tsx"
  "src/components/generated/ComponentRegistry.tsx"
  "src/components/field-editors/FieldEditor.tsx"
  "src/components/NodeSelector.tsx"
  "src/components/sidebar/NodeConnectionsFilters.tsx"
  "src/components/CharacterSelector.tsx"
  "src/components/detail-panel/field-editors/MultiSelectFieldEditor.tsx"
  "src/components/detail-panel/field-editors/SelectFieldEditor.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Create a backup
    cp "$file" "$file.bak"
    
    # Remove SelectTrigger, SelectContent, SelectValue from imports
    sed -i 's/,\s*SelectTrigger//g' "$file"
    sed -i 's/SelectTrigger,\s*//g' "$file"
    sed -i 's/,\s*SelectContent//g' "$file"
    sed -i 's/SelectContent,\s*//g' "$file"
    sed -i 's/,\s*SelectValue//g' "$file"
    sed -i 's/SelectValue,\s*//g' "$file"
    
    # Clean up any resulting empty lines in imports
    sed -i '/^\s*$/d' "$file"
    
    echo "  - Updated imports"
  fi
done

echo "Done! Manual review required for component structure changes."
echo "You'll need to:"
echo "1. Remove <SelectTrigger> wrapper components"
echo "2. Remove <SelectContent> wrapper components"
echo "3. Remove <SelectValue /> components"
echo "4. Move className and id props from SelectTrigger to Select"