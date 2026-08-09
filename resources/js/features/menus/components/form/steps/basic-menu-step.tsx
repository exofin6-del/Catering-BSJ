import { useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { FormCreatableCombobox } from '@/components/shared/form-creatable-combobox';
import type { CreatableComboboxOption } from '@/components/shared/form-creatable-combobox';

import {
    FieldContent,
    FieldDescription,
    FieldGroup,
    FieldLegend,
    FieldSet,
} from '@/components/ui/field';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
    InputGroupTextarea,
} from '@/components/ui/input-group';
import { CategoryIconLabel } from '@/features/categories/components/form/category-icon-label';
import { CategoryIconPicker } from '@/features/categories/components/form/category-icon-picker';

import type { MenuCategory } from '@/types';
import type { MenuFormValues } from '../../../schema/menu-form-schema';
import { NO_CATEGORY_VALUE } from '../constants';
import { MenuFormSummaryAside } from '../menu-form-summary-aside';

type CategoryOption = CreatableComboboxOption & { icon: string };
const NEW_CATEGORY_VALUE = '__new_category__';

export function BasicMenuStep({
    categories,
    selectedCategory,
    values,
}: {
    categories: MenuCategory[];
    selectedCategory: string;
    values: MenuFormValues;
}) {
    const { control, setValue } = useFormContext<MenuFormValues>();
    const [
        categoryId = NO_CATEGORY_VALUE,
        categoryName = '',
        categoryIcon = '',
    ] = useWatch({
        control,
        name: ['categoryId', 'categoryName', 'categoryIcon'],
    });
    const [categoryInputOverride, setCategoryInputOverride] = useState<
        string | null
    >(null);
    const categoryOptions = useMemo<CategoryOption[]>(
        () =>
            categories.map((category) => ({
                label: category.name,
                value: String(category.id),
                icon: category.icon ?? '',
            })),
        [categories],
    );
    const newCategoryOption = useMemo<CategoryOption | null>(() => {
        const normalizedCategoryName = categoryName.trim();

        if (normalizedCategoryName === '') {
            return null;
        }

        return {
            isNew: true,
            label: normalizedCategoryName,
            value: NEW_CATEGORY_VALUE,
            icon: categoryIcon,
        };
    }, [categoryIcon, categoryName]);
    const categoryComboboxOptions = useMemo<CategoryOption[]>(
        () =>
            newCategoryOption
                ? [...categoryOptions, newCategoryOption]
                : categoryOptions,
        [categoryOptions, newCategoryOption],
    );
    const selectedCategoryOption =
        newCategoryOption ??
        categoryOptions.find((category) => category.value === categoryId) ??
        null;
    const categoryInputValue =
        categoryInputOverride ??
        (categoryName.trim() !== ''
            ? categoryName
            : (selectedCategoryOption?.label ?? ''));

    function applyCategoryInputValue(value: string): void {
        const matchedCategory = categoryOptions.find(
            (category) =>
                category.label.toLocaleLowerCase('id-ID') ===
                value.trim().toLocaleLowerCase('id-ID'),
        );

        setCategoryInputOverride(value);
        setCategoryFormValues(matchedCategory?.value ?? NO_CATEGORY_VALUE, {
            categoryName: '',
            categoryIcon: matchedCategory?.icon ?? '',
        });
    }

    function applySelectedCategory(option: CategoryOption | null): void {
        if (!option) {
            clearCategorySelection();

            return;
        }

        setCategoryInputOverride(option.label);

        if (option.isNew) {
            setCategoryFormValues(NO_CATEGORY_VALUE, {
                categoryName: option.label,
                categoryIcon: option.icon,
            });

            return;
        }

        setCategoryFormValues(option.value, {
            categoryName: '',
            categoryIcon: option.icon,
        });
    }

    function clearCategorySelection(): void {
        setCategoryInputOverride('');
        setCategoryFormValues(NO_CATEGORY_VALUE, {
            categoryName: '',
            categoryIcon: '',
        });
    }

    function createCategory(categoryNameValue: string): void {
        const normalizedCategoryName = categoryNameValue.trim();

        if (normalizedCategoryName === '') {
            clearCategorySelection();

            return;
        }

        setCategoryInputOverride(normalizedCategoryName);
        setCategoryFormValues(NO_CATEGORY_VALUE, {
            categoryName: normalizedCategoryName,
            categoryIcon,
        });
    }

    function setCategoryFormValues(
        categoryIdValue: string,
        {
            categoryName: categoryNameValue,
            categoryIcon: categoryIconValue,
        }: { categoryName: string; categoryIcon: string },
    ): void {
        setValue('categoryId', categoryIdValue, {
            shouldDirty: true,
            shouldValidate: true,
        });
        setValue('categoryName', categoryNameValue, {
            shouldDirty: true,
            shouldValidate: true,
        });
        setValue('categoryIcon', categoryIconValue, { shouldDirty: true });
    }

    return (
        <div className="grid gap-5">
            <div className="grid items-start gap-5 lg:grid-cols-[3fr_1.5fr]">
                <section className="admin-card min-w-0 p-4 md:p-5">
                    <FieldSet className="gap-5">
                        <FieldContent>
                            <FieldLegend className="text-base font-semibold text-foreground">
                                Informasi Menu
                            </FieldLegend>
                            <FieldDescription className="text-sm leading-snug">
                                Isi detail menu
                            </FieldDescription>
                        </FieldContent>

                        <FieldGroup className="gap-5">
                            <FormField
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nama menu</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                autoComplete="off"
                                                placeholder="Nasi liwet komplit"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    name="categoryName"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>Kategori</FormLabel>
                                            <FormCreatableCombobox
                                                options={
                                                    categoryComboboxOptions
                                                }
                                                value={selectedCategoryOption}
                                                inputValue={categoryInputValue}
                                                createLabel={(value) =>
                                                    `Buat kategori "${value}"`
                                                }
                                                emptyMessage="Ketik nama kategori baru."
                                                placeholder="Pilih atau buat kategori"
                                                onClear={clearCategorySelection}
                                                onCreate={createCategory}
                                                onInputChange={
                                                    applyCategoryInputValue
                                                }
                                                onValueChange={
                                                    applySelectedCategory
                                                }
                                                renderOption={(option) => (
                                                    <CategoryIconLabel
                                                        icon={option.icon}
                                                        label={option.label}
                                                    />
                                                )}
                                                startAddon={
                                                    <InputGroupAddon
                                                        align="inline-start"
                                                        className="border-r border-border/40 pr-1"
                                                    >
                                                        <CategoryIconPicker
                                                            value={categoryIcon}
                                                            onValueChange={(
                                                                value,
                                                            ) =>
                                                                setValue(
                                                                    'categoryIcon',
                                                                    value,
                                                                    {
                                                                        shouldDirty: true,
                                                                        shouldValidate: true,
                                                                    },
                                                                )
                                                            }
                                                        />
                                                    </InputGroupAddon>
                                                }
                                            />

                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    name="minOrder"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Minimal order</FormLabel>
                                            <FormControl>
                                                <InputGroup>
                                                    <InputGroupInput
                                                        {...field}
                                                        min={1}
                                                        placeholder="1"
                                                        type="number"
                                                    />
                                                    <InputGroupAddon align="inline-end">
                                                        <InputGroupText>
                                                            porsi
                                                        </InputGroupText>
                                                    </InputGroupAddon>
                                                </InputGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Deskripsi</FormLabel>
                                        <FormControl>
                                            <InputGroup>
                                                <InputGroupTextarea
                                                    {...field}
                                                    className="min-h-28"
                                                    placeholder="Ringkasan bahan, rasa, atau komposisi menu."
                                                />
                                            </InputGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </FieldGroup>
                    </FieldSet>
                </section>

                <MenuFormSummaryAside
                    className="admin-card p-4 md:p-5"
                    mode="info"
                    selectedCategory={selectedCategory}
                    values={values}
                />
            </div>
        </div>
    );
}
