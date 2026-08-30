import type {
    OrderBusinessSetting,
    OrderMenuItem,
    OrderPackage,
} from '@/types';
import type { CustomerTheme } from './customer-theme';

export type CustomerCatalogType = 'all' | 'menu_item' | 'package';

export type CustomerBusiness = {
    is_open: boolean;
    latitude: string | null;
    longitude: string | null;
    name: string;
    whatsapp_number: string | null;
    description: string | null;
    hero_images: string[];
};

export type CustomerCatalogItem =
    | { id: string; item: OrderMenuItem; type: 'menu_item' }
    | { id: string; item: OrderPackage; type: 'package' };

export type CustomerStorefrontProps = {
    business: CustomerBusiness;
    customerTheme: CustomerTheme;
    menuItems: OrderMenuItem[];
    packages: OrderPackage[];
};

export type CustomerCheckoutProps = CustomerStorefrontProps & {
    businessSetting?: OrderBusinessSetting | null;
    recaptchaSiteKey: string;
};
