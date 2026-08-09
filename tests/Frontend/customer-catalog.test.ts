import assert from 'node:assert/strict';
import test from 'node:test';
import {
    customerCartItemKey,
    customerCartPackageContents,
    customerCatalogCategories,
    customerCatalogPriceSummary,
    customerCatalogPreviewLimits,
    customerRecommendationSections,
    filterCustomerCatalog,
} from '../../resources/js/features/customers/utils/customer-catalog.ts';
import { customerNavigationHrefAtViewport } from '../../resources/js/features/customers/utils/customer-navigation.ts';

const items = [
    {
        id: 'package-1',
        type: 'package' as const,
        item: {
            id: 1,
            name: 'Paket Meeting',
            price: '50000',
            items: [],
            package_category: { id: 1, name: 'Acara Kantor' },
        },
    },
    {
        id: 'menu-1',
        type: 'menu_item' as const,
        item: {
            id: 1,
            name: 'Nasi Ayam Bakar',
            base_price: '25000',
            menu_category: { id: 2, name: 'Nasi Box' },
        },
    },
];

test('customer catalog initially shows four packages and four menu items', () => {
    assert.equal(customerCatalogPreviewLimits.package, 4);
    assert.equal(customerCatalogPreviewLimits.menu_item, 4);
});

test('customer catalog price summaries stay consistent across catalog views', () => {
    assert.deepEqual(customerCatalogPriceSummary(items[0]), {
        activePrice: 50000,
        discountPercent: 0,
        originalPrice: null,
        startsFrom: false,
    });
    assert.deepEqual(customerCatalogPriceSummary(items[1]), {
        activePrice: 25000,
        discountPercent: 0,
        originalPrice: null,
        startsFrom: false,
    });
});

test('customer catalog price summaries expose menu discounts', () => {
    const discountedMenu = {
        ...items[1],
        item: {
            ...items[1].item,
            promo_price: '20000',
        },
    };

    assert.deepEqual(customerCatalogPriceSummary(discountedMenu), {
        activePrice: 20000,
        discountPercent: 20,
        originalPrice: 25000,
        startsFrom: false,
    });
});

test('customer catalog price summaries expose package discounts', () => {
    const discountedPackage = {
        ...items[0],
        item: {
            ...items[0].item,
            price: '40000',
            items: [
                {
                    id: 1,
                    item_prices: [],
                    menu_item_id: 1,
                    name: 'Paket nasi',
                    package_price: '40000',
                    menu_item: {
                        id: 1,
                        name: 'Nasi box',
                        base_price: '50000',
                    },
                },
            ],
        },
    };

    assert.deepEqual(customerCatalogPriceSummary(discountedPackage), {
        activePrice: 40000,
        discountPercent: 20,
        originalPrice: 50000,
        startsFrom: false,
    });
});

test('customer catalog filters by type, category, and normalized search', () => {
    assert.deepEqual(
        filterCustomerCatalog(items, 'menu_item', 'Nasi Box', 'AYAM').map(
            (item) => item.id,
        ),
        ['menu-1'],
    );
    assert.deepEqual(
        filterCustomerCatalog(items, 'all', 'all', 'kantor').map(
            (item) => item.id,
        ),
        ['package-1'],
    );
});

test('customer catalog categories follow the selected catalog type', () => {
    assert.deepEqual(customerCatalogCategories(items, 'package'), [
        'Acara Kantor',
    ]);
    assert.deepEqual(customerCatalogCategories(items, 'all'), [
        'Acara Kantor',
        'Nasi Box',
    ]);
});

test('cart key is stable when package selections arrive in another order', () => {
    const baseItem = {
        item_type: 'package' as const,
        menu_item_id: '',
        package_id: '9',
        qty: '1',
    };
    const firstKey = customerCartItemKey({
        ...baseItem,
        selected_items: [
            { package_item_id: '2', menu_item_id: '8' },
            { package_item_id: '1', menu_item_id: '4' },
        ],
    });
    const secondKey = customerCartItemKey({
        ...baseItem,
        selected_items: [
            { package_item_id: '1', menu_item_id: '4' },
            { package_item_id: '2', menu_item_id: '8' },
        ],
    });

    assert.equal(firstKey, secondKey);
});

