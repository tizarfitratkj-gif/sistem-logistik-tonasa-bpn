"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ClipboardEdit, Package, Layers, Save, Trash2, AlertTriangle, Calendar, Clock } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminDashboard() {
  const [tipeInput, setTipeInput] = useState<"Semen" | "Kantong">("Semen");
  
  const [jumlah, setJumlah] = useState(""); 
  const [jumlahPecah, setJumlahPecah] = useState(""); 
  
  const [jenisTransaksi, setJenisTransaksi] = useState("Stok Masuk");
  const [jenisSemen, setJenisSemen] = useState("Semen Portland");
  const [kemasanSemen, setKemasanSemen] = useState("Curah");
  
  // State Kantong
  const [merkKantong, setMerkKantong] = useState("Tonasa");
  const [ukuranKantong, setUkuranKantong] = useState("50 Kg");
  
  const [keterangan, setKeterangan] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // State baru untuk menyimpan riwayat input terbaru
  const [riwayatSemen, setRiwayatSemen] = useState<any[]>([]);
  const [riwayatKantong, setRiwayatKantong] = useState<any[]>([]);

  // Fungsi untuk mengambil data riwayat input terbaru (5 data terakhir)
  const fetchRiwayatTerakhir = async () => {
    const [semenRes, kantongRes] = await Promise.all([
      supabase.from("stock_semen").select("*").order("id", { ascending: false }).limit(5),
      supabase.from("stock_kantong").select("*").order("id", { ascending: false }).limit(5)
    ]);

    if (semenRes.data) setRiwayatSemen(semenRes.data);
    if (kantongRes.data) setRiwayatKantong(kantongRes.data);
  };

  // Ambil riwayat saat halaman pertama kali dimuat
  useEffect(() => {
    fetchRiwayatTerakhir();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(false);

    if (tipeInput === "Semen") {
      setIsLoading(true);
      let finalJenisSemen = jenisSemen;
      if (jenisTransaksi === "Stok Keluar") {
        finalJenisSemen = `${jenisSemen} (${kemasanSemen})`;
      }

      const sanitizedJumlah = jumlah.replace(",", ".");
      const jumlahTon = parseFloat(sanitizedJumlah);

      if (isNaN(jumlahTon)) {
        Swal.fire({
          title: "Format Angka Salah",
          text: "Mohon masukkan jumlah ton yang valid. Gunakan koma (,) atau titik (.) untuk desimal.",
          icon: "warning",
          confirmButtonColor: "#1A3A5C"
        });
        setIsLoading(false);
        return;
      }

      const dataInsert = { 
        jenis_transaksi: jenisTransaksi, 
        jenis_semen: finalJenisSemen, 
        jumlah_ton: jumlahTon,
        keterangan: keterangan
      };

      const { error } = await supabase.from("stock_semen").insert([dataInsert]);
      handleResponse(error);
    } else {
      const records = [];
      
      if (jenisTransaksi === "Stok Keluar") {
        const valNormal = parseInt(jumlah) || 0;
        const valPecah = parseInt(jumlahPecah) || 0;

        if (valNormal === 0 && valPecah === 0) {
          Swal.fire({
            title: "Input Kosong",
            text: "Mohon isi jumlah kantong normal atau kantong pecah terlebih dahulu.",
            icon: "warning",
            confirmButtonColor: "#1A3A5C"
          });
          return;
        }

        setIsLoading(true);

        if (valNormal > 0) {
          records.push({
            jenis_transaksi: jenisTransaksi,
            merk: merkKantong,
            ukuran_kantong: ukuranKantong,
            jumlah_lembar: valNormal,
            kondisi: "Normal",
            keterangan: keterangan
          });
        }

        if (valPecah > 0) {
          records.push({
            jenis_transaksi: jenisTransaksi,
            merk: merkKantong,
            ukuran_kantong: ukuranKantong,
            jumlah_lembar: valPecah,
            kondisi: "Pecah",
            keterangan: keterangan ? `${keterangan} (Kondisi: Kantong Pecah)` : "Kantong Pecah / Rusak"
          });
        }
      } else {
        const valJumlah = parseInt(jumlah) || 0;
        if (valJumlah <= 0) {
          Swal.fire({
            title: "Input Kosong",
            text: "Jumlah lembar harus lebih dari 0.",
            icon: "warning",
            confirmButtonColor: "#1A3A5C"
          });
          return;
        }

        setIsLoading(true);
        records.push({
          jenis_transaksi: jenisTransaksi,
          merk: merkKantong,
          ukuran_kantong: ukuranKantong,
          jumlah_lembar: valJumlah,
          kondisi: "Normal",
          keterangan: keterangan
        });
      }

      const { error } = await supabase.from("stock_kantong").insert(records);
      handleResponse(error);
    }
  };

  const handleResponse = (error: any) => {
    setIsLoading(false);
    if (error) {
      Swal.fire({
        title: "Gagal Menyimpan!",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#E74C3C"
      });
    } else {
      Swal.fire({
        title: "Tersimpan!",
        text: `Data logistik ${tipeInput} berhasil diperbarui di database.`,
        icon: "success",
        confirmButtonColor: "#1A3A5C"
      });
      setJumlah(""); 
      setJumlahPecah(""); 
      setKeterangan("");
      fetchRiwayatTerakhir(); // Segarkan daftar riwayat setelah input sukses
    }
  };

  // FUNGSI BARU: MENGHAPUS SATU BARIS DATA YANG SALAH INPUT
  const handleHapusDataIndividual = async (id: number, tabel: "stock_semen" | "stock_kantong") => {
    const namaKomoditas = tabel === "stock_semen" ? "Semen" : "Kantong";
    
    const result = await Swal.fire({
      title: "Hapus Data Ini?",
      text: `Apakah Anda yakin ingin menghapus catatan input ${namaKomoditas} ini? Data stok akan otomatis menyesuaikan kembali.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E74C3C",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    const { error } = await supabase.from(tabel).delete().eq("id", id);

    if (error) {
      Swal.fire({
        title: "Gagal Menghapus",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#E74C3C"
      });
    } else {
      Swal.fire({
        title: "Berhasil Dihapus!",
        text: "Data salah input telah dikeluarkan dari sistem.",
        icon: "success",
        confirmButtonColor: "#1A3A5C",
        timer: 1500
      });
      fetchRiwayatTerakhir(); // Segarkan tampilan tabel riwayat setelah data terhapus
    }
  };

  const handleResetData = async () => {
    const result = await Swal.fire({
      title: "Peringatan Kritis!",
      text: "Anda yakin ingin MENGHAPUS SEMUA DATA riwayat stok? Tindakan ini permanen!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E74C3C",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Ya, Hapus Semua Data!",
      cancelButtonText: "Batal",
      reverseButtons: true
    });

    if (!result.isConfirmed) return;
    setIsResetting(true);

    try {
      const resSemen = await supabase.from("stock_semen").delete().neq("jenis_transaksi", "");
      const resKantong = await supabase.from("stock_kantong").delete().neq("jenis_transaksi", "");

      if (resSemen.error) throw resSemen.error;
      if (resKantong.error) throw resKantong.error;

      await Swal.fire({
        title: "Data Dihapus!",
        text: "Seluruh data riwayat stok telah dibersihkan.",
        icon: "success",
        confirmButtonColor: "#1A3A5C"
      });
      fetchRiwayatTerakhir();
    } catch (error: any) {
      Swal.fire({ title: "Terjadi Kesalahan", text: error.message, icon: "error" });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 font-sans selection:bg-[#1A3A5C] selection:text-white"> 
      
      <header className="max-w-4xl mx-auto mb-10 flex flex-col sm:flex-row sm:items-center gap-4 border-b border-gray-100 pb-6">
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
            tipeInput === "Semen" ? "bg-white text-[#1A3A5C] shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          <Package size={18} /> Input Semen
        </button>
        <button 
          type="button"
          onClick={() => setTipeInput("Kantong")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
            tipeInput === "Kantong" ? "bg-white text-[#1A3A5C] shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          <Layers size={18} /> Input Kantong
        </button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 mb-10">
        
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
                  <label className="block text-sm font-bold text-emerald-800 mb-2">Tipe Kemasan Pengeluaran *</label>
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

              <div className={jenisTransaksi === "Stok Keluar" ? "md:col-span-2" : "w-full"}>
                <label className="block text-sm font-bold text-slate-700 mb-2">Jumlah (Ton) *</label>
                <div className="relative">
                  <input 
                    type="text" 
                    inputMode="decimal"
                    className="w-full border border-slate-200 bg-slate-50 p-3.5 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-[#2E6DA4] focus:ring-4 focus:ring-blue-900/5 transition-all" 
                    value={jumlah} 
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/[^0-9.,]/g, "");
                      setJumlah(cleanVal);
                    }} 
                    placeholder="0,00" 
                    required 
                  />
                  <span className="absolute right-4 top-3.5 text-slate-400 font-bold">TON</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Merk Kantong *</label>
                <select 
                  className="w-full border border-slate-200 bg-slate-50 p-3.5 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-[#2E6DA4] focus:ring-4 focus:ring-blue-900/5 transition-all cursor-pointer" 
                  value={merkKantong} onChange={(e) => setMerkKantong(e.target.value)}
                >
                  <option value="Tonasa">Semen Tonasa</option>
                  <option value="Gresik">Semen Gresik</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Ukuran Kantong *</label>
                <select 
                  className="w-full border border-slate-200 bg-slate-50 p-3.5 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-[#2E6DA4] focus:ring-4 focus:ring-blue-900/5 transition-all cursor-pointer" 
                  value={ukuranKantong} onChange={(e) => setUkuranKantong(e.target.value)}
                >
                  <option value="50 Kg">Kantong 50 Kg</option>
                  <option value="40 Kg">Kantong 40 Kg</option>
                </select>
              </div>

              {jenisTransaksi === "Stok Keluar" ? (
                <>
                  <div className="w-full">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Jumlah Kantong Normal *</label>
                    <div className="relative">
                      <input 
                        type="number" min="0" step="1"
                        className="w-full border border-slate-200 bg-slate-50 p-3.5 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-[#2E6DA4] focus:ring-4 focus:ring-blue-900/5 transition-all" 
                        value={jumlah} onChange={(e) => setJumlah(e.target.value)} placeholder="0"
                      />
                      <span className="absolute right-4 top-3.5 text-slate-400 font-bold">LBR</span>
                    </div>
                  </div>

                  <div className="w-full">
                    <label className="block text-sm font-bold text-rose-600 mb-2">Jumlah Kantong Pecah / Rusak</label>
                    <div className="relative">
                      <input 
                        type="number" min="0" step="1"
                        className="w-full border border-rose-200 bg-rose-50/50 p-3.5 rounded-xl text-rose-700 font-bold focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-900/5 transition-all" 
                        value={jumlahPecah} onChange={(e) => setJumlahPecah(e.target.value)} placeholder="0"
                      />
                      <span className="absolute right-4 top-3.5 text-rose-400 font-bold">LBR</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Jumlah (Lembar) *</label>
                  <div className="relative">
                    <input 
                      type="number" min="0" step="1"
                      className="w-full border border-slate-200 bg-slate-50 p-3.5 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-[#2E6DA4] focus:ring-4 focus:ring-blue-900/5 transition-all" 
                      value={jumlah} onChange={(e) => setJumlah(e.target.value)} placeholder="0" required 
                    />
                    <span className="absolute right-4 top-3.5 text-slate-400 font-bold">LBR</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-700 mb-2">Keterangan Tambahan (Opsional)</label>
          <textarea 
            className="w-full border border-slate-200 bg-slate-50 p-4 rounded-xl text-slate-700 focus:outline-none focus:border-[#2E6DA4] focus:ring-4 focus:ring-blue-900/5 transition-all resize-none" 
            rows={3} placeholder="Tuliskan plat nomor truk, nama kurir, atau catatan khusus di sini..."
            value={keterangan} onChange={(e) => setKeterangan(e.target.value)}
          ></textarea>
        </div>

        <button 
          type="submit" disabled={isLoading}
          className={`w-full text-white font-bold py-4 px-6 rounded-xl text-lg flex items-center justify-center gap-2 shadow-lg transition-all duration-300 ${
            isLoading ? "bg-slate-400 cursor-not-allowed shadow-none" : "bg-[#1A3A5C] hover:bg-[#122841] shadow-blue-900/20 hover:-translate-y-0.5 active:scale-95"
          }`}
        >
          {isLoading ? "Menyimpan ke Database..." : <><Save size={20} /> Simpan Data {tipeInput}</>}
        </button>
      </form>

      {/* SEKSI BARU: TABEL RIWAYAT INPUT UNTUK KOREKSI INDIVIDUAL */}
      <section className="max-w-4xl mx-auto bg-white border border-slate-100 rounded-[2rem] p-6 md:p-8 shadow-xl shadow-slate-200/30 mb-10">
        <div className="flex items-center gap-2 mb-6">
          <Clock size={20} className="text-[#2E6DA4]" />
          <h2 className="text-xl font-black text-slate-800">Riwayat 5 Input Terakhir ({tipeInput})</h2>
        </div>

        <div className="overflow-x-auto">
          {tipeInput === "Semen" ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-black tracking-wider uppercase bg-slate-50">
                  <th className="p-4 rounded-l-xl">Transaksi</th>
                  <th className="p-4">Jenis Semen</th>
                  <th className="p-4">Jumlah</th>
                  <th className="p-4">Keterangan</th>
                  <th className="p-4 text-center rounded-r-xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium text-slate-700 divide-y divide-slate-50">
                {riwayatSemen.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400">Belum ada riwayat input semen.</td></tr>
                ) : (
                  riwayatSemen.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                          row.jenis_transaksi === "Stok Masuk" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        }`}>{row.jenis_transaksi}</span>
                      </td>
                      <td className="p-4 font-bold text-slate-800">{row.jenis_semen}</td>
                      <td className="p-4 font-black text-[#2E6DA4]">{row.jumlah_ton} Ton</td>
                      <td className="p-4 text-xs text-slate-400 max-w-[150px] truncate">{row.keterangan || "-"}</td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => handleHapusDataIndividual(row.id, "stock_semen")}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                          title="Hapus Data Salah"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-black tracking-wider uppercase bg-slate-50">
                  <th className="p-4 rounded-l-xl">Transaksi</th>
                  <th className="p-4">Spesifikasi</th>
                  <th className="p-4">Kondisi</th>
                  <th className="p-4">Jumlah</th>
                  <th className="p-4 text-center rounded-r-xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium text-slate-700 divide-y divide-slate-50">
                {riwayatKantong.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400">Belum ada riwayat input kantong.</td></tr>
                ) : (
                  riwayatKantong.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                          row.jenis_transaksi === "Stok Masuk" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        }`}>{row.jenis_transaksi}</span>
                      </td>
                      <td className="p-4 font-bold text-slate-800">{row.merk} ({row.ukuran_kantong})</td>
                      <td className="p-4">
                        <span className={`text-xs font-bold ${row.kondisi === "Pecah" ? "text-rose-600" : "text-slate-500"}`}>{row.kondisi}</span>
                      </td>
                      <td className="p-4 font-black text-rose-600">{row.jumlah_lembar.toLocaleString()} Lbr</td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => handleHapusDataIndividual(row.id, "stock_kantong")}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                          title="Hapus Data Salah"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Zona Pengaturan Sistem Format Masih Dipertahankan di Paling Bawah */}
      <div className="max-w-2xl mx-auto bg-rose-50 border border-rose-200 p-6 rounded-[1.5rem] shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-xl shrink-0"><AlertTriangle size={24} /></div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-rose-800 mb-1">Zona Pengaturan Sistem</h3>
            <p className="text-sm text-rose-600/80 mb-4 font-medium leading-relaxed">
              Tindakan di bawah ini akan menghapus <b>seluruh</b> riwayat transaksi stok Semen dan Kantong dari *database*. Gunakan fitur ini hanya saat membersihkan data uji coba (*testing*).
            </p>
            <button 
              type="button" onClick={handleResetData} disabled={isResetting}
              className={`font-bold py-3 px-5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                isResetting ? "bg-rose-200 text-rose-400 cursor-not-allowed" : "bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-900/20 hover:-translate-y-0.5 active:scale-95"
              }`}
            >
              <Trash2 size={16} /> {isResetting ? "Membersihkan Data..." : "Format & Kosongkan Semua Data"}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}