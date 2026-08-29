<?php

namespace App\Http\Controllers\Order;

use App\Actions\Admin\Order\OrderAction;
use App\Actions\Admin\Order\OrderPaymentAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StoreOrderPaymentRequest;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class OrderPaymentController extends Controller
{
    public function __construct(
        private readonly OrderPaymentAction $payments,
        private readonly OrderAction $orders,
    ) {}

    public function create(Order $order): Response
    {
        return Inertia::render('admin/orders/settle', [
            'order' => $this->orders->serialize($order),
        ]);
    }

    public function store(StoreOrderPaymentRequest $request, Order $order): RedirectResponse
    {
        $payment = $this->payments->create(
            order: $order,
            data: $request->validated(),
        );

        Inertia::flash([
            'toast' => ['type' => 'success', 'message' => __('Payment recorded.')],
            'receipt' => [
                'type' => 'payment_recorded',
                'order' => $this->orders->serialize($order->refresh()),
                'payment_id' => $payment->id,
            ],
        ]);

        return to_route('order.show', $order);
    }
}
