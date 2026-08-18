export type ImageCompressionOptions = {
    maxBytes?: number;
    maxHeight?: number;
    maxWidth?: number;
    quality?: number;
};

const defaultOptions: Required<ImageCompressionOptions> = {
    maxBytes: 8 * 1024 * 1024,
    maxHeight: 1920,
    maxWidth: 1920,
    quality: 0.82,
};

const heifMimeTypes = new Set(['image/heic', 'image/heif']);
const heifExtensions = new Set(['heic', 'heif']);
const supportedImageExtensions = new Set([
    'avif',
    'bmp',
    'gif',
    'heic',
    'heif',
    'jpeg',
    'jpg',
    'png',
    'svg',
    'webp',
]);

export function isSupportedImageFile(file: File): boolean {
    return (
        file.type.startsWith('image/') ||
        supportedImageExtensions.has(fileExtension(file.name))
    );
}

export async function compressImage(
    file: File,
    options: ImageCompressionOptions = {},
): Promise<File> {
    if (!isSupportedImageFile(file) || file.type === 'image/gif') {
        return file;
    }

    const settings = { ...defaultOptions, ...options };
    const objectUrl = URL.createObjectURL(file);
    const mustRasterize = isSvgFile(file) || isHeifFile(file);
    let decodedImage: DecodedImage | undefined;

    try {
        decodedImage = await loadImage(file, objectUrl);
        const scale = Math.min(
            1,
            settings.maxWidth / decodedImage.width,
            settings.maxHeight / decodedImage.height,
        );
        let width = Math.max(1, Math.round(decodedImage.width * scale));
        let height = Math.max(1, Math.round(decodedImage.height * scale));

        if (file.size <= settings.maxBytes && scale === 1 && !mustRasterize) {
            return file;
        }

        let quality = settings.quality;
        let blob = await renderImage(
            decodedImage.source,
            width,
            height,
            quality,
        );

        for (
            let attempt = 0;
            blob.size > settings.maxBytes && attempt < 12;
            attempt += 1
        ) {
            if (quality > 0.48) {
                quality = Math.max(0.48, quality - 0.08);
            } else {
                width = Math.max(480, Math.round(width * 0.78));
                height = Math.max(480, Math.round(height * 0.78));
            }

            blob = await renderImage(
                decodedImage.source,
                width,
                height,
                quality,
            );
        }

        if (blob.size > settings.maxBytes) {
            throw new Error(
                'Gambar masih terlalu besar setelah dikompres. Pilih gambar dengan resolusi lebih kecil.',
            );
        }

        return new File([blob], compressedFileName(file.name, blob.type), {
            lastModified: Date.now(),
            type: blob.type,
        });
    } finally {
        decodedImage?.close?.();
        URL.revokeObjectURL(objectUrl);
    }
}

type DecodedImage = {
    close?: () => void;
    height: number;
    source: CanvasImageSource;
    width: number;
};

async function loadImage(file: File, objectUrl: string): Promise<DecodedImage> {
    if (isHeifFile(file) && typeof createImageBitmap === 'function') {
        try {
            const bitmap = await createImageBitmap(file);

            return {
                close: () => bitmap.close(),
                height: bitmap.height,
                source: bitmap,
                width: bitmap.width,
            };
        } catch {
            // Fall back to HTMLImageElement for browsers with partial HEIF support.
        }
    }

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.decoding = 'async';
        image.onload = () => {
            if (image.naturalWidth === 0 || image.naturalHeight === 0) {
                reject(new Error('Gambar tidak memiliki ukuran yang valid.'));

                return;
            }

            resolve(image);
        };
        image.onerror = () => reject(imageProcessingError(file));
        image.src = objectUrl;
    });

    return {
        height: image.naturalHeight,
        source: image,
        width: image.naturalWidth,
    };
}

function renderImage(
    image: CanvasImageSource,
    width: number,
    height: number,
    quality: number,
): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if (!context) {
        return Promise.reject(
            new Error('Browser tidak mendukung kompresi gambar.'),
        );
    }

    context.drawImage(image, 0, 0, width, height);

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (webpBlob) => {
                if (webpBlob) {
                    resolve(webpBlob);

                    return;
                }

                canvas.toBlob(
                    (jpegBlob) => {
                        if (jpegBlob) {
                            resolve(jpegBlob);

                            return;
                        }

                        reject(new Error('Gambar tidak dapat dikompres.'));
                    },
                    'image/jpeg',
                    quality,
                );
            },
            'image/webp',
            quality,
        );
    });
}

function isSvgFile(file: File): boolean {
    return file.type === 'image/svg+xml' || fileExtension(file.name) === 'svg';
}

function isHeifFile(file: File): boolean {
    return (
        heifMimeTypes.has(file.type.toLowerCase()) ||
        heifExtensions.has(fileExtension(file.name))
    );
}

function fileExtension(name: string): string {
    return name.split('.').pop()?.toLowerCase() ?? '';
}

function imageProcessingError(file: File): Error {
    if (isHeifFile(file)) {
        return new Error(
            'Browser ini belum mendukung HEIF/HEIC. Konversi gambar ke JPG atau WEBP terlebih dahulu.',
        );
    }

    return new Error('Gambar tidak dapat diproses.');
}

function compressedFileName(name: string, mimeType: string): string {
    const extension = mimeType === 'image/webp' ? 'webp' : 'jpg';
    const baseName = name.replace(/\.[^/.]+$/, '') || 'image';

    return `${baseName}.${extension}`;
}
