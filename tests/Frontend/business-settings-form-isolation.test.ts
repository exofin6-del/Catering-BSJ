import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const businessInfoCard = readFileSync(
    new URL(
        '../../resources/js/features/settings/components/business-info-settings-card.tsx',
        import.meta.url,
    ),
    'utf8',
);
const businessSettingsHook = readFileSync(
    new URL(
        '../../resources/js/features/settings/hooks/use-business-settings.ts',
        import.meta.url,
    ),
    'utf8',
);

test('business information save state ignores unsaved customer hero images', () => {
    assert.match(
        businessInfoCard,
        /const hasPendingChanges = infoForm\.isDirty;/,
    );
    assert.doesNotMatch(businessInfoCard, /heroImagesChanged/);
    assert.doesNotMatch(businessInfoCard, /heroImagesUploading/);
});

test('business information submission does not include or reset hero images', () => {
    const submitInfoSource = businessSettingsHook.slice(
        businessSettingsHook.indexOf('function submitInfo'),
        businessSettingsHook.indexOf('function submitHeroImages'),
    );

    assert.doesNotMatch(submitInfoSource, /heroImagePayload/);
    assert.doesNotMatch(submitInfoSource, /setHeroImagesChanged/);
    assert.doesNotMatch(submitInfoSource, /setHeroImagePreviews/);
});
