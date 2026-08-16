import { ImageFileUpload } from '@/components/shared/file-upload';
import { PublicationStatusCard } from '@/components/shared/publication-status-card';
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
} from '@/components/ui/field';

import type { PackageDetailsFormValues } from '../../../schema/package-form-schema';
import type {
    PackageImagePreview,
    PackagePreviewState,
} from '../../../types/package-types';
import { MAX_PACKAGE_IMAGES } from '../constants';
import { PackageFormSummaryAside } from '../package-form-summary-aside';

export function PackagePublicationStep({
    imageError,
    images,
    menuItems = [],
    preview,
    values,
    onImageChange,
    onImageReject,
    onImageRemove,
    onImageReorder,
}: {
    imageError: string | null;
    images: PackageImagePreview[];
    menuItems?: any[];
    preview: PackagePreviewState;
    values: PackageDetailsFormValues;
    onImageChange: (fileList: FileList | File[] | null) => void;
    onImageReject: (message: string) => void;
    onImageRemove: (imageId: string) => void;
    onImageReorder: (activeImageId: string, overImageId: string) => void;
}) {
    return (
        <div className="grid items-start gap-5 lg:grid-cols-[3fr_1.5fr]">
            <section className="admin-card min-w-0 p-4 md:p-5">
                <FieldSet className="gap-5">
                    <FieldContent>
                        <FieldLegend className="text-base font-semibold text-foreground">
                            Media & publikasi
                        </FieldLegend>
                        <FieldDescription className="text-sm leading-snug">
                            Lengkapi galeri gambar dan atur status publikasi
                            paket.
                        </FieldDescription>
                    </FieldContent>

                    <FieldGroup className="gap-5">
                        <Field>
                            <FieldLabel>Galeri gambar</FieldLabel>
                            <ImageFileUpload
                                images={images}
                                error={imageError}
                                maxFiles={MAX_PACKAGE_IMAGES}
                                previewAlt={values.name || 'Preview paket'}
                                onFilesChange={onImageChange}
                                onRemove={onImageRemove}
                                onReorder={onImageReorder}
                                onReject={onImageReject}
                            />
                        </Field>

                        <PublicationStatusCard
                            activeLabel="Status Paket"
                            activeDescription="Aktif dan tampil untuk pelanggan"
                            activeToggleLabel="Aktifkan paket"
                            recommendationDescription="Tandai paket sebagai rekomendasi"
                        />
                    </FieldGroup>
                </FieldSet>
            </section>

            <PackageFormSummaryAside
                className="admin-card self-start p-4 md:p-5"
                defaultTab="publication"
                preview={preview}
                menuItems={menuItems}
            />
        </div>
    );
}
