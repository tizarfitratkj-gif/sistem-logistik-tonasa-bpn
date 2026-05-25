"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, Settings, Save } from "lucide-react";

export default function PengaturanBatasPage() {
  const router = useRouter();
  const [minSemen, setMinSemen] = useState("");
  const [minKantong, setMinKantong] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Cek sesi login
  useEffect(() => {
    const cekSesi = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      }
    };
    cekSesi();
  }, [router]);

  // Ambil data batas minimum yang tersimpan di Supabase
  useEffect(() => {
    const fetchBatas = async () => {
      const { data, error } = await supabase
        .from("batas_minimum")
        .select("*")
        .eq("id", 1)
        .single();

      if (data && !error) {
        setMinSemen(data.min_semen_ton.toString());
        setMinKantong(data.min_kantong_lembar.toString());
      }
      setIsLoading(false);
    };

    fetchBatas();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const { error } = await supabase
      .from("batas_minimum")
      .update({
        min_semen_ton: parseFloat(minSemen),
        min_kantong_lembar: parseInt(minKantong)
      })
      .eq("id", 1);

    setIsSaving(false);

    if (error) {
      alert("Gagal memperbarui pengaturan: " + error.message);
    } else {
      alert("Sukses! Batas minimum operasional berhasil diperbarui.");
      window.location.href = "/manager"; // Memaksa browser refresh data terbaru
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Memuat data pengaturan...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F2F5F8] p-8 text-gray-800">
      <header className="mb-8">
        <button 
          onClick={() => router.push("/manager")}
          className="flex items-center gap-2 text-[#2E6DA4] hover:text-[#1A3A5C] font-semibold mb-2 transition-colors"
        >
          <ArrowLeft size={18} /> Kembali ke Dashboard
        </button>
        <h1 className="text-3xl font-bold text-[#1A3A5C] flex items-center gap-2">
          <Settings size={28} /> Pengaturan Batas Minimum Stok
        </h1>
        <p className="text-gray-600">Tentukan ambang batas peringatan kritis untuk persediaan gudang</p>
      </header>

      <form onSubmit={handleSave} className="max-w-xl bg-white p-6 rounded-lg shadow-md border">
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Batas Minimum Stok Semen (Ton)
          </label>
          <input 
            type="number" 
            step="0.01"
            className="w-full border p-3 rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2E6DA4]"
            value={minSemen}
            onChange={(e) => setMinSemen(e.target.value)}
            placeholder="Contoh: 500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Stok di bawah angka ini akan memicu indikator warna merah (Kritis).</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Batas Minimum Stok Kantong (Lembar)
          </label>
          <input 
            type="number" 
            className="w-full border p-3 rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2E6DA4]"
            value={minKantong}
            onChange={(e) => setMinKantong(e.target.value)}
            placeholder="Contoh: 2000"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Persediaan lembar kantong di bawah angka ini akan dianggap kritis.</p>
        </div>

        <button 
          type="submit" 
          disabled={isSaving}
          className={`w-full text-white font-bold py-3 px-4 rounded text-lg transition-colors flex items-center justify-center gap-2 ${
            isSaving ? "bg-gray-400" : "bg-[#1A3A5C] hover:bg-[#2E6DA4]"
          }`}
        >
          <Save size={20} />
          {isSaving ? "Menyimpan..." : "Simpan Batas Stok Baru"}
        </button>
      </form>
    </div>
  );
}