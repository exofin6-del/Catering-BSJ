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
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from '@/components/ui/input-group';
import type { MenuFormValues } from '../../../schema/menu-form-schema';
import { MenuFormSummaryAside } from '../menu-form-summary-aside';

export function PricingMenuStep({
    selectedCategory,
    values,
}: {
    selectedCategory: string;
    values: MenuFormValues;
}) {
    return (
        <div className="grid items-start gap-5 lg:grid-cols-[3fr_1.5fr]">
            <section className="admin-card min-w-0 p-4 md:p-5">
                <FieldSet className="gap-5">
                    <FieldContent>
                        <FieldLegend className="text-base font-semibold text-foreground">
                            Harga Menu
                        </FieldLegend>
                        <FieldDescription className="text-sm leading-snug">
                            Isi Harga/diskon menu
                        </FieldDescription>
                    </FieldContent>

                    <FieldGroup className="gap-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                name="basePrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Harga dasar</FormLabel>
                                        <FormControl>
                                            <InputGroup>
                                                <InputGroupAddon>
                                                    <InputGroupText>
                                                        Rp
                                                    </InputGroupText>
                                                </InputGroupAddon>
                                                <InputGroupInput
                                                    {...field}
                                                    min={0}
                                                    placeholder="25000"
                                                    type="number"
                                                />
                                            </InputGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                name="promoPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Harga promo{' '}
                                            <span className="text-xs text-muted-foreground">
                                                (opsional)
                                            </span>
                                        </FormLabel>
                                        <FormControl>
                                            <InputGroup>
                                                <InputGroupAddon>
                                                    <InputGroupText>
                                                        Rp
                                                    </InputGroupText>
                                                </InputGroupAddon>
                                                <InputGroupInput
                                                    {...field}
                                                    min={0}
                                                    placeholder="Opsional"
                                                    type="number"
                                                />
                                            </InputGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </FieldGroup>
                </FieldSet>
            </section>

            <MenuFormSummaryAside
                className="admin-card p-4 md:p-5"
                mode="info-price"
                selectedCategory={selectedCategory}
                values={values}
            />
        </div>
    );
}
