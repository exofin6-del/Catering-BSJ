<?php

namespace App\Http\Controllers\CustomerV2;

use App\Actions\Order\OrderAction;
use App\Actions\Order\StorefrontCheckoutAction;
use App\Http\Requests\Order\StorefrontCheckoutRequest;
use App\Actions\Paket\PackageAction;
use App\CustomerTheme;
use App\Http\Controllers\Controller;
use App\Models\BusinessSetting;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\MenuItem;
use App\Models\Package;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class CustomerController extends Controller
{
    public function __construct(
        private readonly OrderAction $orders,
        private readonly PackageAction $packages,
        private readonly StorefrontCheckoutAction $checkout,
    ) {
    }

    public function __invoke(): Response
    {
        return Inertia::render('customersV2/index', $this->storefrontProps());
    }

    public function menuDetail(MenuItem $menuItem): Response
    {
        $menuItem->loadMissing([
            'category:id,name',
            'primaryImage:id,menu_item_id,image_url',
            'images:id,menu_item_id,image_url,is_primary,sort_order',
        ]);

        // expose relation under `menu_category` to match frontend TypeScript shape
        $menuItem->setRelation('menu_category', $menuItem->category);

        return Inertia::render('customersV2/detail', [
            ...$this->storefrontProps(),
            'itemType' => 'menu_item',
            'item' => $menuItem,
            'back' => url('/'),
        ]);
    }

    public function packageDetail(Package $package): Response
    {
        return Inertia::render('customersV2/detail', [
            ...$this->storefrontProps(),
            'itemType' => 'package',
            'item' => $this->packages->serialize($package),
            'back' => url('/'),
        ]);
    }

    public function search(Request $request): Response
    {
        return Inertia::render('customersV2/search', [
            ...$this->storefrontProps(),
            'query' => (string) $request->query('q', ''),
        ]);
    }

    public function menuCatalog(): Response
    {
        return Inertia::render('customersV2/menu', [
            ...$this->storefrontProps(),
        ]);
    }

    public function packageCatalog(): Response
    {
        return Inertia::render('customersV2/package', [
            ...$this->storefrontProps(),
        ]);
    }

    public function info(): Response
    {
        return Inertia::render('customersV2/info', [
            ...$this->storefrontProps(),
        ]);
    }

    public function checkout(): Response
    {
        $businessSetting = BusinessSetting::query()->first() ?? new BusinessSetting;

        return Inertia::render('customersV2/checkout', [
            ...$this->storefrontProps($businessSetting),
            'businessSetting' => $this->orders->businessSettingForCommand($businessSetting),
        ]);
    }

    public function storeCheckout(StorefrontCheckoutRequest $request): SymfonyResponse
    {
        $checkout = $this->checkout->execute($request->validated());
        $order = $checkout['order'];

        Inertia::flash([
            'toast' => [
                'type' => 'success',
                'message' => __('Pesanan :code berhasil dibuat. Lanjutkan konfirmasi di WhatsApp.', [
                    'code' => $order->order_code,
                ]),
            ],
            'storefront_checkout' => [
                'order_code' => $order->order_code,
                'whatsapp_url' => $checkout['whatsapp_url'],
            ],
        ]);

        return Inertia::location($checkout['whatsapp_url']);
    }



    /**
     * @return array<string, mixed>
     */
    private function storefrontProps(?BusinessSetting $businessSetting = null): array
    {
        $businessSetting ??= BusinessSetting::query()->first() ?? new BusinessSetting;

        return [
            'customerTheme' => $businessSetting->customer_theme ?: CustomerTheme::Minimal->value,
            'business' => [
                'is_open' => (bool) $businessSetting->is_open,
                'latitude' => $businessSetting->business_lat,
                'longitude' => $businessSetting->business_lng,
                'name' => $businessSetting->business_name ?: config('app.name'),
                'whatsapp_number' => $businessSetting->normalizedWhatsAppNumber(),
                'description' => $businessSetting->description,
                'hero_images' => $businessSetting->hero_images ?? [],
            ],
            'menuItems' => fn(): array => $this->orders->menuItemsForCommand(),
            'packages' => fn(): array => $this->orders->packagesForCommand(),
        ];
    }
}
