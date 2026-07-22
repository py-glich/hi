#!/usr/bin/env bash
# Run this from the parent folder where you want the project created.
mkdir -p assets/.aistudio
mkdir -p src/lib

touch src/lib/pdfParser.ts
touch src/App.tsx
touch src/index.css
touch src/main.tsx
touch src/types.ts

touch .env.example
touch .gitignore
touch index.html
touch metadata.json
touch package.json
touch server.ts
touch tsconfig.json
touch vite.config.ts

echo "Done. Structure created."
