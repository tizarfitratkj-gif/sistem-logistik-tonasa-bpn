"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Settings, 
  Activity, 
  Box, 
  Package, 
  TrendingUp, 
  Layers 
} from "lucide-react";
import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic'; 

export default function ManagerDashboard() {
  const router = useRouter();
  const [stockSemen, setStockSemen] = useState(0);
  const [stockKantong, setStockKantong] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // State untuk menyimpan konfigurasi batas minimum dari database
  const [batasSemen, setBatasSemen] = useState(500);
  const [batasKantong, setBatasKantong] = useState(2000);

  useEffect(() => {
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

      if (semenRes.data) {
        let totalSemen = 0;
        semenRes.data.forEach((row) => {
          if (row.jenis_transaksi === 'Stok Masuk') totalSemen += row.jumlah_ton;
          else if (row.jenis_transaksi === 'Stok Keluar') totalSemen -= row.jumlah_ton;
        });
        setStockSemen(totalSemen);
      }

      if (kantongRes.data) {
        let totalKantong = 0;
        kantongRes.data.forEach((row) => {
          if (row.jenis_transaksi === 'Stok Masuk') totalKantong += row.jumlah_lembar;
          else if (row.jenis_transaksi === 'Stok Keluar') totalKantong -= row.jumlah_lembar;
        });
        setStockKantong(totalKantong);
      }
      setIsLoading(false);
    };

    fetchAllStockAndSettings();

    const channelSemen = supabase
      .channel('realtime-semen')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stock_semen' }, (payload) => {
          const newData = payload.new as any; 
          setStockSemen((prev) => newData.jenis_transaksi === 'Stok Masuk' ? prev + newData.jumlah_ton : prev - newData.jumlah_ton);
      }).subscribe();

    const channelKantong = supabase
      .channel('realtime-kantong')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stock_kantong' }, (payload) => {
          const newData = payload.new as any; 
          setStockKantong((prev) => newData.jenis_transaksi === 'Stok Masuk' ? prev + newData.jumlah_lembar : prev - newData.jumlah_lembar);
      }).subscribe();

    return () => {
      supabase.removeChannel(channelSemen);
      supabase.removeChannel(channelKantong);
    };
  }, []);

  // Logika Status Dinamis
  const statusSemen = stockSemen < batasSemen ? "Kritis" : stockSemen < (batasSemen * 1.5) ? "Waspada" : "Aman";
  const statusKantong = stockKantong < batasKantong ? "Kritis" : stockKantong < (batasKantong * 1.5) ? "Waspada" : "Aman";

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

      {/* Main Stats Grid */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Card: Stock Semen */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden group hover:border-blue-200 transition-colors">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-blue-50/50 rounded-full blur-2xl group-hover:bg-blue-100/50 transition-colors"></div>
          
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-[#2E6DA4] rounded-2xl">
                <Package size={24} />
              </div>
              <span className="text-lg font-bold text-slate-600 tracking-wide">STOCK SEMEN</span>
            </div>
            <StatusBadge status={statusSemen} />
          </div>

          <div className="flex items-baseline gap-3 mb-8">
            <h2 className="text-7xl font-black text-slate-800 tracking-tighter">
              {isLoading ? "---" : stockSemen}
            </h2>
            <span className="text-2xl font-bold text-slate-400 uppercase">Ton</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-sm font-bold text-slate-500">Ambang Batas Kritis</span>
            <span className="text-sm font-black text-slate-800">{batasSemen} Ton</span>
          </div>
        </div>

        {/* Card: Stock Kantong */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden group hover:border-rose-200 transition-colors">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-rose-50/50 rounded-full blur-2xl group-hover:bg-rose-100/50 transition-colors"></div>
          
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl">
                <Layers size={24} />
              </div>
              <span className="text-lg font-bold text-slate-600 tracking-wide">STOK KANTONG</span>
            </div>
            <StatusBadge status={statusKantong} />
          </div>

          <div className="flex items-baseline gap-3 mb-8">
            <h2 className="text-7xl font-black text-slate-800 tracking-tighter">
              {isLoading ? "---" : stockKantong.toLocaleString()}
            </h2>
            <span className="text-2xl font-bold text-slate-400 uppercase">Lbr</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-sm font-bold text-slate-500">Ambang Batas Kritis</span>
            <span className="text-sm font-black text-slate-800">{batasKantong.toLocaleString()} Lbr</span>
          </div>
        </div>

      </main>

      {/* Footer Info */}
      <footer className="max-w-7xl mx-auto mt-12 text-center text-slate-400 text-sm font-medium">
        PP. Balikpapan Logistik Monitoring System © 2024
      </footer>

    </div>
  );
}