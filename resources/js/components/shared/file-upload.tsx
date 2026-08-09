'use client';

import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, UniqueIdentifier } from '@dnd-kit/core';
import {
    rectSortingStrategy,
    SortableContext,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ImagePlus, Loader2, Star, X } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileUpload, FileUploadTrigger } from '@/components/ui/file-upload';
import { cn } from '@/lib/utils';

export type ImageUploadItem = {
    id: string;
    isPrimary?: boolean;
    isUploading?: boolean;
    name: string;
    uploadError?: string;
    url: string;
};

export function ImageFileUpload({
    accept = 'image/*',
    className,
    disabled = false,
    error,
    images,
    maxFiles = 5,
    maxSize = 2 * 1024 * 1024,
    previewAlt = 'Preview gambar menu',
    onFilesChange,
    onRemove,
    onReorder,
    onReject,
    onSetPrimary,
}: {
    accept?: string;
    className?: string;
    disabled?: boolean;
    error?: string | null;
    images: ImageUploadItem[];
    maxFiles?: number;
    maxSize?: number;
    previewAlt?: string;
    onFilesChange: (files: File[]) => void;
    onRemove: (imageId: string) => void;
    onReorder?: (activeImageId: string, overImageId: string) => void;
    onReject?: (message: string) => void;
    onSetPrimary?: (imageId: string) => void;
}) {
    'use no memo';

    const remainingSlots = Math.max(0, maxFiles - images.length);
    const canAddMore = remainingSlots > 0 && !disabled;
    const canReorder = Boolean(onReorder) && images.length > 1;
    const sortableId = React.useId();
    const imageIds = React.useMemo<UniqueIdentifier[]>(
        () => images.map((image) => image.id),
        [images],
    );
    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {}),
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (!active || !over || active.id === over.id) {
            return;
        }

        onReorder?.(active.id.toString(), over.id.toString());
    }

    return (
        <FileUpload
            value={[]}
            accept={accept}
            disabled={!canAddMore}
            invalid={Boolean(error)}
            maxFiles={Math.max(remainingSlots, 1)}
            maxSize={maxSize}
            multiple
            onFileReject={(_, message) =>
                onReject?.(
                    message.startsWith('Maximum')
                        ? `Maksimal ${maxFiles} gambar.`
                        : message,
                )
            }
            onAccept={(acceptedFiles) => {
                onFilesChange(acceptedFiles.slice(0, remainingSlots));
            }}
            onFileValidate={(file) => {
                if (!file.type.startsWith('image/')) {
                    return 'File harus berupa gambar.';
                }

                if (file.size > maxSize) {
                    return `Ukuran gambar maksimal ${formatMegabytes(maxSize)}.`;
                }

                return null;
            }}
        >
            <div
                className={cn(
                    'space-y-3 rounded-lg border border-border bg-muted/20 p-3',
                    error && 'border-destructive/70 bg-destructive/5',
                    className,
                )}
            >
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground">
                        Maksimal {maxFiles} gambar, {formatMegabytes(maxSize)}{' '}
                        per gambar.
                    </p>
                    <Badge variant="outline">
                        {images.length}/{maxFiles}
                    </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    <DndContext
                        collisionDetection={closestCenter}
                        id={sortableId}
                        sensors={sensors}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={imageIds}
                            strategy={rectSortingStrategy}
                        >
                            {images.map((image, index) => (
                                <SortableImageTile
                                    key={image.id}
                                    image={image}
                                    index={index}
                                    previewAlt={previewAlt}
                                    canReorder={canReorder}
                                    onRemove={onRemove}
                                    onSetPrimary={onSetPrimary}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>

                    {canAddMore
                        ? Array.from({ length: remainingSlots }).map(
                              (_, index) => (
                                  <FileUploadTrigger
                                      key={`upload-slot-${index}`}
                                      asChild
                                  >
                                      <Button
                                          type="button"
                                          variant="outline"
                                          className="flex aspect-square h-auto w-full flex-col gap-2 rounded-lg border-dashed border-border bg-background/70 p-3 text-center shadow-none hover:border-primary/50 hover:bg-accent/40"
                                      >
                                          <ImagePlus className="size-7 text-muted-foreground" />
                                          <span className="text-sm font-medium">
                                              Upload
                                          </span>
                                      </Button>
                                  </FileUploadTrigger>
                              ),
                          )
                        : null}
                </div>

                {error ? (
                    <p className="text-sm text-destructive">{error}</p>
                ) : null}
            </div>
        </FileUpload>
    );
}

function SortableImageTile({
    canReorder,
    image,
    index,
    previewAlt,
    onRemove,
    onSetPrimary,
}: {
    canReorder: boolean;
    image: ImageUploadItem;
    index: number;
    previewAlt: string;
    onRemove: (imageId: string) => void;
    onSetPrimary?: (imageId: string) => void;
}) {
    const {
        attributes,
        isDragging,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({
        disabled: image.isUploading || !canReorder,
        id: image.id,
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'group relative aspect-square overflow-hidden rounded-lg border border-border bg-background',
                image.uploadError && 'border-destructive/70',
                isDragging && 'z-10 opacity-80 shadow-lg',
            )}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
        >
            <img
                src={image.url}
                alt={`${previewAlt} ${index + 1}`}
                className="size-full object-cover"
            />

            {image.isPrimary ? (
                <Badge className="absolute top-2 left-2 bg-background/90 text-foreground shadow-xs">
                    Utama
                </Badge>
            ) : null}

            {canReorder ? (
                <Button
                    {...attributes}
                    {...listeners}
                    type="button"
                    size="icon-xs"
                    variant="secondary"
                    className="absolute top-2 right-2 cursor-grab bg-background/90 shadow-xs active:cursor-grabbing"
                    title="Geser urutan gambar"
                    disabled={image.isUploading}
                >
                    <GripVertical className="size-3.5" />
                    <span className="sr-only">Geser urutan gambar</span>
                </Button>
            ) : null}

            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-2 pt-8">
                {onSetPrimary ? (
                    <Button
                        type="button"
                        size="icon-xs"
                        variant="secondary"
                        className={cn(
                            'bg-background/90 shadow-xs',
                            image.isPrimary &&
                                'bg-primary text-primary-foreground hover:bg-primary/90',
                        )}
                        title="Jadikan utama"
                        disabled={image.isUploading}
                        onClick={() => onSetPrimary(image.id)}
                    >
                        <Star
                            className={cn(
                                'size-3.5',
                                image.isPrimary && 'fill-current',
                            )}
                        />
                    </Button>
                ) : null}

                <Button
                    type="button"
                    size="icon-xs"
                    variant="secondary"
                    className="bg-background/90 shadow-xs"
                    title="Hapus gambar"
                    disabled={image.isUploading}
                    onClick={() => onRemove(image.id)}
                >
                    <X className="size-3.5" />
                </Button>
            </div>

            {image.isUploading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 text-xs font-medium">
                    <Loader2 className="size-5 animate-spin" />
                    Mengunggah
                </div>
            ) : null}

            {image.uploadError ? (
                <div className="absolute inset-x-2 bottom-12 rounded-md bg-destructive px-2 py-1 text-xs text-white shadow-xs">
                    {image.uploadError}
                </div>
            ) : null}
        </div>
    );
}

function formatMegabytes(bytes: number): string {
    return `${Math.round(bytes / 1024 / 1024)} MB`;
}

export default ImageFileUpload;
