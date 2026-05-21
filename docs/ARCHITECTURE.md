# Gojito Games Architecture

## Purpose

Gojito Games is the platform layer for all Gojito educational games.

The platform is responsible for:
- authentication
- cloud saves
- leaderboards
- premium subscriptions
- user profiles
- shared UI/navigation

Individual game repositories are responsible ONLY for:
- gameplay
- game rendering
- game logic
- local UI
- save serialization/deserialization

---

# Tech Stack

## Frontend
- React
- Vite
- TypeScript

## Hosting
- Cloudflare Pages

## Backend
- Supabase

## Payments
- Stripe

## Source Control
- GitHub

---

# Backend Rules

## Supabase is the single source of truth.

We do NOT use:
- Firebase
- custom auth servers
- MongoDB
- Express servers
- self-hosted APIs

---

# Save System

Guest users:
- localStorage only

Authenticated users:
- Supabase game_saves table

Games never directly call Supabase.
Games use the platform SDK.

---

# Platform SDK Responsibilities

The platform SDK owns:
- auth
- saves
- leaderboards
- premium status

Games interact through:
- saveGame()
- loadGame()
- submitScore()
- getLeaderboard()
- login()
- logout()

---

# Development Rules

Cursor AI must NOT redesign architecture.

Cursor tasks should:
- target specific files
- implement isolated features
- avoid introducing new backend systems

# Profiles Table

The profiles table is the canonical user metadata table.

Important fields:
- tier
- guac_active
- guac_expires_at
- stripe_customer_id
- stripe_subscription_id

Do not remove or redesign these fields.

Premium access should eventually be derived from:
- tier
- guac_active

NOT from ad-hoc frontend logic.