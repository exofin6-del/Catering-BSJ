import { Head } from '@inertiajs/react';
import { useRef, useState } from 'react';

import Heading from '@/components/shared/heading';
import { BusinessHoursSettingsCard } from '@/features/settings/components/business-hours-settings-card';
import { BusinessInfoSettingsCard } from '@/features/settings/components/business-info-settings-card';
import { BusinessLocationCommand } from '@/features/settings/components/business-location-command';
import { BusinessServiceAreaSettingsCard } from '@/features/settings/components/business-service-area-settings-card';
import { CustomerHeroImagesSettingsCard } from '@/features/settings/components/customer-hero-images-settings-card';
import { CustomerThemeSettingsCard } from '@/features/settings/components/customer-theme-settings-card';
import { useBusinessSettings } from '@/features/settings/hooks/use-business-settings';
import type { BusinessSetting } from '@/features/settings/types/business-setting';
import business from '@/routes/business';

export default function BusinessPage({
    businessSetting,
}: {
    businessSetting: BusinessSetting;
}) {
    const settings = useBusinessSettings(businessSetting);
    const [isLocationCommandOpen, setIsLocationCommandOpen] = useState(false);
    const lastDialogClosedAt = useRef<number | null>(null);

    function handleLocationOpenChange(nextOpen: boolean) {
        if (!nextOpen) {
            lastDialogClosedAt.current = Date.now();
            setIsLocationCommandOpen(false);

            return;
        }

        if (
            lastDialogClosedAt.current &&
            Date.now() - lastDialogClosedAt.current < 350
        ) {
            return;
        }

        setIsLocationCommandOpen(true);
    }

    return (
        <>
            <Head title="Pengaturan bisnis" />
            <div className="min-w-0 space-y-8">
                <Heading
                    variant="small"
                    title="Pengaturan bisnis"
                    description="Atur kontak, kapasitas, jam operasional, dan area layanan catering."
                />
                <div className="space-y-6">
                    <BusinessInfoSettingsCard
                        businessSetting={businessSetting}
                        settings={settings}
                    />
                    <CustomerHeroImagesSettingsCard
                        businessSetting={businessSetting}
                        settings={settings}
                    />
                    <CustomerThemeSettingsCard settings={settings} />
                    <BusinessHoursSettingsCard settings={settings} />
                    <BusinessServiceAreaSettingsCard
                        settings={settings}
                        setIsLocationCommandOpen={setIsLocationCommandOpen}
                    />
                    <BusinessLocationCommand
                        open={isLocationCommandOpen}
                        onOpenChange={handleLocationOpenChange}
                        selectedLatitude={
                            settings.areaForm.data.business_lat || null
                        }
                        selectedLongitude={
                            settings.areaForm.data.business_lng || null
                        }
                        selectedAddress={
                            settings.areaForm.data.business_address || null
                        }
                        radiusKm={settings.radiusKm}
                        onRadiusChange={(km) => {
                            settings.areaForm.setData('max_order_km', km);
                        }}
                        onLocationSelect={(loc) => {
                            settings.areaForm.setData(
                                'business_lat',
                                loc.latitude,
                            );
                            settings.areaForm.setData(
                                'business_lng',
                                loc.longitude,
                            );
                            settings.areaForm.setData(
                                'business_address',
                                loc.address,
                            );
                        }}
                    />
                </div>
            </div>
        </>
    );
}

BusinessPage.layout = {
    title: 'Pengaturan',
    breadcrumbs: [{ title: 'Pengaturan Bisnis', href: business.edit() }],
};
