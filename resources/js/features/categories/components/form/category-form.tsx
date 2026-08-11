import { zodResolver } from '@hookform/resolvers/zod';
import type { Errors } from '@inertiajs/core';
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
        const toastMessages = categoryFormToastMessages(isEditing);
        let savingToastId: number | string | null = null;
        const showSavingErrorToast = (
            message: string,
            description?: string,
        ): void => {
            toast.error(message, {
                description,
                id: savingToastId ?? undefined,
            });
            savingToastId = null;
        };
        const dismissSavingToast = (): void => {
            if (savingToastId === null) {
                return;
            }

            toast.dismiss(savingToastId);
            savingToastId = null;
        };

        const route =
            isEditing && category
                ? categories.update([category.type, category.id])
                : categories.store();
        const payload = buildCategoryFormPayload(values, {
            includeType: !isEditing,
        });

        router.visit(route.url, {
            data:
                isEditing && category
                    ? {
                          ...payload,
                          _method: 'put',
                      }
                    : payload,
            invalidateCacheTags: categoryIndexCacheTag,
            method: isEditing ? 'post' : route.method,
            onError: (errors) => {
                applyCategoryFormServerErrors(errors, form.setError);
                showSavingErrorToast(
                    toastMessages.error,
                    firstCategoryErrorMessage(errors),
                );
            },
            onFinish: () => {
                dismissSavingToast();
                setProcessing(false);
            },
            onHttpException: () => {
                showSavingErrorToast(toastMessages.error);
            },
            onNetworkError: () => {
                showSavingErrorToast(
                    'Koneksi bermasalah. Perubahan belum tersimpan.',
                );
            },
            onStart: () => {
                flushCategoryIndexTableCache();
                router.flushByCacheTags(categoryIndexCacheTag);
                setProcessing(true);
                savingToastId = toast.loading(toastMessages.loading, {
                    duration: Infinity,
                });
            },
            onSuccess: () => {
                dismissSavingToast();
                removePersistentState(formStorageKey);
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

function categoryFormToastMessages(isEditing: boolean): {
    error: string;
    loading: string;
} {
    if (isEditing) {
        return {
            error: 'Gagal menyimpan perubahan. Periksa kembali data kategori.',
            loading: 'Menyimpan perubahan',
        };
    }

    return {
        error: 'Gagal menyimpan kategori. Periksa kembali data kategori.',
        loading: 'Menyimpan kategori',
    };
}

function firstCategoryErrorMessage(errors: Errors): string | undefined {
    return Object.values(errors).find(
        (message): message is string =>
            typeof message === 'string' && message.trim() !== '',
    );
}
