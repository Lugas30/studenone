// app/preview-detail-pid/page.tsx
import { Suspense } from "react";
import PreviewDetailPID from "./PreviewDetailPID";

/**
 * Komponen Page utama untuk /preview-detail-pid.
 * Komponen ini secara default adalah Server Component (App Router).
 * Kami membungkus Client Component PreviewDetailPID dengan <Suspense>
 * untuk mengatasi error "missing-suspense-with-csr-bailout"
 * yang disebabkan oleh penggunaan useSearchParams di client component.
 */
export default function PreviewDetailPIDPage() {
  return (
    // Tambahkan <Suspense> di sini
    <Suspense
      fallback={
        <div style={{ padding: "24px", textAlign: "center" }}>
          Memuat detail kelas...
        </div>
      }
    >
      <PreviewDetailPID />
    </Suspense>
  );
}
