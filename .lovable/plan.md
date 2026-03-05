

# Fix Console Warnings in ContactProfileDialog

## Changes

### `src/components/contacts/ContactProfileDialog.tsx`

1. **Add `DialogDescription`** import from `@/components/ui/dialog` and add a visually-hidden description inside `DialogHeader` to fix the `aria-describedby` warning.

2. **EmptyState** is a plain function component, not passed as a ref — the `forwardRef` warning likely comes from it being used inside `TabsContent` (a Radix component). This is actually fine as-is since `EmptyState` doesn't receive a ref. The warning may be from Radix internals. No change needed for `EmptyState` itself.

Actually, let me re-check — the `forwardRef` warning is more likely about the dialog missing `DialogDescription`. Radix Dialog warns when `aria-describedby` is set but no `DialogDescription` exists.

### Summary
- Import `DialogDescription` and add `<DialogDescription className="sr-only">Профил на контакт</DialogDescription>` after `DialogTitle`
- Single file, single edit

