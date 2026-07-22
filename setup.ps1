# Run this from the parent folder where you want the project created.
New-Item -ItemType Directory -Force -Path "assets\.aistudio" | Out-Null
New-Item -ItemType Directory -Force -Path "src\lib" | Out-Null

New-Item -ItemType File -Force -Path "src\lib\pdfParser.ts" | Out-Null
New-Item -ItemType File -Force -Path "src\App.tsx" | Out-Null
New-Item -ItemType File -Force -Path "src\index.css" | Out-Null
New-Item -ItemType File -Force -Path "src\main.tsx" | Out-Null
New-Item -ItemType File -Force -Path "src\types.ts" | Out-Null

New-Item -ItemType File -Force -Path ".env.example" | Out-Null
New-Item -ItemType File -Force -Path ".gitignore" | Out-Null
New-Item -ItemType File -Force -Path "index.html" | Out-Null
New-Item -ItemType File -Force -Path "metadata.json" | Out-Null
New-Item -ItemType File -Force -Path "package.json" | Out-Null
New-Item -ItemType File -Force -Path "server.ts" | Out-Null
New-Item -ItemType File -Force -Path "tsconfig.json" | Out-Null
New-Item -ItemType File -Force -Path "vite.config.ts" | Out-Null

Write-Host "Done. Structure created."
