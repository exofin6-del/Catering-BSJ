<?php

namespace App\Http\Controllers\Order;

use App\Actions\Admin\Order\OrderAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Order\AcceptOrderRequest;
use App\Http\Requests\Order\OrderCalendarCapacityRequest;
use App\Http\Requests\Order\OrderCatalogRequest;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Requests\Order\UpdateOrderRequest;
use App\Http\Requests\Order\UpdateOrderStatusRequest;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderAction $orders,
    ) {}

    public function index(Request $request): Response
    {
        return Inertia::render('admin/orders/index', $this->pageProps($request));
    }

    public function export(Request $request): JsonResponse
    {
        $filters = $this->orders->normalizeIndexFilters($request->only([
            'event_date_from',
            'event_date_to',
            'payment_status',
            'payment_type',
            'per_page',
            'search',
            'sort_by',
            'sort_dir',
            'status',
        ]));
        $data = $this->orders->exportRows($filters);

        return response()->json([
            'data' => $data,
            'total' => count($data),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/orders/create', $this->commandProps());
    }

    public function catalog(OrderCatalogRequest $request): JsonResponse
    {
        return response()->json(
            $this->orders->commandCatalog($request->validated()),
        );
    }

    public function calendarCapacity(OrderCalendarCapacityRequest $request): JsonResponse
    {
        return response()->json(
            $this->orders->calendarCapacity($request->month()),
        );
    }

    public function store(StoreOrderRequest $request): RedirectResponse
    {
        $order = $this->orders->create(
            $request->validated(),
            $request->user()?->id,
            enforceLimits: false,
        );

        Inertia::flash([
            'toast' => [
                'type' => 'success',
                'message' => __('Order :code created.', ['code' => $order->order_code]),
            ],
            'receipt' => [
                'type' => 'order_created',
                'order' => $this->orders->serialize($order),
                'payment_id' => $order->payments->last()?->id,
            ],
        ]);

        return to_route('order.index');
    }

    public function show(Order $order): Response
    {
        return Inertia::render('admin/orders/show', [
            'order' => $this->orders->serialize($order),
        ]);
    }

    public function receipt(Order $order): Response
    {
        return Inertia::render('admin/orders/receipt', [
            'order' => $this->orders->serialize($order),
        ]);
    }

    public function edit(Order $order): Response
    {
        return Inertia::render('admin/orders/edit', [
            ...$this->commandProps($order),
            'order' => $this->orders->serialize($order),
        ]);
    }

    public function acceptPage(Order $order): Response
    {
        return Inertia::render('admin/orders/accept', [
            'order' => $this->orders->serialize($order),
        ]);
    }

    public function payPage(Order $order): Response
    {
        return Inertia::render('admin/orders/pay', [
            'order' => $this->orders->serialize($order),
        ]);
    }

    public function correction(Order $order): Response
    {
        return Inertia::render('admin/orders/edit', [
            ...$this->commandProps($order),
            'order' => $this->orders->serialize($order),
        ]);
    }

    public function update(UpdateOrderRequest $request, Order $order): RedirectResponse
    {
        $this->orders->update(
            $order,
            $request->validated(),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Order :code updated.', ['code' => $order->order_code]),
        ]);

        return to_route('order.index');
    }

    public function destroy(Order $order): RedirectResponse
    {
        $orderCode = $order->order_code;

        $this->orders->delete($order);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Order :code deleted.', ['code' => $orderCode]),
        ]);

        return to_route('order.index');
    }

    public function status(UpdateOrderStatusRequest $request, Order $order): RedirectResponse
    {
        $this->orders->updateStatus($order, $request->status());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Order status updated.')]);

        return to_route('order.index');
    }

    public function accept(AcceptOrderRequest $request, Order $order): RedirectResponse
    {
        $acceptedOrder = $this->orders->accept($order, $request->validated());
        $flash = [
            'toast' => [
                'type' => 'success',
                'message' => __('Order :code accepted.', ['code' => $acceptedOrder->order_code]),
            ],
        ];

        if ($request->recordsPayment()) {
            $flash['receipt'] = [
                'type' => 'payment_recorded',
                'order' => $this->orders->serialize($acceptedOrder),
                'payment_id' => $acceptedOrder->payments->last()?->id,
            ];
        }

        Inertia::flash($flash);

        return to_route('order.index');
    }

    /**
     * @return array{items: LengthAwarePaginator<int, array<string, mixed>>, activityItems: array<int, array<string, mixed>>, filters: array<string, mixed>, stats: array<string, int>, mode: string, order: null}
     */
    private function pageProps(Request $request): array
    {
        $filters = $this->orders->normalizeIndexFilters($request->only([
            'event_date_from',
            'event_date_to',
            'payment_status',
            'payment_type',
            'per_page',
            'search',
            'sort_by',
            'sort_dir',
            'status',
        ]));

        return [
            'items' => $this->orders->index($filters),
            'activityItems' => $this->orders->recentActivities(),
            'filters' => $filters,
            'stats' => $this->orders->stats(),
            'mode' => 'index',
            'order' => null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function commandProps(?Order $order = null): array
    {
        $catalog = $order instanceof Order
            ? $this->orders->initialCommandCatalog($order)
            : [
                'menuItems' => $this->orders->menuItemsForCommand(),
                'packages' => $this->orders->packagesForCommand(),
            ];

        return [
            'businessSetting' => $this->orders->businessSettingForCommand(),
            'menuItems' => $catalog['menuItems'],
            'packages' => $catalog['packages'],
        ];
    }
}
