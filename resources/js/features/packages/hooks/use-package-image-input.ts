import { useEffect, useRef, useState } from 'react';

import paket from '@/routes/paket';
import type { MenuPackage } from '@/types';
import type {
    PackageImagePreview,
    TemporaryPackageImageUploadResponse,
} from '../types/package-types';
import {
    createFilePreviewId,
    initialPackageImages,
    revokeObjectUrl,
} from '../utils/package-form-values';

const MaxPackageImages = 5;
const MaxPackageImageSize = 2 * 1024 * 1024;

export function usePackageImageInput(item?: MenuPackage | null) {
    const [imageError, setImageError] = useState<string | null>(null);
    const [images, setImages] = useState<PackageImagePreview[]>(() =>
        normalizeImages(initialPackageImages(item ?? null)),
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

        const remainingSlots = MaxPackageImages - imagesRef.current.length;
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
            setImageError(`Maksimal ${MaxPackageImages} gambar.`);

            return;
        }

        const files = nextFiles.slice(0, remainingSlots);
        const validationError = validateFiles(files);

        if (validationError) {
            setImageError(validationError);

            return;
        }

        const previews = files.map((file, index) => ({
            file,
            id: createFilePreviewId(file),
            isPrimary: imagesRef.current.length === 0 && index === 0,
            isUploading: true,
            name: file.name,
            url: URL.createObjectURL(file),
        }));

        setImageError(
            selectedFiles.length > remainingSlots
                ? `Hanya ${remainingSlots} gambar yang ditambahkan. Maksimal ${MaxPackageImages} gambar.`
                : null,
        );
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
                    const response = await uploadTemporaryImage(preview.file);

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

        if (removedImage?.existingId !== undefined) {
            setRemovedImageIds((ids) =>
                Array.from(
                    new Set([...ids, removedImage.existingId as number]),
                ),
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

    function setPrimaryImage(imageId: string): void {
        setImages((currentImages) =>
            normalizeImages(
                currentImages.map((image) => ({
                    ...image,
                    isPrimary: image.id === imageId,
                })),
            ),
        );
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

    return {
        handleImageChange,
        imageError,
        images,
        isUploadingImages: pendingUploadCount > 0,
        removedImageIds,
        removeImage,
        reorderImages,
        setImageError,
        setPrimaryImage,
    };
}

function normalizeImages(images: PackageImagePreview[]): PackageImagePreview[] {
    const slicedImages = images.slice(0, MaxPackageImages);

    if (slicedImages.length === 0) {
        return [];
    }

    const primaryIndex = slicedImages.findIndex((image) => image.isPrimary);
    const resolvedPrimaryIndex = primaryIndex >= 0 ? primaryIndex : 0;

    return slicedImages.map((image, index) => ({
        ...image,
        isPrimary: index === resolvedPrimaryIndex,
    }));
}

function markFirstImageAsPrimary(
    images: PackageImagePreview[],
): PackageImagePreview[] {
    return images.slice(0, MaxPackageImages).map((image, index) => ({
        ...image,
        isPrimary: index === 0,
    }));
}

function validateFiles(files: File[]): string | null {
    for (const file of files) {
        if (!file.type.startsWith('image/')) {
            return 'File harus berupa gambar.';
        }

        if (file.size > MaxPackageImageSize) {
            return 'Ukuran gambar maksimal 2 MB.';
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
): Promise<TemporaryPackageImageUploadResponse> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(paket.images.temp.store.url(), {
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

    return (await response.json()) as TemporaryPackageImageUploadResponse;
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
