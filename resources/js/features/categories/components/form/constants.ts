import {
    Apple,
    Banana,
    Beef,
    Beer,
    BriefcaseBusiness,
    CakeSlice,
    CalendarDays,
    Carrot,
    ChefHat,
    Citrus,
    Coffee,
    Cookie,
    CookingPot,
    Croissant,
    Crown,
    CupSoda,
    Donut,
    Drumstick,
    EggFried,
    Fish,
    Flame,
    ForkKnife,
    Gift,
    GlassWater,
    Grape,
    HeartHandshake,
    IceCreamBowl,
    IceCreamCone,
    Leaf,
    Martini,
    Milk,
    Package,
    Pizza,
    Popcorn,
    Salad,
    Sandwich,
    Soup,
    Sparkles,
    Star,
    Tags,
    Utensils,
    UtensilsCrossed,
    Users,
    Wine,
    SmilePlus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { CategoryType } from '@/types';

export const CATEGORY_FORM_ID = 'category-form';

export type CategoryTypeOption = {
    icon: LucideIcon;
    label: string;
    value: CategoryType;
};

export type CategoryIconOption = {
    icon: LucideIcon;
    keywords: string[];
    label: string;
    value: string;
};

export const categoryTypeOptions: CategoryTypeOption[] = [
    {
        icon: UtensilsCrossed,
        label: 'Menu',
        value: 'menu',
    },
    {
        icon: Package,
        label: 'Paket',
        value: 'paket',
    },
];

export const categoryIconOptions: CategoryIconOption[] = [
    {
        icon: SmilePlus,
        keywords: ['kategori', 'tag', 'label'],
        label: 'Tanpa ikon',
        value: '',
    },
    {
        icon: Utensils,
        keywords: ['menu', 'makan', 'catering'],
        label: 'Menu',
        value: 'utensils',
    },
    {
        icon: Package,
        keywords: ['paket', 'box', 'bundle'],
        label: 'Paket',
        value: 'package',
    },
    {
        icon: Coffee,
        keywords: ['kopi', 'minuman', 'drink'],
        label: 'Minuman',
        value: 'coffee',
    },
    {
        icon: CakeSlice,
        keywords: ['kue', 'dessert', 'manis'],
        label: 'Kue',
        value: 'cake-slice',
    },
    {
        icon: Soup,
        keywords: ['soup', 'kuah', 'hangat'],
        label: 'Sup',
        value: 'soup',
    },
    {
        icon: Sandwich,
        keywords: ['snack', 'roti', 'bekal'],
        label: 'Snack',
        value: 'sandwich',
    },
    {
        icon: Salad,
        keywords: ['sayur', 'healthy', 'segar'],
        label: 'Salad',
        value: 'salad',
    },
    {
        icon: Pizza,
        keywords: ['pizza', 'western', 'party'],
        label: 'Pizza',
        value: 'pizza',
    },
    {
        icon: Beef,
        keywords: ['daging', 'beef', 'protein'],
        label: 'Daging',
        value: 'beef',
    },
    {
        icon: Fish,
        keywords: ['ikan', 'seafood', 'laut'],
        label: 'Seafood',
        value: 'fish',
    },
    {
        icon: IceCreamBowl,
        keywords: ['es krim', 'dessert', 'dingin'],
        label: 'Dessert',
        value: 'ice-cream-bowl',
    },
    {
        icon: Cookie,
        keywords: ['cookies', 'kue kering', 'cemilan'],
        label: 'Cookies',
        value: 'cookie',
    },
    {
        icon: Apple,
        keywords: ['buah', 'fruit', 'sehat'],
        label: 'Buah',
        value: 'apple',
    },
    {
        icon: Banana,
        keywords: ['pisang', 'banana', 'buah'],
        label: 'Pisang',
        value: 'banana',
    },
    {
        icon: Grape,
        keywords: ['anggur', 'grape', 'buah'],
        label: 'Anggur',
        value: 'grape',
    },
    {
        icon: Citrus,
        keywords: ['jeruk', 'citrus', 'buah'],
        label: 'Jeruk',
        value: 'citrus',
    },
    {
        icon: Carrot,
        keywords: ['wortel', 'sayur', 'vegetable'],
        label: 'Sayuran',
        value: 'carrot',
    },
    {
        icon: EggFried,
        keywords: ['telur', 'egg', 'sarapan'],
        label: 'Telur',
        value: 'egg-fried',
    },
    {
        icon: Drumstick,
        keywords: ['ayam', 'chicken', 'protein'],
        label: 'Ayam',
        value: 'drumstick',
    },
    {
        icon: ForkKnife,
        keywords: ['makanan', 'food', 'hidangan'],
        label: 'Makanan',
        value: 'fork-knife',
    },
    {
        icon: ChefHat,
        keywords: ['koki', 'chef', 'masakan'],
        label: 'Koki',
        value: 'chef-hat',
    },
    {
        icon: Croissant,
        keywords: ['croissant', 'roti', 'bakery'],
        label: 'Roti',
        value: 'croissant',
    },
    {
        icon: CookingPot,
        keywords: ['nasi', 'masakan', 'rice'],
        label: 'Nasi',
        value: 'cooking-pot',
    },
    {
        icon: IceCreamCone,
        keywords: ['es krim', 'ice cream', 'dingin'],
        label: 'Es Krim',
        value: 'ice-cream-cone',
    },
    {
        icon: Donut,
        keywords: ['donat', 'donut', 'manis'],
        label: 'Donat',
        value: 'donut',
    },
    {
        icon: Popcorn,
        keywords: ['popcorn', 'cemilan', 'snack'],
        label: 'Popcorn',
        value: 'popcorn',
    },
    {
        icon: GlassWater,
        keywords: ['air', 'water', 'minuman'],
        label: 'Air Mineral',
        value: 'glass-water',
    },
    {
        icon: Milk,
        keywords: ['susu', 'milk', 'minuman'],
        label: 'Susu',
        value: 'milk',
    },
    {
        icon: Beer,
        keywords: ['bir', 'beer', 'minuman'],
        label: 'Bir',
        value: 'beer',
    },
    {
        icon: Wine,
        keywords: ['anggur', 'wine', 'minuman'],
        label: 'Wine',
        value: 'wine',
    },
    {
        icon: Martini,
        keywords: ['koktail', 'cocktail', 'minuman'],
        label: 'Koktail',
        value: 'martini',
    },
    {
        icon: Gift,
        keywords: ['hadiah', 'gift', 'hampers'],
        label: 'Hampers',
        value: 'gift',
    },
    {
        icon: BriefcaseBusiness,
        keywords: ['kantor', 'corporate', 'meeting'],
        label: 'Corporate',
        value: 'briefcase-business',
    },
    {
        icon: Users,
        keywords: ['tamu', 'keluarga', 'grup'],
        label: 'Grup',
        value: 'users',
    },
    {
        icon: CalendarDays,
        keywords: ['event', 'jadwal', 'tanggal'],
        label: 'Event',
        value: 'calendar-days',
    },
    {
        icon: HeartHandshake,
        keywords: ['wedding', 'acara', 'layanan'],
        label: 'Acara',
        value: 'heart-handshake',
    },
    {
        icon: Sparkles,
        keywords: ['premium', 'spesial', 'favorit'],
        label: 'Spesial',
        value: 'sparkles',
    },
    {
        icon: Leaf,
        keywords: ['vegetarian', 'organik', 'fresh'],
        label: 'Organik',
        value: 'leaf',
    },
    {
        icon: Flame,
        keywords: ['pedas', 'hot', 'promo'],
        label: 'Pedas',
        value: 'flame',
    },
    {
        icon: Star,
        keywords: ['rekomendasi', 'favorite', 'unggulan'],
        label: 'Unggulan',
        value: 'star',
    },
    {
        icon: Crown,
        keywords: ['vip', 'luxury', 'premium'],
        label: 'Premium',
        value: 'crown',
    },
];

const legacyCategoryIcons: Record<
    string,
    Pick<CategoryIconOption, 'icon' | 'keywords' | 'label'>
> = {
    briefcase: {
        icon: BriefcaseBusiness,
        keywords: ['kantor', 'corporate', 'meeting'],
        label: 'Corporate',
    },
    'chef-hat': {
        icon: ChefHat,
        keywords: ['koki', 'menu', 'catering'],
        label: 'Koki',
    },
    'cup-soda': {
        icon: CupSoda,
        keywords: ['minuman', 'drink'],
        label: 'Minuman',
    },
};

export function labelForCategoryType(type: CategoryType): string {
    return (
        categoryTypeOptions.find((option) => option.value === type)?.label ??
        'Menu'
    );
}

export function resolveCategoryIconOption(
    value?: string | null,
): CategoryIconOption {
    const iconValue = value?.trim() ?? '';
    const iconOption = categoryIconOptions.find(
        (option) => option.value === iconValue,
    );

    if (iconOption) {
        return iconOption;
    }

    const legacyIconOption = legacyCategoryIcons[iconValue];

    if (legacyIconOption) {
        return {
            ...legacyIconOption,
            value: iconValue,
        };
    }

    return {
        icon: Tags,
        keywords: [iconValue],
        label: iconValue || 'Tanpa ikon',
        value: iconValue,
    };
}
