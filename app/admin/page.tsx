"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { ClipboardEdit, Package, Layers, Save, Trash2, AlertTriangle } from "lucide-react";
import Swal from "sweetalert2"; // Import SweetAlert2

export default function AdminDashboard() {
  const [tipeInput, setTipeInput] = useState<"Semen" | "Kantong">("Semen");
  
  const [jumlah, setJumlah] = useState("");
  const [jenisTransaksi, setJenisTransaksi] = useState("Stok Masuk");
  const [jenisSemen, setJenisSemen] = useState("Semen Portland");
  const [kemasanSemen, setKemasanSemen] = useState("Curah");
  const [ukuranKantong, setUkuranKantong] = useState("50 Kg");
  const [keterangan, setKeterangan] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let table = tipeInput === "Semen" ? "stock_semen" : "stock_kantong";
    let dataInsert = {};

    if (tipeInput === "Semen") {
      let finalJenisSemen = jenisSemen;
      if (jenisTransaksi === "Stok Keluar") {
        finalJenisSemen = `${jenisSemen} (${kemasanSemen})`;
      }

      dataInsert = { 
        jenis_transaksi: jenisTransaksi, 
        jenis_semen: finalJenisSemen, 
        jumlah_ton: parseFloat(jumlah),
        keterangan: keterangan
      };
    } else {
      dataInsert = {
        jenis_transaksi: jenisTransaksi,
        ukuran_kantong: ukuranKantong,
        jumlah_lembar: parseInt(jumlah),
        keterangan: keterangan
      };
    }

    const { error } = await supabase.from(table).insert([dataInsert]);

    setIsLoading(false);

    if (error) {
      // Pop-up Error Modern
      Swal.fire({
        title: "Gagal Menyimpan!",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#E74C3C",
        confirmButtonText: "Tutup"
      });
    } else {
      // Pop-up Sukses Modern
      Swal.fire({
        title: "Tersimpan!",
        text: `Data logistik ${tipeInput} berhasil ditambahkan ke database.`,
        icon: "success",
        confirmButtonColor: "#1A3A5C",
        confirmButtonText: "Selesai"
      });
      setJumlah(""); 
      setKeterangan("");
    }
  };

  const handleResetData = async () => {
    // Pop-up Konfirmasi Ganda Modern
    const result = await Swal.fire({
      title: "Peringatan Kritis!",
      text: "Anda yakin ingin MENGHAPUS SEMUA DATA riwayat stok Semen dan Kantong? Tindakan ini permanen!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E74C3C", // Warna merah danger
      cancelButtonColor: "#64748B",  // Warna abu-abu netral
      confirmButtonText: "Ya, Hapus Semua Data!",
      cancelButtonText: "Batal",
      reverseButtons: true // Menaruh tombol batal di sebelah kanan
    });

    // Jika user mengklik "Batal" atau menutup pop-up
    if (!result.isConfirmed) return;

    setIsResetting(true);

    try {
      const resSemen = await supabase.from("stock_semen").delete().neq("jenis_transaksi", "");
      const resKantong = await supabase.from("stock_kantong").delete().neq("jenis_transaksi", "");

      if (resSemen.error) throw resSemen.error;
      if (resKantong.error) throw resKantong.error;

      // Pop-up Sukses Reset
      await Swal.fire({
        title: "Data Dihapus!",
        text: "Seluruh data riwayat stok telah dibersihkan dari sistem.",
        icon: "success",
        confirmButtonColor: "#1A3A5C"
      });
      
      window.location.href = "/manager";
    } catch (error: any) {
      Swal.fire({
        title: "Terjadi Kesalahan",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#E74C3C"
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 md:p-12 font-sans selection:bg-[#1A3A5C] selection:text-white"> 
      
      <header className="max-w-2xl mx-auto mb-10 flex flex-col sm:flex-row sm:items-center gap-4 border-b border-gray-100 pb-6">
        <div className="bg-[#1A3A5C] p-3 rounded-2xl text-white shadow-lg shadow-blue-900/20 inline-block self-start sm:self-auto">
          <ClipboardEdit size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Input Logistik</h1>
          <p className="text-slate-500 font-medium mt-1">Pembaruan data stok gudang PP. Balikpapan</p>
        </div>
      </header>
      
      <div className="flex p-1.5 mb-8 bg-slate-100 rounded-2xl max-w-2xl mx-auto border border-slate-200">
        <button 
          type="button"
          onClick={() => setTipeInput("Semen")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
            tipeInput === "Semen" 
              ? "bg-white text-[#1A3A5C] shadow-sm border border-slate-200/50" 
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          <Package size={18} />
          Input Semen
        </button>
        <button 
          type="button"
          onClick={() => setTipeInput("Kantong")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
            tipeInput === "Kantong" 
              ? "bg-white text-[#1A3A5C] shadow-sm border border-slate-200/50" 
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          <Layers size={18} />
          Input Kantong
        </button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 mb-8">
        
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">Jenis Transaksi *</label>
          <select 
            className="w-full border border-slate-200 bg-slate-50 p-3.5 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-[#2E6DA4] focus:ring-4 focus:ring-blue-900/5 transition-all cursor-pointer" 
            value={jenisTransaksi} 
            onChange={(e) => setJenisTransaksi(e.target.value)}
            required
          >
            <option value="Stok Masuk">Stok Masuk (Penambahan)</option>
            <option value="Stok Keluar">Stok Keluar (Pengurangan)</option>
            <option value="Penyesuaian">Penyesuaian Sistem</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {tipeInput === "Semen" ? (
            <>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Jenis Semen *</label>
                <select 
                  className="w-full border border-slate-200 bg-slate-50 p-3.5 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-[#2E6DA4] focus:ring-4 focus:ring-blue-900/5 transition-all cursor-pointer" 
                  value={jenisSemen} 
                  onChange={(e) => setJenisSemen(e.target.value)}
                >
                  <option value="Semen Portland">Semen Portland (OPC)</option>
                  <option value="Semen PCC">Semen PCC</option>
                </select>
              </div>

              {jenisTransaksi === "Stok Keluar" && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tipe Kemasan Pengeluaran *</label>
                  <select 
                    className="w-full border border-emerald-300 bg-emerald-50 p-3.5 rounded-xl text-emerald-800 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-900/10 transition-all cursor-pointer" 
                    value={kemasanSemen} 
                    onChange={(e) => setKemasanSemen(e.target.value)}
                  >
                    <option value="Curah">Semen Curah (Bulk)</option>
                    <option value="Zak">Semen Zak (Bagged)</option>
                  </select>
                </div>
              )}
            </>
          ) : (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Ukuran Kantong *</label>
              <select 
                className="w-full border border-slate-200 bg-slate-50 p-3.5 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-[#2E6DA4] focus:ring-4 focus:ring-blue-900/5 transition-all cursor-pointer" 
                value={ukuranKantong} 
                onChange={(e) => setUkuranKantong(e.target.value)}
              >
                <option value="50 Kg">Kantong 50 Kg</option>
                <option value="40 Kg">Kantong 40 Kg</option>
              </select>
            </div>
          )}

          <div className={tipeInput === "Semen" && jenisTransaksi === "Stok Keluar" ? "md:col-span-2" : ""}>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              {tipeInput === "Semen" ? "Jumlah (Ton) *" : "Jumlah (Lembar) *"}
            </label>
            <div className="relative">
              <input 
                type="number" 
                min="0" 
                step={tipeInput === "Semen" ? "0.01" : "1"}
                className="w-full border border-slate-200 bg-slate-50 p-3.5 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-[#2E6DA4] focus:ring-4 focus:ring-blue-900/5 transition-all" 
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
                placeholder="0"
                required 
              />
              <span className="absolute right-4 top-3.5 text-slate-400 font-bold">
                {tipeInput === "Semen" ? "TON" : "LBR"}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-700 mb-2">Keterangan Tambahan (Opsional)</label>
          <textarea 
            className="w-full border border-slate-200 bg-slate-50 p-4 rounded-xl text-slate-700 focus:outline-none focus:border-[#2E6DA4] focus:ring-4 focus:ring-blue-900/5 transition-all resize-none" 
            rows={3}
            placeholder="Tuliskan plat nomor truk, nama kurir, atau catatan khusus di sini..."
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
          ></textarea>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className={`w-full text-white font-bold py-4 px-6 rounded-xl text-lg flex items-center justify-center gap-2 shadow-lg transition-all duration-300 ${
            isLoading 
              ? "bg-slate-400 cursor-not-allowed shadow-none" 
              : "bg-[#1A3A5C] hover:bg-[#122841] shadow-blue-900/20 hover:-translate-y-0.5 active:scale-95"
          }`}
        >
          {isLoading ? (
            "Menyimpan ke Database..."
          ) : (
            <>
              <Save size={20} />
              Simpan Data {tipeInput}
            </>
          )}
        </button>
      </form>

      <div className="max-w-2xl mx-auto bg-rose-50 border border-rose-200 p-6 rounded-[1.5rem] shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-xl shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-rose-800 mb-1">Zona Pengaturan Sistem</h3>
            <p className="text-sm text-rose-600/80 mb-4 font-medium leading-relaxed">
              Tindakan di bawah ini akan menghapus <b>seluruh</b> riwayat transaksi stok Semen dan Kantong dari *database*. Gunakan fitur ini hanya saat membersihkan data uji coba (*testing*).
            </p>
            <button 
              type="button"
              onClick={handleResetData}
              disabled={isResetting}
              className={`font-bold py-3 px-5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                isResetting 
                  ? "bg-rose-200 text-rose-400 cursor-not-allowed" 
                  : "bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-900/20 hover:-translate-y-0.5 active:scale-95"
              }`}
            >
              <Trash2 size={16} />
              {isResetting ? "Membersihkan Data..." : "Format & Kosongkan Semua Data"}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}