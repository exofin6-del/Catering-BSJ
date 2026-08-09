'use client';

import { ImageIcon } from 'lucide-react';
import {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { ReactNode } from 'react';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import type { CarouselApi } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

export type DetailGalleryImage = {
    alt: string;
    id: string;
    isPrimary?: boolean;
    url: string;
};

export function DetailGalleryLayout({
    children,
    asideFooter,
    className,
    fallbackLabel = 'Belum ada gambar',
    galleryAction,
    images,
    layoutMode = 'grid',
    overlay,
    showThumbnails = false,
    thumbnailPosition = 'side',
}: {
    children: ReactNode;
    asideFooter?: ReactNode;
    className?: string;
    fallbackLabel?: string;
    galleryAction?: ReactNode;
    images: DetailGalleryImage[];
    layoutMode?: 'grid' | 'stack';
    overlay?: ReactNode;
    showThumbnails?: boolean;
    thumbnailPosition?: 'bottom' | 'side';
}) {
    const galleryLabelId = useId();
    const galleryColumnRef = useRef<HTMLDivElement>(null);
    const [desktopGalleryHeight, setDesktopGalleryHeight] = useState<
        number | undefined
    >();

    const initialImageIndex = Math.max(
        images.findIndex((image) => image.isPrimary),
        0,
    );

    const [activeImageId, setActiveImageId] = useState<string | null>(
        images[initialImageIndex]?.id ?? null,
    );

    const [carouselApi, setCarouselApi] = useState<CarouselApi>();

    const hasMultipleImages = images.length > 1;
    const shouldShowThumbnails = showThumbnails && hasMultipleImages;
    const shouldFillThumbnailRail = shouldShowThumbnails && images.length >= 4;

    const activeImage =
        images.find((image) => image.id === activeImageId) ??
        images.find((image) => image.isPrimary) ??
        images[0] ??
        null;

    const activeImageIndex = activeImage
        ? images.findIndex((image) => image.id === activeImage.id)
        : -1;

    const carouselOptions = useMemo(
        () => ({
            align: 'center' as const,
            loop: false,
            startIndex: initialImageIndex,
        }),
        [initialImageIndex],
    );

    useEffect(() => {
        if (!carouselApi) {
            return;
        }

        const syncActiveImage = () => {
            const selectedImage = images[carouselApi.selectedScrollSnap()];

            if (selectedImage) {
                setActiveImageId(selectedImage.id);
            }
        };

        carouselApi.on('select', syncActiveImage);
        carouselApi.on('reInit', syncActiveImage);

        return () => {
            carouselApi.off('select', syncActiveImage);
            carouselApi.off('reInit', syncActiveImage);
        };
    }, [carouselApi, images]);

    useEffect(() => {
        if (!carouselApi || activeImageIndex < 0) {
            return;
        }

        if (carouselApi.selectedScrollSnap() !== activeImageIndex) {
            carouselApi.scrollTo(activeImageIndex);
        }
    }, [activeImageIndex, carouselApi]);

    useEffect(() => {
        const galleryColumn = galleryColumnRef.current;

        if (!galleryColumn) {
            return;
        }

        const desktopQuery = window.matchMedia('(min-width: 1024px)');

        const syncGalleryHeight = () => {
            if (!desktopQuery.matches) {
                setDesktopGalleryHeight(undefined);

                return;
            }

            setDesktopGalleryHeight(galleryColumn.clientHeight);
        };

        const resizeObserver = new ResizeObserver(syncGalleryHeight);

        resizeObserver.observe(galleryColumn);
        desktopQuery.addEventListener('change', syncGalleryHeight);
        syncGalleryHeight();

        return () => {
            resizeObserver.disconnect();
            desktopQuery.removeEventListener('change', syncGalleryHeight);
        };
    }, []);

    const handleThumbnailSelect = useCallback(
        (imageId: string, index: number) => {
            setActiveImageId(imageId);
            carouselApi?.scrollTo(index);
        },
        [carouselApi],
    );

    return (
        <section
            aria-labelledby={galleryLabelId}
            className={cn(
                layoutMode === 'grid'
                    ? 'grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.9fr)] lg:items-stretch'
                    : 'flex flex-col gap-4',
                className,
            )}
        >
            <h2 id={galleryLabelId} className="sr-only">
                Galeri gambar
            </h2>

            <div
                ref={galleryColumnRef}
                className={cn(
                    'grid min-w-0 gap-3 lg:gap-4',
                    layoutMode === 'grid' && 'lg:self-start',
                    shouldShowThumbnails &&
                        layoutMode === 'grid' &&
                        thumbnailPosition === 'side' &&
                        'lg:grid-cols-[96px_minmax(0,1fr)]',
                    shouldShowThumbnails &&
                        layoutMode === 'stack' &&
                        'grid-cols-[64px_minmax(0,1fr)] gap-2',
                )}
            >
                {shouldShowThumbnails ? (
                    <div
                        className={cn(
                            'min-w-0',
                            layoutMode === 'grid' &&
                                thumbnailPosition === 'side' &&
                                'lg:h-full',
                            layoutMode === 'grid' &&
                                thumbnailPosition === 'side' &&
                                'order-2 lg:order-1',
                            layoutMode === 'grid' &&
                                thumbnailPosition === 'bottom' &&
                                'order-2',
                            layoutMode === 'stack' && 'order-1 h-full',
                        )}
                    >
                        <div
                            className={cn(
                                galleryAction &&
                                    layoutMode === 'grid' &&
                                    (thumbnailPosition === 'bottom'
                                        ? 'flex min-w-0 items-stretch gap-3'
                                        : 'flex min-w-0 items-stretch gap-3 lg:block'),
                            )}
                        >
                            <div className="min-w-0 flex-1">
                                <div
                                    className={cn(
                                        'flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden',
                                        layoutMode === 'grid' &&
                                            thumbnailPosition === 'side' &&
                                            'lg:h-full lg:flex-col lg:overflow-y-auto lg:pr-1 lg:pb-0',
                                        layoutMode === 'stack' &&
                                            'h-full flex-col overflow-x-hidden overflow-y-auto pr-1 pb-0',
                                    )}
                                >
                                    {images.map((image, index) => {
                                        const isActive =
                                            activeImage?.id === image.id;

                                        return (
                                            <button
                                                key={image.id}
                                                type="button"
                                                aria-current={
                                                    isActive
                                                        ? 'true'
                                                        : undefined
                                                }
                                                aria-label={`Tampilkan ${image.alt} ${
                                                    index + 1
                                                }`}
                                                className={cn(
                                                    'group relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl bg-muted transition-opacity duration-200 outline-none',
                                                    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                                    layoutMode === 'grid' &&
                                                        thumbnailPosition ===
                                                            'side' &&
                                                        'lg:w-full lg:flex-none',
                                                    layoutMode === 'stack' &&
                                                        'w-full flex-none',
                                                    shouldFillThumbnailRail &&
                                                        layoutMode === 'grid' &&
                                                        thumbnailPosition ===
                                                            'side' &&
                                                        'lg:aspect-auto lg:h-0 lg:flex-1',
                                                    shouldFillThumbnailRail &&
                                                        layoutMode ===
                                                            'stack' &&
                                                        'aspect-auto h-0 flex-1',
                                                    isActive
                                                        ? 'opacity-100'
                                                        : 'opacity-70 hover:opacity-100',
                                                )}
                                                onClick={() =>
                                                    handleThumbnailSelect(
                                                        image.id,
                                                        index,
                                                    )
                                                }
                                            >
                                                <div className="relative h-full w-full overflow-hidden rounded-xl">
                                                    <img
                                                        src={image.url}
                                                        alt={`${image.alt} ${
                                                            index + 1
                                                        }`}
                                                        className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                                        loading="lazy"
                                                    />
                                                </div>

                                                <span
                                                    aria-hidden="true"
                                                    className={cn(
                                                        'pointer-events-none absolute inset-0 rounded-xl ring-1 transition-colors ring-inset',
                                                        isActive
                                                            ? 'ring-foreground/35'
                                                            : 'ring-black/10 group-hover:ring-foreground/20 dark:ring-white/10',
                                                    )}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {galleryAction && layoutMode === 'grid' ? (
                                <div
                                    className={cn(
                                        'flex shrink-0',
                                        thumbnailPosition === 'side' &&
                                            'lg:hidden',
                                    )}
                                >
                                    {galleryAction}
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                <div
                    className={cn(
                        'min-w-0',
                        shouldShowThumbnails &&
                            layoutMode === 'grid' &&
                            thumbnailPosition === 'side' &&
                            'order-1 lg:order-2',
                        shouldShowThumbnails &&
                            layoutMode === 'grid' &&
                            thumbnailPosition === 'bottom' &&
                            'order-1',
                        layoutMode === 'stack' && 'order-2',
                    )}
                >
                    <div
                        className={cn(
                            'relative overflow-hidden bg-background',
                            layoutMode === 'grid'
                                ? '-mx-4 -mt-4 sm:mx-0 sm:mt-0 sm:rounded-xl sm:border sm:border-border/60 sm:shadow-sm'
                                : 'rounded-xl border border-border/60 shadow-sm',
                        )}
                    >
                        {overlay ? (
                            <div className="pointer-events-none absolute top-3 left-3 z-10">
                                {overlay}
                            </div>
                        ) : null}
                        {activeImage ? (
                            <Carousel
                                opts={carouselOptions}
                                setApi={setCarouselApi}
                                className="group/gallery relative w-full"
                            >
                                <CarouselContent className="ml-0">
                                    {images.map((image, index) => (
                                        <CarouselItem
                                            key={image.id}
                                            className="basis-full pl-0"
                                        >
                                            <AspectRatio
                                                ratio={4 / 3}
                                                className="bg-muted"
                                            >
                                                <img
                                                    src={image.url}
                                                    alt={image.alt}
                                                    className="size-full object-cover"
                                                    loading={
                                                        index ===
                                                        initialImageIndex
                                                            ? 'eager'
                                                            : 'lazy'
                                                    }
                                                />
                                            </AspectRatio>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>

                                {hasMultipleImages ? (
                                    <>
                                        <CarouselPrevious
                                            type="button"
                                            className="left-3 hidden size-9 border-border/60 bg-background/85 text-foreground opacity-95 shadow-sm backdrop-blur hover:bg-background hover:opacity-100 disabled:hidden sm:inline-flex"
                                        />

                                        <CarouselNext
                                            type="button"
                                            className="right-3 hidden size-9 border-border/60 bg-background/85 text-foreground opacity-95 shadow-sm backdrop-blur hover:bg-background hover:opacity-100 disabled:hidden sm:inline-flex"
                                        />

                                        <div className="absolute right-3 bottom-3 rounded-full border border-border/60 bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
                                            {activeImageIndex + 1} /{' '}
                                            {images.length}
                                        </div>
                                    </>
                                ) : null}
                            </Carousel>
                        ) : (
                            <AspectRatio
                                ratio={4 / 3}
                                className="min-h-[280px]"
                            >
                                <div className="flex size-full flex-col items-center justify-center gap-3 text-muted-foreground">
                                    <ImageIcon className="size-10" />
                                    <span className="text-sm">
                                        {fallbackLabel}
                                    </span>
                                </div>
                            </AspectRatio>
                        )}
                    </div>
                </div>

                {galleryAction ? (
                    <div
                        className={cn(
                            'order-3',
                            shouldShowThumbnails &&
                                layoutMode === 'grid' &&
                                thumbnailPosition === 'side' &&
                                'hidden lg:col-span-2 lg:block',
                            shouldShowThumbnails &&
                                layoutMode === 'grid' &&
                                thumbnailPosition === 'bottom' &&
                                'hidden',
                        )}
                    >
                        {galleryAction}
                    </div>
                ) : null}
            </div>

            <aside
                className={cn(
                    'min-w-0',
                    layoutMode === 'grid' && 'lg:min-h-0 lg:overflow-hidden',
                )}
                style={
                    layoutMode === 'grid' && desktopGalleryHeight
                        ? { height: `${desktopGalleryHeight}px` }
                        : undefined
                }
            >
                <div
                    className={cn(
                        'flex min-h-0 flex-col gap-4',
                        layoutMode === 'grid' && 'lg:h-full lg:gap-5',
                    )}
                >
                    {children}
                    {asideFooter ? (
                        <div className="shrink-0">{asideFooter}</div>
                    ) : null}
                </div>
            </aside>
        </section>
    );
}
