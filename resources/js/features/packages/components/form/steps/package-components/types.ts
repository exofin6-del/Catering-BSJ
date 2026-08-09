import type { PackageMenuItem } from '@/types';

import type {
    PackageChoiceFormItem,
    PackageComponentFormItem,
} from '../../../../types/package-types';

export type PackageComponentsStepProps = {
    componentError: string | null;
    components: PackageComponentFormItem[];
    menuItems: PackageMenuItem[];
    onAddChoiceMenuItem: (
        componentId: string,
        menuItem: PackageMenuItem,
    ) => void;
    onAddFixedComponent: (menuItem: PackageMenuItem) => void;
    onMoveComponent: (componentId: string, direction: -1 | 1) => void;
    onRemoveChoiceItem: (componentId: string, choiceId: string) => void;
    onRemoveComponent: (componentId: string) => void;
    onUpdateChoiceItem: <Key extends keyof PackageChoiceFormItem>(
        componentId: string,
        choiceId: string,
        field: Key,
        value: PackageChoiceFormItem[Key],
    ) => void;
    onUpdateComponent: <Key extends keyof PackageComponentFormItem>(
        componentId: string,
        field: Key,
        value: PackageComponentFormItem[Key],
    ) => void;
};

export type PackageComponentsListProps = {
    components: PackageComponentFormItem[];
    menuItems: PackageMenuItem[];
    usedMenuItemIds: number[];
} & Pick<
    PackageComponentsStepProps,
    | 'onAddChoiceMenuItem'
    | 'onMoveComponent'
    | 'onRemoveChoiceItem'
    | 'onRemoveComponent'
    | 'onUpdateChoiceItem'
    | 'onUpdateComponent'
>;
