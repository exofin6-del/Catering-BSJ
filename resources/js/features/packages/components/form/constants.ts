import { Info, Megaphone, PackagePlus } from 'lucide-react';

import type { FormWizardStepDefinition } from '@/components/shared/form-wizard';
import type { PackageDetailsFormValues } from '../../schema/package-form-schema';
import type { PackageFormStep } from './types';

export const PACKAGE_FORM_ID = 'package-form';
export const MAX_PACKAGE_IMAGES = 5;

export const packageFormSteps: FormWizardStepDefinition<PackageFormStep>[] = [
    {
        id: 'information',
        title: 'Info paket',
        description: 'Nama, kategori, dan minimum order.',
        icon: Info,
    },
    {
        id: 'components',
        title: 'Komponen',
        description: 'Item tetap dan pilihan paket.',
        icon: PackagePlus,
    },
    {
        id: 'publication',
        title: 'Publikasi',
        description: 'Gambar, status, dan rekomendasi.',
        icon: Megaphone,
    },
];

export const packageFormStepFields: Record<
    Exclude<PackageFormStep, 'preview'>,
    (keyof PackageDetailsFormValues)[]
> = {
    components: [],
    information: [
        'name',
        'packageCategoryId',
        'packageCategoryName',
        'minOrder',
        'description',
    ],
    publication: ['isActive', 'isRecommended'],
};
