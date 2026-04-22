// Runs once before Vite + backend (see root package.json "dev").
console.log(`
[FinEra] Dev stack
  • Frontend (Vite):  http://localhost:5173   (or 5174+ if 5173 is busy — check the [fe] line)
  • API (Express):    http://localhost:4000   (look for "[FinEra] Database connected" then "[FinEra] Backend started")

First time or missing deps: run  npm run install:backend  from the repo root.
`);
