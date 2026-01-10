"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";

export default function ClientSidebarHeader() {
  const { role } = useAuth();
  const dashboardHref =
    role === "employer" ? "/employer/dashboard" : "/dashboard";
  return (
    <Link href={dashboardHref} className="flex items-center gap-2 p-2 group">
      <Image
        src="https://i.postimg.cc/nLrDYrHW/icon.png"
        alt="CareerCompass logo"
        width={32}
        height={32}
        className="dark:bg-white dark:p-1 dark:rounded-3xl group-hover:opacity-80 transition"
      />
      <span className="text-xl font-bold tracking-tight max-md:hidden">
        CareerCompass
      </span>
    </Link>
  );
}
