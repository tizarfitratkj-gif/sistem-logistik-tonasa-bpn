"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  BarChart3, 
  Calendar, 
  FileText, 
  Package, 
  Download, 
  Filter, 
  FileSpreadsheet, 
  Database 
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const dynamic = 'force-dynamic';

interface Transaksi {
  id: string;
  tanggal_waktu: string;
  jenis_transaksi: string;
  produk: "Semen" | "Kantong";
  jumlah: number;
  detail: string;
  keterangan: string;
}

export default function LaporanPage() {
  const router = useRouter();
  const [filterPeriode, setFilterPeriode] = useState<"harian" | "mingguan" | "bulanan">("mingguan");
  const [filterProduk, setFilterProduk] = useState<"Semua" | "Semen" | "Kantong">("Semua");
  
  // State baru untuk sub-filter kemasan (Curah/Zak)
  const [filterKemasan, setFilterKemasan] = useState<"Semua" | "Curah" | "Zak">("Semua");
  
  const [histori, setHistori] = useState<Transaksi[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cekSesi = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/login");
    };
    cekSesi();
  }, [router]);

  useEffect(() => {
    const fetchHistoriData = async () => {
      setIsLoading(true);
      const [semenRes, kantongRes] = await Promise.all([
        supabase.from("stock_semen").select("*").order("tanggal_waktu", { ascending: false }),
        supabase.from("stock_kantong").select("*").order("tanggal_waktu", { ascending: false })
      ]);

      const gabungan: Transaksi[] = [];
      if (semenRes.data) {
        semenRes.data.forEach((item: any) => {
          gabungan.push({
            id: item.id,
            tanggal_waktu: item.tanggal_waktu,
            jenis_transaksi: item.jenis_transaksi,
            produk: "Semen",
            jumlah: item.jumlah_ton,
            detail: item.jenis_semen,
            keterangan: item.keterangan || "-",
          });
        });
      }

      if (kantongRes.data) {
        kantongRes.data.forEach((item: any) => {
          gabungan.push({
            id: item.id,
            tanggal_waktu: item.tanggal_waktu,
            jenis_transaksi: item.jenis_transaksi,
            produk: "Kantong",
            jumlah: item.jumlah_lembar,
            detail: `Ukuran ${item.ukuran_kantong}`,
            keterangan: item.keterangan || "-",
          });
        });
      }

      gabungan.sort((a, b) => new Date(b.tanggal_waktu).getTime() - new Date(a.tanggal_waktu).getTime());
      setHistori(gabungan);
      setIsLoading(false);
    };

    fetchHistoriData();
  }, []);

  const dataTerfilter = histori.filter((item) => {
    // 1. Filter Produk Utama
    if (filterProduk !== "Semua" && item.produk !== filterProduk) return false;
    
    // 2. Filter Sub-Kemasan (Hanya berlaku jika difilter "Semen")
    if (filterProduk === "Semen" && filterKemasan !== "Semua") {
      // Mencari kata "Curah" atau "Zak" yang tersimpan di bagian detail
      if (!item.detail.includes(filterKemasan)) return false;
    }

    // 3. Filter Tanggal
    const tglItem = new Date(item.tanggal_waktu);
    const sekarang = new Date();
    
    if (filterPeriode === "harian") {
      return tglItem.toDateString() === sekarang.toDateString();
    } else if (filterPeriode === "mingguan") {
      const satuMingguLalu = new Date();
      satuMingguLalu.setDate(sekarang.getDate() - 7);
      return tglItem >= satuMingguLalu;
    } else if (filterPeriode === "bulanan") {
      return tglItem.getMonth() === sekarang.getMonth() && tglItem.getFullYear() === sekarang.getFullYear();
    }
    return true;
  });

  const exportToExcel = () => {
    const excelData = dataTerfilter.map(row => ({
      "Tanggal & Waktu": new Date(row.tanggal_waktu).toLocaleString("id-ID", { hour12: false }) + " WITA",
      "Kategori Produk": row.produk,
      "Jenis Transaksi": row.jenis_transaksi,
      "Jumlah": row.jumlah,
      "Satuan": row.produk === "Semen" ? "Ton" : "Lembar",
      "Spesifikasi Detail": row.detail,
      "Keterangan": row.keterangan
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Stok");
    XLSX.writeFile(workbook, `Rekap_Logistik_Gudang_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("Laporan Histori Mutasi Stok PP.Balikpapan", 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Dicetak pada: ${new Date().toLocaleString("id-ID", { hour12: false })} WITA`, 14, 22);
    
    // Update teks PDF agar menampilkan filter kemasan jika aktif
    let filterText = `Filter Aktif: Periode ${filterPeriode} | Produk: ${filterProduk}`;
    if (filterProduk === "Semen" && filterKemasan !== "Semua") filterText += ` (${filterKemasan})`;
    doc.text(filterText, 14, 28);

    const tableColumn = ["Tanggal & Waktu", "Produk", "Jenis", "Jumlah", "Keterangan"];
    const tableRows: any[] = [];

    dataTerfilter.forEach(row => {
      const rowData = [
        new Date(row.tanggal_waktu).toLocaleString("id-ID", { hour12: false }),
        row.produk,
        row.jenis_transaksi,
        row.produk === "Semen" ? `${row.jumlah} Ton` : `${row.jumlah} Lbr`,
        row.keterangan
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [26, 58, 92] } 
    });

    doc.save(`Laporan_PDF_Gudang_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 font-sans selection:bg-[#1A3A5C] selection:text-white">
      
      <header className="max-w-7xl mx-auto mb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 border-b border-slate-200 pb-6">
        <div>
          <button 
            onClick={() => router.push("/manager")}
            className="flex items-center gap-2 text-slate-500 hover:text-[#2E6DA4] font-semibold mb-4 transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
            Kembali ke Dashboard Utama
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-[#1A3A5C] p-2.5 rounded-2xl text-white shadow-lg shadow-blue-900/20">
              <Database size={28} />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
              Audit & <span className="text-[#2E6DA4]">Laporan</span>
            </h1>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={exportToExcel} 
            className="group bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 hover:border-emerald-600 text-emerald-700 hover:text-white font-bold py-2.5 px-5 rounded-xl shadow-sm transition-all duration-300 flex items-center gap-2 active:scale-95"
          >
            <FileSpreadsheet size={18} className="transition-transform group-hover:scale-110" /> 
            Unduh Excel
          </button>
          <button 
            onClick={exportToPDF} 
            className="group bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 text-rose-700 hover:text-white font-bold py-2.5 px-5 rounded-xl shadow-sm transition-all duration-300 flex items-center gap-2 active:scale-95"
          >
            <FileText size={18} className="transition-transform group-hover:scale-110" /> 
            Unduh PDF
          </button>
        </div>
      </header>

      {/* Panel Kontrol Filter */}
      <div className="max-w-7xl mx-auto bg-white p-5 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 mb-8 flex flex-col xl:flex-row gap-6 items-center justify-between">
        <div className="flex flex-col md:flex-row flex-wrap gap-4 w-full xl:w-auto">
          
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
            <Filter size={16} className="text-slate-400" />
            <select 
              value={filterProduk} 
              onChange={(e) => {
                setFilterProduk(e.target.value as any);
                if (e.target.value !== "Semen") setFilterKemasan("Semua"); // Reset filter sub-kemasan jika produk bukan Semen
              }}
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Produk</option>
              <option value="Semen">Khusus Semen</option>
              <option value="Kantong">Khusus Kantong</option>
            </select>
          </div>

          {/* Munculkan sub-filter Kemasan HANYA jika filter utama adalah Semen */}
          {filterProduk === "Semen" && (
             <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
               <Package size={16} className="text-emerald-500" />
               <select 
                 value={filterKemasan} 
                 onChange={(e) => setFilterKemasan(e.target.value as any)}
                 className="bg-transparent text-sm font-bold text-emerald-800 focus:outline-none cursor-pointer"
               >
                 <option value="Semua">Semua Kemasan</option>
                 <option value="Curah">Semen Curah</option>
                 <option value="Zak">Semen Zak</option>
               </select>
             </div>
          )}

          <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-1">
            {(['harian', 'mingguan', 'bulanan'] as const).map((periode) => (
              <button 
                key={periode}
                onClick={() => setFilterPeriode(periode)} 
                className={`px-5 py-2 text-sm font-bold rounded-lg capitalize transition-all duration-300 ${
                  filterPeriode === periode 
                    ? "bg-white text-[#1A3A5C] shadow-sm" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {periode}
              </button>
            ))}
          </div>
        </div>
        
        <div className="text-sm text-slate-500 font-medium whitespace-nowrap bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
          Ditemukan <span className="text-[#1A3A5C] font-black text-base ml-1">{dataTerfilter.length}</span> rekam data
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-[#2E6DA4] rounded-lg"><BarChart3 size={20} /></div>
            Fluktuasi 7 Hari Terakhir
          </h3>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">SIMULASI</span>
        </div>
        <div className="h-48 flex items-end justify-between gap-3 pt-4 px-2">
          {[
            { label: "Sen", height: "40%", color: "bg-emerald-400" },
            { label: "Sel", height: "55%", color: "bg-emerald-400" },
            { label: "Rab", height: "30%", color: "bg-amber-400" },
            { label: "Kam", height: "70%", color: "bg-emerald-400" },
            { label: "Jum", height: "85%", color: "bg-emerald-500" },
            { label: "Sab", height: "15%", color: "bg-rose-400" },
            { label: "Min", height: "60%", color: "bg-emerald-400" }
          ].map((bar, index) => (
            <div key={index} className="w-full h-full flex flex-col items-center justify-end gap-3 group cursor-pointer">
              <div className="w-full relative flex items-end justify-center h-full bg-slate-50 rounded-t-xl overflow-hidden">
                <div className={`w-full rounded-t-xl ${bar.color} transition-all duration-500 group-hover:opacity-80`} style={{ height: bar.height }}></div>
              </div>
              <span className="text-xs font-bold text-slate-400">{bar.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden mb-12">
        <div className="p-6 bg-gradient-to-r from-[#1A3A5C] to-[#2E6DA4] text-white flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-lg">
            <Package size={22} className="text-blue-200" /> 
            Tabel Rekam Jejak Logistik
          </div>
          <Download size={20} className="text-blue-200 opacity-50" />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider font-bold text-slate-500">
                <th className="p-5 pl-8">Tanggal & Waktu</th>
                <th className="p-5">Produk</th>
                <th className="p-5">Jenis Transaksi</th>
                <th className="p-5">Volume</th>
                <th className="p-5">Keterangan Tambahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                      <div className="w-8 h-8 border-4 border-slate-200 border-t-[#2E6DA4] rounded-full animate-spin"></div>
                      <span className="font-medium text-sm">Menyinkronkan data dari server...</span>
                    </div>
                  </td>
                </tr>
              ) : dataTerfilter.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                    Tidak ada rekaman transaksi yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                dataTerfilter.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-5 pl-8 text-slate-600 font-medium text-sm flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-400 group-hover:text-[#2E6DA4] transition-colors">
                        <Calendar size={16} />
                      </div>
                      {new Date(row.tanggal_waktu).toLocaleString("id-ID", { hour12: false, day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                    </td>
                    <td className="p-5">
                      <div>
                        <span className="font-bold text-slate-800">{row.produk}</span>
                        {/* Menampilkan Spesifikasi Detail (Termasuk Curah/Zak) */}
                        <div className="text-xs text-[#2E6DA4] font-bold mt-1 bg-blue-50 inline-block px-2 py-0.5 rounded border border-blue-100">
                          {row.detail}
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wide ${
                        row.jenis_transaksi === "Stok Masuk" ? "bg-emerald-100 text-emerald-700" :
                        row.jenis_transaksi === "Stok Keluar" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {row.jenis_transaksi.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className="font-black text-slate-800 text-lg">
                        {row.produk === "Semen" ? row.jumlah : row.jumlah.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-slate-400 ml-1">
                        {row.produk === "Semen" ? "TON" : "LBR"}
                      </span>
                    </td>
                    <td className="p-5">
                      <p className="text-sm text-slate-600 max-w-[250px] truncate" title={row.keterangan}>
                        {row.keterangan}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}