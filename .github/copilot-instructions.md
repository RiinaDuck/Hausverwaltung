# GitHub Copilot Instructions

## Before Suggesting Any Solution

1. **Check existing implementations first.**  
   Before recommending a new library or approach, search the codebase for an existing one.  
   Example: if email sending is needed, check `app/api/send-email/route.ts` and `package.json` before suggesting a new solution.

2. **Scan `package.json` for already-installed packages.**  
   Never suggest installing a package that is already listed in `dependencies` or `devDependencies`.

3. **Check `.env.local` to understand which services are already configured.**  
   Do not suggest setting up a service that already has environment variables defined.

4. **Prefer extending existing patterns over introducing new ones.**  
   Match the patterns, naming, and structure already present in the codebase.

---

## Current Tech Stack

| Concern | Solution | Notes |
|---|---|---|
| Framework | Next.js 16 (Turbopack) | App Router, `app/` directory |
| Database | Supabase (`@supabase/ssr`) | RLS enabled, see `lib/supabase/` |
| Auth | Supabase Auth | `context/auth-context.tsx`, hardcoded admin fallback (`admin/admin`) |
| Email | **Resend** (`resend` SDK) | `app/api/send-email/route.ts` — do NOT use nodemailer or SMTP |
| Styling | Tailwind CSS + shadcn/ui | Components in `components/ui/` |
| State | React Context | `context/app-data-context.tsx`, `context/auth-context.tsx` |
| PDF | jsPDF | `lib/pdf-generator.tsx` |
| DATEV Import | Custom CSV parser | `lib/parseDatev.ts` |

## Known Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
RESEND_API_KEY
RESEND_FROM
```

## Key Conventions

- All Supabase writes are guarded by `if (isAdmin || isDemo || !user?.id) return;`
- `getFullName(profile)` from `context/auth-context.tsx` is used as `created_by` in all audit fields
- Event logging goes to the `mieter_events` table via `insertMieterEvent()` in `mieterdaten-view.tsx`
- Toast notifications use `useToast()` from `hooks/use-toast.ts`
- File names use kebab-case; component names use PascalCase
