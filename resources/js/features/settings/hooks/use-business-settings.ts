import { router, useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';

import type {
    AreaFormData,
    BusinessSetting,
    HoursFormData,
    InfoFormData,
    ThemeFormData,
} from '@/features/settings/types/business-setting';
import business from '@/routes/business';

export function useBusinessSettings(businessSetting: BusinessSetting) {
    const initialBusinessName = businessSetting.business_name?.trim() || '';

    const [heroImagePreviews, setHeroImagePreviews] = useState<string[]>(
        businessSetting.hero_images ?? [],
    );
    const [heroImageErrors, setHeroImageErrors] = useState<string[]>([
        '',
        '',
        '',
    ]);
    const [heroImagesChanged, setHeroImagesChanged] = useState(false);
    const [heroImagesSaving, setHeroImagesSaving] = useState(false);
    const heroImageFileRefs = useRef<(File | null)[]>([null, null, null]);
    const heroImageRemoveFlags = useRef<boolean[]>([false, false, false]);
    const infoForm = useForm<InfoFormData>('business-info.v1', {
        business_name: initialBusinessName,
        description: businessSetting.description ?? '',
        whatsapp_number: businessSetting.whatsapp_number ?? '',
        is_open: businessSetting.is_open,
    });

    const themeForm = useForm<ThemeFormData>('business-theme.v1', {
        customer_theme: businessSetting.customer_theme,
    });

    const hoursForm = useForm<HoursFormData>('business-hours.v1', {
        operational_start_time: businessSetting.operational_start_time,
        operational_end_time: businessSetting.operational_end_time,
        max_orders_per_day: businessSetting.max_orders_per_day,
    });

    const areaForm = useForm<AreaFormData>('business-area.v1', {
        business_lat: businessSetting.business_lat ?? '',
        business_lng: businessSetting.business_lng ?? '',
        business_address: businessSetting.business_address ?? '',
        max_order_km: Number(businessSetting.max_order_km),
    });

    const radiusKm = Number.isFinite(areaForm.data.max_order_km)
        ? areaForm.data.max_order_km
        : 1;

    function submitInfo(event?: FormEvent<HTMLFormElement>): void {
        event?.preventDefault();

        let shouldDismissToast = true;
        const savingToastId = toast.loading('Menyimpan pengaturan bisnis...');

        infoForm.transform((data) => ({
            ...data,
            _method: 'patch',
            ...heroImagePayload(),
        }));

        infoForm.post(business.update.url(), {
            forceFormData: true,
            onSuccess: (page) => {
                const updatedSetting = page.props
                    .businessSetting as BusinessSetting;
                const updatedInfo = {
                    business_name: updatedSetting.business_name,
                    description: updatedSetting.description ?? '',
                    whatsapp_number: updatedSetting.whatsapp_number ?? '',
                    is_open: updatedSetting.is_open,
                };

                infoForm.setData(updatedInfo);
                infoForm.setDefaults(updatedInfo);
                infoForm.clearErrors();

                // Reset hero image state
                heroImageFileRefs.current = [null, null, null];
                heroImageRemoveFlags.current = [false, false, false];
                setHeroImagePreviews(updatedSetting.hero_images ?? []);
                setHeroImageErrors(['', '', '']);
                setHeroImagesChanged(false);
            },
            onError: (errors) => {
                shouldDismissToast = false;
                syncHeroImageErrors(errors);
                toast.error('Gagal menyimpan pengaturan bisnis.', {
                    id: savingToastId,
                });
            },
            onFinish: () => {
                if (shouldDismissToast) {
                    toast.dismiss(savingToastId);
                }
            },
            preserveScroll: true,
        });
    }

    function submitHeroImages(): void {
        let shouldDismissToast = true;
        const savingToastId = toast.loading('Menyimpan gambar beranda...');

        const data = new FormData();
        data.append('_method', 'patch');

        for (let i = 0; i < 3; i++) {
            if (heroImageFileRefs.current[i]) {
                data.append(`hero_image_${i}`, heroImageFileRefs.current[i]!);
            }

            if (heroImageRemoveFlags.current[i]) {
                data.append(`remove_hero_image_${i}`, '1');
            }
        }

        router.post(business.update.url(), data, {
            forceFormData: true,
            onStart: () => {
                setHeroImagesSaving(true);
            },
            onSuccess: (page) => {
                const updatedSetting = page.props
                    .businessSetting as BusinessSetting;

                heroImageFileRefs.current = [null, null, null];
                heroImageRemoveFlags.current = [false, false, false];
                setHeroImagePreviews(updatedSetting.hero_images ?? []);
                setHeroImageErrors(['', '', '']);
                setHeroImagesChanged(false);
            },
            onError: (errors) => {
                shouldDismissToast = false;
                syncHeroImageErrors(errors);
                toast.error('Gagal menyimpan gambar beranda.', {
                    id: savingToastId,
                });
            },
            onFinish: () => {
                setHeroImagesSaving(false);

                if (shouldDismissToast) {
                    toast.dismiss(savingToastId);
                }
            },
            preserveScroll: true,
        });
    }

    function handleHeroImageChange(index: number, file: File | null): void {
        heroImageRemoveFlags.current[index] = false;

        if (file) {
            if (!file.type.startsWith('image/')) {
                const errors = [...heroImageErrors];
                errors[index] = 'File harus berupa gambar.';
                setHeroImageErrors(errors);

                return;
            }

            const errors = [...heroImageErrors];
            errors[index] = '';
            setHeroImageErrors(errors);

            heroImageFileRefs.current[index] = file;

            const reader = new FileReader();
            reader.onloadend = () => {
                const previews = [...heroImagePreviews];
                previews[index] = reader.result as string;
                setHeroImagePreviews(previews);
            };
            reader.readAsDataURL(file);
        } else {
            heroImageFileRefs.current[index] = null;
        }

        setHeroImagesChanged(true);
    }

    function handleHeroImageRemove(index: number) {
        heroImageFileRefs.current[index] = null;
        heroImageRemoveFlags.current[index] = true;
        heroImageFileRefs.current[index] = null;

        const previews = [...heroImagePreviews];
        previews[index] = '';
        setHeroImagePreviews(previews);

        const errors = [...heroImageErrors];
        errors[index] = '';
        setHeroImageErrors(errors);

        setHeroImagesChanged(true);
    }

    function handleHeroImageReset() {
        heroImageFileRefs.current = [null, null, null];
        heroImageRemoveFlags.current = [false, false, false];
        setHeroImagePreviews(businessSetting.hero_images ?? []);
        setHeroImageErrors(['', '', '']);
        setHeroImagesChanged(false);
    }

    function submitTheme(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        let shouldDismissToast = true;
        const savingToastId = toast.loading('Menyimpan tema customer...');

        themeForm.transform((data) => ({
            ...data,
            _method: 'patch',
        }));

        themeForm.post(business.update.url(), {
            forceFormData: true,
            onSuccess: (page) => {
                const updatedSetting = page.props
                    .businessSetting as BusinessSetting;
                const updatedTheme = {
                    customer_theme: updatedSetting.customer_theme,
                };

                themeForm.setData(updatedTheme);
                themeForm.setDefaults(updatedTheme);
                themeForm.clearErrors();
            },
            onError: () => {
                shouldDismissToast = false;
                toast.error('Gagal menyimpan tema customer.', {
                    id: savingToastId,
                });
            },
            onFinish: () => {
                if (shouldDismissToast) {
                    toast.dismiss(savingToastId);
                }
            },
            preserveScroll: true,
        });
    }

    function submitHours(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        let shouldDismissToast = true;
        const savingToastId = toast.loading('Menyimpan jam operasional...');

        hoursForm.transform((data) => ({
            ...data,
            _method: 'patch',
        }));

        hoursForm.post(business.update.url(), {
            forceFormData: true,
            onSuccess: (page) => {
                const updatedSetting = page.props
                    .businessSetting as BusinessSetting;
                const updatedHours = {
                    max_orders_per_day: updatedSetting.max_orders_per_day,
                    operational_end_time: updatedSetting.operational_end_time,
                    operational_start_time:
                        updatedSetting.operational_start_time,
                };

                hoursForm.setData(updatedHours);
                hoursForm.setDefaults(updatedHours);
                hoursForm.clearErrors();
            },
            onError: () => {
                shouldDismissToast = false;
                toast.error('Gagal menyimpan jam operasional.', {
                    id: savingToastId,
                });
            },
            onFinish: () => {
                if (shouldDismissToast) {
                    toast.dismiss(savingToastId);
                }
            },
            preserveScroll: true,
        });
    }

    function submitArea(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        let shouldDismissToast = true;
        const savingToastId = toast.loading('Menyimpan area layanan...');

        areaForm.transform((data) => ({
            ...data,
            _method: 'patch',
        }));

        areaForm.post(business.update.url(), {
            forceFormData: true,
            onSuccess: (page) => {
                const updatedSetting = page.props
                    .businessSetting as BusinessSetting;
                const updatedArea = {
                    business_address: updatedSetting.business_address ?? '',
                    business_lat: updatedSetting.business_lat ?? '',
                    business_lng: updatedSetting.business_lng ?? '',
                    max_order_km: Number(updatedSetting.max_order_km),
                };

                areaForm.setData(updatedArea);
                areaForm.setDefaults(updatedArea);
                areaForm.clearErrors();
            },
            onError: () => {
                shouldDismissToast = false;
                toast.error('Gagal menyimpan area layanan.', {
                    id: savingToastId,
                });
            },
            onFinish: () => {
                if (shouldDismissToast) {
                    toast.dismiss(savingToastId);
                }
            },
            preserveScroll: true,
        });
    }

    function heroImagePayload(): Record<string, File | string> {
        const payload: Record<string, File | string> = {};

        for (let i = 0; i < 3; i++) {
            const file = heroImageFileRefs.current[i];

            if (file) {
                payload[`hero_image_${i}`] = file;
            }

            if (heroImageRemoveFlags.current[i]) {
                payload[`remove_hero_image_${i}`] = '1';
            }
        }

        return payload;
    }

    function syncHeroImageErrors(errors: Record<string, string>): void {
        const nextErrors = ['', '', ''];

        for (let i = 0; i < 3; i++) {
            nextErrors[i] = errors[`hero_image_${i}`] ?? '';
        }

        setHeroImageErrors(nextErrors);
    }

    return {
        areaForm,
        handleHeroImageChange,
        handleHeroImageRemove,
        handleHeroImageReset,
        heroImageErrors,
        heroImageFileRefs,
        heroImagesChanged,
        heroImagePreviews,
        heroImageRemoveFlags,
        heroImagesSaving,
        setHeroImageErrors,
        setHeroImagesChanged,
        setHeroImagePreviews,
        hoursForm,
        infoForm,
        radiusKm,
        submitArea,
        submitHours,
        submitHeroImages,
        submitInfo,
        submitTheme,
        themeForm,
    };
}
