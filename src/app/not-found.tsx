'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-amber-600/10 blur-[120px]" />

      <div className="text-center relative z-10 max-w-md mx-auto">
        <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-200 to-slate-500 tracking-tighter leading-none select-none">
          404
        </h1>
        
        <h2 className="text-2xl font-bold text-white mt-6 tracking-tight">
          Página no encontrada
        </h2>
        
        <p className="text-slate-400 mt-3 text-sm leading-relaxed">
          Lo sentimos, la página que estás buscando no existe o ha sido movida a otra ubicación. Verifique la dirección o regrese al panel de control.
        </p>

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-lg px-6 py-3 text-sm font-semibold transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]"
          >
            Volver al Panel Principal
          </Link>
        </div>
      </div>
    </div>
  );
}
