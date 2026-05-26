"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Settings, 
  Activity, 
  Package, 
  TrendingUp, 
  Layers 
} from "lucide-react";
import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic'; 

export default function ManagerDashboard() {
  const router = useRouter();
  const [stockSemen, setStockSemen] = useState(0);
  
  // State baru: Mengganti angka tunggal menjadi objek kategori terpisah
  const [stockKantong, setStockKantong] = useState({
    tonasa50: 0,
    tonasa40: 0,
    gresik50: 0,
    gresik40: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);

  // Batas minimum konfigurasi sistem
  const [batasSemen, setBatasSemen] = useState(500);
  const [batasKantong, setBatasKantong] = useState(2000);

  // Fungsi pengambilan data terpusat
  const fetchAllStockAndSettings = async () => {
    const [semenRes, kantongRes, batasRes] = await Promise.all([
      supabase.from('stock_semen').select('*'),
      supabase.from('stock_kantong').select('*'),
      supabase.from('batas_minimum').select('*').eq('id', 1).single()
    ]);
    
    if (batasRes.data && !batasRes.error) {
      setBatasSemen(parseFloat(batasRes.data.min_semen_ton));
      setBatasKantong(parseInt(batasRes.data.min_kantong_lembar));
    }

    // 1. Kalkulasi Stok Semen
    if (semenRes.data) {
      let totalSemen = 0;
      semenRes.data.forEach((row) => {
        if (row.jenis_transaksi === 'Stok Masuk') totalSemen += row.jumlah_ton;
        else if (row.jenis_transaksi === 'Stok Keluar') totalSemen -= row.jumlah_ton;
      });
      setStockSemen(totalSemen);
    }

    // 2. Kalkulasi Stok Kantong Terpisah (Tonasa & Gresik / 40Kg & 50Kg)
    if (kantongRes.data) {
      let t50 = 0, t40 = 0, g50 = 0, g40 = 0;
      
      kantongRes.data.forEach((row) => {
        const jumlah = row.jumlah_lembar;
        const multiplier = row.jenis_transaksi === 'Stok Masuk' ? 1 : -1;

        if (row.merk === 'Tonasa') {
          if (row.ukuran_kantong === '50 Kg') t50 += jumlah * multiplier;
          else if (row.ukuran_kantong === '40 Kg') t40 += jumlah * multiplier;
        } else if (row.merk === 'Gresik') {
          if (row.ukuran_kantong === '50 Kg') g50 += jumlah * multiplier;
          else if (row.ukuran_kantong === '40 Kg') g40 += jumlah * multiplier;
        }
      });

      setStockKantong({
        tonasa50: t50,
        tonasa40: t40,
        gresik50: g50,
        gresik40: g40
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAllStockAndSettings();

    // Menggunakan strategi pemicu ulang otomatis agar data realtime sinkron 100% saat terjadi perubahan/reset
    const channelSemen = supabase
      .channel('realtime-semen')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_semen' }, () => {
          fetchAllStockAndSettings();
      }).subscribe();

    const channelKantong = supabase
      .channel('realtime-kantong')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_kantong' }, () => {
          fetchAllStockAndSettings();
      }).subscribe();

    return () => {
      supabase.removeChannel(channelSemen);
      supabase.removeChannel(channelKantong);
    };
  }, []);

  // Logika Status Dinamis
  const statusSemen = stockSemen < batasSemen ? "Kritis" : stockSemen < (batasSemen * 1.5) ? "Waspada" : "Aman";
  
  const getStatusKantong = (jumlah: number) => {
    return jumlah < batasKantong ? "Kritis" : jumlah < (batasKantong * 1.5) ? "Waspada" : "Aman";
  };

  // Komponen Badge Status Modern
  const StatusBadge = ({ status }: { status: string }) => {
    if (status === "Aman") return (
      <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
        <CheckCircle2 size={14} /> Aman
      </span>
    );
    if (status === "Waspada") return (
      <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
        <Activity size={14} /> Waspada
      </span>
    );
    return (
      <span className="flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-100 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
        <AlertCircle size={14} /> Kritis
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 font-sans selection:bg-[#1A3A5C] selection:text-white">
      
      {/* Header Area */}
      <header className="max-w-7xl mx-auto mb-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#1A3A5C] p-2.5 rounded-2xl text-white shadow-lg shadow-blue-900/20">
              <TrendingUp size={24} />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
              Control Panel <span className="text-[#2E6DA4]">Gudang</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-slate-500 font-medium ml-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Sistem Pemantauan Terpusat Real-Time
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => router.push("/manager/laporan")}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-2.5 px-6 rounded-2xl shadow-sm transition-all active:scale-95"
          >
            <FileText size={18} className="text-[#2E6DA4]" /> 
            Data Laporan
          </button>
          <button 
            onClick={() => router.push("/manager/pengaturan")}
            className="flex items-center gap-2 bg-[#1A3A5C] hover:bg-[#122841] text-white font-bold py-2.5 px-6 rounded-2xl shadow-lg shadow-blue-900/20 transition-all active:scale-95"
          >
            <Settings size={18} /> 
            Konfigurasi
          </button>
        </div>
      </header>

      {/* Main Stats Area */}
      <main className="max-w-7xl mx-auto space-y-10">
        
        {/* BAGIAN 1: TOTAL STOK SEMEN */}
        <section>
          <h2 className="text-xl font-extrabold text-slate-700 mb-4 tracking-tight flex items-center gap-2">
            <Package size={20} className="text-[#2E6DA4]" /> Komoditas Semen (Curah / Zak)
          </h2>
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:border-blue-200 transition-colors max-w-2xl">
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-blue-50/50 rounded-full blur-2xl group-hover:bg-blue-100/50 transition-colors"></div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-black text-slate-400 tracking-wider uppercase">Volume Semen Berjalan</span>
              <StatusBadge status={statusSemen} />
            </div>
            <div className="flex items-baseline gap-3 mb-6">
              <h2 className="text-6xl font-black text-slate-800 tracking-tighter">
                {isLoading ? "---" : stockSemen}
              </h2>
              <span className="text-xl font-bold text-slate-400 uppercase">Ton</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold text-slate-500">
              <span>Ambang Batas Minimum</span>
              <span className="text-slate-800 font-black">{batasSemen} Ton</span>
            </div>
          </div>
        </section>

        {/* BAGIAN 2: GRID STOK KANTONG YANG DIPISAH BERDASARKAN MERK & BERAT */}
        <section>
          <h2 className="text-xl font-extrabold text-slate-700 mb-4 tracking-tight flex items-center gap-2">
            <Layers size={20} className="text-rose-500" /> Inventori Kantong Berdasarkan Merk & Ukuran
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* KELOMPOK: SEMEN TONASA */}
            <div className="bg-slate-100/60 border border-slate-200 p-6 rounded-[2.5rem] space-y-6">
              <div className="flex items-center gap-2 px-2">
                <div className="w-3 h-6 bg-[#1A3A5C] rounded-full"></div>
                <h3 className="text-lg font-black text-slate-800">Merek: Semen Tonasa</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tonasa 50 Kg */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm relative group hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-black bg-blue-50 text-blue-800 px-2.5 py-1 rounded-md">Ukuran 50 KG</span>
                    <StatusBadge status={getStatusKantong(stockKantong.tonasa50)} />
                  </div>
                  <div className="text-4xl font-black text-slate-800 tracking-tight mb-4">
                    {isLoading ? "---" : stockKantong.tonasa50.toLocaleString()} <span className="text-xs text-slate-400 font-bold">LBR</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 border-t border-slate-100 pt-2 flex justify-between">
                    <span>Min: {batasKantong.toLocaleString()} Lbr</span>
                  </div>
                </div>

                {/* Tonasa 40 Kg */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm relative group hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-black bg-blue-50 text-blue-800 px-2.5 py-1 rounded-md">Ukuran 40 KG</span>
                    <StatusBadge status={getStatusKantong(stockKantong.tonasa40)} />
                  </div>
                  <div className="text-4xl font-black text-slate-800 tracking-tight mb-4">
                    {isLoading ? "---" : stockKantong.tonasa40.toLocaleString()} <span className="text-xs text-slate-400 font-bold">LBR</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 border-t border-slate-100 pt-2 flex justify-between">
                    <span>Min: {batasKantong.toLocaleString()} Lbr</span>
                  </div>
                </div>
              </div>
            </div>

            {/* KELOMPOK: SEMEN GRESIK */}
            <div className="bg-slate-100/60 border border-slate-200 p-6 rounded-[2.5rem] space-y-6">
              <div className="flex items-center gap-2 px-2">
                <div className="w-3 h-6 bg-orange-500 rounded-full"></div>
                <h3 className="text-lg font-black text-slate-800">Merek: Semen Gresik</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Gresik 50 Kg */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm relative group hover:border-orange-300 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-black bg-orange-50 text-orange-800 px-2.5 py-1 rounded-md">Ukuran 50 KG</span>
                    <StatusBadge status={getStatusKantong(stockKantong.gresik50)} />
                  </div>
                  <div className="text-4xl font-black text-slate-800 tracking-tight mb-4">
                    {isLoading ? "---" : stockKantong.gresik50.toLocaleString()} <span className="text-xs text-slate-400 font-bold">LBR</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 border-t border-slate-100 pt-2 flex justify-between">
                    <span>Min: {batasKantong.toLocaleString()} Lbr</span>
                  </div>
                </div>

                {/* Gresik 40 Kg */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm relative group hover:border-orange-300 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-black bg-orange-50 text-orange-800 px-2.5 py-1 rounded-md">Ukuran 40 KG</span>
                    <StatusBadge status={getStatusKantong(stockKantong.gresik40)} />
                  </div>
                  <div className="text-4xl font-black text-slate-800 tracking-tight mb-4">
                    {isLoading ? "---" : stockKantong.gresik40.toLocaleString()} <span className="text-xs text-slate-400 font-bold">LBR</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 border-t border-slate-100 pt-2 flex justify-between">
                    <span>Min: {batasKantong.toLocaleString()} Lbr</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* Footer Info */}
      <footer className="max-w-7xl mx-auto mt-16 text-center text-slate-400 text-sm font-medium">
        PP. Balikpapan Logistik Monitoring System © 2026
      </footer>

    </div>
  );
}