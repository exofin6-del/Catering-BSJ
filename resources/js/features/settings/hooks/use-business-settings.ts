import { router, useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';

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

        const data = new FormData();
        data.append('business_name', infoForm.data.business_name);
        data.append('description', infoForm.data.description);
        data.append('whatsapp_number', infoForm.data.whatsapp_number);
        data.append('is_open', infoForm.data.is_open ? '1' : '0');
        data.append('_method', 'patch');

        // Hero images
        for (let i = 0; i < 3; i++) {
            if (heroImageFileRefs.current[i]) {
                data.append(`hero_image_${i}`, heroImageFileRefs.current[i]!);
            }

            if (heroImageRemoveFlags.current[i]) {
                data.append(`remove_hero_image_${i}`, '1');
            }
        }

        router.visit(business.update.url(), {
            method: 'post',
            data: data as any,
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
                if (errors.whatsapp_number || errors.business_name) {
                    infoForm.setError(
                        Object.keys(errors) as any,
                    );
                }

                // Handle hero image errors
                for (let i = 0; i < 3; i++) {
                    const heroKey = `hero_image_${i}`;

                    if (errors[heroKey]) {
                        const heroErrors = [...heroImageErrors];
                        heroErrors[i] = errors[heroKey];
                        setHeroImageErrors(heroErrors);
                    }
                }
            },
            preserveScroll: true,
        });
    }

    function submitHeroImages(): void {
        setHeroImagesSaving(true);

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
            onSuccess: (page) => {
                const updatedSetting = page.props
                    .businessSetting as BusinessSetting;

                heroImageFileRefs.current = [null, null, null];
                heroImageRemoveFlags.current = [false, false, false];
                setHeroImagePreviews(updatedSetting.hero_images ?? []);
                setHeroImageErrors(['', '', '']);
                setHeroImagesChanged(false);
                setHeroImagesSaving(false);
            },
            onError: (errors) => {
                for (let i = 0; i < 3; i++) {
                    const heroKey = `hero_image_${i}`;

                    if (errors[heroKey]) {
                        const heroErrors = [...heroImageErrors];
                        heroErrors[i] = errors[heroKey];
                        setHeroImageErrors(heroErrors);
                    }
                }

                setHeroImagesSaving(false);
            },
            preserveScroll: true,
        });
    }

    function handleHeroImageChange(index: number, file: File | null) {
        heroImageRemoveFlags.current[index] = false;

        if (file) {
            if (!file.type.startsWith('image/')) {
                const errors = [...heroImageErrors];
                errors[index] = 'File harus berupa gambar.';
                setHeroImageErrors(errors);

                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                const errors = [...heroImageErrors];
                errors[index] = 'Ukuran gambar maksimal 5MB.';
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

        const data = new FormData();
        data.append('customer_theme', themeForm.data.customer_theme);
        data.append('_method', 'patch');

        router.visit(business.update.url(), {
            method: 'post',
            data: data as any,
            forceFormData: true,
            onSuccess: () => {
                themeForm.setDefaults(themeForm.data as any);
            },
            preserveScroll: true,
        });
    }

    function submitHours(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        const data = new FormData();
        data.append(
            'operational_start_time',
            hoursForm.data.operational_start_time,
        );
        data.append(
            'operational_end_time',
            hoursForm.data.operational_end_time,
        );
        data.append(
            'max_orders_per_day',
            String(hoursForm.data.max_orders_per_day),
        );
        data.append('_method', 'patch');

        router.visit(business.update.url(), {
            method: 'post',
            data: data as any,
            forceFormData: true,
            onSuccess: () => {
                hoursForm.setDefaults(hoursForm.data as any);
            },
            preserveScroll: true,
        });
    }

    function submitArea(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        const data = new FormData();
        data.append('business_lat', areaForm.data.business_lat);
        data.append('business_lng', areaForm.data.business_lng);
        data.append('business_address', areaForm.data.business_address);
        data.append('max_order_km', String(areaForm.data.max_order_km));
        data.append('_method', 'patch');

        router.visit(business.update.url(), {
            method: 'post',
            data: data as any,
            forceFormData: true,
            onSuccess: () => {
                areaForm.setDefaults(areaForm.data as any);
            },
            preserveScroll: true,
        });
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
