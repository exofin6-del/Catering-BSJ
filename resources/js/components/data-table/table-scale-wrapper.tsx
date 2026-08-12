import * as React from 'react';
import { cn } from '@/lib/utils';

interface TableScaleWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    minScale?: number; // Minimum scale factor, e.g., 0.60 to prevent text from becoming unreadably small
    active?: boolean;
}

export function TableScaleWrapper({
    children,
    minScale = 0.6,
    active = true,
    className,
    ...props
}: TableScaleWrapperProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [scale, setScale] = React.useState(1);
    const [supportsZoom] = React.useState(
        () =>
            // Detect browser support for CSS zoom property
            typeof CSS !== 'undefined' &&
            CSS.supports &&
            (CSS.supports('zoom: 1') || CSS.supports('zoom', '1')),
    );

    React.useEffect(() => {
        if (!active) {
            const frame = window.requestAnimationFrame(() => {
                setScale(1);
            });

            return () => window.cancelAnimationFrame(frame);
        }

        const hasZoom = supportsZoom;

        const handleResize = () => {
            const container = containerRef.current;
            const content = contentRef.current;

            if (!container || !content) {
                return;
            }

            // Reset styles to get the natural, unconstrained measurements
            if (hasZoom) {
                content.style.zoom = '1';
            } else {
                content.style.transform = 'none';
                content.style.width = 'auto';
            }

            const containerWidth = container.offsetWidth;
            const contentWidth = content.scrollWidth;

            if (contentWidth > containerWidth && containerWidth > 0) {
                const calculatedScale = containerWidth / contentWidth;
                // Clamp scale to the defined minimum to prevent it from becoming too small
                const finalScale = Math.max(minScale, calculatedScale);
                setScale(finalScale);

                if (hasZoom) {
                    content.style.zoom = String(finalScale);
                } else {
                    content.style.transform = `scale(${finalScale})`;
                    content.style.transformOrigin = 'top left';
                    content.style.width = `${100 / finalScale}%`;
                }
            } else {
                setScale(1);

                if (hasZoom) {
                    content.style.zoom = '1';
                } else {
                    content.style.transform = 'none';
                    content.style.width = 'auto';
                }
            }
        };

        const resizeObserver = new ResizeObserver(() => {
            // Use requestAnimationFrame to prevent "ResizeObserver loop limit exceeded" warning
            window.requestAnimationFrame(handleResize);
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [active, minScale, supportsZoom]);

    return (
        <div
            ref={containerRef}
            className={cn(
                'w-full',
                // Enable horizontal scrollbar if zoom is not supported or if the scale hits the minimum limit
                (!supportsZoom || scale <= minScale) && 'overflow-x-autoScroll',
                className,
            )}
            {...props}
        >
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                .overflow-x-autoScroll {
                    overflow-x: auto !important;
                }
                /* Disable internal overflow-x on core table components inside the scale wrapper */
                [data-slot=table-container] {
                    overflow-x: visible !important;
                }
            `,
                }}
            />
            <div
                ref={contentRef}
                className="w-full transition-[zoom,transform] duration-200 ease-out"
            >
                {children}
            </div>
        </div>
    );
}
