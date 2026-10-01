<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Instructions

## Project Stack

This is a Next.js 16 application using:

- React 19
- TypeScript
- Tailwind CSS 4
- Supabase
- React Hook Form
- Zod
- Jest and Testing Library

## Architecture

The project follows a feature-oriented architecture.

Main source directories include:

- `src/app` — Next.js App Router, layouts, pages, route-level code
- `src/entities` — domain entities
- `src/features` — user-facing features and business logic
- `src/widgets` — larger composed UI blocks
- `src/views` — page/view composition
- `src/shared` — reusable UI, utilities, API helpers, types, and shared infrastructure

Before introducing new folders, abstractions, hooks, utilities, or components, inspect the existing project structure and reuse established patterns where appropriate.

## Working With The Codebase

Before making changes:

1. Inspect the relevant existing implementation.
2. Inspect related components, hooks, types, utilities, and API code when necessary.
3. Follow existing naming, import, folder, and architectural conventions.
4. Do not assume how existing code works without inspecting it.

Prefer modifying existing abstractions over creating duplicate functionality.

Do not perform unrelated refactors unless they are necessary for the requested task.

## Next.js

Follow the Next.js agent instructions above.

Do not rely on assumptions from older Next.js versions when behavior may have changed.

Respect Server Component and Client Component boundaries.

Do not add `"use client"` unless the component actually requires client-side functionality.

## TypeScript

Maintain strict type safety.

Avoid `any` unless there is a concrete reason and no reasonable typed alternative.

Prefer existing project types and schemas over duplicating them.

Do not silence TypeScript errors merely to make checks pass.

## Dependencies

Do not install, remove, or upgrade dependencies unless required by the task.

Before adding a dependency, check whether the project already contains functionality that solves the problem.

## Generated Files

Do not manually modify generated or dependency directories such as:

- `node_modules`
- `.next`
- `.swc`
- `supabase/.temp`

unless explicitly requested.

## Validation

After meaningful code changes, run the relevant validation commands.

Available project commands:

- `npm run lint`
- `npm test`
- `npm run build`

For TypeScript checking, use:

- `npx tsc --noEmit`

Run the checks relevant to the change.

If a check fails because of your changes, investigate and fix the issue before considering the task complete.

Do not modify unrelated code simply to silence pre-existing errors or warnings.

## Tests

When changing behavior that already has tests, update the affected tests when necessary.

For new non-trivial logic, consider whether tests should be added.

Do not rewrite tests simply to make an incorrect implementation pass.

## Git

Do not commit, push, reset, rebase, or rewrite Git history unless explicitly requested.

Do not discard existing user changes.

Keep modifications scoped to the requested task.

## Communication

For implementation tasks, make the requested code changes instead of only describing what should be changed.

When the task is complete, briefly report:

- what was changed
- important implementation decisions
- validation performed
- any remaining issues or risks
