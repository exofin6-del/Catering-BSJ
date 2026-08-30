import { Head } from '@inertiajs/react';
import { FileText, CheckCircle2, AlertCircle, ShoppingBag, CreditCard } from 'lucide-react';
import CustomerDetailLayout from '@/layouts/customer/customer-detail-layout';
import type { CustomerStorefrontProps } from '@/features/customers/types/customer-storefront-types';

export default function TermsOfServicePage({
    business,
}: CustomerStorefrontProps) {
    const appName = business?.name || 'Layanan Catering Kami';

    return (
        <CustomerDetailLayout title="Syarat & Ketentuan" showHeader={false} showFooter={false}>
            <Head title="Syarat dan Ketentuan (Terms of Service)" />

            <div className="mx-auto max-w-4xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
                {/* Header */}
                <div className="border-b border-border pb-6 space-y-2">
                    <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
                        <FileText className="size-4" />
                        <span>Syarat dan Ketentuan</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Syarat & Ketentuan Layanan {appName}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Terakhir Diperbarui: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>

                {/* Main Content */}
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <CheckCircle2 className="size-5 text-primary" />
                            1. Penerimaan Ketentuan
                        </h2>
                        <p>
                            Dengan mengakses, mendaftar, atau membuat pesanan di {appName}, Anda menyetujui untuk terikat oleh Syarat dan Ketentuan Layanan ini. Jika Anda tidak menyetujui bagian mana pun dari ketentuan ini, Anda dianjurkan untuk tidak melanjutkan penggunaan layanan kami.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <ShoppingBag className="size-5 text-primary" />
                            2. Pemesanan & Pengiriman
                        </h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Pelanggan wajib memberikan informasi kontak dan alamat pengiriman yang akurat.</li>
                            <li>Pemesanan paket atau menu catering harus dilakukan sesuai dengan ketentuan batas waktu pemesanan yang berlaku.</li>
                            <li>Waktu pengiriman yang diperkirakan disesuaikan dengan kondisi jalan dan kesiapan hidangan.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <CreditCard className="size-5 text-primary" />
                            3. Pembayaran & Pembatalan
                        </h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Pembayaran dapat dilakukan melalui metode pembayaran sah yang tersedia di platform kami.</li>
                            <li>Pembatalan atau perubahan pesanan hanya dapat diproses sesuai kebijakan pembatalan toko yang berlaku sebelum waktu pengiriman yang ditentukan.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <AlertCircle className="size-5 text-primary" />
                            4. Tanggung Jawab Pengguna
                        </h2>
                        <p>
                            Pengguna bertanggung jawab untuk menjaga kerahasiaan otentikasi akun (seperti akun Google Anda) dan tidak menggunakan platform kami untuk kegiatan yang melanggar hukum.
                        </p>
                    </section>

                    <section className="space-y-3 border-t border-border pt-6">
                        <h2 className="text-lg font-semibold text-foreground">
                            5. Perubahan Ketentuan
                        </h2>
                        <p>
                            Kami berhak untuk mengubah atau memperbarui Syarat dan Ketentuan ini sewaktu-waktu tanpa pemberitahuan sebelumnya. Perubahan akan berlaku segera setelah dipublikasikan di halaman ini.
                        </p>
                    </section>
                </div>
            </div>
        </CustomerDetailLayout>
    );
}
