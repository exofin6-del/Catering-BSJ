export const customerThemeOptions = [
    {
        value: 'minimal',
        label: 'Minimalist',
        description: 'Hitam dan putih modern',
        previewClassName:
            'bg-[#f7f7f5] [--theme-accent:#2b2b2b] [--theme-surface:#e0e0dc] [--theme-card:#ffffff] [--theme-card-border:#dcdcd8] [--theme-input-border:#dcdcd8] [--theme-primary-fg:#f7f7f5]',
    },
    {
        value: 'sage',
        label: 'Sage',
        description: 'Hijau lembut dan natural',
        previewClassName:
            'bg-[#f0faf3] [--theme-accent:#059669] [--theme-surface:#b7f0cf] [--theme-card:#ffffff] [--theme-card-border:#b7e6cb] [--theme-input-border:#b7e6cb] [--theme-primary-fg:#ffffff]',
    },
    {
        value: 'terracotta',
        label: 'Terracotta',
        description: 'Oranye hangat dan bersahaja',
        previewClassName:
            'bg-[#fff7ed] [--theme-accent:#ea580c] [--theme-surface:#fed7aa] [--theme-card:#ffffff] [--theme-card-border:#fed7aa] [--theme-input-border:#fed7aa] [--theme-primary-fg:#ffffff]',
    },
    {
        value: 'ocean',
        label: 'Ocean',
        description: 'Biru segar dan tenang',
        previewClassName:
            'bg-[#eef4ff] [--theme-accent:#1d4ed8] [--theme-surface:#b9cefc] [--theme-card:#ffffff] [--theme-card-border:#b9cefc] [--theme-input-border:#b9cefc] [--theme-primary-fg:#ffffff]',
    },
    {
        value: 'lavender',
        label: 'Lavender',
        description: 'Ungu lembut dan elegan',
        previewClassName:
            'bg-[#f5f2ff] [--theme-accent:#6d28d9] [--theme-surface:#d4c8fc] [--theme-card:#ffffff] [--theme-card-border:#cdbcf5] [--theme-input-border:#cdbcf5] [--theme-primary-fg:#ffffff]',
    },
    {
        value: 'rose',
        label: 'Rose',
        description: 'Merah muda modern dan premium',
        previewClassName:
            'bg-[#fef1f4] [--theme-accent:#d91a3c] [--theme-surface:#fec5cf] [--theme-card:#ffffff] [--theme-card-border:#f0b8c5] [--theme-input-border:#f0b8c5] [--theme-primary-fg:#ffffff]',
    },
    {
        value: 'citrus',
        label: 'Citrus',
        description: 'Kuning cerah dan penuh energi',
        previewClassName:
            'bg-[#fefce8] [--theme-accent:#b58a04] [--theme-surface:#f9e57a] [--theme-card:#ffffff] [--theme-card-border:#e8d47a] [--theme-input-border:#e8d47a] [--theme-primary-fg:#ffffff]',
    },
] as const;

export type CustomerTheme = (typeof customerThemeOptions)[number]['value'];
