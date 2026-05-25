"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Lock, Mail, LogIn, HardHat } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // 1. Proses Autentikasi dengan Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      alert("Gagal Login: Email atau Password salah!");
    } else {
      // 2. POLISI LALU LINTAS (Role-Based Routing)
      // Membaca email yang berhasil login untuk menentukan arah halaman
      const userEmail = data.user.email?.toLowerCase() || "";

      if (userEmail.includes("manager")) {
        router.push("/manager"); // Arahkan ke Dashboard Manager
      } else if (userEmail.includes("admin")) {
        router.push("/admin");   // Arahkan ke Dashboard Admin
      } else {
        // Fallback jika email tidak memiliki unsur kata admin/manager
        alert("Peran tidak dikenali, mengarahkan ke halaman default.");
        router.push("/");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 selection:bg-[#1A3A5C] selection:text-white">
      
      {/* Container Login */}
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl shadow-blue-900/10 border border-slate-100 overflow-hidden">
        
        {/* Header Biru Khas Tonasa */}
        <div className="bg-gradient-to-br from-[#1A3A5C] to-[#2E6DA4] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
          
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 text-white shadow-inner">
            <HardHat size={32} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">PORTAL LOGISTIK</h1>
          <p className="text-blue-100 text-sm font-medium mt-1">Sistem Pemantauan Gudang</p>
        </div>

        {/* Form Input */}
        <form onSubmit={handleLogin} className="p-8">
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">Alamat Email</label>
            <div className="relative">
              <div className="absolute left-4 top-3.5 text-slate-400">
                <Mail size={20} />
              </div>
              <input 
                type="email" 
                className="w-full border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[#2E6DA4] focus:ring-4 focus:ring-blue-900/5 transition-all" 
                placeholder="manager@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-700 mb-2">Kata Sandi</label>
            <div className="relative">
              <div className="absolute left-4 top-3.5 text-slate-400">
                <Lock size={20} />
              </div>
              <input 
                type="password" 
                className="w-full border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[#2E6DA4] focus:ring-4 focus:ring-blue-900/5 transition-all" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
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
              "Memverifikasi..."
            ) : (
              <>
                <LogIn size={20} />
                Masuk ke Sistem
              </>
            )}
          </button>
        </form>
        
        {/* Footer */}
        <div className="bg-slate-50 py-4 text-center border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400">PP. Balikpapan © 2024</p>
        </div>
      </div>
    </div>
  );
}