'use client';

import React, { useState, useEffect } from 'react';
import { EVENT_CONFIG } from '@/config';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  GraduationCap,
  Users,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface PonenciaActiva {
  id: number;
  orden: number;
  dia: number;
  fecha: string;
  nombre: string;
  expositor: string | null;
  descripcion: string | null;
  estado: string;
}

const LOCAL_STORAGE_KEY = 'constructecnia_2026_asistente_info';

export default function AsistenciaPage() {
  // Estado de la ponencia abierta
  const [ponenciaActiva, setPonenciaActiva] = useState<PonenciaActiva | null>(null);
  const [cargandoPonencia, setCargandoPonencia] = useState(true);

  // Estado del formulario
  const [correo, setCorreo] = useState('');
  const [tipoId, setTipoId] = useState<'alumno_pucp' | 'externo'>('alumno_pucp');
  const [documento, setDocumento] = useState('');
  const [consentimiento, setConsentimiento] = useState(true);

  // Estados de envío y respuesta
  const [enviando, setEnviando] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [exitoInfo, setExitoInfo] = useState<{
    mensaje: string;
    ponenciaNombre: string;
    ponenciaOrden: number;
    correo: string;
    registradoEn: string;
  } | null>(null);

  // 1. Cargar datos previos guardados en localStorage para agilidad (< 20 segundos)
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (guardado) {
        const datos = JSON.parse(guardado);
        if (datos.correo) setCorreo(datos.correo);
        if (datos.tipoId === 'alumno_pucp' || datos.tipoId === 'externo') setTipoId(datos.tipoId);
        if (datos.documento) setDocumento(datos.documento);
      }
    } catch (e) {
      console.warn('No se pudo leer localStorage:', e);
    }
  }, []);

  // 2. Polling periódico para consultar la ponencia abierta (cada 5 segundos)
  const consultarPonenciaActiva = async (silencioso = false) => {
    if (!silencioso) setCargandoPonencia(true);
    try {
      const res = await fetch('/api/asistencia/activa', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setPonenciaActiva(data.ponencia);
      }
    } catch (err) {
      console.warn('Error al consultar ponencia activa:', err);
    } finally {
      setCargandoPonencia(false);
    }
  };

  useEffect(() => {
    consultarPonenciaActiva(false);
    const interval = setInterval(() => {
      consultarPonenciaActiva(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 3. Manejo del envío del formulario con validación
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje(null);

    // Validación preliminar en navegador (la validación principal y definitiva ocurre en el servidor)
    const correoLimpio = correo.trim().toLowerCase();
    const docLimpio = documento.trim().replace(/\s+/g, '');

    if (!EVENT_CONFIG.validacion.correo.regex.test(correoLimpio)) {
      setErrorMensaje(EVENT_CONFIG.validacion.correo.errorMensaje);
      return;
    }

    const valRegla =
      tipoId === 'alumno_pucp'
        ? EVENT_CONFIG.validacion.alumnoPucp
        : EVENT_CONFIG.validacion.externo;

    if (!valRegla.regex.test(docLimpio)) {
      setErrorMensaje(valRegla.errorMensaje);
      return;
    }

    if (!consentimiento) {
      setErrorMensaje(
        'Debes aceptar el consentimiento de uso de datos para poder registrar tu asistencia.'
      );
      return;
    }

    setEnviando(true);

    try {
      const res = await fetch('/api/asistencia/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correo: correoLimpio,
          tipo_id: tipoId,
          documento: docLimpio,
          consentimiento,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMensaje(data.error || 'No se pudo registrar la asistencia.');
      } else {
        // Guardar en localStorage para pre-cargar en las siguientes ponencias
        try {
          localStorage.setItem(
            LOCAL_STORAGE_KEY,
            JSON.stringify({
              correo: correoLimpio,
              tipoId,
              documento: docLimpio,
            })
          );
        } catch (storageErr) {
          console.warn('Error guardando en localStorage:', storageErr);
        }

        setExitoInfo(data);
      }
    } catch {
      setErrorMensaje('Ocurrió un error de conexión. Verifica tu internet y vuelve a intentar.');
    } finally {
      setEnviando(false);
    }
  };

  const handleRegistrarOtro = () => {
    setExitoInfo(null);
    setErrorMensaje(null);
  };

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* HEADER INSTITUCIONAL ADEIC */}
      <header className="bg-adeic-navy-900 text-white border-b-4 border-adeic-gold-500 shadow-md">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-adeic-gold-500 text-adeic-navy-950 font-black flex items-center justify-center text-lg shadow-sm border border-adeic-gold-400">
              A
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs uppercase font-extrabold tracking-widest text-adeic-gold-400">
                  {EVENT_CONFIG.organizador}
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-300">{EVENT_CONFIG.edicion}</span>
              </div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-none mt-0.5">
                {EVENT_CONFIG.nombreEvento}
              </h1>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block bg-adeic-navy-800 text-adeic-gold-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-adeic-navy-700">
              Sede B-100 PUCP
            </span>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col justify-start">
        {/* PANTALLA DE ÉXITO */}
        {exitoInfo ? (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-500 p-6 my-auto text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <span className="inline-block bg-emerald-100 text-emerald-800 font-extrabold text-xs uppercase px-3 py-1 rounded-full mb-2">
              ¡Registro Confirmado!
            </span>

            <h2 className="text-2xl font-black text-adeic-navy-900 mb-2 leading-tight">
              {exitoInfo.mensaje}
            </h2>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 my-5 text-left text-sm space-y-2">
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500 font-medium">Ponencia:</span>
                <span className="text-adeic-navy-900 font-bold text-right ml-2">
                  #{exitoInfo.ponenciaOrden}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500 font-medium">Asistente:</span>
                <span className="text-adeic-navy-900 font-semibold break-all text-right ml-2">
                  {exitoInfo.correo}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Hora registrada:</span>
                <span className="text-adeic-navy-900 font-bold text-right ml-2">
                  {exitoInfo.registradoEn}
                </span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 mb-6 text-left flex items-start space-x-2">
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Tus datos se guardaron en este celular.</strong> En la siguiente ponencia
                el formulario ya estará completado.
              </span>
            </div>

            <button
              onClick={handleRegistrarOtro}
              className="w-full min-h-[52px] bg-adeic-navy-900 hover:bg-adeic-navy-800 active:scale-[0.99] text-white font-bold text-base rounded-xl flex items-center justify-center space-x-2 shadow-md transition"
            >
              <span>Registrar a otro asistente</span>
              <ArrowRight className="w-5 h-5 text-adeic-gold-400" />
            </button>
          </div>
        ) : (
          <>
            {/* TARJETA SUPERIOR: ESTADO DE LA PONENCIA ABIERTA */}
            <section className="mb-4">
              {cargandoPonencia && !ponenciaActiva ? (
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm animate-pulse text-center">
                  <div className="h-4 bg-slate-200 rounded w-1/3 mx-auto mb-2"></div>
                  <div className="h-6 bg-slate-200 rounded w-3/4 mx-auto"></div>
                </div>
              ) : ponenciaActiva ? (
                <div className="bg-adeic-navy-900 rounded-2xl p-5 text-white shadow-lg border-2 border-adeic-gold-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-adeic-gold-500 text-adeic-navy-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-sm flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                    <span>EN VIVO</span>
                  </div>

                  <div className="flex items-center space-x-2 text-adeic-gold-400 text-xs font-bold uppercase tracking-wider mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Ponencia Abierta para Asistencia</span>
                  </div>

                  <h2 className="text-lg md:text-xl font-black leading-snug text-white mt-1 mb-2">
                    {ponenciaActiva.nombre}
                  </h2>

                  {ponenciaActiva.expositor && (
                    <p className="text-xs text-slate-300 font-medium">
                      Expositor: <span className="text-white font-semibold">{ponenciaActiva.expositor}</span>
                    </p>
                  )}

                  <div className="mt-3 pt-2.5 border-t border-adeic-navy-700/80 flex items-center justify-between text-[11px] text-slate-300">
                    <span className="flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-adeic-gold-400" />
                      <span>Confirma que estás en esta ponencia</span>
                    </span>
                    <button
                      onClick={() => consultarPonenciaActiva(false)}
                      className="text-adeic-gold-400 hover:text-adeic-gold-300 p-1 flex items-center space-x-1"
                      title="Actualizar estado"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Actualizar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 text-amber-950 shadow-sm text-center">
                  <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-extrabold text-amber-900 mb-1">
                    Ahora no hay ninguna ponencia abierta para registrar asistencia
                  </h3>
                  <p className="text-xs text-amber-800 leading-relaxed max-w-xs mx-auto">
                    El staff de ADEIC habilitará el registro durante la ponencia correspondiente.
                    Esta pantalla se actualiza automáticamente.
                  </p>
                  <button
                    onClick={() => consultarPonenciaActiva(false)}
                    className="mt-3 inline-flex items-center space-x-1.5 text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Verificar ahora</span>
                  </button>
                </div>
              )}
            </section>

            {/* FORMULARIO DE ASISTENCIA */}
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl p-5 shadow-md border border-slate-200 space-y-4"
            >
              {/* Mensaje de Error */}
              {errorMensaje && (
                <div className="bg-red-50 border-l-4 border-red-600 p-3 rounded-lg flex items-start space-x-2 text-xs text-red-800 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="font-semibold">{errorMensaje}</div>
                </div>
              )}

              {/* TIPO DE IDENTIFICACIÓN (BOTONES GRANDES TÁCTILES) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Tipo de Asistente <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTipoId('alumno_pucp')}
                    className={`min-h-[54px] px-3 py-2 rounded-xl border-2 text-left flex items-center space-x-2.5 transition active:scale-[0.98] ${
                      tipoId === 'alumno_pucp'
                        ? 'border-adeic-navy-900 bg-adeic-navy-900 text-white shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <GraduationCap
                      className={`w-5 h-5 flex-shrink-0 ${
                        tipoId === 'alumno_pucp' ? 'text-adeic-gold-400' : 'text-slate-500'
                      }`}
                    />
                    <div className="leading-tight">
                      <div className="text-xs font-extrabold">Alumno PUCP</div>
                      <div
                        className={`text-[10px] ${
                          tipoId === 'alumno_pucp' ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        Código 8 dígitos
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoId('externo')}
                    className={`min-h-[54px] px-3 py-2 rounded-xl border-2 text-left flex items-center space-x-2.5 transition active:scale-[0.98] ${
                      tipoId === 'externo'
                        ? 'border-adeic-navy-900 bg-adeic-navy-900 text-white shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Users
                      className={`w-5 h-5 flex-shrink-0 ${
                        tipoId === 'externo' ? 'text-adeic-gold-400' : 'text-slate-500'
                      }`}
                    />
                    <div className="leading-tight">
                      <div className="text-xs font-extrabold">No soy PUCP</div>
                      <div
                        className={`text-[10px] ${
                          tipoId === 'externo' ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        DNI 8 dígitos
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* CAMPO DOCUMENTO / CÓDIGO */}
              <div>
                <label
                  htmlFor="documento"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  {tipoId === 'alumno_pucp' ? 'Código de Alumno PUCP' : 'Número de DNI'}
                  <span className="text-red-500"> *</span>
                </label>
                <input
                  id="documento"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  placeholder={
                    tipoId === 'alumno_pucp'
                      ? `Ej. ${EVENT_CONFIG.validacion.alumnoPucp.ejemplo}`
                      : `Ej. ${EVENT_CONFIG.validacion.externo.ejemplo}`
                  }
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value.replace(/[^0-9]/g, ''))}
                  required
                  className="w-full min-h-[50px] px-4 rounded-xl border-2 border-slate-300 focus:border-adeic-navy-900 focus:ring-2 focus:ring-adeic-navy-900/20 text-base font-semibold text-slate-900 placeholder:text-slate-400 transition"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Debe contener exactamente 8 dígitos.
                </span>
              </div>

              {/* CAMPO CORREO ELECTRÓNICO */}
              <div>
                <label
                  htmlFor="correo"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  id="correo"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="ejemplo@pucp.edu.pe o personal"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                  className="w-full min-h-[50px] px-4 rounded-xl border-2 border-slate-300 focus:border-adeic-navy-900 focus:ring-2 focus:ring-adeic-navy-900/20 text-base font-semibold text-slate-900 placeholder:text-slate-400 transition"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  A este correo se asociará tu certificado oficial (mínimo 4 ponencias).
                </span>
              </div>

              {/* CASILLA DE CONSENTIMIENTO OBLIGATORIA */}
              <div className="pt-1">
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={consentimiento}
                    onChange={(e) => setConsentimiento(e.target.checked)}
                    required
                    className="w-5 h-5 mt-0.5 rounded border-2 border-slate-300 text-adeic-navy-900 focus:ring-adeic-navy-900 cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 leading-snug">
                    Acepto que mis datos se usen únicamente para registrar mi asistencia y emitir mi
                    certificado de <strong>Constructecnia 2026</strong>.
                  </span>
                </label>
              </div>

              {/* BOTÓN PRINCIPAL DE REGISTRO */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={enviando || !ponenciaActiva}
                  className={`w-full min-h-[56px] rounded-xl font-black text-base uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2 transition active:scale-[0.98] ${
                    !ponenciaActiva
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                      : enviando
                      ? 'bg-adeic-gold-400 text-adeic-navy-950 opacity-90 cursor-wait'
                      : 'bg-adeic-gold-500 hover:bg-adeic-gold-400 text-adeic-navy-950 border-2 border-adeic-gold-400'
                  }`}
                >
                  {enviando ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Validando y registrando...</span>
                    </>
                  ) : !ponenciaActiva ? (
                    <span>Sin ponencia abierta</span>
                  ) : (
                    <>
                      <UserCheck className="w-5 h-5" />
                      <span>Registrar mi Asistencia</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-1">
                <span className="text-[11px] text-slate-500">
                  Certificado válido asistiendo a un <strong>mínimo de 4 ponencias</strong>.
                </span>
              </div>
            </form>
          </>
        )}
      </div>

      {/* FOOTER */}
      <footer className="text-center py-4 text-xs text-slate-500">
        <div>
          Constructecnia 2026 • 23 y 24 de noviembre • ADEIC PUCP
        </div>
        <div className="mt-1">
          <a
            href="/admin/login"
            className="text-slate-400 hover:text-adeic-navy-900 underline text-[11px]"
          >
            Acceso exclusivo Staff
          </a>
        </div>
      </footer>
    </main>
  );
}
