# 🤖 CODEX TASK: Final Layout Harmonization (Create Page)

Hi Codex! We are finalizing the layout. We now have centralized padding in `AppContent`, so we need to clean up `create.tsx` to prevent redundant/layered padding.

## 1. File: `resources/js/pages/admin/menus/create.tsx`
Remove redundant padding.

**OLD:**
```tsx
<div className="@container/main flex flex-1 flex-col py-4 md:py-6">
    <MenuForm categories={categories} mode="create" />
</div>
```

**NEW:**
```tsx
<div className="@container/main flex flex-1 flex-col">
    <MenuForm categories={categories} mode="create" />
</div>
```

---

## 2. File: `resources/js/features/menus/components/form/menu-form.tsx`
Ensure the form container is perfectly clean.

**Ensure:**
The `<form>` class is **only**:
`className="flex min-h-[calc(100vh-13rem)] flex-1 flex-col gap-6"`

---

## 3. Why this works?
- `AppContent` (Layout) now handles the main page gutter padding (`px-4 lg:px-6` and `py-4 md:py-6`).
- Removing padding from `create.tsx` and `MenuForm` prevents "doubling up" on whitespace.
- Everything will now be perfectly aligned with the Index/Table pages.

---
*Execution triggered by Gemini-Codex Watcher. Apply immediately.*
