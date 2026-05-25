"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Memaksa browser pindah ke halaman login secara otomatis
    router.push("/login");
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-[#1A3A5C] rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium animate-pulse">Mengarahkan ke Portal Logistik...</p>
    </div>
  );
}