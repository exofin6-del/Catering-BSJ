import { Check, ChevronDown, ChevronLeft } from 'lucide-react';
import { useState } from 'react';

import { DataTableFilterChipGroup } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { InputGroupButton } from '@/components/ui/input-group';
import { cn } from '@/lib/utils';
import { categoryIconOptions, resolveCategoryIconOption } from './constants';
import type { CategoryIconOption } from './constants';

const FILTER_GROUPS = [
    { id: 'semua', label: 'Semua' },
    { id: 'makanan', label: 'Makanan & Cemilan' },
    { id: 'minuman', label: 'Minuman' },
    { id: 'lainnya', label: 'Lainnya' },
];

const FOOD_ICON_VALUES = [
    'utensils',
    'package',
    'cake-slice',
    'soup',
    'sandwich',
    'salad',
    'pizza',
    'beef',
    'fish',
    'ice-cream-bowl',
    'cookie',
    'apple',
    'leaf',
];

const DRINK_ICON_VALUES = ['coffee'];
const EMPTY_ICON_COMMAND_VALUE = '__empty-category-icon__';

export function CategoryIconPicker({
    value,
    onValueChange,
}: {
    value: string;
    onValueChange: (value: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('semua');

    const selectedIcon = resolveCategoryIconOption(value);
    const SelectedIcon = selectedIcon.icon;
    const selectedCommandValue = commandValueForIcon(selectedIcon);

    function selectIcon(commandValue: string) {
        onValueChange(iconValueFromCommand(commandValue));
        setSearch('');
        setOpen(false);
    }

    const filteredIcons = categoryIconOptions.filter((option) => {
        if (selectedGroup === 'makanan') {
            return FOOD_ICON_VALUES.includes(option.value);
        }

        if (selectedGroup === 'minuman') {
            return DRINK_ICON_VALUES.includes(option.value);
        }

        if (selectedGroup === 'lainnya') {
            return (
                !FOOD_ICON_VALUES.includes(option.value) &&
                !DRINK_ICON_VALUES.includes(option.value)
            );
        }

        return true;
    });

    const groupOptions = FILTER_GROUPS.map((group) => ({
        id: group.id,
        label: group.label,
        selected: selectedGroup === group.id,
        onSelect: () => setSelectedGroup(group.id),
    }));

    return (
        <>
            <InputGroupButton
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 gap-1.5 px-2 text-foreground hover:bg-accent/50"
                aria-label={
                    selectedIcon.value
                        ? `Ikon kategori: ${selectedIcon.label}. Ubah ikon`
                        : 'Pilih ikon kategori'
                }
                onClick={() => setOpen(true)}
            >
                <SelectedIcon className="size-4 shrink-0 text-muted-foreground" />
                {!selectedIcon.value ? (
                    <span className="text-xs font-normal text-muted-foreground select-none">
                        Tanpa ikon
                    </span>
                ) : null}
                <ChevronDown className="size-3 shrink-0 opacity-50" />
            </InputGroupButton>

            <CommandDialog
                open={open}
                onOpenChange={(isOpen) => {
                    setOpen(isOpen);

                    if (!isOpen) {
                        setSearch('');
                        setSelectedGroup('semua');
                    }
                }}
                title="Pilih ikon kategori"
                description="Cari dan pilih ikon untuk kategori."
                className="top-1/2 max-h-[calc(100dvh-1rem)] -translate-y-1/2 max-sm:top-0 max-sm:h-[100svh] max-sm:max-h-none max-sm:w-screen max-sm:max-w-none max-sm:translate-y-0 max-sm:overflow-hidden max-sm:rounded-none! sm:max-w-2xl"
            >
                <Command
                    key={selectedCommandValue}
                    defaultValue={selectedCommandValue}
                    shouldFilter
                    className="min-h-0 rounded-none! p-0 max-sm:h-full"
                >
                    <div className="flex h-16 shrink-0 items-center gap-2 border-b px-4 sm:h-auto sm:p-3">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="-ml-2 size-9 shrink-0 hover:bg-transparent sm:hidden"
                            aria-label="Kembali"
                            onClick={() => setOpen(false)}
                        >
                            <ChevronLeft className="size-7" />
                        </Button>

                        <CommandInput
                            autoFocus
                            autoComplete="off"
                            placeholder="Cari ikon kategori..."
                            value={search}
                            onValueChange={setSearch}
                            wrapperClassName="min-w-0 flex-1 p-0"
                            inputGroupClassName="h-10!"
                        />
                    </div>

                    <div className="flex shrink-0 items-center border-b border-border/60 bg-muted/5 px-4 py-2.5 sm:px-3 sm:py-2">
                        <DataTableFilterChipGroup
                            label="Filter ikon"
                            options={groupOptions}
                            showLabel={false}
                            wrap={false}
                            className="w-full min-w-0"
                        />
                    </div>

                    <CommandList className="min-h-0 p-3.5 max-sm:max-h-none! max-sm:flex-1 sm:max-h-[min(65dvh,32rem)] sm:p-4">
                        <CommandEmpty>Ikon tidak ditemukan.</CommandEmpty>
                        <CommandGroup className="p-0 [&_[cmdk-group-items]]:grid [&_[cmdk-group-items]]:grid-cols-3 [&_[cmdk-group-items]]:gap-2.5 sm:[&_[cmdk-group-items]]:grid-cols-4 md:[&_[cmdk-group-items]]:grid-cols-5">
                            {filteredIcons.map((option) => {
                                const Icon = option.icon;
                                const commandValue =
                                    commandValueForIcon(option);
                                const isSelected =
                                    commandValue === selectedCommandValue;

                                return (
                                    <CommandItem
                                        key={commandValue}
                                        aria-label={`${isSelected ? 'Ikon terpilih' : 'Pilih ikon'} ${option.label}`}
                                        aria-checked={isSelected}
                                        data-checked={
                                            isSelected ? 'true' : undefined
                                        }
                                        keywords={[
                                            option.label,
                                            option.value,
                                            ...option.keywords,
                                        ].filter(Boolean)}
                                        title={option.label}
                                        value={commandValue}
                                        className={cn(
                                            'group/icon-card relative flex h-[4.5rem] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-transparent p-2 text-center transition-colors duration-150 hover:bg-muted/60 data-selected:bg-muted/60 [&>svg:last-child]:hidden',
                                            isSelected
                                                ? 'border-primary/20 bg-primary/5 text-primary hover:bg-primary/5'
                                                : 'text-muted-foreground',
                                        )}
                                        onSelect={selectIcon}
                                    >
                                        {isSelected ? (
                                            <span className="absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                                <Check className="size-2 stroke-[4]" />
                                            </span>
                                        ) : null}

                                        <Icon
                                            className={cn(
                                                'size-5 text-muted-foreground transition-colors group-hover/icon-card:text-foreground',
                                                isSelected &&
                                                    'text-primary group-hover/icon-card:text-primary',
                                            )}
                                        />

                                        <span
                                            className={cn(
                                                'line-clamp-2 w-full px-1 text-center text-[10px] leading-tight font-medium break-words text-muted-foreground transition-colors group-hover/icon-card:text-foreground sm:text-[11px]',
                                                isSelected &&
                                                    'font-semibold text-primary group-hover/icon-card:text-primary',
                                            )}
                                        >
                                            {option.label}
                                        </span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </CommandDialog>
        </>
    );
}

function commandValueForIcon(option: CategoryIconOption): string {
    return option.value || EMPTY_ICON_COMMAND_VALUE;
}

function iconValueFromCommand(commandValue: string): string {
    return commandValue === EMPTY_ICON_COMMAND_VALUE ? '' : commandValue;
}
