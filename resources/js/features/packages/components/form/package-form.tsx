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
import paket from '@/routes/paket';
import type { MenuPackage, PackageCategory, PackageMenuItem } from '@/types';

import { usePackageComponents } from '../../hooks/use-package-components';
import { usePackageImageInput } from '../../hooks/use-package-image-input';
import type { PackageDetailsFormValues } from '../../schema/package-form-schema';
import { packageDetailsFormSchema } from '../../schema/package-form-schema';
import type { PackageComponentFormItem } from '../../types/package-types';
import {
    applyPackageFormServerErrors,
    applyPackageImageServerError,
    resolveFirstPackageFormErrorStepIndex,
    resolvePackageComponentServerError,
} from '../../utils/package-form-errors';
import {
    buildPackageFormPayload,
    findMenuItem,
    initialPackageDetails,
    packagePreviewStateFromForm,
    resolveSelectedPackageCategory,
} from '../../utils/package-form-values';
import { priceNumber } from '../../utils/package-price';
import {
    flushPackageIndexTableCache,
    packageIndexCacheTag,
} from '../../utils/package-table';
import {
    PACKAGE_FORM_ID,
    packageFormStepFields,
    packageFormSteps,
} from './constants';
import { PackageComponentsStep } from './steps/package-components-step';
import { PackageInformationStep } from './steps/package-information-step';
import { PackagePublicationStep } from './steps/package-publication-step';
import type { PackageFormMode } from './types';

