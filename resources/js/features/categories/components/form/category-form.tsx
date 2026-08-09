import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import {
    FormWizardFooter,
    FormWizardPage,
} from '@/components/shared/form-wizard';
import { Form } from '@/components/ui/form';
import {
    removePersistentState,
    usePersistedFormState,
} from '@/lib/hooks/use-persistent-state';
import categories from '@/routes/categories';
import { categoryFormSchema } from '../../schema/category-form-schema';
import type { CategoryFormValues } from '../../schema/category-form-schema';
import type { CategoryFormProps } from '../../types/category-types';
import { applyCategoryFormServerErrors } from '../../utils/category-form-errors';
import {
    buildCategoryFormPayload,
    createCategoryFormDefaultValues,
} from '../../utils/category-form-values';
import {
    categoryIndexCacheTag,
    flushCategoryIndexTableCache,
} from '../../utils/category-table';
import { CATEGORY_FORM_ID } from './constants';
import { CategoryDetailsStep } from './steps/category-details-step';

export function CategoryForm({
    category,
    initialType = 'menu',
    mode,
}: CategoryFormProps) {
    const [processing, setProcessing] = useState(false);
    const isEditing =
        mode === 'edit' && category !== undefined && category !== null;
    const defaultValues = useMemo<CategoryFormValues>(
        () => createCategoryFormDefaultValues({ category, initialType }),
        [category, initialType],
    );
    const formStorageKey = `category-form.v1.${mode}.${category?.id ?? 'new'}`;

    const form = useForm<CategoryFormValues>({
        defaultValues,
        resolver: zodResolver(categoryFormSchema),
    });
    usePersistedFormState(form, formStorageKey);
    const watchedValues = {
        ...defaultValues,
        ...useWatch({
            control: form.control,
        }),
    } as CategoryFormValues;

    function submit(values: CategoryFormValues) {
        form.clearErrors();

        const routeForm =
            isEditing && category
                ? categories.update.form([category.type, category.id])
                : categories.store.form();
        const payload = buildCategoryFormPayload(values, {
            includeType: !isEditing,
        });

        router.visit(routeForm.action, {
            data: payload,
            invalidateCacheTags: categoryIndexCacheTag,
            method: routeForm.method,
            onError: (errors) =>
                applyCategoryFormServerErrors(errors, form.setError),
            onSuccess: () => {
                removePersistentState(formStorageKey);
                toast.success(
                    isEditing
                        ? 'Kategori berhasil diperbarui.'
                        : 'Kategori berhasil ditambahkan.',
                );
            },
            onFinish: () => setProcessing(false),
            onStart: () => {
                flushCategoryIndexTableCache();
                router.flushByCacheTags(categoryIndexCacheTag);
                setProcessing(true);
            },
            preserveScroll: true,
        });
    }

    return (
        <Form {...form}>
            <form
                id={CATEGORY_FORM_ID}
                className="flex flex-1 flex-col gap-5"
                onSubmit={form.handleSubmit(submit)}
            >
                <FormWizardPage>
                    <CategoryDetailsStep
                        isEditing={isEditing}
                        values={watchedValues}
                    />
                </FormWizardPage>

                <FormWizardFooter
                    mode="standalone"
                    activeStepIndex={0}
                    isLastStep={true}
                    processing={processing}
                    saveLabel={
                        isEditing ? 'Simpan perubahan' : 'Simpan kategori'
                    }
                    savingLabel="Menyimpan..."
                    hideStepIndicator={true}
                    stepCount={0}
                    submitFormId={CATEGORY_FORM_ID}
                    onNext={() => undefined}
                    onPrevious={() => undefined}
                />
            </form>
        </Form>
    );
}
