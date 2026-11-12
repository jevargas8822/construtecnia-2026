'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EVENT_CONFIG } from '@/config';
import { Lock, Eye, EyeOff, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje(null);
    setCargando(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMensaje(data.error || 'Contraseña incorrecta.');
      } else {
        router.push('/admin');
      }
    } catch {
      setErrorMensaje('Error de conexión al servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="max-w-sm w-full bg-slate-800 border-2 border-adeic-gold-500 rounded-3xl p-6 shadow-2xl text-white">
        {/* LOGO & ENCABEZADO */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-adeic-gold-500 text-adeic-navy-950 font-black rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg border border-adeic-gold-300">
            A
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-adeic-gold-400">
            {EVENT_CONFIG.organizador} • Panel de Staff
          </span>
          <h1 className="text-xl font-black tracking-tight text-white mt-0.5">
            {EVENT_CONFIG.nombreEvento}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ingreso protegido para control de ponencias y asistencias
          </p>
        </div>

        {/* ALERTA DE ERROR */}
        {errorMensaje && (
          <div className="mb-4 bg-red-950/80 border border-red-500/60 rounded-xl p-3 text-xs text-red-200 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="font-semibold">{errorMensaje}</div>
          </div>
        )}

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Contraseña de Staff
            </label>
            <div className="relative">
              <input
                type={mostrarPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa la clave de administración"
                required
                className="w-full min-h-[50px] pl-10 pr-12 rounded-xl bg-slate-900 border-2 border-slate-700 focus:border-adeic-gold-400 focus:outline-none text-white text-base font-mono transition"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                title={mostrarPassword ? 'Ocultar' : 'Mostrar'}
              >
                {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Protección con límite de 5 intentos por cada 10 minutos.
            </span>
          </div>

          <button
            type="submit"
            disabled={cargando || !password}
            className={`w-full min-h-[54px] rounded-xl font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2 transition active:scale-[0.98] ${
              cargando || !password
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-adeic-gold-500 hover:bg-adeic-gold-400 text-adeic-navy-950 font-black'
            }`}
          >
            {cargando ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verificando...</span>
              </>
            ) : (
              <>
                <span>Ingresar al Panel</span>
                <ArrowRight className="w-4 h-4 text-adeic-navy-950" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-700/60 text-center">
          <a
            href="/asistencia"
            className="text-xs text-adeic-gold-400 hover:text-adeic-gold-300 font-semibold underline"
          >
            ← Volver a página de asistencia (QR)
          </a>
        </div>
      </div>
    </div>
  );
}
