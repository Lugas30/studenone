"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import logo from "../public/images/studentone-logo.png";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Atur jeda waktu (delay) di sini (misalnya 2000 milidetik = 2 detik)
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Lakukan pengalihan ke halaman dashboard
      router.push("/dashboard");
    }, 3000); // <-- Jeda 2 detik

    // Cleanup function: penting untuk membersihkan timer
    return () => clearTimeout(timer);
  }, [router]);

  if (isLoading) {
    // Tampilkan Loading Screen
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-3xl font-semibold text-black">
          <img src={logo.src} alt="Student One" className="w-40" />
        </div>
        {/* Anda bisa menambahkan spinner atau animasi loading di sini */}
      </div>
    );
  }

  // Setelah isLoading menjadi false, halaman ini akan segera dialihkan oleh router.push('/dashboard')
  return null;
}
