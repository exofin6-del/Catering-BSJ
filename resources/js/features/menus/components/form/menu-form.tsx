import { zodResolver } from '@hookform/resolvers/zod';
import type { Errors } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import {
    FormWizardFooter,
    FormWizardPage,
    FormWizardStepper,
} from '@/components/shared/form-wizard';
import { Form } from '@/components/ui/form';
import {
    removePersistentState,
    usePersistedFormState,
    usePersistentState,
} from '@/lib/hooks/use-persistent-state';
import menu from '@/routes/menu';
import type { MenuCategory, MenuItem } from '@/types';
import { useMenuImageInput } from '../../hooks/use-menu-image-input';
import type { MenuFormValues } from '../../schema/menu-form-schema';
import { menuFormSchema } from '../../schema/menu-form-schema';
import {
    applyImageServerError,
    applyMenuFormServerErrors,
    resolveFirstMenuFormErrorStepIndex,
} from '../../utils/menu-form-errors';
import {
    buildMenuFormPayload,
    createMenuFormDefaultValues,
    resolveSelectedCategory,
} from '../../utils/menu-form-values';
import {
    flushMenuIndexTableCache,
    menuIndexCacheTag,
} from '../../utils/menu-table';
import { FORM_ID, menuFormStepFields, menuFormSteps } from './constants';
import { BasicMenuStep } from './steps/basic-menu-step';
import { PricingMenuStep } from './steps/pricing-menu-step';
import { PublishMenuStep } from './steps/publish-menu-step';
import type { MenuFormMode } from './types';

