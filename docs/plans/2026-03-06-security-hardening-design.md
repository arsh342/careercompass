## Security Hardening Design

Date: 2026-03-06

### Scope

This pass hardens the public repository before broader sharing. It focuses on:

- Failing closed for server-side authentication
- Restricting public AI and API surfaces
- Binding mutable operations to the authenticated user
- Tightening Firestore privacy and admin access
- Removing unsafe HTML rendering
- Reducing CSP risk where safe
- Upgrading production-relevant vulnerable packages

### Goals

- No protected API should succeed when Firebase Admin auth is unavailable.
- Billable AI endpoints should require authentication and rate limiting.
- Sensitive recruiter and email automation flows should not be publicly callable.
- Client-supplied identifiers must not control server-side authorization decisions.
- The `users` collection should no longer be globally readable by any authenticated user.
- Admin data access should require explicit admin authorization.
- AI output should not be rendered as raw HTML.

### Non-Goals

- Full migration to server-issued Firebase session cookies
- Complete redesign of all data access around server components
- Full elimination of all low-severity transitive dependency advisories

### Design

#### 1. Authentication and trust boundaries

- Treat middleware as a navigation hint, not a security boundary.
- Change API auth helpers to fail closed when `adminAuth` is unavailable.
- Add server-context auth helpers for server actions and AI flows using the `__session` token cookie plus Firebase Admin verification.
- Derive authenticated identity from verified tokens only, never from request body fields.

#### 2. API hardening

- `POST /api/checkout`
  - Require a verified user.
  - Ignore body `userId`.
  - Bind Stripe metadata and customer email to the verified user.
- `GET /api/checkout/verify`
  - Require a verified user.
  - Only return session details if the session metadata belongs to the authenticated user.
- `POST /api/application-status`
  - Require a verified employer.
  - Load the application and opportunity from Firestore.
  - Only allow the employer who owns the opportunity to trigger the status email.
  - Derive applicant/job/company fields from stored data instead of trusting the request body.
- `POST /api/genkit/improve-message`
  - Require auth and rate limiting.

#### 3. AI surfaces

- Remove sensitive flows from public Genkit registration:
  - candidate ranking
  - candidate discovery
  - email-sending flows
- Add auth checks to AI server actions used from authenticated app pages.
- Add employer ownership checks to recruiter-only flows.

#### 4. Firestore privacy and admin access

- Restrict `/users/{userId}` reads in Firestore rules to:
  - the owner
  - optionally, explicit admin users if present
- Keep employer and public browse experiences working by changing client pages to rely on narrower queries or public-safe fields only.
- Lock the admin page behind a real admin allowlist check.

#### 5. Rendering and CSP

- Replace raw HTML rendering of AI suggestions with escaped text rendering plus line-break preservation.
- Reduce CSP risk by removing `unsafe-eval` outside development if possible.

#### 6. Dependencies

- Upgrade `next` to a patched 15.5.x release.
- Upgrade `jspdf` to a patched release.
- Refresh the lockfile and re-run `npm audit`.

### Verification

- Run `tsc --noEmit`
- Run a focused build or lint pass if feasible
- Re-run `npm audit`
- Summarize residual risk if any page still depends on client-side auth cookie presence for redirect UX
