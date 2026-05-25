import { redirect } from "next/navigation";

export default function Home() {
  // Sistem akan langsung mengarahkan pengunjung ke halaman login
  redirect("/login");
}