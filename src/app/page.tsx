"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LucideLoader2 } from "lucide-react";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/config-agent");
    }, 3000); // 3 seconds delay

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen w-full relative bg-black flex items-center justify-center">
      {/* Background gradients */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 100%, rgba(70, 85, 110, 0.5) 0%, transparent 60%),
            radial-gradient(circle at 50% 100%, rgba(99, 102, 241, 0.4) 0%, transparent 70%),
            radial-gradient(circle at 50% 100%, rgba(181, 184, 208, 0.3) 0%, transparent 80%)
          `,
        }}
      />

      {/* Center animation (example: pulsing circle) */}
      <main className="z-10 flex flex-col items-center justify-center">
        <h1 className=" font-sora text-2xl tracking-tight text-white">Welcome to Best Hybrid Rag AI Agent</h1>
        <p className="text-white mt-4 animate-fadeIn flex items-center justify-center gap-4">Loading <LucideLoader2 className="animate-spin"/></p>
      </main>
    </div>
  );
}
