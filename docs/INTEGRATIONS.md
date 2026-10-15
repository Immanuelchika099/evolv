# EVOLV integrations — implementation plan

## Security baseline
- Provider secrets, OAuth client secrets, and Supabase service-role keys stay server-side.
- Use OAuth Authorization Code + PKCE where supported; validate state, redirect URIs, token audience and expiry.
- Store refresh/access tokens encrypted server-side, never in localStorage or client-readable tables.
- Keep integrations opt-in and scope-minimal. Show what each connection can read/write, provide disconnect/revoke, and delete stored tokens on disconnect.
- Add per-user ownership checks, audit events, rate limits, and provider error states.
- Treat external content as untrusted input for AI tool calls; require confirmation for consequential writes.

## Suggested build order
1. Google Calendar read-only OAuth integration.
2. Server-side AI tool interface with explicit tool schemas and allowlisted integrations.
3. Tasks provider (select provider before implementing OAuth/API calls).
4. Health data only after platform/API constraints and consent flows are verified.

## Current status
src/lib/integrations/registry.js is descriptive metadata only. No providers are connected yet. Each planned integration needs a server-side implementation, OAuth/API configuration, and an explicit consent UI before it can be enabled.
