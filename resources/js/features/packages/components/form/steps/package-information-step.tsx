import { useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';

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
import type { PackageCategory, PackageMenuItem } from '@/types';

import type { PackageDetailsFormValues } from '../../../schema/package-form-schema';
import type { PackagePreviewState } from '../../../types/package-types';
import { PackageFormSummaryAside } from '../package-form-summary-aside';

type CategoryOption = CreatableComboboxOption & { icon: string };

export function PackageInformationStep({
    categories,
    menuItems = [],
    preview,
    selectedCategory,
}: {
    categories: PackageCategory[];
    menuItems?: PackageMenuItem[];
    preview: PackagePreviewState;
    selectedCategory: string;
}) {
    const { setValue, watch } = useFormContext<PackageDetailsFormValues>();
    const categoryId = watch('packageCategoryId');
    const categoryName = watch('packageCategoryName');
    const categoryIcon = watch('packageCategoryIcon');
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
    const selectedCategoryOption =
        categoryOptions.find((category) => category.value === categoryId) ??
        (categoryName.trim() !== ''
            ? {
                  isNew: true,
                  label: categoryName.trim(),
                  value: '__new_package_category__',
                  icon: categoryIcon,
              }
            : null);
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
        setCategoryFormValues(matchedCategory?.value ?? '', {
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
            setCategoryFormValues('', {
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
        setCategoryFormValues('', {
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
        setCategoryFormValues('', {
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
        setValue('packageCategoryId', categoryIdValue, {
            shouldDirty: true,
            shouldValidate: true,
        });
        setValue('packageCategoryName', categoryNameValue, {
            shouldDirty: true,
            shouldValidate: true,
        });
        setValue('packageCategoryIcon', categoryIconValue, {
            shouldDirty: true,
        });
    }

    return (
        <div className="grid gap-5">
            <div className="grid items-start gap-5 lg:grid-cols-[3fr_1.5fr]">
                <section className="admin-card min-w-0 p-4 md:p-5">
                    <FieldSet className="gap-5">
                        <FieldContent>
                            <FieldLegend className="text-base font-semibold text-foreground">
                                Informasi dasar paket
                            </FieldLegend>
                            <FieldDescription className="text-sm leading-snug">
                                Informasi dasar paket yang akan ditampilkan pada
                                halaman detail paket.
                            </FieldDescription>
                        </FieldContent>

                        <FieldGroup className="gap-5">
                            <FormField
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nama paket</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                autoComplete="off"
                                                placeholder="Paket nasi liwet keluarga"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    name="packageCategoryName"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>
                                                Kategori paket
                                            </FormLabel>
                                            <FormCreatableCombobox
                                                options={categoryOptions}
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
                                                                    'packageCategoryIcon',
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
                                                    placeholder="Ringkasan komposisi, jumlah porsi, atau catatan paket."
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

                <PackageFormSummaryAside
                    className="admin-card self-start p-4 md:p-5"
                    defaultTab="details"
                    preview={{
                        ...preview,
                        categoryName: selectedCategory,
                    }}
                    menuItems={menuItems}
                />
            </div>
        </div>
    );
}
