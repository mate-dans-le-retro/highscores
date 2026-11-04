# Decisions

Log of structural choices. Add a dated entry when a new one is made; do not rewrite old ones, mark them "superseded by".

## 2026-11-04: TanStack Start + Supabase, on Vercel

Three days before the event. TanStack Start gives us React with server functions to keep secrets on the server (score detection from a photo, Instagram) without running separate Edge Functions. Supabase covers the database, realtime for the public screen, photo storage and volunteer auth in one go. MDLR already has GitHub, Supabase and Vercel accounts.

## 2026-11-04: shadcn/ui themed by the MDLR design system

Components come from shadcn (new-york, Radix). Their variables (`--primary`, `--background`…) are wired to the MDLR tokens in `src/styles/mdlr/shadcn.css`, so they follow the three themes without recompiling. The design system's React bundle (React 18, `MDLR` global) is not used. MDLR-specific components will be written here, then extracted later into a shared library.

## 2026-11-04: a single `scores` table for submissions and admin entries

A player submission and a score entered by a volunteer are the same object at different stages (`status`, `source`). A single table keeps the leaderboard, realtime and admin simple.

## 2026-11-04: sign-ups closed, volunteers in `public.admins`

No public sign-up. An Auth account alone grants nothing: it has to be in `public.admins`. This way, sign-ups opened by mistake would not give access to the admin.

## 2026-11-04: public repository

Nothing sensitive in the code; the publishable key is public by design and RLS protects the data. The repository is also a showcase for the association. Consequence: never any real player data in seeds, tests or screenshots.

## 2026-11-04: photos in a public bucket

The public screen and the admin show photos without signing URLs. File names are UUIDs and the bucket cannot be listed by the public. To revisit if we want to hide photos of rejected submissions (private bucket + signed URLs from the admin).

## 2026-11-04: everything in English except the interface

Code, identifiers, routes, comments, docs, commit messages and pull requests are in English. The interface stays in French, for the players and volunteers.
