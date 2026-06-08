# Execution Rules

Use these rules when implementing tasks from `TODO.md`, especially when the user asks for automation or to continue until a phase is done.

## Core Loop

For every `TODO.md` step:

1. Read the relevant source-of-truth files.
2. Implement only the current step or task.
3. Run the required verification.
4. Self-review the changed files.
5. Fix issues found during verification or self-review.
6. Update `TODO.md` only for steps that are actually complete.
7. Report what changed and what verification passed.

## Source Files To Check

Always check:

- `AGENTS.md`
- `TODO.md`
- `PRODUCT_PLAN.md`
- `CONTEXT.md`
- `ARCHITECTURE.md`
- `UI_DESIGN.md`

Check when relevant:

- `SYSTEM_DESIGN.md`
- `DATABASE_SCHEMA.md`
- `AI_FEATURE_SPEC.md`
- `docs/superpowers/plans/*.md`
- `docs/adr/*.md`

## Verification Rules

When the project exists, run after meaningful code changes:

```powershell
npm run lint
npm run build
```

If tests exist, run the relevant focused tests first, then the broader suite.

If a verification command fails:

1. Read the error.
2. Fix the root cause.
3. Rerun the command.
4. Do not mark the step complete until verification passes.

If verification cannot run because the project is not initialized yet, say so explicitly.

## Self-review Checklist

Before moving to the next step, review the diff and check:

- The change implements the current `TODO.md` step only.
- The change follows `ARCHITECTURE.md`.
- UI changes follow `UI_DESIGN.md`.
- Domain terms match `CONTEXT.md`.
- V1 scope still matches `PRODUCT_PLAN.md`.
- Server-side writes validate input and check permissions.
- Financial, permission, reminder, report, and generated-record logic is not hidden in UI components.
- No deferred feature was accidentally implemented.
- No unrelated files were changed.
- No user changes were reverted.

## Automation Boundaries

Automation may continue through small steps in the same phase if:

- Each step passes verification.
- The next step is already described in an implementation plan.
- No product, schema, or security decision is unclear.
- No dependency or network approval is blocked.

Automation must stop and report before:

- Starting a new `TODO.md` phase.
- Making irreversible schema decisions not already covered by `DATABASE_SCHEMA.md`.
- Adding a new dependency not already planned.
- Changing product scope.
- Implementing deferred features.
- Continuing after repeated verification failure.

## Phase Boundary Rule

At the end of each phase:

1. Run the broadest available verification.
2. Summarize completed steps.
3. Summarize files changed.
4. List any unresolved issues.
5. Stop and wait for user direction before starting the next phase.

## Commit Rule

If the user asks for commits:

- Commit after each coherent task or phase.
- Do not commit unverified work.
- Do not include unrelated user changes.
- Use concise messages like `chore: initialize nextjs foundation`.

If the user does not ask for commits, do not commit automatically.

## Done Means Done

Do not say a step is complete unless:

- Required files exist.
- Required behavior works.
- Required verification passed or a clear reason is documented.
- `TODO.md` reflects the actual completed state.
