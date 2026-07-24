# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server with HMR
- `npm run build` — type-check (`tsc -b`) then production build (`vite build`)
- `npm run lint` — run Oxlint (`.oxlintrc.json` config)
- `npm run preview` — preview the production build locally

There is no test suite configured in this project.

## Architecture

This is a single-page French-language personal budget tracker (React 19 + TypeScript + Vite). It has no backend: all state lives in React state and is persisted to `localStorage` (`src/lib/storage.ts`, keys `budget-tracker:expenses` / `budget-tracker:categories`). There is no routing.

**State ownership**: `src/App.tsx` is the sole owner of `expenses` and `categories` state. It loads both from storage on mount, persists on every change via `useEffect`, and passes data + callback handlers down to presentational components in `src/components/`. Components do not read/write storage directly.

**Domain model** (`src/types.ts`): an `Expense` has a `status` of `'reel'` (realized) or `'prevu'` (planned), determined by comparing its `date` to today (see `statusForDate` in `ExpenseForm.tsx`). Expenses are filtered per month (`isInMonth`) and split into realized vs. planned lists in `App.tsx`.

**Recurring expenses**: creating an expense with "repeat monthly" enabled generates N sibling `Expense` records up front (not computed lazily), all sharing one `recurrenceId` (`ExpenseForm.tsx`). Deleting an expense that has a `recurrenceId` prompts the user (`RecurringDeleteDialog`) to delete just that occurrence or the whole future series (`e.recurrenceId === id && e.date >= date` in `App.tsx`'s `handleDeleteSeries`). Editing a recurring expense only edits the single occurrence — recurrence is a create-time-only concept.

**Categories**: seeded from `src/data/defaultCategories.ts`, using a fixed-order categorical color palette (`CATEGORY_PALETTE`) — colors are assigned by position, not reassigned per instance. Categories in use by an expense (`usedCategoryIds` in `App.tsx`) cannot be deleted.

**Dates**: all dates are stored/compared as ISO strings (`yyyy-MM-dd`); helpers in `src/lib/date.ts` wrap `date-fns` (with the `fr` locale for display labels) for month navigation, month-membership checks, and ISO conversions. Prefer string comparison (`date.localeCompare`) for sorting, matching existing code.

**CSV export**: `src/lib/csv.ts` builds a `;`-delimited, UTF-8 BOM-prefixed CSV (French locale conventions: comma decimal separator, `Réalisée`/`Prévue` status labels) and triggers a client-side download via an object URL.

## Language

All UI copy is in French. Keep new UI strings, labels, and user-facing messages in French to match the existing app.
