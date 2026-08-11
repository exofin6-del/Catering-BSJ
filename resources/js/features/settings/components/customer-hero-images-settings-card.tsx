import {
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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { useBusinessSettings } from '@/features/settings/hooks/use-business-settings';
import type { BusinessSetting } from '@/features/settings/types/business-setting';

import { BusinessSettingCardHeader } from './business-setting-card-header';

export function CustomerHeroImagesSettingsCard({
    settings,
}: {
    businessSetting: BusinessSetting;
    settings: ReturnType<typeof useBusinessSettings>;
}) {
    const {
        heroImageErrors,
        heroImagesChanged,
        heroImagePreviews,
        handleHeroImageChange,
        handleHeroImageRemove,
        handleHeroImageReset,
        heroImagesSaving,
        submitHeroImages,
    } = settings;

    const fileInputRefs = useRef<(HTMLInputElement | null)[]>([
        null,
        null,
        null,
    ]);

    function handleFileSelect(index: number) {
        fileInputRefs.current[index]?.click();
    }

    function handleInputChange(
        index: number,
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const file = event.target.files?.[0] ?? null;
        handleHeroImageChange(index, file);
        event.target.value = '';
    }

    const slots = Array.from({ length: 3 }, (_, i) => i);

    return (
        <Card className="overflow-hidden">
            <BusinessSettingCardHeader
                icon={Images}
                title="Gambar beranda customer"
                description="Maksimal 3 gambar yang akan tampil sebagai slide di halaman customer."
            />
            <CardContent className="px-5 py-5 sm:px-6">
                <div className="grid gap-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {slots.map((index) => {
                            const preview = heroImagePreviews[index];
                            const error = heroImageErrors[index];
                            const isEmpty = !preview;

                            return (
                                <div
                                    key={index}
                                    className="flex flex-col gap-1.5"
                                >
                                    <div
                                        key={preview ?? `empty-hero-${index}`}
                                        className={`group relative flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
                                            error
                                                ? 'border-destructive bg-destructive/5'
                                                : isEmpty
                                                  ? 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'
                                                  : 'border-transparent bg-muted'
                                        }`}
                                        onClick={() => handleFileSelect(index)}
                                    >
                                        {preview ? (
                                            <>
                                                <img
                                                    src={preview}
                                                    alt={`Hero ${index + 1}`}
                                                    className="size-full object-cover"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <Upload className="size-4 text-white" />
                                                    <span className="text-xs font-medium text-white">
                                                        Ganti
                                                    </span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    size="icon-xs"
                                                    variant="secondary"
                                                    className="absolute top-2 right-2 bg-background/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                                                    title="Hapus gambar"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleHeroImageRemove(
                                                            index,
                                                        );
                                                    }}
                                                >
                                                    <Trash2 className="size-3.5" />
                                                    <span className="sr-only">
                                                        Hapus
                                                    </span>
                                                </Button>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1.5 p-4 text-center">
                                                <ImagePlus className="size-6 text-muted-foreground" />
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    Gambar {index + 1}
                                                </span>
                                                <span className="text-[11px] text-muted-foreground">
                                                    PNG · JPG · WEBP
                                                    <br />
                                                    auto kompres
                                                </span>
                                            </div>
                                        )}
                                        <input
                                            key={
                                                preview ?? `hero-input-${index}`
                                            }
                                            ref={(el) => {
                                                fileInputRefs.current[index] =
                                                    el;
                                            }}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) =>
                                                handleInputChange(index, e)
                                            }
                                        />
                                    </div>
                                    {error && <InputError message={error} />}
                                </div>
                            );
                        })}
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Gambar akan tampil sebagai slideshow otomatis di bagian
                        beranda halaman customer.
                    </p>

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                        <Button
                            type="button"
                            size="sm"
                            onClick={submitHeroImages}
                            disabled={!heroImagesChanged || heroImagesSaving}
                        >
                            {heroImagesSaving ? (
                                <LoaderCircle className="mr-1 size-4 animate-spin" />
                            ) : (
                                <Save className="mr-1 size-4" />
                            )}
                            Simpan
                        </Button>
                        {heroImagesChanged && (
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleHeroImageReset}
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