export function MenuForm({
    categories = [],
    item,
    mode,
}: {
    categories?: MenuCategory[];
    item?: MenuItem | null;
    mode: MenuFormMode;
}) {
    const formStorageKey = `menu-form.v1.${mode}.${item?.id ?? 'new'}`;
    const [activeStepIndex, setActiveStepIndex] = usePersistentState(
        `${formStorageKey}.step`,
        0,
    );
    const [processing, setProcessing] = useState(false);
    const isEditing = mode === 'edit';
    const {
        handleImageChange,
        imageError,
        images,
        isUploadingImages,
        rejectImageSelection,
        removedImageIds,
        removeImage,
        reorderImages,
        setImageError,
        setPrimaryImage,
    } = useMenuImageInput(item);

    const defaultValues = useMemo<MenuFormValues>(
        () => createMenuFormDefaultValues(item),
        [item],
    );
    const form = useForm<MenuFormValues>({
        defaultValues,
        resolver: zodResolver(menuFormSchema),
    });
    usePersistedFormState(form, formStorageKey);

    const currentStep = menuFormSteps[activeStepIndex];
    const isLastStep = activeStepIndex === menuFormSteps.length - 1;
    const watchedValues = {
        ...defaultValues,
        ...useWatch({
            control: form.control,
        }),
    } as MenuFormValues;
    const selectedCategory = resolveSelectedCategory(categories, watchedValues);

    async function handleNext() {
        const stepId = currentStep.id;
        const isValid = await form.trigger(menuFormStepFields[stepId], {
            shouldFocus: true,
        });

        if (isValid) {
            setActiveStepIndex((index) =>
                Math.min(index + 1, menuFormSteps.length - 1),
            );
        }
    }

    function handlePrevious() {
        setActiveStepIndex((index) => Math.max(index - 1, 0));
    }

    async function handleSave() {
        await form.handleSubmit(submit)();
    }

    async function handleStepClick(nextIndex: number) {
        if (nextIndex <= activeStepIndex) {
            setActiveStepIndex(nextIndex);

            return;
        }

        for (let index = activeStepIndex; index < nextIndex; index += 1) {
            const isValid = await form.trigger(
                menuFormStepFields[menuFormSteps[index].id],
                {
                    shouldFocus: true,
                },
            );

            if (!isValid) {
                return;
            }
        }

        setActiveStepIndex(nextIndex);
    }

    function submit(values: MenuFormValues) {
        setImageError(null);

        if (isUploadingImages) {
            setImageError('Tunggu upload gambar selesai.');
            setActiveStepIndex(
                menuFormSteps.findIndex((step) => step.id === 'publish'),
            );

            return;
        }

        const toastMessages = menuFormToastMessages(isEditing);
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

        const payload = buildMenuFormPayload(values, images, removedImageIds);
        const route =
            isEditing && item?.id !== undefined
                ? menu.update(item.id)
                : menu.store();

        router.visit(route.url, {
            data:
                isEditing && item?.id !== undefined
                    ? {
                          ...payload,
                          _method: 'put',
                      }
                    : payload,
            invalidateCacheTags: menuIndexCacheTag,
            method: isEditing ? 'post' : route.method,
            onError: (errors) => {
                applyMenuFormServerErrors(errors, form.setError);
                applyImageServerError(errors, setImageError);
                moveToFirstErrorStep(errors);
                showSavingErrorToast(
                    toastMessages.error,
                    firstMenuErrorMessage(errors),
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
                flushMenuIndexTableCache();
                router.flushByCacheTags(menuIndexCacheTag);
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

    function moveToFirstErrorStep(errors: Errors) {
        const firstErrorStepIndex = resolveFirstMenuFormErrorStepIndex(errors);

        if (firstErrorStepIndex >= 0) {
            setActiveStepIndex(firstErrorStepIndex);
        }
    }

    function firstMenuErrorMessage(errors: Errors): string | undefined {
        return Object.values(errors).find(
            (message): message is string =>
                typeof message === 'string' && message.trim() !== '',
        );
    }

    function menuFormToastMessages(isEditing: boolean): {
        error: string;
        loading: string;
    } {
        if (isEditing) {
            return {
                error: 'Gagal menyimpan perubahan. Periksa kembali data menu.',
                loading: 'Menyimpan perubahan',
            };
        }

        return {
            error: 'Gagal menyimpan menu. Periksa kembali data menu.',
            loading: 'Menyimpan menu',
        };
    }

    return (
        <Form {...form}>
            <form
                id={FORM_ID}
                className="flex flex-1 flex-col gap-5"
                onSubmit={(event) => event.preventDefault()}
            >
                <FormWizardStepper
                    activeStepIndex={activeStepIndex}
                    steps={menuFormSteps}
                    onStepClick={handleStepClick}
                />

                <FormWizardPage>
                    {currentStep.id === 'basic' ? (
                        <BasicMenuStep
                            categories={categories}
                            selectedCategory={selectedCategory}
                            values={watchedValues}
                        />
                    ) : null}

                    {currentStep.id === 'pricing' ? (
                        <PricingMenuStep
                            selectedCategory={selectedCategory}
                            values={watchedValues}
                        />
                    ) : null}

                    {currentStep.id === 'publish' ? (
                        <PublishMenuStep
                            imageError={imageError}
                            images={images}
                            isUploadingImages={isUploadingImages}
                            selectedCategory={selectedCategory}
                            values={watchedValues}
                            onImageChange={handleImageChange}
                            onImageRemove={removeImage}
                            onImageReorder={reorderImages}
                            onImageReject={rejectImageSelection}
                            onPrimaryImageChange={setPrimaryImage}
                        />
                    ) : null}
                </FormWizardPage>

                <FormWizardFooter
                    mode="standalone"
                    activeStepIndex={activeStepIndex}
                    isLastStep={isLastStep}
                    processing={processing || isUploadingImages}
                    saveLabel={isEditing ? 'Simpan' : 'Simpan'}
                    savingLabel={
                        isUploadingImages ? 'Mengunggah...' : 'Menyimpan...'
                    }
                    stepCount={menuFormSteps.length}
                    submitFormId={FORM_ID}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    onSaveClick={() => void handleSave()}
                />
            </form>
        </Form>
    );
}
