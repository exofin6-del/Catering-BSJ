import type { CustomerBusiness } from '../types/customer-storefront-types';
import { customerWhatsAppUrl } from '../utils/customer-whatsapp';

export function CustomerWhatsAppButton({
    business,
}: {
    business: CustomerBusiness;
}) {
    const href = customerWhatsAppUrl(
        business.whatsapp_number,
        `Halo ${business.name}, saya ingin bertanya tentang layanan catering.`,
    );

    if (!href) {
        return null;
    }

    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="fixed right-4 bottom-20 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_8px_30px_rgba(16,185,129,0.4)] transition-all duration-300 hover:scale-110 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 active:scale-95 sm:right-8 sm:bottom-8 sm:h-16 sm:w-16"
            aria-label={`Hubungi ${business.name} melalui WhatsApp`}
        >
            {/* Soft background pulse wave */}
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/30 opacity-75 duration-1000" />
            
            <img
                src="/images/ikon-whatsapp.png"
                alt="WhatsApp"
                className="relative z-10 h-8 w-8 object-contain transition-transform duration-300 hover:rotate-6 sm:h-9 sm:w-9"
                onError={(e) => {
                    // Fallback to text if image fails
                    e.currentTarget.style.display = 'none';
                }}
            />
        </a>
    );
}
