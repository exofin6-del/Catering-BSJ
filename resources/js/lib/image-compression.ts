export type ImageCompressionOptions = {
    maxHeight?: number;
    maxWidth?: number;
    quality?: number;
};

const defaultCompressionOptions: Required<ImageCompressionOptions> = {
    maxHeight: 1920,
    maxWidth: 1920,
    quality: 0.82,
};

export async function compressImageFile(
    file: File,
    options: ImageCompressionOptions = {},
): Promise<File> {
    if (!file.type.startsWith('image/') || shouldKeepOriginal(file)) {
        return file;
    }

    const resolvedOptions = {
        ...defaultCompressionOptions,
        ...options,
    };

    try {
        const bitmap = await decodeImage(file);
        const scale = Math.min(
            1,
            resolvedOptions.maxWidth / bitmap.width,
            resolvedOptions.maxHeight / bitmap.height,
        );
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));
        const canvas = document.createElement('canvas');

        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height);

        const blob = await canvasToBlob(
            canvas,
            outputTypeFor(file),
            resolvedOptions.quality,
        );

        closeBitmap(bitmap);

        if (!blob || blob.size >= file.size) {
            return file;
        }

        return new File([blob], compressedFilename(file, blob.type), {
            lastModified: Date.now(),
            type: blob.type,
        });
    } catch {
        return file;
    }
}

export async function compressImageFiles(
    files: File[],
    options: ImageCompressionOptions = {},
): Promise<File[]> {
    return Promise.all(files.map((file) => compressImageFile(file, options)));
}

function shouldKeepOriginal(file: File): boolean {
    return ['image/gif', 'image/svg+xml'].includes(file.type);
}

async function decodeImage(
    file: File,
): Promise<ImageBitmap | HTMLImageElement> {
    if ('createImageBitmap' in window) {
        return createImageBitmap(file);
    }

    return new Promise((resolve, reject) => {
        const image = new Image();
        const url = URL.createObjectURL(file);

        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Image decode failed.'));
        };
        image.src = url;
    });
}

function canvasToBlob(
    canvas: HTMLCanvasElement,
    type: string,
    quality: number,
): Promise<Blob | null> {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function outputTypeFor(file: File): string {
    return file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';
}

function compressedFilename(file: File, mimeType: string): string {
    const extension = mimeType === 'image/jpeg' ? 'jpg' : 'webp';
    const basename = file.name.replace(/\.[^.]+$/, '');

    return `${basename}.${extension}`;
}

function closeBitmap(bitmap: ImageBitmap | HTMLImageElement): void {
    if ('close' in bitmap) {
        bitmap.close();
    }
}
