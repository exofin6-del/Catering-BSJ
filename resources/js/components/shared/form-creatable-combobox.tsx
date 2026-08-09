import { Plus } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';
import { FormControl } from '@/components/ui/form';
import { InputGroupAddon } from '@/components/ui/input-group';

export type CreatableComboboxOption = {
    isNew?: boolean;
    label: string;
    value: string;
};

export function FormCreatableCombobox<Option extends CreatableComboboxOption>({
    createLabel = (value) => `Buat "${value}"`,
    emptyMessage,
    inputValue,
    newBadgeLabel = 'Baru',
    options,
    placeholder,
    value,
    onClear,
    onCreate,
    onInputChange,
    onValueChange,
    renderOption,
    startAddon,
}: {
    createLabel?: (value: string) => string;
    emptyMessage?: string;
    inputValue: string;
    newBadgeLabel?: string;
    options: Option[];
    placeholder?: string;
    value: Option | null;
    onClear: () => void;
    onCreate?: (value: string) => void;
    onInputChange: (value: string) => void;
    onValueChange: (option: Option) => void;
    renderOption?: (option: Option) => React.ReactNode;
    startAddon?: React.ReactNode;
}) {
    const [open, setOpen] = React.useState(false);
    const inputAnchorRef = React.useRef<HTMLDivElement | null>(null);
    const creatableValue = inputValue.trim();

    const displayOptions = React.useMemo(() => {
        if (!onCreate || !creatableValue) {
            return options;
        }

        const exactMatch = options.find(
            (o) => o.label.toLowerCase() === creatableValue.toLowerCase(),
        );

        if (exactMatch) {
            return options;
        }

        return [
            ...options,
            {
                label: createLabel(creatableValue),
                value: '__create__',
                isNew: true,
            } as Option,
        ];
    }, [options, creatableValue, onCreate, createLabel]);

    const resolvedEmptyMessage =
        emptyMessage ??
        (onCreate ? 'Ketik nama item baru.' : 'Tidak ada item.');

    return (
        <Combobox
            items={displayOptions}
            value={value}
            inputValue={inputValue}
            open={open}
            onOpenChange={setOpen}
            itemToStringValue={(option) => option?.label ?? ''}
            isItemEqualToValue={(option, currentValue) =>
                Boolean(currentValue) && option.value === currentValue.value
            }
            onInputValueChange={(nextInputValue, eventDetails) => {
                if (eventDetails.reason === 'clear-press') {
                    onClear();

                    return;
                }

                if (eventDetails.reason === 'item-press') {
                    return;
                }

                onInputChange(nextInputValue);
            }}
            onValueChange={(option) => {
                if (!option) {
                    onClear();

                    return;
                }

                if (option.value === '__create__') {
                    onCreate?.(creatableValue);
                    setOpen(false);

                    return;
                }

                onValueChange(option);
            }}
        >
            <FormControl>
                <ComboboxInput
                    anchorRef={inputAnchorRef}
                    showClear
                    className="w-full"
                    placeholder={placeholder}
                >
                    {startAddon}
                    {value?.isNew && (
                        <InputGroupAddon
                            align="inline-end"
                            className="order-2 shrink-0"
                        >
                            <Badge
                                variant="outline"
                                className="h-5 px-1.5 text-[10px] font-bold whitespace-nowrap uppercase"
                            >
                                {newBadgeLabel}
                            </Badge>
                        </InputGroupAddon>
                    )}
                </ComboboxInput>
            </FormControl>
            <ComboboxContent anchor={inputAnchorRef}>
                <ComboboxEmpty className="p-2">
                    {resolvedEmptyMessage}
                </ComboboxEmpty>
                <ComboboxList>
                    {(option) => (
                        <ComboboxItem
                            key={option.value}
                            value={option}
                            className={
                                option.value === '__create__'
                                    ? 'bg-accent/50 font-medium italic'
                                    : ''
                            }
                        >
                            {option.value === '__create__' ? (
                                <Plus className="mr-2 size-4 text-muted-foreground" />
                            ) : null}
                            {option.value !== '__create__' && renderOption ? (
                                renderOption(option)
                            ) : (
                                <span className="min-w-0 flex-1 truncate">
                                    {option.label}
                                </span>
                            )}
                            {option.isNew ? (
                                <Badge
                                    variant="outline"
                                    className="mr-2 h-5 shrink-0 px-1.5 text-[10px] font-bold whitespace-nowrap uppercase"
                                >
                                    {newBadgeLabel}
                                </Badge>
                            ) : null}
                        </ComboboxItem>
                    )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    );
}
