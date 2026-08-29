import {
    Boxes,
    ChevronDown,
    ImageIcon,
    Minus,
    Plus,
    Utensils,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export type OrderSummaryQuantityControl = {
    ariaInvalid?: boolean;
    ariaLabel?: string;
    detailAction?: ReactNode;
    layout?: 'default' | 'right-stacked';
    max?: number;
    min?: number;
    onDecrease: () => void;
    onIncrease: () => void;
    onValueCommit?: (value: string) => void;
    onValueChange: (value: string) => void;
    subtotal: ReactNode;
    subtotalDetail?: ReactNode;
    value: string;
};

export type OrderSummaryItemData = {
    action?: ReactNode;
    badge?: ReactNode;
    description?: ReactNode;
    details?: {
        content: ReactNode;
        label: string;
    };
    footer?: ReactNode;
    id: string;
    image?: string | null;
    imageAlt?: string;
    meta?: ReactNode;
    metaClassName?: string;
    name: string;
    quantity?: ReactNode;
    quantityControl?: OrderSummaryQuantityControl;
    total?: ReactNode;
    unitPrice?: ReactNode;
};

export type OrderPackageDetailItemData = {
    id: number | string;
    image?: string | null;
    name: string;
    price: ReactNode;
};

type OrderSummaryListVariant = 'compact' | 'framed' | 'plain';

type OrderItemPickerOptionContentProps = {
    badges?: ReactNode;
    categoryName?: string | null;
    image?: string | null;
    minOrder: number;
    name: string;
    originalPrice?: string | null;
    price: string;
    type: 'menu' | 'package';
};

export function OrderSummaryBadge({ children }: { children: ReactNode }) {
    return (
        <Badge
            variant="secondary"
            className="h-5 w-fit rounded-sm px-1.5 text-[10px] font-semibold"
        >
            {children}
        </Badge>
    );
}

export function OrderPackageDetailList({
    className,
    items,
}: {
    className?: string;
    items: OrderPackageDetailItemData[];
}) {
    return (
        <div
            className={cn(
                'mt-2 grid gap-1 border-t border-border/60 pt-2',
                className,
            )}
        >
            {items.map((item) => (
                <div
                    key={item.id}
                    className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 py-0.5 text-[11px]"
                >
                    <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/50 text-muted-foreground ring-1 ring-border/50">
                        {item.image ? (
                            <img
                                src={item.image}
                                alt=""
                                className="size-full object-cover"
                                loading="lazy"
                            />
                        ) : (
                            <ImageIcon className="size-3.5" />
                        )}
                    </span>
                    <span className="min-w-0 truncate font-medium text-foreground">
                        {item.name}
                    </span>
                    <span className="shrink-0 text-muted-foreground tabular-nums">
                        {item.price}
                    </span>
                </div>
            ))}
        </div>
    );
}

export function OrderSummaryList({
    className,
    items,
    variant = 'framed',
}: {
    className?: string;
    items: OrderSummaryItemData[];
    variant?: OrderSummaryListVariant;
}) {
    return (
        <div
            className={cn(
                variant === 'framed'
                    ? 'divide-y overflow-hidden rounded-lg border bg-background'
                    : variant === 'compact'
                      ? 'grid gap-3'
                      : 'grid gap-4',
                className,
            )}
        >
            {items.map((item) => (
                <OrderSummaryItem key={item.id} item={item} variant={variant} />
            ))}
        </div>
    );
}

function OrderSummaryItem({
    item,
    variant,
}: {
    item: OrderSummaryItemData;
    variant: OrderSummaryListVariant;
}) {
    if (variant === 'compact') {
        return <CompactOrderSummaryItem item={item} />;
    }

    if (item.quantityControl?.layout === 'right-stacked') {
        return <RightStackedOrderSummaryItem item={item} variant={variant} />;
    }

    const content = (
        <article
            className={cn(
                'grid min-w-0 grid-cols-[auto_minmax(0,1fr)]',
                variant === 'framed' && 'gap-x-3 gap-y-2 p-3',
                variant === 'plain' && 'gap-x-3 gap-y-2 py-1',
            )}
        >
            <OrderSummaryImage
                alt={item.imageAlt ?? item.name}
                src={item.image}
                variant={variant}
            />

            <div className="relative min-w-0">
                {item.details ? (
                    <CollapsibleTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="group absolute top-0 right-0 size-7 shrink-0"
                            aria-label={item.details.label}
                        >
                            <ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
                        </Button>
                    </CollapsibleTrigger>
                ) : item.action ? (
                    <div className="absolute top-0 right-0 flex shrink-0 items-center gap-1">
                        {item.action}
                    </div>
                ) : null}

                <div
                    className={cn(
                        'grid min-w-0 gap-0.5',
                        (item.action || item.details) && 'pr-9',
                    )}
                >
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <h3 className="line-clamp-1 min-w-0 text-sm leading-tight font-semibold text-foreground">
                            {item.name}
                        </h3>
                        {item.badge}
                    </div>

                    {item.description ? (
                        <div className="line-clamp-1 text-xs leading-tight text-muted-foreground">
                            {item.description}
                        </div>
                    ) : null}

                    {item.meta ? (
                        <div
                            className={cn(
                                'min-w-0 text-xs leading-tight text-muted-foreground',
                                item.metaClassName,
                            )}
                        >
                            {item.meta}
                        </div>
                    ) : null}
                </div>

                {item.quantityControl ? (
                    <OrderSummaryQuantityEditor
                        control={item.quantityControl}
                    />
                ) : (
                    <div className="mt-2 flex min-h-7 min-w-0 items-center justify-between gap-3">
                        <div className="min-w-0 text-xs text-muted-foreground">
                            {item.quantity ? (
                                <span className="font-semibold text-foreground">
                                    {item.quantity}
                                </span>
                            ) : null}
                            {item.quantity && item.unitPrice ? ' x ' : null}
                            {item.unitPrice}
                        </div>
                        {item.total ? (
                            <div className="shrink-0 text-xs font-semibold text-foreground tabular-nums">
                                {item.total}
                            </div>
                        ) : null}
                    </div>
                )}
            </div>

            {item.footer ? (
                <div className="col-span-2">{item.footer}</div>
            ) : null}

            {item.details ? (
                <CollapsibleContent className="col-span-2">
                    {item.details.content}
                </CollapsibleContent>
            ) : null}
        </article>
    );

    if (!item.details) {
        return content;
    }

    return <Collapsible>{content}</Collapsible>;
}

function RightStackedOrderSummaryItem({
    item,
    variant,
}: {
    item: OrderSummaryItemData;
    variant: OrderSummaryListVariant;
}) {
    const quantityControl = item.quantityControl;

    if (!quantityControl) {
        return null;
    }

    const content = (
        <article
            className={cn(
                'grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 gap-y-2',
                variant === 'framed' && 'p-3',
                variant === 'plain' && 'py-2',
            )}
        >
            <div className="row-span-2 self-center">
                <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/60 text-muted-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                    {item.image ? (
                        <img
                            src={item.image}
                            alt={item.imageAlt ?? item.name}
                            className="size-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <ImageIcon className="size-6" />
                    )}
                </div>
            </div>

            <div className="grid min-w-0 gap-0.5 self-start">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <h3 className="line-clamp-1 min-w-0 text-sm leading-tight font-semibold text-foreground">
                        {item.name}
                    </h3>
                    {item.badge}
                </div>

                {item.description ? (
                    <div className="line-clamp-1 text-xs leading-tight text-muted-foreground">
                        {item.description}
                    </div>
                ) : null}

                {item.meta ? (
                    <div
                        className={cn(
                            'min-w-0 text-xs leading-tight text-muted-foreground',
                            item.metaClassName,
                        )}
                    >
                        {item.meta}
                    </div>
                ) : null}
            </div>

            <div className="flex justify-end self-start">
                {item.details ? (
                    <CollapsibleTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="group -mt-1 -mr-1 size-7 shrink-0"
                            aria-label={item.details.label}
                        >
                            <ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
                        </Button>
                    </CollapsibleTrigger>
                ) : item.action ? (
                    item.action
                ) : null}
            </div>

            <div className="col-start-2 col-end-4 flex min-w-0 items-center justify-between gap-3">
                <OrderSummaryQuantityEditor control={quantityControl} />

                <div className="grid shrink-0 justify-items-end gap-0.5 text-right">
                    <div className="text-sm font-bold whitespace-nowrap text-foreground tabular-nums">
                        {quantityControl.subtotal}
                    </div>
                    {quantityControl.subtotalDetail ? (
                        <div className="text-[11px] leading-none font-medium tracking-[0.01em] whitespace-nowrap text-muted-foreground tabular-nums">
                            {quantityControl.subtotalDetail}
                        </div>
                    ) : null}
                </div>
            </div>

            {item.footer ? (
                <div className="col-span-3">{item.footer}</div>
            ) : null}

            {item.details ? (
                <CollapsibleContent className="col-span-3">
                    {item.details.content}
                </CollapsibleContent>
            ) : null}
        </article>
    );

    if (!item.details) {
        return content;
    }

    return <Collapsible>{content}</Collapsible>;
}

function CompactOrderSummaryItem({ item }: { item: OrderSummaryItemData }) {
    const content = (
        <article className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-1">
            <div className="row-span-2 self-center">
                <OrderSummaryImage
                    alt={item.imageAlt ?? item.name}
                    src={item.image}
                    variant="compact"
                />
            </div>

            <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-1.5">
                    <h3 className="line-clamp-1 min-w-0 text-sm leading-tight font-semibold text-foreground">
                        {item.name}
                    </h3>
                    {item.badge}
                </div>

                {item.description ? (
                    <div className="mt-0.5 line-clamp-1 text-[11px] leading-tight text-muted-foreground">
                        {item.description}
                    </div>
                ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-1 self-start">
                {item.details ? (
                    <CollapsibleTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="group -mt-1 -mr-1 size-7 shrink-0"
                            aria-label={item.details.label}
                        >
                            <ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
                        </Button>
                    </CollapsibleTrigger>
                ) : item.action ? (
                    item.action
                ) : null}
            </div>

            {item.meta || item.quantity || item.unitPrice || item.total ? (
                <div className="col-start-2 col-end-4 flex min-w-0 items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-1 text-[11px] leading-none text-muted-foreground">
                        {item.meta ? (
                            <span className="min-w-0 truncate">
                                {item.meta}
                            </span>
                        ) : null}
                        {item.meta && (item.quantity || item.unitPrice) ? (
                            <span className="shrink-0" aria-hidden="true">
                                |
                            </span>
                        ) : null}
                        {item.quantity ? (
                            <span className="shrink-0 font-semibold text-foreground">
                                {item.quantity}
                            </span>
                        ) : null}
                        {item.quantity && item.unitPrice ? (
                            <span className="shrink-0" aria-hidden="true">
                                ×
                            </span>
                        ) : null}
                        {item.unitPrice ? (
                            <span className="shrink-0">{item.unitPrice}</span>
                        ) : null}
                    </div>

                    {item.total ? (
                        <div className="shrink-0 text-right text-xs leading-none font-semibold whitespace-nowrap text-foreground tabular-nums">
                            {item.total}
                        </div>
                    ) : null}
                </div>
            ) : null}

            {item.footer ? (
                <div className="col-span-3">{item.footer}</div>
            ) : null}

            {item.details ? (
                <CollapsibleContent className="col-span-3">
                    {item.details.content}
                </CollapsibleContent>
            ) : null}
        </article>
    );

    if (!item.details) {
        return content;
    }

    return <Collapsible>{content}</Collapsible>;
}

function OrderSummaryQuantityEditor({
    control,
}: {
    control: OrderSummaryQuantityControl;
}) {
    const min = control.min ?? 1;
    const max = control.max;
    const quantity = numericQuantity(control.value, min);
    const useConfirmQuantityStyle = control.layout === 'right-stacked';
    const quantityEditor = (
        <ButtonGroup
            orientation="horizontal"
            className={cn(
                'shrink-0 overflow-hidden',
                useConfirmQuantityStyle
                    ? 'h-8 rounded-full border border-border/80 bg-background p-0.5 text-foreground shadow-xs ring-1 ring-border/30'
                    : 'h-7 rounded-lg border bg-background text-foreground',
            )}
        >
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                    'size-7',
                    useConfirmQuantityStyle ? 'rounded-full' : 'rounded-none',
                )}
                disabled={quantity <= min}
                onClick={control.onDecrease}
                aria-label="Kurangi jumlah"
            >
                <Minus className="size-3.5" />
            </Button>

            <input
                aria-invalid={control.ariaInvalid}
                aria-label={control.ariaLabel ?? 'Jumlah'}
                className={cn(
                    'h-7 w-10 bg-transparent px-0 text-center text-xs font-semibold tabular-nums outline-none [-moz-appearance:textfield] focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
                    useConfirmQuantityStyle ? 'border-0' : 'border-x',
                )}
                inputMode="numeric"
                max={max}
                min={min}
                step={1}
                type="number"
                value={control.value}
                onFocus={(event) => event.currentTarget.select()}
                onChange={(event) => control.onValueChange(event.target.value)}
                onBlur={() =>
                    control.onValueCommit?.(
                        normalizeQuantity(control.value, min, max),
                    )
                }
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        event.currentTarget.blur();
                    }
                }}
            />

            <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                    'size-7',
                    useConfirmQuantityStyle ? 'rounded-full' : 'rounded-none',
                )}
                disabled={max !== undefined && quantity >= max}
                onClick={control.onIncrease}
                aria-label="Tambah jumlah"
            >
                <Plus className="size-3.5" />
            </Button>
        </ButtonGroup>
    );

    if (control.layout === 'right-stacked') {
        return (
            <div className="flex items-center gap-1 whitespace-nowrap">
                {quantityEditor}
                {control.detailAction}
            </div>
        );
    }

    return (
        <div className="mt-2 flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1">
                {quantityEditor}
                {control.detailAction}
            </div>

            <div className="shrink-0 text-right text-xs font-semibold whitespace-nowrap text-foreground tabular-nums">
                {control.subtotal}
            </div>
        </div>
    );
}

