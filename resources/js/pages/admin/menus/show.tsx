import { Head } from '@inertiajs/react';

import { MenuDetailView } from '@/features/menus/components/menu-detail-view';
import { menuDisplayDataFromItem } from '@/features/menus/utils/menu-format';
import { resolveMenuPrice } from '@/features/menus/utils/menu-price';
import { dashboard } from '@/routes';
import menu from '@/routes/menu';
import type { MenuItem } from '@/types';

export default function MenuShow({ item }: { item: MenuItem }) {
    const display = menuDisplayDataFromItem(item);
    const price = resolveMenuPrice(item);
    const categoryName = item.menu_category?.name ?? 'Tanpa kategori';

    return (
        <>
            <Head title={item.name ? `Detail ${item.name}` : 'Detail Menu'} />

            <div className="@container/main flex flex-1 flex-col py-4 md:py-6">
                <div className="flex w-full flex-col gap-4 px-4 md:gap-5 lg:px-6">
                    <MenuDetailView
                        categoryName={categoryName}
                        display={display}
                        layoutMode="grid"
                        price={price}
                        showThumbnails={false}
                    />
                </div>
            </div>
        </>
    );
}

MenuShow.layout = ({ item }: { item: MenuItem }) => {
    const itemId = item.id;

    return {
        title: 'Detail Menu',
        back: {
            label: 'Kembali ke Menu',
            href: menu.index(),
        },
        action:
            itemId !== undefined
                ? {
                      label: 'Edit',
                      href: menu.edit(itemId),
                      icon: 'pencil' as const,
                  }
                : undefined,
        breadcrumbs: [
            {
                title: 'Dashboard',
                href: dashboard(),
            },
            {
                title: 'Menu',
                href: menu.index(),
            },
            {
                title: 'Detail',
                href: menu.index(),
            },
        ],
    };
};
