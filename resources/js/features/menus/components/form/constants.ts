import { BadgeDollarSign, Info, Megaphone } from 'lucide-react';

import type { FormWizardStepDefinition } from '@/components/shared/form-wizard';
import type { MenuFormValues } from '../../schema/menu-form-schema';
import type { MenuFormStep } from './types';

export const FORM_ID = 'menu-form';
export const MAX_MENU_IMAGES = 5;
export const NO_CATEGORY_VALUE = 'none';

export const menuFormSteps: FormWizardStepDefinition<MenuFormStep>[] = [
    {
        id: 'basic',
        title: 'Info menu',
        description: 'Nama, kategori, minimal order, dan deskripsi.',
        icon: Info,
    },
    {
        id: 'pricing',
        title: 'Harga',
        description: 'Harga jual dan promo.',
        icon: BadgeDollarSign,
    },
    {
        id: 'publish',
        title: 'Publikasi',
        description: 'Gambar, status, dan rekomendasi.',
        icon: Megaphone,
    },
];

export const menuFormStepFields: Record<
    MenuFormStep,
    (keyof MenuFormValues)[]
> = {
    basic: ['name', 'categoryId', 'categoryName', 'minOrder', 'description'],
    pricing: ['basePrice', 'promoPrice'],
    publish: ['isActive', 'isRecommended'],
};
