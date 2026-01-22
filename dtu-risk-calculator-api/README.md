# DTU Risk Calculator API

Simple Express API for sending risk calculator plans to GoHighLevel.

## Endpoints

- `POST /email-plan` - create/update a contact and apply the `risk_calculator_plan` tag.
- `GET /health` - basic health check.

## Environment Variables

Set these on your host (do not commit secrets):

- `GHL_API_KEY` (required)
- `GHL_LOCATION_ID` (optional, defaults to `OiIKORhJ82flAVisHu3d`)

Copy `.env.example` to `.env` for local development and fill in your values.

## Deploy on Render

1. Create a new **Web Service** on Render.
2. Point it at this repo.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables in Render:
   - `GHL_API_KEY`
   - `GHL_LOCATION_ID` (optional)
6. Deploy.

## Notes

- CORS is restricted to `https://tools.daytradinguni.com`.
- The API key is read from environment variables only.
