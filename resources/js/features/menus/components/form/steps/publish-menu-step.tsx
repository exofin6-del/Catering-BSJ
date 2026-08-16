import { ImageFileUpload } from '@/components/shared/file-upload';
import { PublicationStatusCard } from '@/components/shared/publication-status-card';
import {
    Field,
    FieldContent,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
    FieldDescription,
} from '@/components/ui/field';
import type { MenuFormValues } from '../../../schema/menu-form-schema';
import type { MenuImagePreview } from '../../../types/menu-types';
import { MAX_MENU_IMAGES } from '../constants';
import { MenuFormSummaryAside } from '../menu-form-summary-aside';

export function PublishMenuStep({
    imageError,
    images,
    isUploadingImages,
    selectedCategory,
    values,
    onImageChange,
    onImageRemove,
    onImageReorder,
    onImageReject,
}: {
    imageError: string | null;
    images: MenuImagePreview[];
    isUploadingImages: boolean;
    selectedCategory: string;
    values: MenuFormValues;
    onImageChange: (fileList: FileList | File[] | null) => void;
    onImageRemove: (imageId: string) => void;
    onImageReorder: (activeImageId: string, overImageId: string) => void;
    onImageReject: (message: string) => void;
}) {
    return (
        <div className="grid items-start gap-5 lg:grid-cols-[3fr_1.5fr]">
            <section className="admin-card min-w-0 p-4 md:p-5">
                <FieldSet className="gap-5">
                    <FieldContent>
                        <FieldLegend className="text-base font-semibold text-foreground">
                            Galeri & Status
                        </FieldLegend>
                        <FieldDescription className="text-sm leading-snug">
                            Isi Galeri menu dan Status
                        </FieldDescription>
                    </FieldContent>
                    <FieldGroup className="gap-5">
                        <Field>
                            <FieldLabel>Galeri gambar</FieldLabel>
                            <ImageFileUpload
                                images={images}
                                error={imageError}
                                maxFiles={MAX_MENU_IMAGES}
                                previewAlt={values.name || 'Preview menu'}
                                onFilesChange={onImageChange}
                                onRemove={onImageRemove}
                                onReorder={onImageReorder}
                                onReject={onImageReject}
                            />
                        </Field>

                        <PublicationStatusCard
                            activeLabel="Status Menu"
                            activeDescription="Aktif dan tampil untuk pelanggan"
                            activeToggleLabel="Aktifkan menu"
                            recommendationDescription="Tandai menu sebagai rekomendasi"
                        />
                    </FieldGroup>
                </FieldSet>
            </section>

            <MenuFormSummaryAside
                className="admin-card p-4 md:p-5"
                images={images}
                isUploadingImages={isUploadingImages}
                mode="preview-tabs"
                selectedCategory={selectedCategory}
                values={values}
            />
        </div>
    );
}
