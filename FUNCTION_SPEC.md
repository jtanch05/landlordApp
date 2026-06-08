# PropTrack Functional Specification

Status: legacy reference only.

This file originally summarized features from an earlier cloned/source-code-derived version of PropTrack. It is no longer the active product source of truth.

Use these files instead:

- `PRODUCT_PLAN.md` for the current v1 product and engineering direction.
- `AI_FEATURE_SPEC.md` for future AI assistant requirements.
- `AGENTS.md` for AI agent guardrails and development constraints.
- `TODO.md` for active task tracking.

## Current Decision

The current v1 scope has changed from the original functional extraction:

- Web app first.
- React Native mobile app later.
- Full-stack Next.js on Vercel.
- Supabase/Postgres/Auth/Storage.
- Portfolio-based ownership.
- Host and Co-owner roles only.
- Property-level co-owner invitations.
- Property-centric UX with top-level Dashboard, Properties, Vendors, Reports, Activity, and Settings.
- AI assistant deferred until after v1 foundation.
- Push notifications, Google Calendar, WhatsApp links, tenant portal, billing, LHDN report, CSV exports, and mobile app are deferred.

Do not implement from this file directly. If there is a conflict, `PRODUCT_PLAN.md` wins.
