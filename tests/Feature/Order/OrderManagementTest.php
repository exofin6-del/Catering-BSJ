<?php

namespace Tests\Feature\Order;

use App\Models\BusinessSetting;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Package;
use App\Models\PackageCategory;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Support\SessionKey;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OrderManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->fakeCloudinary();
        $this->withoutVite();
    }

    public function test_order_index_renders_with_stats_and_filters(): void
    {
        $user = User::factory()->create();

        $this->createOrder([
            'customer_name' => 'Budi Santoso',
            'order_code' => 'ORD-TEST-001',
            'status' => 'pending_confirmation',
        ]);
        $this->createOrder([
            'order_code' => 'ORD-TEST-002',
            'payment_status' => 'dp_paid',
            'status' => 'confirmed',
        ]);
        $this->createOrder([
            'order_code' => 'ORD-TEST-003',
            'payment_status' => 'paid',
            'status' => 'completed',
        ]);
        $this->createOrder([
            'order_code' => 'ORD-TEST-004',
            'status' => 'canceled',
        ]);

        $this
            ->actingAs($user)
            ->get(route('order.index', ['search' => 'Budi']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/orders/index')
                ->where('filters.search', 'Budi')
                ->has('items.data', 4)
                ->where('stats.pending_confirmation', 1)
                ->where('stats.confirmed', 1)
                ->where('stats.completed', 1)
                ->where('stats.canceled', 1)
                ->where('stats.dp_paid', 1)
                ->where('stats.paid', 1)
                ->has('activityItems', 4));
    }

    public function test_order_create_page_includes_active_catalog_items(): void
    {
        $user = User::factory()->create();
        $category = $this->createMenuCategory();

        $this->createMenuItem($category, 'Nasi Liwet', 'nasi-liwet');
        $this->createMenuItem($category, 'Menu Hidden', 'menu-hidden', isActive: false);

        $this
            ->actingAs($user)
            ->get(route('order.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/orders/create')
                ->has('menuItems', 1)
                ->where('menuItems.0.name', 'Nasi Liwet')
                ->has('packages', 0)
                ->has('businessSetting'));
    }

    public function test_order_calendar_capacity_returns_non_canceled_order_counts(): void
    {
        $user = User::factory()->create();
        $eventDate = now()->addMonth()->startOfMonth()->addDays(4);

        BusinessSetting::query()->create([
            'max_orders_per_day' => 3,
        ]);
        $this->createOrder([
            'event_date' => $eventDate->toDateString(),
            'status' => 'pending_confirmation',
        ]);
        $this->createOrder([
            'event_date' => $eventDate->toDateString(),
            'status' => 'completed',
        ]);
        $this->createOrder([
            'event_date' => $eventDate->toDateString(),
            'status' => 'canceled',
        ]);

        $this
            ->actingAs($user)
            ->getJson(route('order.calendar-capacity', [
                'month' => $eventDate->format('Y-m'),
            ]))
            ->assertOk()
            ->assertJsonPath('max_orders_per_day', 3)
            ->assertJsonPath("days.{$eventDate->toDateString()}", 2);
    }

    public function test_order_accept_page_renders_pending_order(): void
    {
        $user = User::factory()->create();
        $order = $this->createOrder([
            'order_code' => 'ORD-ACCEPT-001',
            'status' => 'pending_confirmation',
        ]);

        $this
            ->actingAs($user)
            ->get(route('order.acceptPage', $order))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/orders/accept')
                ->where('order.id', $order->id)
                ->where('order.order_code', 'ORD-ACCEPT-001')
                ->where('order.status', 'pending_confirmation'));
    }

    public function test_order_payment_page_renders_unpaid_order(): void
    {
        $user = User::factory()->create();
        $order = $this->createOrder([
            'order_code' => 'ORD-PAY-001',
            'payment_status' => 'unpaid',
            'status' => 'pending_confirmation',
        ]);

        $this
            ->actingAs($user)
            ->get(route('order.payPage', $order))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/orders/pay')
                ->where('order.id', $order->id)
                ->where('order.order_code', 'ORD-PAY-001')
                ->where('order.payment_status', 'unpaid'));
    }

    public function test_order_settlement_page_renders_confirmed_order(): void
    {
        $user = User::factory()->create();
        $order = $this->createOrder([
            'order_code' => 'ORD-SETTLE-001',
            'payment_status' => 'dp_paid',
            'remaining_amount' => 60000,
            'status' => 'confirmed',
            'total_price' => 100000,
        ]);
        $order->payments()->create([
            'amount' => 40000,
            'method' => 'transfer',
            'paid_at' => now(),
            'type' => 'dp',
        ]);

        $this
            ->actingAs($user)
            ->get(route('order.payments.create', $order))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/orders/settle')
                ->where('order.id', $order->id)
                ->where('order.order_code', 'ORD-SETTLE-001')
                ->where('order.payment_status', 'dp_paid')
                ->where('order.remaining_amount', '60000.00'));
    }

    public function test_order_receipt_page_renders_order_with_payments(): void
    {
        $user = User::factory()->create();
        $order = $this->createOrder([
            'order_code' => 'ORD-RECEIPT-001',
            'payment_status' => 'dp_paid',
            'remaining_amount' => 50000,
            'status' => 'confirmed',
            'total_price' => 100000,
        ]);
        $order->payments()->create([
            'amount' => 50000,
            'method' => 'transfer',
            'paid_at' => now(),
            'type' => 'dp',
        ]);

        $this
            ->actingAs($user)
            ->get(route('order.receipt', $order))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/orders/receipt')
                ->where('order.id', $order->id)
                ->where('order.order_code', 'ORD-RECEIPT-001')
                ->has('order.payments', 1)
                ->where('order.payments.0.amount', '50000.00'));
    }

    public function test_order_editability_depends_on_completion_status_instead_of_payment_status(): void
    {
        $user = User::factory()->create();
        $paidOrder = $this->createOrder([
            'payment_status' => 'paid',
            'status' => 'confirmed',
        ]);
        $completedOrder = $this->createOrder([
            'payment_status' => 'paid',
            'status' => 'completed',
        ]);

        $this
            ->actingAs($user)
            ->get(route('order.show', $paidOrder))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('order.can_edit', true));

        $this
            ->actingAs($user)
            ->get(route('order.show', $completedOrder))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('order.can_edit', false));
    }

    public function test_order_edit_page_includes_active_catalog_and_selected_inactive_items(): void
    {
        $user = User::factory()->create();
        $menuCategory = $this->createMenuCategory();
        $packageCategory = PackageCategory::query()->create([
            'is_active' => true,
            'name' => 'Paket Meeting',
            'slug' => 'paket-meeting',
            'sort_order' => 1,
        ]);
        $activeMenu = $this->createMenuItem(
            $menuCategory,
            'Menu Aktif',
            'menu-aktif',
        );
        $inactiveSelectedMenu = $this->createMenuItem(
            $menuCategory,
            'Menu Lama',
            'menu-lama',
            isActive: false,
        );
        $activePackage = Package::query()->create([
            'is_active' => true,
            'min_order' => 1,
            'name' => 'Paket Aktif',
            'package_category_id' => $packageCategory->id,
            'price' => 50000,
            'slug' => 'paket-aktif',
            'sort_order' => 1,
        ]);
        $inactiveSelectedPackage = Package::query()->create([
            'is_active' => false,
            'min_order' => 1,
            'name' => 'Paket Lama',
            'package_category_id' => $packageCategory->id,
            'price' => 60000,
            'slug' => 'paket-lama',
            'sort_order' => 2,
        ]);
        $order = $this->createOrder();
        $order->update([
            'dp_amount' => 50000,
            'payment_status' => 'dp_paid',
            'remaining_amount' => 50000,
        ]);
        $order->payments()->create([
            'amount' => 50000,
            'method' => 'transfer',
            'paid_at' => now(),
            'proof_image' => '/storage/payments/example/payment-proof.jpg',
            'type' => 'dp',
        ]);

        OrderItem::query()->create([
            'item_type' => 'menu_item',
            'menu_item_id' => $inactiveSelectedMenu->id,
            'name_snapshot' => $inactiveSelectedMenu->name,
            'order_id' => $order->id,
            'price_snapshot' => 25000,
            'qty' => 1,
            'subtotal' => 25000,
        ]);
        OrderItem::query()->create([
            'item_type' => 'package',
            'name_snapshot' => $inactiveSelectedPackage->name,
            'order_id' => $order->id,
            'package_id' => $inactiveSelectedPackage->id,
            'price_snapshot' => 60000,
            'qty' => 1,
            'subtotal' => 60000,
        ]);

        $this
            ->actingAs($user)
            ->get(route('order.edit', $order))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/orders/edit')
                ->has('menuItems', 2)
                ->where('menuItems.0.id', $activeMenu->id)
                ->where('menuItems.1.id', $inactiveSelectedMenu->id)
                ->has('packages', 2)
                ->where('packages.0.id', $activePackage->id)
                ->where('packages.1.id', $inactiveSelectedPackage->id)
                ->where('order.payment_status', 'dp_paid')
                ->has('order.payments', 1)
                ->where('order.payments.0.type', 'dp')
                ->where('order.payments.0.amount', '50000.00')
                ->where(
                    'order.payments.0.proof_image',
                    '/storage/payments/example/payment-proof.jpg',
                ));
    }

    public function test_order_store_creates_menu_item_order_with_backend_totals(): void
    {
        $user = User::factory()->create();
        $category = $this->createMenuCategory();
        $menuItem = $this->createMenuItem(
            category: $category,
            name: 'Ayam Bakar',
            slug: 'ayam-bakar',
            basePrice: 25000,
            promoPrice: 20000,
        );

        $this
            ->actingAs($user)
            ->post(route('order.store'), [
                ...$this->orderPayload(),
                'items' => [
                    [
                        'item_type' => 'menu_item',
                        'menu_item_id' => $menuItem->id,
                        'qty' => 2,
                    ],
                ],
            ])
            ->assertRedirect(route('order.index'))
            ->assertSessionHas(SessionKey::FLASH_DATA, fn (array $flash): bool => ($flash['toast']['type'] ?? null) === 'success'
                && str_starts_with((string) ($flash['toast']['message'] ?? ''), 'Order ORD-')
                && str_ends_with((string) ($flash['toast']['message'] ?? ''), ' created.'))
            ->assertSessionHasNoErrors();

        $order = Order::query()
            ->with('items')
            ->where('customer_name', 'Budi Santoso')
            ->firstOrFail();
        $item = $order->items->firstOrFail();

        $this->assertStringStartsWith('ORD-', $order->order_code);
        $this->assertSame('40000.00', $order->subtotal);
        $this->assertSame('40000.00', $order->total_price);
        $this->assertSame('full', $order->payment_type);
        $this->assertSame('confirmed', $order->status);
        $this->assertSame($user->id, $order->created_by_admin_id);
        $this->assertSame('Ayam Bakar', $item->name_snapshot);
        $this->assertSame('20000.00', $item->price_snapshot);
        $this->assertSame('40000.00', $item->subtotal);
    }

    public function test_order_store_rejects_an_event_date_in_the_past(): void
    {
        $user = User::factory()->create();
        $category = $this->createMenuCategory();
        $menuItem = $this->createMenuItem(
            category: $category,
            name: 'Ayam Bakar',
            slug: 'ayam-bakar-past-date',
        );

        $this
            ->actingAs($user)
            ->post(route('order.store'), [
                ...$this->orderPayload(),
                'event_date' => now()->subDay()->toDateString(),
                'items' => [
                    [
                        'item_type' => 'menu_item',
                        'menu_item_id' => $menuItem->id,
                        'qty' => 1,
                    ],
                ],
            ])
            ->assertSessionHasErrors('event_date');
    }

    public function test_order_store_rejects_a_date_at_daily_capacity(): void
    {
        $user = User::factory()->create();
        $category = $this->createMenuCategory();
        $menuItem = $this->createMenuItem(
            category: $category,
            name: 'Nasi Kapasitas',
            slug: 'nasi-kapasitas',
        );
        $eventDate = now()->addDays(5)->toDateString();

        BusinessSetting::query()->create(['max_orders_per_day' => 3]);

        foreach (range(1, 3) as $index) {
            $this->createOrder([
                'event_date' => $eventDate,
                'order_code' => "ORD-CAPACITY-{$index}",
            ]);
        }

        $this
            ->actingAs($user)
            ->post(route('order.store'), [
                ...$this->orderPayload(),
                'event_date' => $eventDate,
                'items' => [
                    [
                        'item_type' => 'menu_item',
                        'menu_item_id' => $menuItem->id,
                        'qty' => 1,
                    ],
                ],
            ])
            ->assertSessionHasErrors('event_date');
    }

    public function test_order_update_rejects_changing_the_event_to_a_past_date(): void
    {
        $order = $this->createOrder();

        $this
            ->actingAs(User::factory()->create())
            ->put(route('order.update', $order), [
                'event_date' => now()->subDay()->toDateString(),
            ])
            ->assertSessionHasErrors('event_date');
    }

    public function test_order_update_redirects_to_index_even_when_detail_redirect_is_requested(): void
    {
        $user = User::factory()->create();
        $order = $this->createOrder([
            'customer_name' => 'Budi Santoso',
        ]);

        $this
            ->actingAs($user)
            ->put(route('order.update', [
                'order' => $order,
                'redirect' => 'show',
            ]), [
                'customer_name' => 'Siti Aminah',
            ])
            ->assertRedirect(route('order.index'))
            ->assertSessionHas(SessionKey::FLASH_DATA, fn (array $flash): bool => ($flash['toast']['type'] ?? null) === 'success'
                && ($flash['toast']['message'] ?? null) === "Order {$order->order_code} updated.")
            ->assertSessionHasNoErrors();

        $this->assertSame('Siti Aminah', $order->refresh()->customer_name);
    }

    public function test_pending_order_can_be_canceled_and_settlement_can_be_recorded(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $order = $this->createOrder([
            'total_price' => 100000,
        ]);

        $this
            ->actingAs($user)
            ->patch(route('order.status', $order), ['status' => 'canceled'])
            ->assertRedirect(route('order.index'))
            ->assertSessionHasNoErrors();

        $this->assertSame('canceled', $order->refresh()->status);

        $paymentOrder = $this->createOrder([
            'status' => 'confirmed',
            'total_price' => 100000,
        ]);

        $this
            ->actingAs($user)
            ->from(route('order.payments.create', $paymentOrder))
            ->post(route('order.payments.store', $paymentOrder), [
                'amount' => 100000,
                'method' => 'transfer',
                'paid_at' => now()->toDateString(),
                'proof_image' => UploadedFile::fake()->image(
                    'bukti-pelunasan.jpg',
                    800,
                    600,
                ),
            ])
            ->assertRedirect(route('order.show', $paymentOrder))
            ->assertSessionHasNoErrors();

        $payment = Payment::query()
            ->where('order_id', $paymentOrder->id)
            ->firstOrFail();

        $this->assertSame('paid', $paymentOrder->refresh()->payment_status);
        $this->assertStringContainsString('res.cloudinary.com/test-cloud', $payment->proof_image);
        $this->assertNotNull($payment->cloudinary_public_id);
        $this->assertModelExists($payment);
    }

    public function test_settlement_requires_confirmed_order(): void
    {
        $user = User::factory()->create();
        $order = $this->createOrder([
            'status' => 'pending_confirmation',
            'total_price' => 100000,
        ]);

        $this
            ->actingAs($user)
            ->post(route('order.payments.store', $order), [
                'amount' => 100000,
                'method' => 'transfer',
                'paid_at' => now()->toDateString(),
            ])
            ->assertSessionHasErrors('status');

        $this->assertCount(0, $order->payments);
        $this->assertSame('unpaid', $order->refresh()->payment_status);
    }

    public function test_order_payment_delete_endpoint_is_not_available(): void
    {
        $user = User::factory()->create();
        $order = $this->createOrder([
            'payment_status' => 'paid',
            'remaining_amount' => 0,
            'status' => 'confirmed',
            'total_price' => 100000,
        ]);
        $payment = $order->payments()->create([
            'amount' => 100000,
            'method' => 'manual',
            'paid_at' => now(),
            'type' => 'full',
        ]);

        $this
            ->actingAs($user)
            ->delete(route('order.payments.store', $order)."/{$payment->id}")
            ->assertNotFound();

        $this->assertSame('paid', $order->refresh()->payment_status);
        $this->assertModelExists($payment);
    }

    public function test_order_cancel_requires_pending_unpaid_order_without_payment(): void
    {
        $user = User::factory()->create();
        $pendingPaidOrder = $this->createOrder([
            'payment_status' => 'dp_paid',
            'remaining_amount' => 50000,
            'status' => 'pending_confirmation',
            'total_price' => 100000,
        ]);
        $pendingPaidOrder->payments()->create([
            'amount' => 50000,
            'method' => 'transfer',
            'paid_at' => now(),
            'type' => 'dp',
        ]);
        $confirmedOrder = $this->createOrder([
            'payment_status' => 'unpaid',
            'status' => 'confirmed',
            'total_price' => 100000,
        ]);

        $this
            ->actingAs($user)
            ->patch(route('order.status', $pendingPaidOrder), ['status' => 'canceled'])
            ->assertSessionHasErrors('status');

        $this
            ->actingAs($user)
            ->patch(route('order.status', $confirmedOrder), ['status' => 'canceled'])
            ->assertSessionHasErrors('status');

        $this->assertSame('pending_confirmation', $pendingPaidOrder->refresh()->status);
        $this->assertSame('confirmed', $confirmedOrder->refresh()->status);
    }

    public function test_paid_confirmed_order_can_be_marked_completed_from_status_action(): void
    {
        $user = User::factory()->create();
        $order = $this->createOrder([
            'payment_status' => 'paid',
            'remaining_amount' => 0,
            'status' => 'confirmed',
            'total_price' => 100000,
        ]);
        $order->payments()->create([
            'amount' => 100000,
            'method' => 'transfer',
            'paid_at' => now(),
            'type' => 'full',
        ]);

        $this
            ->actingAs($user)
            ->patch(route('order.status', $order), ['status' => 'completed'])
            ->assertRedirect(route('order.index'))
            ->assertSessionHasNoErrors();

        $this->assertSame('completed', $order->refresh()->status);
    }

    public function test_order_completion_requires_paid_status_without_remaining_balance(): void
    {
        $user = User::factory()->create();
        $dpOrder = $this->createOrder([
            'payment_status' => 'dp_paid',
            'remaining_amount' => 50000,
            'status' => 'confirmed',
            'total_price' => 100000,
        ]);
        $paidWithRemainingOrder = $this->createOrder([
            'payment_status' => 'paid',
            'remaining_amount' => 1000,
            'status' => 'confirmed',
            'total_price' => 100000,
        ]);

        $this
            ->actingAs($user)
            ->patch(route('order.status', $dpOrder), ['status' => 'completed'])
            ->assertSessionHasErrors('status');

        $this
            ->actingAs($user)
            ->patch(route('order.status', $paidWithRemainingOrder), ['status' => 'completed'])
            ->assertSessionHasErrors('status');

        $this->assertSame('confirmed', $dpOrder->refresh()->status);
        $this->assertSame('confirmed', $paidWithRemainingOrder->refresh()->status);
    }

    public function test_pending_order_can_be_accepted_without_recording_payment(): void
    {
        $user = User::factory()->create();
        $order = $this->createOrder([
            'remaining_amount' => 0,
            'total_price' => 100000,
        ]);

        $this
            ->actingAs($user)
            ->post(route('order.accept', $order), [
                'record_payment' => false,
            ])
            ->assertRedirect(route('order.index'))
            ->assertSessionHasNoErrors();

        $order->refresh();

        $this->assertSame('confirmed', $order->status);
        $this->assertSame('unpaid', $order->payment_status);
        $this->assertSame('100000.00', $order->remaining_amount);
        $this->assertCount(0, $order->payments);
    }

    public function test_pending_dp_order_can_be_accepted_with_initial_payment(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $order = $this->createOrder([
            'dp_amount' => 50000,
            'payment_type' => 'dp',
            'remaining_amount' => 100000,
            'total_price' => 100000,
        ]);

        $this
            ->actingAs($user)
            ->post(route('order.accept', $order), [
                'record_payment' => true,
                'payment_amount' => 50000,
                'payment_method' => 'transfer',
                'payment_paid_at' => now()->toDateTimeString(),
                'proof_image' => UploadedFile::fake()->image('bukti-dp.jpg'),
            ])
            ->assertRedirect(route('order.index'))
            ->assertSessionHasNoErrors();

        $order->refresh();
        $payment = $order->payments()->firstOrFail();

        $this->assertSame('confirmed', $order->status);
        $this->assertSame('dp_paid', $order->payment_status);
        $this->assertSame('50000.00', $order->remaining_amount);
        $this->assertSame('dp', $payment->type);
        $this->assertSame('50000.00', $payment->amount);
        $this->assertNotNull($payment->proof_image);
        $this->assertStringContainsString('res.cloudinary.com/test-cloud', $payment->proof_image);
        $this->assertNotNull($payment->cloudinary_public_id);
    }

    public function test_order_acceptance_rejects_overpayment_and_non_pending_orders(): void
    {
        $user = User::factory()->create();
        $pendingOrder = $this->createOrder([
            'total_price' => 100000,
        ]);

        $this
            ->actingAs($user)
            ->post(route('order.accept', $pendingOrder), [
                'record_payment' => true,
                'payment_amount' => 100001,
                'payment_method' => 'cash',
                'payment_paid_at' => now()->toDateTimeString(),
            ])
            ->assertSessionHasErrors('payment_amount');

        $this->assertSame('pending_confirmation', $pendingOrder->refresh()->status);
        $this->assertCount(0, $pendingOrder->payments);

        $confirmedOrder = $this->createOrder([
            'status' => 'confirmed',
        ]);

        $this
            ->actingAs($user)
            ->post(route('order.accept', $confirmedOrder), [
                'record_payment' => false,
            ])
            ->assertSessionHasErrors('status');

        $this->assertSame('confirmed', $confirmedOrder->refresh()->status);
    }

    public function test_order_store_saves_one_payment_proof_image(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $category = $this->createMenuCategory();
        $menuItem = $this->createMenuItem(
            category: $category,
            name: 'Nasi Box',
            slug: 'nasi-box-payment-proof',
            basePrice: 25000,
        );

        $this
            ->actingAs($user)
            ->post(route('order.store'), [
                ...$this->orderPayload(),
                'items' => [
                    [
                        'item_type' => 'menu_item',
                        'menu_item_id' => $menuItem->id,
                        'qty' => 2,
                    ],
                ],
                'payment_amount' => 50000,
                'payment_method' => 'transfer',
                'payment_paid_at' => now()->toDateTimeString(),
                'proof_image' => UploadedFile::fake()->image(
                    'bukti-transfer.jpg',
                    800,
                    600,
                ),
            ])
            ->assertRedirect(route('order.index'))
            ->assertSessionHasNoErrors();

        $order = Order::query()
            ->where('customer_name', 'Budi Santoso')
            ->firstOrFail();
        $payment = Payment::query()
            ->where('order_id', $order->id)
            ->firstOrFail();

        $this->assertNotNull($payment->proof_image);
        $this->assertStringContainsString('res.cloudinary.com/test-cloud', $payment->proof_image);
        $this->assertNotNull($payment->cloudinary_public_id);
    }

    public function test_dp_order_store_with_full_payment_keeps_dp_and_settlement_history(): void
    {
        $user = User::factory()->create();
        $category = $this->createMenuCategory();
        $menuItem = $this->createMenuItem(
            category: $category,
            name: 'Paket Meeting',
            slug: 'paket-meeting-full-dp',
            basePrice: 100000,
        );

        $this
            ->actingAs($user)
            ->post(route('order.store'), [
                ...$this->orderPayload(),
                'items' => [
                    [
                        'item_type' => 'menu_item',
                        'menu_item_id' => $menuItem->id,
                        'qty' => 1,
                    ],
                ],
                'payment_amount' => 100000,
                'payment_method' => 'transfer',
                'payment_paid_at' => now()->toDateTimeString(),
                'payment_type' => 'dp',
            ])
            ->assertRedirect(route('order.index'))
            ->assertSessionHasNoErrors();

        $order = Order::query()
            ->where('customer_name', 'Budi Santoso')
            ->firstOrFail();

        $this->assertSame('dp', $order->payment_type);
        $this->assertSame('paid', $order->payment_status);
        $this->assertSame('0.00', $order->remaining_amount);
        $this->assertSame('50000.00', $order->dp_amount);
        $this->assertCount(2, $order->payments);
        $this->assertSame(
            ['dp', 'remaining'],
            $order->payments()->orderBy('id')->pluck('type')->all(),
        );
        $this->assertSame(
            ['50000.00', '50000.00'],
            $order->payments()->orderBy('id')->pluck('amount')->all(),
        );
    }

    public function test_order_store_rejects_non_image_payment_proof(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $category = $this->createMenuCategory();
        $menuItem = $this->createMenuItem(
            category: $category,
            name: 'Nasi Box',
            slug: 'nasi-box-invalid-proof',
        );

        $this
            ->actingAs($user)
            ->post(route('order.store'), [
                ...$this->orderPayload(),
                'items' => [
                    [
                        'item_type' => 'menu_item',
                        'menu_item_id' => $menuItem->id,
                        'qty' => 1,
                    ],
                ],
                'payment_amount' => 25000,
                'payment_method' => 'transfer',
                'payment_paid_at' => now()->toDateTimeString(),
                'proof_image' => UploadedFile::fake()->create(
                    'bukti-transfer.pdf',
                    100,
                    'application/pdf',
                ),
            ])
            ->assertSessionHasErrors('proof_image');

        $this->assertDatabaseCount('orders', 0);
        Storage::disk('public')->assertDirectoryEmpty('payments');
    }

    public function test_dp_order_can_be_settled_from_order_edit(): void
    {
        $user = User::factory()->create();
        $order = $this->createOrder([
            'dp_amount' => 50000,
            'payment_status' => 'dp_paid',
            'payment_type' => 'dp',
            'remaining_amount' => 50000,
            'status' => 'confirmed',
            'total_price' => 100000,
        ]);

        OrderItem::query()->create([
            'item_type' => 'menu_item',
            'name_snapshot' => 'Paket Acara',
            'order_id' => $order->id,
            'price_snapshot' => 100000,
            'qty' => 1,
            'subtotal' => 100000,
        ]);
        $order->payments()->create([
            'amount' => 50000,
            'method' => 'transfer',
            'paid_at' => now()->subDay(),
            'type' => 'dp',
        ]);

        $this
            ->actingAs($user)
            ->put(route('order.update', $order), [
                'payment_amount' => 50000,
                'payment_method' => 'transfer',
                'payment_paid_at' => now()->toDateTimeString(),
            ])
            ->assertRedirect(route('order.index'))
            ->assertSessionHasNoErrors();

        $order->refresh();
        $remainingPayment = $order->payments()
            ->where('type', 'remaining')
            ->firstOrFail();

        $this->assertSame('paid', $order->payment_status);
        $this->assertSame('0.00', $order->remaining_amount);
        $this->assertSame('50000.00', $order->payments()->where('type', 'dp')->value('amount'));
        $this->assertSame('50000.00', $remainingPayment->amount);
        $this->assertCount(2, $order->payments);
    }

    public function test_order_edit_can_record_final_payment_and_mark_order_completed(): void
    {
        $user = User::factory()->create();
        $order = $this->createOrder([
            'dp_amount' => 50000,
            'payment_status' => 'dp_paid',
            'payment_type' => 'dp',
            'remaining_amount' => 50000,
            'status' => 'confirmed',
            'total_price' => 100000,
        ]);

        $this->createOrderItem($order, 100000);
        $order->payments()->create([
            'amount' => 50000,
            'method' => 'transfer',
            'paid_at' => now()->subDay(),
            'type' => 'dp',
        ]);

        $this
            ->actingAs($user)
            ->put(route('order.update', $order), [
                'payment_amount' => 50000,
                'payment_method' => 'transfer',
                'payment_paid_at' => now()->toDateTimeString(),
                'status' => 'completed',
            ])
            ->assertRedirect(route('order.index'))
            ->assertSessionHasNoErrors();

        $order->refresh();

        $this->assertSame('completed', $order->status);
        $this->assertSame('paid', $order->payment_status);
        $this->assertSame('0.00', $order->remaining_amount);
    }

    public function test_order_edit_rejects_completed_status_when_payment_is_not_settled(): void
    {
        $user = User::factory()->create();
        $order = $this->createOrder([
            'dp_amount' => 50000,
            'payment_status' => 'dp_paid',
            'payment_type' => 'dp',
            'remaining_amount' => 50000,
            'status' => 'confirmed',
            'total_price' => 100000,
        ]);

        $this->createOrderItem($order, 100000);
        $order->payments()->create([
            'amount' => 50000,
            'method' => 'transfer',
            'paid_at' => now()->subDay(),
            'type' => 'dp',
        ]);

        $this
            ->actingAs($user)
            ->put(route('order.update', $order), [
                'status' => 'completed',
            ])
            ->assertSessionHasErrors('status');

        $order->refresh();

        $this->assertSame('confirmed', $order->status);
        $this->assertSame('dp_paid', $order->payment_status);
        $this->assertSame('50000.00', $order->remaining_amount);
    }

    public function test_dp_payment_totals_recalculate_when_order_items_change(): void
    {
        $user = User::factory()->create();
        $category = $this->createMenuCategory();
        $menuItem = $this->createMenuItem(
            category: $category,
            name: 'Paket Acara Besar',
            slug: 'paket-acara-besar',
            basePrice: 120000,
        );
        $order = $this->createOrder([
            'dp_amount' => 50000,
            'payment_status' => 'dp_paid',
            'payment_type' => 'dp',
            'remaining_amount' => 50000,
            'status' => 'confirmed',
            'total_price' => 100000,
        ]);

        $order->payments()->create([
            'amount' => 50000,
            'method' => 'transfer',
            'paid_at' => now()->subDay(),
            'type' => 'dp',
        ]);

        $this
            ->actingAs($user)
            ->put(route('order.update', $order), [
                'items' => [
                    [
                        'item_type' => 'menu_item',
                        'menu_item_id' => $menuItem->id,
                        'qty' => 1,
                    ],
                ],
                'payment_amount' => 70000,
                'payment_method' => 'transfer',
                'payment_paid_at' => now()->toDateTimeString(),
            ])
            ->assertRedirect(route('order.index'))
            ->assertSessionHasNoErrors();

        $order->refresh();

        $this->assertSame('120000.00', $order->total_price);
        $this->assertSame(120000, $order->payments()->sum('amount'));
        $this->assertSame('0.00', $order->remaining_amount);
        $this->assertSame('paid', $order->payment_status);
    }

    public function test_full_payment_edit_recalculates_totals_with_manual_payments(): void
    {
        $user = User::factory()->create();
        $category = $this->createMenuCategory();
        $menuItem = $this->createMenuItem(
            category: $category,
            name: 'Menu Tambahan',
            slug: 'menu-tambahan',
            basePrice: 120000,
        );
        $order = $this->createOrder([
            'payment_status' => 'dp_paid',
            'payment_type' => 'full',
            'remaining_amount' => 50000,
            'status' => 'confirmed',
            'total_price' => 100000,
        ]);

        $order->payments()->create([
            'amount' => 50000,
            'method' => 'manual',
            'paid_at' => now()->subDay(),
            'type' => 'full',
        ]);

        $this
            ->actingAs($user)
            ->put(route('order.update', $order), [
                'items' => [
                    [
                        'item_type' => 'menu_item',
                        'menu_item_id' => $menuItem->id,
                        'qty' => 1,
                    ],
                ],
                'payment_amount' => 70000,
                'payment_method' => 'transfer',
                'payment_paid_at' => now()->toDateTimeString(),
            ])
            ->assertRedirect(route('order.index'))
            ->assertSessionHasNoErrors();

        $order->refresh();

        $this->assertSame('120000.00', $order->total_price);
        $this->assertSame(120000, $order->payments()->sum('amount'));
        $this->assertSame('0.00', $order->remaining_amount);
        $this->assertSame('paid', $order->payment_status);
    }

    private function createMenuCategory(): MenuCategory
    {
        return MenuCategory::query()->create([
            'is_active' => true,
            'name' => 'Nasi Box',
            'slug' => 'nasi-box',
            'sort_order' => 1,
        ]);
    }

    private function createMenuItem(
        MenuCategory $category,
        string $name,
        string $slug,
        int $basePrice = 25000,
        ?int $promoPrice = null,
        bool $isActive = true,
    ): MenuItem {
        return MenuItem::query()->create([
            'base_price' => $basePrice,
            'is_active' => $isActive,
            'menu_category_id' => $category->id,
            'min_order' => 1,
            'name' => $name,
            'promo_price' => $promoPrice,
            'slug' => $slug,
            'sort_order' => 1,
        ]);
    }

    private function createOrderItem(Order $order, int $price): OrderItem
    {
        return OrderItem::query()->create([
            'item_type' => 'menu_item',
            'name_snapshot' => 'Paket Acara',
            'order_id' => $order->id,
            'price_snapshot' => $price,
            'qty' => 1,
            'subtotal' => $price,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function orderPayload(): array
    {
        return [
            'address_name' => 'Rumah pagar hitam',
            'customer_name' => 'Budi Santoso',
            'event_address' => 'Jl. Mawar No. 1',
            'event_date' => now()->addDay()->toDateString(),
            'event_name' => 'Rapat kantor',
            'event_time' => '09:00',
            'latitude' => null,
            'longitude' => null,
            'notes' => 'Tanpa sambal.',
            'payment_type' => 'full',
            'phone' => '081234567890',
            'status' => 'confirmed',
        ];
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createOrder(array $overrides = []): Order
    {
        return Order::query()->create([
            'customer_name' => 'Budi Santoso',
            'event_address' => 'Jl. Mawar No. 1',
            'event_date' => now()->addDay()->toDateString(),
            'event_name' => 'Rapat kantor',
            'event_time' => '09:00',
            'order_code' => 'ORD-'.fake()->unique()->numberBetween(1000, 9999),
            'payment_status' => 'unpaid',
            'payment_type' => 'full',
            'phone' => '081234567890',
            'status' => 'pending_confirmation',
            'subtotal' => 100000,
            'total_price' => 100000,
            ...$overrides,
        ]);
    }
}