export function OrderSummaryTotals({
    subtotal,
    total,
}: {
    itemCount: number;
    subtotal: ReactNode;
    total: ReactNode;
}) {
    return (
        <div className="grid gap-2 border-t pt-3 text-sm">
            <div className="flex min-w-0 items-center justify-between gap-3 text-muted-foreground">
                <span>Subtotal</span>
                <span className="shrink-0 font-medium text-foreground tabular-nums">
                    {subtotal}
                </span>
            </div>
            <div className="flex min-w-0 items-center justify-between gap-3">
                <span className="font-semibold">Total</span>
                <span className="shrink-0 text-lg font-bold text-foreground tabular-nums">
                    {total}
                </span>
            </div>
        </div>
    );
}

export function OrderItemPickerOptionContent({
    badges,
    categoryName,
    image,
    minOrder,
    name,
    originalPrice,
    price,
    type,
}: OrderItemPickerOptionContentProps) {
    const Icon = type === 'package' ? Boxes : Utensils;

    return (
        <div className="grid w-full min-w-0 grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted/30">
                {image ? (
                    <img
                        src={image}
                        alt=""
                        className="size-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <Icon className="size-6 text-muted-foreground" />
                )}
            </div>

            <div className="grid min-w-0 gap-1">
                <span className="line-clamp-1 min-w-0 text-sm font-semibold text-foreground">
                    {name}
                </span>

                <span className="line-clamp-1 text-xs text-muted-foreground">
                    {categoryName || (type === 'package' ? 'Paket' : 'Menu')}
                    {' · '}Min. {minOrder}
                </span>

                <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                    <span className="text-sm font-semibold whitespace-nowrap text-foreground tabular-nums">
                        {price}
                    </span>
                    {originalPrice ? (
                        <span className="text-[11px] whitespace-nowrap text-muted-foreground tabular-nums line-through">
                            {originalPrice}
                        </span>
                    ) : null}
                    {badges}
                </span>
            </div>
        </div>
    );
}

function OrderSummaryImage({
    alt,
    src,
    variant,
}: {
    alt: string;
    src?: string | null;
    variant: OrderSummaryListVariant;
}) {
    const className =
        variant === 'compact'
            ? 'size-11 rounded-lg border border-border/60 bg-muted/30'
            : 'size-14 rounded-md sm:size-16';

    if (src) {
        return (
            <img
                src={src}
                alt={alt}
                className={cn(className, 'object-cover')}
                loading="lazy"
            />
        );
    }

    return (
        <span
            className={cn(
                className,
                'flex items-center justify-center bg-muted/50 text-muted-foreground',
            )}
        >
            <ImageIcon
                className={variant === 'compact' ? 'size-4' : 'size-5'}
            />
        </span>
    );
}

function numericQuantity(value: string, fallback: number): number {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue) && parsedValue > 0
        ? parsedValue
        : fallback;
}

function normalizeQuantity(
    value: string,
    minimum: number,
    maximum?: number,
): string {
    const parsedValue = Number(value);

    if (!Number.isFinite(parsedValue)) {
        return String(minimum);
    }

    const normalized = Math.max(minimum, Math.floor(parsedValue));

    return String(
        maximum === undefined ? normalized : Math.min(maximum, normalized),
    );
}
