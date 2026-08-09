import { useFormContext } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import {
    FieldContent,
    FieldDescription,
    FieldGroup,
    FieldLegend,
    FieldSet,
} from '@/components/ui/field';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { CategoryFormValues } from '../../../schema/category-form-schema';
import { CategoryFormSummaryAside } from '../category-form-summary-aside';
import { CategoryIconInput } from '../category-icon-input';
import { categoryTypeOptions } from '../constants';

export function CategoryDetailsStep({
    isEditing,
    values,
}: {
    isEditing: boolean;
    values: CategoryFormValues;
}) {
    const { control, formState } = useFormContext<CategoryFormValues>();

    return (
        <div className="grid items-start gap-5 lg:grid-cols-[3fr_1.5fr]">
            <section className="admin-card min-w-0 p-4 md:p-5">
                <FieldSet className="gap-5">
                    <FieldContent>
                        <FieldLegend className="text-base font-semibold text-foreground">
                            Detail kategori
                        </FieldLegend>
                        <FieldDescription className="text-sm leading-snug">
                            Data utama kategori yang muncul di daftar admin.
                        </FieldDescription>
                    </FieldContent>

                    <FieldGroup className="gap-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipe kategori</FormLabel>
                                        <Select
                                            value={field.value}
                                            disabled={isEditing}
                                            onValueChange={field.onChange}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Pilih tipe" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categoryTypeOptions.map(
                                                    (option) => {
                                                        const Icon =
                                                            option.icon;

                                                        return (
                                                            <SelectItem
                                                                key={
                                                                    option.value
                                                                }
                                                                value={
                                                                    option.value
                                                                }
                                                            >
                                                                <Icon className="size-4" />
                                                                {option.label}
                                                            </SelectItem>
                                                        );
                                                    },
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Nama dan ikon kategori
                                        </FormLabel>
                                        <FormField
                                            control={control}
                                            name="icon"
                                            render={({ field: iconField }) => (
                                                <FormControl>
                                                    <CategoryIconInput
                                                        value={field.value}
                                                        onChange={
                                                            field.onChange
                                                        }
                                                        iconValue={
                                                            iconField.value
                                                        }
                                                        onIconChange={
                                                            iconField.onChange
                                                        }
                                                        autoFocus
                                                        placeholder="Snack Box"
                                                    />
                                                </FormControl>
                                            )}
                                        />
                                        <FormMessage />
                                        {formState.errors.icon?.message ? (
                                            <p className="text-sm text-destructive">
                                                {formState.errors.icon.message}
                                            </p>
                                        ) : null}
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="rounded-md border p-3">
                                    <div className="flex items-center gap-3">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={(value) =>
                                                    field.onChange(
                                                        value === true,
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <div className="grid gap-0.5">
                                            <FormLabel className="text-sm">
                                                Aktif
                                            </FormLabel>
                                            <FormDescription className="text-xs">
                                                Tersedia untuk menu atau paket.
                                            </FormDescription>
                                        </div>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </FieldGroup>
                </FieldSet>
            </section>

            <CategoryFormSummaryAside
                className="admin-card p-4 md:p-5"
                values={values}
            />
        </div>
    );
}
