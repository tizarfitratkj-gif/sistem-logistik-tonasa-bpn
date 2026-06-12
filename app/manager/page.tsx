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
  Layers,
  Trash2,
  Clock,
  Info
} from "lucide-react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export const dynamic = 'force-dynamic'; 

// KOMPONEN SILO DINAMIS
const DynamicSilo = ({ current, max }: { current: number; max: number }) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  
  // Tentukan warna berdasarkan persentase
  const fillColor = percentage < 15 ? "bg-rose-500" : percentage < 35 ? "bg-amber-500" : "bg-[#2E6DA4]";
  const borderColor = percentage < 15 ? "border-rose-200" : percentage < 35 ? "border-amber-200" : "border-blue-100";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`relative w-24 h-48 bg-slate-100 border-4 ${borderColor} rounded-t-full rounded-b-lg overflow-hidden shadow-inner`}>
        {/* Cairan Semen Dinamis */}
        <div 
          className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ease-in-out ${fillColor} shadow-[0_-4px_10px_rgba(0,0,0,0.1)]`}
          style={{ height: `${percentage}%` }}
        >
          {/* Efek Kilauan di dalam Silo */}
          <div className="absolute top-0 left-0 w-full h-2 bg-white/20"></div>
        </div>
        
        {/* Garis Penanda Kapasitas */}
        <div className="absolute top-1/4 left-0 w-full h-[1px] bg-slate-300/50"></div>
        <div className="absolute top-2/4 left-0 w-full h-[1px] bg-slate-300/50"></div>
        <div className="absolute top-3/4 left-0 w-full h-[1px] bg-slate-300/50"></div>
      </div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">
        Silo 01: {percentage.toFixed(1)}%
      </div>
    </div>
  );
};

export default function ManagerDashboard() {
  const router = useRouter();
  const [stockSemen, setStockSemen] = useState(0);
  const MAX_CAPACITY_SILO = 5000; // Kapasitas Maksimum Silo Anda
  
  const [stockKantong, setStockKantong] = useState({
    tonasa50: 0, tonasa40: 0, gresik50: 0, gresik40: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [riwayatSemen, setRiwayatSemen] = useState<any[]>([]);
  const [riwayatKantong, setRiwayatKantong] = useState<any[]>([]);
  const [batasSemen, setBatasSemen] = useState(500);
  const [batasKantong, setBatasKantong] = useState(2000);

  const fetchAllStockAndSettings = async () => {
    const [semenRes, kantongRes, databaseSemenRows, databaseKantongRows, batasRes] = await Promise.all([
      supabase.from('stock_semen').select('*'),
      supabase.from('stock_kantong').select('*'),
      supabase.from('stock_semen').select('*').order('id', { ascending: false }).limit(5),
      supabase.from('stock_kantong').select('*').order('id', { ascending: false }).limit(5),
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
      setStockKantong({ tonasa50: t50, tonasa40: t40, gresik50: g50, gresik40: g40 });
    }

    if (databaseSemenRows.data) setRiwayatSemen(databaseSemenRows.data);
    if (databaseKantongRows.data) setRiwayatKantong(databaseKantongRows.data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAllStockAndSettings();
    const channelSemen = supabase.channel('rt-semen').on('postgres_changes', { event: '*', schema: 'public', table: 'stock_semen' }, () => fetchAllStockAndSettings()).subscribe();
    const channelKantong = supabase.channel('rt-kantong').on('postgres_changes', { event: '*', schema: 'public', table: 'stock_kantong' }, () => fetchAllStockAndSettings()).subscribe();
    return () => { supabase.removeChannel(channelSemen); supabase.removeChannel(channelKantong); };
  }, []);

  const handleHapusDataOlehManager = async (id: number, tabel: "stock_semen" | "stock_kantong") => {
    const result = await Swal.fire({
      title: "Hapus Data?",
      text: "Batalkan input ini? Stok akan dikalkulasi ulang.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E74C3C",
      confirmButtonText: "Ya, Hapus!",
      reverseButtons: true
    });
    if (!result.isConfirmed) return;
    const { error } = await supabase.from(tabel).delete().eq("id", id);
    if (!error) {
      Swal.fire({ title: "Dihapus!", icon: "success", timer: 1000, showConfirmButton: false });
      fetchAllStockAndSettings();
    }
  };

  const statusSemen = stockSemen < batasSemen ? "Kritis" : stockSemen < (batasSemen * 1.5) ? "Waspada" : "Aman";
  const getStatusKantong = (jumlah: number) => jumlah < batasKantong ? "Kritis" : jumlah < (batasKantong * 1.5) ? "Waspada" : "Aman";

  const StatusBadge = ({ status }: { status: string }) => {
    const colors = status === "Aman" ? "bg-emerald-50 text-emerald-700" : status === "Waspada" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700";
    return <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${colors}`}>{status}</span>;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 font-sans">
      <header className="max-w-7xl mx-auto mb-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Control Panel <span className="text-[#2E6DA4]">Gudang</span></h1>
          <div className="text-slate-500 font-medium mt-1 flex items-center gap-2">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div> Sistem Aktif Terpusat
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => router.push("/manager/laporan")} className="bg-white border border-slate-200 font-bold py-2.5 px-6 rounded-2xl shadow-sm hover:bg-slate-50">Data Laporan</button>
          <button onClick={() => router.push("/manager/pengaturan")} className="bg-[#1A3A5C] text-white font-bold py-2.5 px-6 rounded-2xl shadow-lg hover:bg-[#122841]">Konfigurasi</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-12">
        {/* SEKSI SEMEN DENGAN SILO DINAMIS */}
        <section>
          <h2 className="text-xl font-extrabold text-slate-700 mb-4 tracking-tight flex items-center gap-2"><Package size={20} className="text-[#2E6DA4]" /> Monitoring Silo Semen Curah</h2>
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row gap-10 items-center max-w-4xl">
            {/* Visual Silo */}
            <DynamicSilo current={stockSemen} max={MAX_CAPACITY_SILO} />
            
            <div className="flex-1 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-400 tracking-wider uppercase">Volume Stok Berjalan</span>
                <StatusBadge status={statusSemen} />
              </div>
              <div className="flex items-baseline gap-3">
                <h2 className="text-6xl font-black text-slate-800 tracking-tighter">{isLoading ? "---" : stockSemen.toLocaleString()}</h2>
                <span className="text-xl font-bold text-slate-400 uppercase">Ton</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Sisa Kapasitas</div>
                  <div className="text-lg font-black text-slate-700">{(MAX_CAPACITY_SILO - stockSemen).toLocaleString()} Ton</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Batas Kritis</div>
                  <div className="text-lg font-black text-rose-600">{batasSemen} Ton</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* KANTONG SECTION ... (Tetap Sama dengan Sebelumnya) */}
        <section>
          <h2 className="text-xl font-extrabold text-slate-700 mb-4 tracking-tight flex items-center gap-2"><Layers size={20} className="text-rose-500" /> Inventori Kantong Berdasarkan Merk & Ukuran</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-100/60 p-6 rounded-[2.5rem] space-y-6">
              <div className="flex items-center gap-2 px-2"><div className="w-3 h-6 bg-[#1A3A5C] rounded-full"></div><h3 className="text-lg font-black text-slate-800">Semen Tonasa</h3></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm"><StatusBadge status={getStatusKantong(stockKantong.tonasa50)} /><div className="text-3xl font-black mt-4">{stockKantong.tonasa50.toLocaleString()} <span className="text-xs text-slate-400">LBR</span></div><div className="text-[10px] font-bold text-slate-400 mt-2 tracking-tighter">UKURAN 50 KG</div></div>
                <div className="bg-white rounded-2xl p-6 shadow-sm"><StatusBadge status={getStatusKantong(stockKantong.tonasa40)} /><div className="text-3xl font-black mt-4">{stockKantong.tonasa40.toLocaleString()} <span className="text-xs text-slate-400">LBR</span></div><div className="text-[10px] font-bold text-slate-400 mt-2 tracking-tighter">UKURAN 40 KG</div></div>
              </div>
            </div>
            <div className="bg-slate-100/60 p-6 rounded-[2.5rem] space-y-6">
              <div className="flex items-center gap-2 px-2"><div className="w-3 h-6 bg-orange-500 rounded-full"></div><h3 className="text-lg font-black text-slate-800">Semen Gresik</h3></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm"><StatusBadge status={getStatusKantong(stockKantong.gresik50)} /><div className="text-3xl font-black mt-4">{stockKantong.gresik50.toLocaleString()} <span className="text-xs text-slate-400">LBR</span></div><div className="text-[10px] font-bold text-slate-400 mt-2 tracking-tighter">UKURAN 50 KG</div></div>
                <div className="bg-white rounded-2xl p-6 shadow-sm"><StatusBadge status={getStatusKantong(stockKantong.gresik40)} /><div className="text-3xl font-black mt-4">{stockKantong.gresik40.toLocaleString()} <span className="text-xs text-slate-400">LBR</span></div><div className="text-[10px] font-bold text-slate-400 mt-2 tracking-tighter">UKURAN 40 KG</div></div>
              </div>
            </div>
          </div>
        </section>

        {/* LOG KENDALI MANAGER ... (Tetap Sama dengan Sebelumnya) */}
        <section className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-xl shadow-slate-200/30">
          <div className="flex items-center gap-2 mb-6"><Clock size={20} className="text-[#1A3A5C]" /><h2 className="text-xl font-black text-slate-800">Pusat Pembatalan Data Admin (Real-Time)</h2></div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="overflow-x-auto"><table className="w-full text-left text-xs border-collapse"><thead><tr className="bg-slate-50 text-slate-400 font-bold"><th className="p-3">Aksi</th><th className="p-3">Semen</th><th className="p-3">Volume</th><th className="p-3 text-center">Batal</th></tr></thead><tbody className="bg-white divide-y divide-slate-50">{riwayatSemen.map((row) => (<tr key={row.id}><td><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.jenis_transaksi === "Stok Masuk" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{row.jenis_transaksi}</span></td><td className="p-3 font-bold">{row.jenis_semen}</td><td className="p-3 font-black text-[#2E6DA4]">{row.jumlah_ton} Ton</td><td className="text-center"><button onClick={() => handleHapusDataOlehManager(row.id, "stock_semen")} className="text-slate-400 hover:text-rose-600"><Trash2 size={14}/></button></td></tr>))}</tbody></table></div>
            <div className="overflow-x-auto"><table className="w-full text-left text-xs border-collapse"><thead><tr className="bg-slate-50 text-slate-400 font-bold"><th className="p-3">Aksi</th><th className="p-3">Merk</th><th className="p-3">Kondisi</th><th className="p-3">Volume</th><th className="p-3 text-center">Batal</th></tr></thead><tbody className="bg-white divide-y divide-slate-50">{riwayatKantong.map((row) => (<tr key={row.id}><td><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.jenis_transaksi === "Stok Masuk" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{row.jenis_transaksi}</span></td><td className="p-3 font-bold">{row.merk}</td><td className="p-3">{row.kondisi || "Normal"}</td><td className="p-3 font-black text-rose-600">{row.jumlah_lembar} Lbr</td><td className="text-center"><button onClick={() => handleHapusDataOlehManager(row.id, "stock_kantong")} className="text-slate-400 hover:text-rose-600"><Trash2 size={14}/></button></td></tr>))}</tbody></table></div>
          </div>
        </section>
      </main>
    </div>
  );
}