export type DataTableDetailEditQuickActionStateInput = {
    editHref?: unknown;
    hasEditHandler?: boolean;
    hasViewHandler?: boolean;
    viewHref?: unknown;
};

export type DataTableDetailEditQuickActionState = {
    canEdit: boolean;
    canView: boolean;
    hasActions: boolean;
};

export function getDataTableDetailEditQuickActionState({
    editHref,
    hasEditHandler = false,
    hasViewHandler = false,
    viewHref,
}: DataTableDetailEditQuickActionStateInput): DataTableDetailEditQuickActionState {
    const canView = hasViewHandler || Boolean(viewHref);
    const canEdit = hasEditHandler || Boolean(editHref);

    return {
        canEdit,
        canView,
        hasActions: canView || canEdit,
    };
}
