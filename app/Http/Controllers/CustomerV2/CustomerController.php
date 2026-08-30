<?php

namespace App\Http\Controllers\CustomerV2;

use App\Actions\Admin\Order\OrderAction;
use App\Actions\Admin\Paket\PackageAction;
use App\Actions\Customer\StorefrontCheckoutAction;
use App\CustomerTheme;
use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StorefrontCheckoutRequest;
use App\Models\BusinessSetting;
use App\Models\Customer;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Package;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class CustomerController extends Controller
{
    public function __construct(
        private readonly OrderAction $orders,
        private readonly PackageAction $packages,
        private readonly StorefrontCheckoutAction $checkout,
    ) {}

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

    public function privacyPolicy(): Response
    {
        return Inertia::render('customersV2/privacy-policy', [
            ...$this->storefrontProps(),
        ]);
    }

    public function termsOfService(): Response
    {
        return Inertia::render('customersV2/terms-of-service', [
            ...$this->storefrontProps(),
        ]);
    }

    public function checkout(): Response
    {
        $businessSetting = BusinessSetting::query()->first() ?? new BusinessSetting;

        return Inertia::render('customersV2/checkout', [
            ...$this->storefrontProps($businessSetting),
            'businessSetting' => $this->orders->businessSettingForCommand($businessSetting),
            'recaptchaSiteKey' => (string) config('recaptcha.site_key'),
        ]);
    }

    public function orders(Request $request): Response
    {
        /** @var Customer $customer */
        $customer = $request->user();

        $orders = Order::query()
            ->where('customer_id', $customer->id)
            ->with(['items:id,order_id,item_type,name_snapshot,qty,subtotal'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Order $order): array => [
                'id' => $order->id,
                'order_code' => $order->order_code,
                'customer_name' => $order->customer_name,
                'event_name' => $order->event_name,
                'event_date' => $order->event_date?->format('Y-m-d'),
                'event_time' => $order->event_time ? substr((string) $order->event_time, 0, 5) : null,
                'event_address' => $order->event_address,
                'status' => $order->status,
                'payment_status' => $order->payment_status,
                'payment_type' => $order->payment_type,
                'total_price' => $order->total_price,
                'dp_amount' => $order->dp_amount,
                'remaining_amount' => $order->remaining_amount,
                'notes' => $order->notes,
                'created_at' => $order->created_at?->toIso8601String(),
                'items' => $order->items->map(fn (OrderItem $item): array => [
                    'id' => $item->id,
                    'item_type' => $item->item_type,
                    'name_snapshot' => $item->name_snapshot,
                    'qty' => $item->qty,
                    'subtotal' => $item->subtotal,
                ])->values()->all(),
            ])
            ->values()
            ->all();

        return Inertia::render('customersV2/orders', [
            ...$this->storefrontProps(),
            'orders' => $orders,
        ]);
    }

    public function storeCheckout(StorefrontCheckoutRequest $request): SymfonyResponse
    {
        /** @var Customer|null $customer */
        $customer = $request->user();
        $checkout = $this->checkout->execute($request->validated(), $customer?->id, $request->ip());
        $order = $checkout['order'];

        Inertia::flash([
            'toast' => [
                'type' => 'success',
                'message' => __('Pesanan :code berhasil dibuat.', [
                    'code' => $order->order_code,
                ]),
            ],
        ]);

        return redirect()->route('customerV2.orders');
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
            'menuItems' => fn (): array => $this->orders->menuItemsForCommand(),
            'packages' => fn (): array => $this->orders->packagesForCommand(),
        ];
    }
}