export function PackageForm({
    item,
    menuItems = [],
    mode,
    packageCategories = [],
}: {
    item?: MenuPackage | null;
    menuItems?: PackageMenuItem[];
    mode: PackageFormMode;
    packageCategories?: PackageCategory[];
}) {
    const formStorageKey = `package-form.v1.${mode}.${item?.id ?? 'new'}`;
    const [activeStepIndex, setActiveStepIndex] = usePersistentState(
        `${formStorageKey}.step`,
        0,
    );
    const [componentError, setComponentError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const isEditing = mode === 'edit';
    const {
        addChoiceMenuItem,
        addFixedComponent,
        clearComponents,
        components,
        moveComponent,
        removeChoiceItem,
        removeComponent,
        updateChoiceItem,
        updateComponent,
    } = usePackageComponents({
        item,
        menuItems,
        storageKey: `${formStorageKey}.components`,
    });
    const {
        handleImageChange,
        imageError,
        images,
        isUploadingImages,
        removedImageIds,
        removeImage,
        reorderImages,
        setImageError,
        setPrimaryImage,
    } = usePackageImageInput(item);
    const defaultValues = useMemo<PackageDetailsFormValues>(
        () => initialPackageDetails(item ?? null),
        [item],
    );
    const form = useForm<PackageDetailsFormValues>({
        defaultValues,
        resolver: zodResolver(packageDetailsFormSchema),
    });
    usePersistedFormState(form, formStorageKey);
    const currentStep = packageFormSteps[activeStepIndex];
    const isLastStep = activeStepIndex === packageFormSteps.length - 1;
    const watchedValues = {
        ...defaultValues,
        ...useWatch({
            control: form.control,
        }),
    } as PackageDetailsFormValues;
    const selectedCategory = resolveSelectedPackageCategory(
        packageCategories,
        watchedValues,
    );
    const preview = packagePreviewStateFromForm({
        categoryName: selectedCategory,
        components,
        images,
        menuItems,
        values: watchedValues,
    });

    async function handleNext() {
        if (currentStep.id === 'components') {
            if (!validateComponents()) {
                return;
            }

            setActiveStepIndex((index) =>
                Math.min(index + 1, packageFormSteps.length - 1),
            );

            return;
        }

        const stepId = currentStep.id;
        const isValid = await form.trigger(packageFormStepFields[stepId], {
            shouldFocus: true,
        });

        if (isValid) {
            setActiveStepIndex((index) =>
                Math.min(index + 1, packageFormSteps.length - 1),
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
            const step = packageFormSteps[index];

            if (step.id === 'components') {
                if (!validateComponents()) {
                    return;
                }

                continue;
            }

            const isValid = await form.trigger(packageFormStepFields[step.id], {
                shouldFocus: true,
            });

            if (!isValid) {
                return;
            }
        }

        setActiveStepIndex(nextIndex);
    }

    function submit(values: PackageDetailsFormValues) {
        setImageError(null);

        if (!validateComponents()) {
            setActiveStepIndex(
                packageFormSteps.findIndex((step) => step.id === 'components'),
            );

            return;
        }

        if (isUploadingImages) {
            setImageError('Tunggu upload gambar selesai.');
            setActiveStepIndex(
                packageFormSteps.findIndex((step) => step.id === 'publication'),
            );

            return;
        }

        const route =
            isEditing && item?.id !== undefined
                ? paket.update(item.id)
                : paket.store();
        const payload = buildPackageFormPayload(
            values,
            components,
            images,
            removedImageIds,
        );

        const toastMessages = packageFormToastMessages(isEditing);
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

        router.visit(route.url, {
            data:
                isEditing && item?.id !== undefined
                    ? {
                          ...payload,
                          _method: 'put',
                      }
                    : payload,
            invalidateCacheTags: packageIndexCacheTag,
            method: isEditing ? 'post' : route.method,
            onError: (errors) => {
                applyPackageFormServerErrors(errors, form.setError);
                applyPackageImageServerError(errors, setImageError);
                setComponentError(resolvePackageComponentServerError(errors));
                moveToFirstErrorStep(errors);
                showSavingErrorToast(
                    toastMessages.error,
                    firstPackageErrorMessage(errors),
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
                flushPackageIndexTableCache();
                router.flushByCacheTags(packageIndexCacheTag);
                setProcessing(true);
                savingToastId = toast.loading(toastMessages.loading, {
                    duration: Infinity,
                });
            },
            onSuccess: () => {
                dismissSavingToast();
                removePersistentState(formStorageKey);
                removePersistentState(`${formStorageKey}.step`);
                clearComponents();
            },
            preserveScroll: true,
        });
    }

    function moveToFirstErrorStep(errors: Errors) {
        const firstErrorStepIndex =
            resolveFirstPackageFormErrorStepIndex(errors);

        if (firstErrorStepIndex >= 0) {
            setActiveStepIndex(firstErrorStepIndex);
        }
    }

    function validateComponents(): boolean {
        const errorMessage = resolveComponentClientError(components, menuItems);

        setComponentError(errorMessage);

        return errorMessage === null;
    }

    function firstPackageErrorMessage(errors: Errors): string | undefined {
        return Object.values(errors).find(
            (message): message is string =>
                typeof message === 'string' && message.trim() !== '',
        );
    }

    function packageFormToastMessages(isEditing: boolean): {
        error: string;
        loading: string;
    } {
        if (isEditing) {
            return {
                error: 'Gagal menyimpan perubahan. Periksa kembali data paket.',
                loading: 'Menyimpan perubahan',
            };
        }

        return {
            error: 'Gagal menyimpan paket. Periksa kembali data paket.',
            loading: 'Menyimpan paket',
        };
    }

    return (
        <Form {...form}>
            <form
                id={PACKAGE_FORM_ID}
                className="flex flex-1 flex-col gap-5"
                onSubmit={(event) => event.preventDefault()}
            >
                <FormWizardStepper
                    activeStepIndex={activeStepIndex}
                    steps={packageFormSteps}
                    onStepClick={handleStepClick}
                />

                <FormWizardPage>
                    {currentStep.id === 'information' ? (
                        <PackageInformationStep
                            categories={packageCategories}
                            menuItems={menuItems}
                            preview={preview}
                            selectedCategory={selectedCategory}
                        />
                    ) : null}

                    {currentStep.id === 'components' ? (
                        <PackageComponentsStep
                            componentError={componentError}
                            components={components}
                            menuItems={menuItems}
                            preview={preview}
                            onAddChoiceMenuItem={addChoiceMenuItem}
                            onAddFixedComponent={addFixedComponent}
                            onMoveComponent={moveComponent}
                            onRemoveChoiceItem={removeChoiceItem}
                            onRemoveComponent={removeComponent}
                            onUpdateChoiceItem={updateChoiceItem}
                            onUpdateComponent={updateComponent}
                        />
                    ) : null}

                    {currentStep.id === 'publication' ? (
                        <PackagePublicationStep
                            imageError={imageError}
                            images={images}
                            menuItems={menuItems}
                            preview={preview}
                            values={watchedValues}
                            onImageChange={handleImageChange}
                            onImageReject={setImageError}
                            onImageRemove={removeImage}
                            onImageReorder={reorderImages}
                            onPrimaryImageChange={setPrimaryImage}
                        />
                    ) : null}
                </FormWizardPage>

                <FormWizardFooter
                    mode="standalone"
                    activeStepIndex={activeStepIndex}
                    isLastStep={isLastStep}
                    processing={processing || isUploadingImages}
                    saveLabel={isEditing ? 'Simpan perubahan' : 'Simpan paket'}
                    savingLabel={
                        isUploadingImages ? 'Mengunggah...' : 'Menyimpan...'
                    }
                    stepCount={packageFormSteps.length}
                    submitFormId={PACKAGE_FORM_ID}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    onSaveClick={() => void handleSave()}
                />
            </form>
        </Form>
    );
}

function resolveComponentClientError(
    components: PackageComponentFormItem[],
    menuItems: PackageMenuItem[],
): string | null {
    if (components.length === 0) {
        return 'Tambahkan minimal satu komponen paket.';
    }

    const selectedMenuItemIds = new Set<number>();

    for (const component of components) {
        if (component.type === 'choice') {
            if (component.itemPrices.length === 0) {
                return 'Tambahkan minimal satu pilihan pada grup paket.';
            }

            for (const choice of component.itemPrices) {
                const menuItem = findMenuItem(menuItems, choice.menuItemId);

                if (!menuItem) {
                    return 'Salah satu menu pilihan tidak tersedia.';
                }

                if (selectedMenuItemIds.has(menuItem.id)) {
                    return 'Menu yang sama tidak boleh dipakai dua kali dalam paket.';
                }

                selectedMenuItemIds.add(menuItem.id);

                if (
                    priceNumber(choice.packagePrice) >
                    priceNumber(menuItem.base_price)
                ) {
                    return `Harga paket untuk ${menuItem.name} tidak boleh melebihi harga dasar.`;
                }
            }

            continue;
        }

        const menuItem = findMenuItem(menuItems, component.menuItemId);

        if (!menuItem) {
            return 'Salah satu menu komponen tidak tersedia.';
        }

        if (selectedMenuItemIds.has(menuItem.id)) {
            return 'Menu yang sama tidak boleh dipakai dua kali dalam paket.';
        }

        selectedMenuItemIds.add(menuItem.id);

        if (
            priceNumber(component.packagePrice) >
            priceNumber(menuItem.base_price)
        ) {
            return `Harga paket untuk ${menuItem.name} tidak boleh melebihi harga dasar.`;
        }
    }

    return null;
}
