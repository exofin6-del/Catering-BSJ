import { Head } from '@inertiajs/react';
import { ShieldCheck, Lock, Eye, UserCheck } from 'lucide-react';
import type { CustomerStorefrontProps } from '@/features/customers/types/customer-storefront-types';
import { useCustomerTheme } from '@/lib/hooks/use-customer-theme';

export default function PrivacyPolicyPage({
    business,
}: CustomerStorefrontProps) {
    useCustomerTheme();
    const appName = business?.name || 'Layanan Catering Kami';

    return (
        <>
            <Head title="Kebijakan Privasi (Privacy Policy)" />

            <div className="mx-auto max-w-4xl space-y-8 py-6 sm:py-8 lg:py-10">
                {/* Header */}
                <div className="border-b border-border pb-6 space-y-2">
                    <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
                        <ShieldCheck className="size-4" />
                        <span>Kebijakan Privasi</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Kebijakan Privasi {appName}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Terakhir Diperbarui: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>

                {/* Main Content */}
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Eye className="size-5 text-primary" />
                            1. Informasi yang Kami Kumpulkan
                        </h2>
                        <p>
                            Saat Anda menggunakan layanan {appName} dan login menggunakan Google Authentication, kami mengumpulkan informasi pribadi dasar Anda yang dibagikan secara sukarela untuk memproses pemesanan catering:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Nama lengkap dan foto profil (dari profil Google Anda).</li>
                            <li>Alamat email (digunakan untuk otentikasi akun dan konfirmasi pesanan).</li>
                            <li>Nomor telepon dan alamat pengiriman (yang Anda masukkan saat melakukan checkout).</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <UserCheck className="size-5 text-primary" />
                            2. Penggunaan Informasi
                        </h2>
                        <p>Informasi yang kami kumpulkan hanya digunakan untuk:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Mengidentifikasi dan memverifikasi identitas Anda saat login.</li>
                            <li>Memproses pesanan menu dan paket catering yang Anda ajukan.</li>
                            <li>Menghubungi Anda terkait status pengiriman atau konfirmasi pembayaran.</li>
                            <li>Meningkatkan kualitas layanan dan pengalaman pelanggan.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Lock className="size-5 text-primary" />
                            3. Perlindungan & Keamanan Data
                        </h2>
                        <p>
                            Kami berkomitmen untuk menjaga keamanan data pribadi Anda. Kami tidak pernah menjual, menyewakan, atau membagikan informasi pribadi Anda kepada pihak ketiga mana pun tanpa persetujuan Anda, kecuali diperlukan oleh hukum atau untuk pemrosesan pengiriman pesanan.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold text-foreground">
                            4. Hak Anda
                        </h2>
                        <p>
                            Anda berhak untuk mengakses, memperbarui, atau meminta penghapusan akun dan data pribadi Anda dari sistem kami kapan saja dengan menghubungi tim dukungan kami.
                        </p>
                    </section>

                    <section className="space-y-3 border-t border-border pt-6">
                        <h2 className="text-lg font-semibold text-foreground">
                            5. Hubungi Kami
                        </h2>
                        <p>
                            Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi layanan pelanggan kami melalui informasi kontak yang tertera di halaman utama atau halaman informasi toko kami.
                        </p>
                    </section>
                </div>
            </div>
        </>
    );
}

PrivacyPolicyPage.layout = {
    title: 'Kebijakan Privasi',
    description: 'Kebijakan privasi penggunaan layanan customer.',
};
