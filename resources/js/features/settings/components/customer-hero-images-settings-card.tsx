import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    rectSortingStrategy,
    SortableContext,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    GripVertical,
    ImagePlus,
    Images,
    LoaderCircle,
    Save,
    Trash2,
    Upload,
} from 'lucide-react';
import { useRef } from 'react';
import type { ChangeEvent } from 'react';

import InputError from '@/components/shared/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { useBusinessSettings } from '@/features/settings/hooks/use-business-settings';
import type { BusinessSetting } from '@/features/settings/types/business-setting';
import { cn } from '@/lib/utils';

import { BusinessSettingCardHeader } from './business-setting-card-header';

const HERO_IMAGE_COUNT = 3;

export function CustomerHeroImagesSettingsCard({
    settings,
}: {
    businessSetting: BusinessSetting;
    settings: ReturnType<typeof useBusinessSettings>;
}) {
    const {
        heroImageErrors,
        heroImagePreviews,
        heroImageUploading,
        heroImagesChanged,
        heroImagesSaving,
        handleHeroImageChange,
        handleHeroImageRemove,
        handleHeroImageReset,
        reorderHeroImages,
        submitHeroImages,
    } = settings;
    const fileInputRefs = useRef<(HTMLInputElement | null)[]>(
        Array.from({ length: HERO_IMAGE_COUNT }, () => null),
    );
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 180, tolerance: 5 },
        }),
        useSensor(KeyboardSensor, {}),
    );

    function handleDragEnd(event: DragEndEvent): void {
        const activeIndex = Number(
            String(event.active.id).replace('hero-', ''),
        );
        const overIndex = event.over
            ? Number(String(event.over.id).replace('hero-', ''))
            : -1;

        if (Number.isInteger(activeIndex) && Number.isInteger(overIndex)) {
            reorderHeroImages(activeIndex, overIndex);
        }
    }

    function handleFileSelect(index: number): void {
        if (!heroImagesSaving && !heroImageUploading[index]) {
            fileInputRefs.current[index]?.click();
        }
    }

    function handleInputChange(
        index: number,
        event: ChangeEvent<HTMLInputElement>,
    ): void {
        const file = event.target.files?.[0] ?? null;
        void handleHeroImageChange(index, file);
        event.target.value = '';
    }

    const slots = Array.from({ length: HERO_IMAGE_COUNT }, (_, index) => index);

    return (
        <Card className="overflow-hidden">
            <BusinessSettingCardHeader
                icon={Images}
                title="Gambar beranda customer"
                description="Maksimal 3 gambar yang akan tampil sebagai slide di halaman customer."
            />
            <CardContent className="px-5 py-5 sm:px-6">
                <div className="grid gap-4">
                    <DndContext
                        collisionDetection={closestCenter}
                        sensors={sensors}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={slots.map((index) => `hero-${index}`)}
                            strategy={rectSortingStrategy}
                        >
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                {slots.map((index) => (
                                    <SortableHeroImageSlot
                                        key={`hero-${index}`}
                                        error={heroImageErrors[index]}
                                        imageUploading={
                                            heroImageUploading[index]
                                        }
                                        index={index}
                                        preview={heroImagePreviews[index]}
                                        saving={heroImagesSaving}
                                        fileInputRef={(element) => {
                                            fileInputRefs.current[index] =
                                                element;
                                        }}
                                        onChange={(event) =>
                                            handleInputChange(index, event)
                                        }
                                        onRemove={() =>
                                            handleHeroImageRemove(index)
                                        }
                                        onSelect={() => handleFileSelect(index)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    <p className="text-xs text-muted-foreground">
                        Geser gambar untuk mengatur urutan slide. Badge 1
                        menjadi gambar pertama.
                    </p>

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                        <Button
                            type="button"
                            size="sm"
                            onClick={submitHeroImages}
                            disabled={
                                !heroImagesChanged ||
                                heroImagesSaving ||
                                heroImageUploading.some(Boolean)
                            }
                        >
                            {heroImagesSaving ? (
                                <LoaderCircle className="mr-1 size-4 animate-spin" />
                            ) : (
                                <Save className="mr-1 size-4" />
                            )}
                            {heroImagesSaving ? 'Mengunggah...' : 'Simpan'}
                        </Button>
                        {heroImagesChanged && (
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleHeroImageReset}
                                disabled={heroImagesSaving}
                            >
                                Batal
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function SortableHeroImageSlot({
    error,
    fileInputRef,
    imageUploading,
    index,
    onChange,
    onRemove,
    onSelect,
    preview,
    saving,
}: {
    error?: string;
    fileInputRef: (element: HTMLInputElement | null) => void;
    imageUploading: boolean;
    index: number;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
    onSelect: () => void;
    preview?: string;
    saving: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({
            disabled: !preview || imageUploading || saving,
            id: `hero-${index}`,
        });
    const isBusy = imageUploading || saving;

    return (
        <div
            ref={setNodeRef}
            className="flex min-w-0 flex-col gap-1.5"
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
        >
            <div
                className={cn(
                    'group relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors',
                    error
                        ? 'border-destructive bg-destructive/5'
                        : preview
                          ? 'border-transparent bg-muted'
                          : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50',
                )}
                onClick={onSelect}
            >
                <Badge className="absolute top-2 left-2 z-10 min-w-6 justify-center bg-background/90 text-foreground shadow-xs">
                    {index + 1}
                </Badge>

                {preview ? (
                    <img
                        src={preview}
                        alt={`Hero ${index + 1}`}
                        className="size-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-1.5 p-4 text-center">
                        <ImagePlus className="size-6 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                            Tambah gambar
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                            PNG · JPG · WEBP
                        </span>
                    </div>
                )}

                {preview && !isBusy ? (
                    <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 sm:group-focus-within:opacity-100">
                        <Upload className="size-4 text-white" />
                        <span className="text-xs font-medium text-white">
                            Ganti
                        </span>
                    </div>
                ) : null}

                {preview ? (
                    <Button
                        {...attributes}
                        {...listeners}
                        type="button"
                        size="icon-xs"
                        variant="secondary"
                        className="absolute top-2 right-2 z-10 cursor-grab bg-background/90 shadow-sm active:cursor-grabbing"
                        title="Geser urutan gambar"
                        disabled={isBusy}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <GripVertical className="size-3.5" />
                        <span className="sr-only">Geser urutan gambar</span>
                    </Button>
                ) : null}

                {preview ? (
                    <Button
                        type="button"
                        size="icon-xs"
                        variant="secondary"
                        className="absolute right-2 bottom-2 z-10 bg-background/90 opacity-100 shadow-sm sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
                        title="Hapus gambar"
                        disabled={saving}
                        onClick={(event) => {
                            event.stopPropagation();
                            onRemove();
                        }}
                    >
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">Hapus gambar</span>
                    </Button>
                ) : null}

                {isBusy ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/75 text-xs font-medium">
                        <LoaderCircle className="size-5 animate-spin" />
                        {imageUploading ? 'Menyiapkan gambar' : 'Mengunggah'}
                    </div>
                ) : null}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.svg,.heic,.heif"
                    className="hidden"
                    onChange={onChange}
                />
            </div>
            {error ? <InputError message={error} /> : null}
        </div>
    );
}
