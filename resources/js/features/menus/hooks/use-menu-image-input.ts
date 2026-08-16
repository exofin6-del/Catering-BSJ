import { useEffect, useRef, useState } from 'react';

import { compressImage, isSupportedImageFile } from '@/lib/image-compression';
import menu from '@/routes/menu';
import type { MenuItem } from '@/types';
import { MAX_MENU_IMAGES } from '../components/form/constants';
import type {
    MenuImagePreview,
    TemporaryImageUploadResponse,
} from '../types/menu-types';
import {
    createPreviewId,
    initialMenuImages,
    revokeObjectUrl,
} from '../utils/menu-format';

export function useMenuImageInput(item?: MenuItem | null) {
    const [imageError, setImageError] = useState<string | null>(null);
    const [images, setImages] = useState<MenuImagePreview[]>(() =>
        normalizeImages(initialMenuImages(item ?? null)),
    );
    const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);
    const [pendingUploadCount, setPendingUploadCount] = useState(0);
    const activeFileSignaturesRef = useRef(new Set<string>());
    const imagesRef = useRef(images);

    useEffect(() => {
        imagesRef.current = images;
    }, [images]);

    useEffect(() => {
        return () => {
            imagesRef.current.forEach((image) => revokeObjectUrl(image.url));
        };
    }, []);

    async function handleImageChange(
        fileList: FileList | File[] | null,
    ): Promise<void> {
        const selectedFiles = deduplicateFiles(Array.from(fileList ?? []));

        if (selectedFiles.length === 0) {
            return;
        }

        const remainingSlots = MAX_MENU_IMAGES - imagesRef.current.length;
        const ignoredSignatures = new Set([
            ...activeFileSignaturesRef.current,
            ...imagesRef.current
                .map((image) =>
                    image.file ? createFileSignature(image.file) : null,
                )
                .filter((signature): signature is string => Boolean(signature)),
        ]);
        const nextFiles = selectedFiles.filter(
            (file) => !ignoredSignatures.has(createFileSignature(file)),
        );

        if (remainingSlots <= 0) {
            setImageError(`Maksimal ${MAX_MENU_IMAGES} gambar.`);

            return;
        }

        if (nextFiles.length === 0) {
            return;
        }

        const files = nextFiles.slice(0, remainingSlots);
        const validationError = validateFiles(files);

        if (validationError) {
            setImageError(validationError);

            return;
        }

        if (selectedFiles.length > remainingSlots) {
            setImageError(
                `Hanya ${remainingSlots} gambar yang ditambahkan. Maksimal ${MAX_MENU_IMAGES} gambar.`,
            );
        } else {
            setImageError(null);
        }

        const previews = files.map((file, index) => ({
            file,
            id: createPreviewId(file),
            isPrimary: imagesRef.current.length === 0 && index === 0,
            isUploading: true,
            name: file.name,
            uploadStage: 'compressing' as const,
            url: URL.createObjectURL(file),
        }));

        setImages((currentImages) =>
            normalizeImages([...currentImages, ...previews]),
        );
        previews.forEach((preview) => {
            activeFileSignaturesRef.current.add(
                createFileSignature(preview.file),
            );
        });
        setPendingUploadCount((count) => count + previews.length);

        await Promise.all(
            previews.map(async (preview) => {
                try {
                    const response = await uploadTemporaryImage(
                        preview.file,
                        (uploadStage) => {
                            setImages((currentImages) =>
                                currentImages.map((image) =>
                                    image.id === preview.id
                                        ? { ...image, uploadStage }
                                        : image,
                                ),
                            );
                        },
                    );

                    setImages((currentImages) =>
                        normalizeImages(
                            currentImages.map((image) => {
                                if (image.id !== preview.id) {
                                    return image;
                                }

                                return {
                                    ...image,
                                    isUploading: false,
                                    name: response.name,
                                    temporaryId: response.id,
                                    uploadStage: undefined,
                                    uploadError: undefined,
                                };
                            }),
                        ),
                    );
                } catch (error) {
                    const message =
                        error instanceof Error
                            ? error.message
                            : 'Upload gambar gagal.';

                    revokeObjectUrl(preview.url);
                    setImageError(message);
                    setImages((currentImages) =>
                        normalizeImages(
                            currentImages.filter(
                                (image) => image.id !== preview.id,
                            ),
                        ),
                    );
                } finally {
                    activeFileSignaturesRef.current.delete(
                        createFileSignature(preview.file),
                    );
                    setPendingUploadCount((count) => Math.max(0, count - 1));
                }
            }),
        );
    }

    function removeImage(imageId: string): void {
        const removedImage = imagesRef.current.find(
            (image) => image.id === imageId,
        );

        const existingId = removedImage?.existingId;

        if (existingId !== undefined) {
            setRemovedImageIds((ids) =>
                Array.from(new Set([...ids, existingId])),
            );
        }

        if (removedImage) {
            revokeObjectUrl(removedImage.url);
        }

        setImages((currentImages) =>
            normalizeImages(
                currentImages.filter((image) => image.id !== imageId),
            ),
        );
        setImageError(null);
    }

    function reorderImages(activeImageId: string, overImageId: string): void {
        setImages((currentImages) => {
            const oldIndex = currentImages.findIndex(
                (image) => image.id === activeImageId,
            );
            const newIndex = currentImages.findIndex(
                (image) => image.id === overImageId,
            );

            if (oldIndex === -1 || newIndex === -1) {
                return currentImages;
            }

            return markFirstImageAsPrimary(
                moveArrayItem(currentImages, oldIndex, newIndex),
            );
        });
    }

    function clearImageSelection(): void {
        const currentImages = imagesRef.current;

        setRemovedImageIds((ids) =>
            Array.from(
                new Set([
                    ...ids,
                    ...currentImages
                        .map((image) => image.existingId)
                        .filter((id): id is number => id !== undefined),
                ]),
            ),
        );

        currentImages.forEach((image) => revokeObjectUrl(image.url));

        setImages([]);
        setImageError(null);
    }

    function rejectImageSelection(message: string): void {
        setImageError(message);
    }

    return {
        clearImageSelection,
        handleImageChange,
        imageError,
        images,
        isUploadingImages: pendingUploadCount > 0,
        rejectImageSelection,
        removedImageIds,
        removeImage,
        reorderImages,
        setImageError,
    };
}

