# RoxyGPT

RoxyGPT is a Chrome extension concept that lets a user ask an AI about the visible page or a screenshot. The existing VOID Roblox profile page is preserved on `main`; this work is on the separate `rox-y-gpt-oauth-architecture` branch.

## Current status

- [x] Separate development branch; existing default branch is untouched.
- [x] Chrome Manifest V3 extension scaffold with context menu and side panel.
- [x] Screenshot preview and prompt UI.
- [x] Explicit provider connection status and safe setup notes.
- [ ] OAuth credentials and provider approval.
- [ ] Real model requests and region-crop selection.
- [ ] Automated browser tests and production deployment.

This branch is a prototype, not a finished AI service. The extension does not pretend to return an AI answer when a provider is not configured.

## Important OAuth reality

### ChatGPT account

OpenAI's **Sign in with ChatGPT** can support sign-in and eligible ChatGPT-plan-powered requests in participating apps. Availability and access depend on OpenAI's supported integration/registration path; the official docs currently describe limited availability for some integrations. Do not scrape ChatGPT, reuse browser cookies, or ask users for their ChatGPT password. Before implementing the model adapter, confirm that RoxyGPT is eligible for the supported open-source or partner flow and use only its official OAuth/token instructions.

- Quickstart: https://developers.openai.com/siwc/quickstart
- Client ID registration: https://developers.openai.com/siwc/request-client-id
- Terms: https://openai.com/policies/sign-in-with-chatgpt-terms/

If this official flow is unavailable to this project, the supported fallback is an OpenAI API key supplied by the user and stored locally, with clear billing disclosure. Do not silently substitute it for a ChatGPT subscription.

### Gemini / Google

Google sign-in and Gemini API authorization are separate concepts. A Google OAuth login alone does not automatically grant access to the consumer Gemini app or a paid plan. Gemini API OAuth requires a configured Google Cloud project, enabled Generative Language API, consent screen, client ID, and appropriate scopes.

Official guide: https://ai.google.dev/gemini-api/docs/oauth

## Architecture

- `extension/`: Chrome MV3 extension; UI and screenshots stay on the user's device.
- `server/`: reserved for an optional local-only helper if an approved provider flow requires it. Do not put client secrets or refresh tokens in GitHub Pages or extension source.
- Provider adapters must use official endpoints and documented authorization only.
- Keep OAuth tokens local to the user's device where provider terms require it. Never store user tokens in a shared database.
- Do not transmit a screenshot until the user explicitly clicks **Send**.
- Add a disconnect/revoke action and a clear screenshot preview before sending.

## Install the prototype

1. Open Chrome and visit `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select the `extension` folder.
4. Right-click a page and choose **RoxyGPT'ye Sor**.
5. The side panel opens with a screenshot preview. Provider requests are intentionally disabled until the official OAuth flow is configured.

## Keyboard shortcuts

Chrome extension shortcuts can conflict with browser or operating-system shortcuts. Configure them at `chrome://extensions/shortcuts`. Prototype defaults:
- `Alt+P`: close/hide the side panel where supported.
- `Alt+L`: open the side panel.

## Security checklist before release

- Register exact OAuth redirect URIs and validate `state`/PKCE as required by each provider.
- Request minimum scopes.
- Never collect provider passwords, browser cookies, or session cookies.
- Never commit OAuth client secrets, access tokens, refresh tokens, or API keys.
- Avoid uploading screenshots automatically; require an explicit send action.
- Add privacy policy, data retention rules, error handling, and automated tests before publishing.
