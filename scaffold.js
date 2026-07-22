// scaffold.js
// Run inside VS Code terminal with: node scaffold.js
// Creates the project's empty folder/file structure in the current directory.

const fs = require("fs");
const path = require("path");

const structure = [
  "assets/.aistudio/",
  "src/lib/pdfParser.ts",
  "src/App.tsx",
  "src/index.css",
  "src/main.tsx",
  "src/types.ts",
  ".env.example",
  ".gitignore",
  "index.html",
  "metadata.json",
  "package.json",
  "server.ts",
  "tsconfig.json",
  "vite.config.ts",
];

structure.forEach((entry) => {
  const fullPath = path.join(process.cwd(), entry);

  if (entry.endsWith("/")) {
    // It's a folder
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created folder: ${entry}`);
  } else {
    // It's a file — make sure its parent folder exists first
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, "");
      console.log(`Created file:   ${entry}`);
    } else {
      console.log(`Already exists: ${entry}`);
    }
  }
});

console.log("\nDone! Project structure created.");