test('cart package contents use the selected choice and fixed menu items', () => {
    const menuPackage = {
        id: 9,
        name: 'Paket Rapat',
        price: '50000',
        items: [
            {
                id: 10,
                name: 'Nasi',
                item_prices: [
                    {
                        id: 1,
                        menu_item_id: 101,
                        package_price: '20000',
                        is_recommended: true,
                        menu_item: {
                            id: 101,
                            name: 'Nasi Putih',
                            primary_image: '/nasi-putih.jpg',
                        },
                    },
                    {
                        id: 2,
                        menu_item_id: 102,
                        package_price: '22000',
                        menu_item: {
                            id: 102,
                            name: 'Nasi Liwet',
                            primary_image: '/nasi-liwet.jpg',
                        },
                    },
                ],
            },
            {
                id: 20,
                name: 'Minuman',
                item_prices: [],
                menu_item_id: 201,
                package_price: '8000',
                menu_item: {
                    id: 201,
                    name: 'Es Teh',
                    primary_image: '/es-teh.jpg',
                },
            },
        ],
    };
    const contents = customerCartPackageContents(
        {
            item_type: 'package',
            menu_item_id: '',
            package_id: '9',
            qty: '10',
            selected_items: [{ package_item_id: '10', menu_item_id: '102' }],
        },
        menuPackage,
    );

    assert.deepEqual(contents, [
        {
            id: '10:102',
            image: '/nasi-liwet.jpg',
            name: 'Nasi Liwet',
            price: 22000,
        },
        {
            id: '20:201',
            image: '/es-teh.jpg',
            name: 'Es Teh',
            price: 8000,
        },
    ]);
});

test('cart package contents fall back to the recommended choice', () => {
    const contents = customerCartPackageContents(
        {
            item_type: 'package',
            menu_item_id: '',
            package_id: '9',
            qty: '10',
            selected_items: [],
        },
        {
            id: 9,
            name: 'Paket Rapat',
            price: '50000',
            items: [
                {
                    id: 10,
                    name: 'Nasi',
                    item_prices: [
                        {
                            id: 1,
                            menu_item_id: 101,
                            package_price: '20000',
                            is_recommended: true,
                            menu_item: {
                                id: 101,
                                name: 'Nasi Putih',
                            },
                        },
                        {
                            id: 2,
                            menu_item_id: 102,
                            package_price: '22000',
                            menu_item: {
                                id: 102,
                                name: 'Nasi Liwet',
                            },
                        },
                    ],
                },
            ],
        },
    );

    assert.deepEqual(contents, [
        {
            id: '10:101',
            image: null,
            name: 'Nasi Putih',
            price: 20000,
        },
    ]);
});

test('recommendations put the current item type first and prioritize its category', () => {
    const recommendationItems = [
        ...items,
        {
            id: 'package-2',
            type: 'package' as const,
            item: {
                id: 2,
                name: 'Paket Keluarga',
                price: '70000',
                items: [],
                package_category: { id: 1, name: 'Acara Kantor' },
            },
        },
        {
            id: 'package-3',
            type: 'package' as const,
            item: {
                id: 3,
                name: 'Paket Ulang Tahun',
                price: '80000',
                items: [],
                is_recommended: true,
                package_category: { id: 3, name: 'Pesta' },
            },
        },
    ];

    const sections = customerRecommendationSections(
        recommendationItems,
        'package',
        1,
    );

    assert.deepEqual(
        sections.map((section) => section.type),
        ['package', 'menu_item'],
    );
    assert.deepEqual(
        sections[0].items.map((entry) => entry.id),
        ['package-2', 'package-3'],
    );
    assert.equal(
        sections[0].items.some((entry) => entry.id === 'package-1'),
        false,
    );
});

test('menu recommendations put related packages after similar menus', () => {
    const relatedPackage = {
        id: 'package-9',
        type: 'package' as const,
        item: {
            id: 9,
            name: 'Paket Ayam',
            price: '60000',
            package_category: { id: 1, name: 'Paket Acara' },
            items: [
                {
                    id: 1,
                    item_prices: [],
                    menu_item_id: 1,
                    name: 'Menu utama',
                },
            ],
        },
    };
    const sections = customerRecommendationSections(
        [...items, relatedPackage],
        'menu_item',
        1,
    );

    assert.deepEqual(
        sections.map((section) => section.type),
        ['menu_item', 'package'],
    );
    assert.equal(sections[1].items[0].id, 'package-9');
});

test('customer navigation follows the latest section crossing the header anchor', () => {
    assert.equal(
        customerNavigationHrefAtViewport([
            { href: '#beranda', top: -600 },
            { href: '#tentang', top: -120 },
            { href: '#katalog', top: 94 },
            { href: '#lokasi', top: 760 },
        ]),
        '#katalog',
    );
    assert.equal(
        customerNavigationHrefAtViewport([
            { href: '#beranda', top: 120 },
            { href: '#tentang', top: 820 },
            { href: '#katalog', top: 1480 },
            { href: '#lokasi', top: 2100 },
        ]),
        '#beranda',
    );
});