function normalizeImages(images: MenuImagePreview[]): MenuImagePreview[] {
    const slicedImages = images.slice(0, MAX_MENU_IMAGES);

    if (slicedImages.length === 0) {
        return [];
    }

    return slicedImages.map((image, index) => ({
        ...image,
        isPrimary: index === 0,
    }));
}

function markFirstImageAsPrimary(
    images: MenuImagePreview[],
): MenuImagePreview[] {
    return images.slice(0, MAX_MENU_IMAGES).map((image, index) => ({
        ...image,
        isPrimary: index === 0,
    }));
}

function validateFiles(files: File[]): string | null {
    for (const file of files) {
        if (!isSupportedImageFile(file)) {
            return 'File harus berupa gambar.';
        }
    }

    return null;
}

function deduplicateFiles(files: File[]): File[] {
    const signatures = new Set<string>();

    return files.filter((file) => {
        const signature = createFileSignature(file);

        if (signatures.has(signature)) {
            return false;
        }

        signatures.add(signature);

        return true;
    });
}

function createFileSignature(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
}

function moveArrayItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
    const nextItems = [...items];
    const [item] = nextItems.splice(fromIndex, 1);

    if (item === undefined) {
        return items;
    }

    nextItems.splice(toIndex, 0, item);

    return nextItems;
}

async function uploadTemporaryImage(
    file: File,
    onStage: (stage: 'compressing' | 'uploading') => void,
): Promise<TemporaryImageUploadResponse> {
    onStage('compressing');
    const compressedFile = await compressImage(file);
    const formData = new FormData();
    formData.append('image', compressedFile);
    onStage('uploading');

    const response = await fetch(menu.images.temp.store.url(), {
        body: formData,
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            ...csrfHeader(),
        },
        method: 'POST',
    });

    if (!response.ok) {
        throw new Error(await readUploadError(response));
    }

    return (await response.json()) as TemporaryImageUploadResponse;
}

async function readUploadError(response: Response): Promise<string> {
    const fallbackMessage = 'Upload gambar gagal.';

    try {
        const data = (await response.json()) as {
            errors?: Record<string, string[]>;
            message?: string;
        };

        return data.errors?.image?.[0] ?? data.message ?? fallbackMessage;
    } catch {
        return fallbackMessage;
    }
}

function csrfHeader(): Record<string, string> {
    const token =
        document
            .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? readCookie('XSRF-TOKEN');

    return token ? { 'X-CSRF-TOKEN': token } : {};
}

function readCookie(name: string): string | null {
    const prefix = `${name}=`;
    const cookie = document.cookie
        .split('; ')
        .find((value) => value.startsWith(prefix));

    return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}
