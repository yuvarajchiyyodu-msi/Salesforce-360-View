# Headless 360

Hackathon app: ask a natural-language question, get a consolidated 360° customer view across two Salesforce UAT orgs (MCN/LMR and VS&A) via a Claude-on-Bedrock agentic SOQL loop.

## Run

```bash
# Backend (terminal 1)
cd backend && ./run.sh

# Frontend (terminal 2)
cd frontend && npm install && npm run dev
```

Open http://localhost:5173. Backend serves on http://localhost:8000.

Prereqs: `sf` CLI authenticated to `LMRUATOrg` and `VSAUATOrg`; AWS creds with Bedrock access in `us-east-1`.
