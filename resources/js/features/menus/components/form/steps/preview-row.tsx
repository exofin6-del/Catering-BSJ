export function PreviewRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>
            <span className="max-w-[60%] text-right font-medium break-words">
                {value}
            </span>
        </div>
    );
}
