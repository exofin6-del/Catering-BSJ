import { Settings2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from '@/components/ui/input-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { PackageMenuItem } from '@/types';

import type { PackagePriceMode } from '../../../../types/package-types';
import { packagePriceForMode } from '../../../../utils/package-form-values';
import {
    formatPackagePrice,
    hasMenuItemPromo,
    menuItemPromoPrice,
    packageDiscountPercentage,
    priceNumber,
} from '../../../../utils/package-price';

export function ComponentPriceControl({
    inputId,
    menuItem,
    packagePrice,
    priceMode,
    onCustomPriceChange,
    onPriceModeChange,
}: {
    inputId: string;
    menuItem: PackageMenuItem | null;
    packagePrice: string;
    priceMode: PackagePriceMode;
    onCustomPriceChange: (value: string) => void;
    onPriceModeChange: (value: PackagePriceMode) => void;
}) {
    const hasPromo = hasMenuItemPromo(menuItem);
    const selectedPriceMode =
        priceMode === 'promo' && !hasPromo ? 'normal' : priceMode;
    const selectedPrice = packagePriceForMode(
        menuItem,
        selectedPriceMode,
        packagePrice,
    );
    const selectedPriceModeLabel = priceModeLabel(selectedPriceMode);
    const discountPercent = packageDiscountPercentage(
        menuItem?.base_price,
        selectedPrice,
    );
    const priceTooHigh =
        selectedPriceMode === 'custom' &&
        priceNumber(packagePrice) > priceNumber(menuItem?.base_price);

    function handlePriceModeValueChange(value: string): void {
        if (value === '') {
            return;
        }

        onPriceModeChange(value as PackagePriceMode);
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!menuItem}
                    className="h-8 w-[7.25rem] max-w-full shrink-0 justify-between gap-1.5 bg-muted/45 px-2 text-xs shadow-none hover:bg-muted"
                    aria-label="Atur harga komponen"
                >
                    <Settings2 className="size-3 text-muted-foreground/80" />
                    <span className="grid min-w-0 flex-1 justify-items-end leading-tight">
                        {discountPercent > 0 ? (
                            <span className="max-w-full truncate text-[10px] font-medium text-muted-foreground line-through">
                                {formatPackagePrice(menuItem?.base_price)}
                            </span>
                        ) : null}
                        <span className="max-w-full truncate font-semibold text-foreground tabular-nums">
                            {formatPackagePrice(selectedPrice)}
                        </span>
                    </span>
                    <span className="sr-only">{selectedPriceModeLabel}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72" forceMount>
                <DropdownMenuLabel className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-muted-foreground">
                        Harga komponen
                    </span>
                    <span className="rounded-md bg-muted px-2 py-1 font-medium text-muted-foreground">
                        {selectedPriceModeLabel}
                    </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="grid gap-3 p-1">
                    <div className="grid gap-1.5">
                        <p className="text-[11px] font-medium text-muted-foreground">
                            Sumber harga
                        </p>
                        <ToggleGroup
                            type="single"
                            variant="default"
                            size="sm"
                            value={selectedPriceMode}
                            className="grid min-w-0 grid-cols-3 gap-1 rounded-md bg-muted/60 p-1"
                            onValueChange={handlePriceModeValueChange}
                        >
                            <ToggleGroupItem
                                value="normal"
                                className="h-8 min-w-0 rounded-sm px-2 text-xs data-[state=on]:bg-background data-[state=on]:shadow-xs"
                                aria-label={`Harga normal ${formatPackagePrice(menuItem?.base_price)}`}
                            >
                                Normal
                            </ToggleGroupItem>
                            <ToggleGroupItem
                                value="promo"
                                disabled={!hasPromo}
                                className="h-8 min-w-0 rounded-sm px-2 text-xs data-[state=on]:bg-background data-[state=on]:shadow-xs"
                                aria-label={`Harga promo ${formatPackagePrice(menuItemPromoPrice(menuItem) || menuItem?.base_price)}`}
                            >
                                Promo
                            </ToggleGroupItem>
                            <ToggleGroupItem
                                value="custom"
                                className="h-8 min-w-0 rounded-sm px-2 text-xs data-[state=on]:bg-background data-[state=on]:shadow-xs"
                                aria-label="Harga custom"
                            >
                                Custom
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>

                    {selectedPriceMode === 'custom' ? (
                        <div className="grid gap-1.5">
                            <label
                                htmlFor={inputId}
                                className="text-[11px] font-medium text-muted-foreground"
                            >
                                Harga custom
                            </label>
                            <InputGroup className="h-8 bg-background">
                                <InputGroupAddon
                                    align="inline-start"
                                    className="px-2 text-xs"
                                >
                                    <InputGroupText>Rp</InputGroupText>
                                </InputGroupAddon>
                                <InputGroupInput
                                    id={inputId}
                                    value={packagePrice}
                                    inputMode="numeric"
                                    placeholder="0"
                                    className="h-8 text-right text-xs font-semibold tabular-nums"
                                    onChange={(event) =>
                                        onCustomPriceChange(
                                            event.target.value.replace(
                                                /[^0-9]/g,
                                                '',
                                            ),
                                        )
                                    }
                                />
                            </InputGroup>
                        </div>
                    ) : null}

                    {priceTooHigh ? (
                        <p className="text-xs text-destructive">
                            Harga paket tidak boleh melebihi harga dasar menu.
                        </p>
                    ) : null}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function priceModeLabel(priceMode: PackagePriceMode): string {
    if (priceMode === 'custom') {
        return 'Custom';
    }

    if (priceMode === 'promo') {
        return 'Promo';
    }

    return 'Normal';
}
