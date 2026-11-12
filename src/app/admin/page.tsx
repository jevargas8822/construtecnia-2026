'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { EVENT_CONFIG } from '@/config';
import {
  Play,
  Square,
  RefreshCw,
  Users,
  Award,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  LogOut,
  Search,
  CheckCircle,
  Upload,
  Layers,
  ShieldAlert,
} from 'lucide-react';

interface Ponencia {
  id: number;
  orden: number;
  dia: number;
  fecha: string;
  nombre: string;
  expositor: string | null;
  descripcion: string | null;
  estado: 'cerrada' | 'abierta' | 'finalizada';
  abierta_en: string | null;
  cerrada_en: string | null;
  total_asistentes: number;
}

interface AsistenciaItem {
  id: number;
  correo: string;
  tipo_id: 'alumno_pucp' | 'externo';
  documento: string;
  ponencia_id: number;
  ponencia_nombre: string;
  ponencia_orden: number;
  registrado_en_lima: string;
  es_inscrito: boolean;
}

interface CertificadoItem {
  correo: string;
  documento: string;
  tipo_id: 'alumno_pucp' | 'externo';
  total_ponencias: number;
  ponencias_asistidas: number[];
  apto_certificado: boolean;
  es_inscrito: boolean;
  nombre_inscrito: string | null;
  primera_asistencia_lima: string;
  ultima_asistencia_lima: string;
}

interface RevisionData {
  totalCasosSospechosos: number;
  documentosConMultiplesCorreos: Array<{
    documento: string;
    correos: string[];
    total_correos: number;
    total_registros: number;
  }>;
  correosConMultiplesDocumentos: Array<{
    correo: string;
    documentos: string[];
    total_documentos: number;
    total_registros: number;
  }>;
  ipsConMultiplesAsistentes: Array<{
    ip_hash: string;
    total_correos: number;
    total_registros: number;
    correos_muestra: string[];
  }>;
}

type TabType = 'ponencias' | 'asistencias' | 'certificados' | 'revision' | 'inscritos';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('ponencias');

  // Datos principales
  const [ponencias, setPonencias] = useState<Ponencia[]>([]);
  const [ponenciaAbierta, setPonenciaAbierta] = useState<Ponencia | null>(null);
  const [totalGeneralAsistencias, setTotalGeneralAsistencias] = useState(0);
  const [accionEnCurso, setAccionEnCurso] = useState<number | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [alertaExito, setAlertaExito] = useState<string | null>(null);

  // Tab Asistencias
  const [asistencias, setAsistencias] = useState<AsistenciaItem[]>([]);
  const [busquedaAsistencias, setBusquedaAsistencias] = useState('');
  const [cargandoAsistencias, setCargandoAsistencias] = useState(false);

  // Tab Certificados
  const [certificados, setCertificados] = useState<CertificadoItem[]>([]);
  const [soloAptosCertificados, setSoloAptosCertificados] = useState(false);
  const [busquedaCertificados, setBusquedaCertificados] = useState('');
  const [statsCertificados, setStatsCertificados] = useState({
    totalAsistentesUnicos: 0,
    totalAptosCertificado: 0,
    totalInscritosCruzados: 0,
  });
  const [cargandoCertificados, setCargandoCertificados] = useState(false);

  // Tab Revisión
  const [revisionData, setRevisionData] = useState<RevisionData | null>(null);
  const [cargandoRevision, setCargandoRevision] = useState(false);

  // Tab Inscritos (Passline)
  const [statsInscritos, setStatsInscritos] = useState({ totalInscritos: 0, totalCruzados: 0 });
  const [archivoCsv, setArchivoCsv] = useState<File | null>(null);
  const [subiendoCsv, setSubiendoCsv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Cargar Ponencias y Monitoreo en Vivo (Polling cada 4s)
  const cargarPonencias = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ponencias', { cache: 'no-store' });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setPonencias(data.ponencias || []);
        setPonenciaAbierta(data.ponenciaAbierta);
        setTotalGeneralAsistencias(data.totalAsistenciasRegistradas || 0);
      }
    } catch (err) {
      console.warn('Error al cargar ponencias:', err);
    }
  }, [router]);

  useEffect(() => {
    cargarPonencias();
    const interval = setInterval(() => {
      cargarPonencias();
    }, 4000); // Polling continuo cada 4 segundos
    return () => clearInterval(interval);
  }, [cargarPonencias]);

  // 2. Cargar Asistencias
  const cargarAsistencias = useCallback(async () => {
    setCargandoAsistencias(true);
    try {
      const url = `/api/admin/asistencias?q=${encodeURIComponent(busquedaAsistencias)}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setAsistencias(data.asistencias || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoAsistencias(false);
    }
  }, [busquedaAsistencias]);

  useEffect(() => {
    if (activeTab === 'asistencias') {
      cargarAsistencias();
    }
  }, [activeTab, cargarAsistencias]);

  // 3. Cargar Certificados
  const cargarCertificados = useCallback(async () => {
    setCargandoCertificados(true);
    try {
      const url = `/api/admin/certificados?soloAptos=${soloAptosCertificados}&q=${encodeURIComponent(
        busquedaCertificados
      )}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCertificados(data.asistentes || []);
        setStatsCertificados({
          totalAsistentesUnicos: data.totalAsistentesUnicos,
          totalAptosCertificado: data.totalAptosCertificado,
          totalInscritosCruzados: data.totalInscritosCruzados,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoCertificados(false);
    }
  }, [soloAptosCertificados, busquedaCertificados]);

  useEffect(() => {
    if (activeTab === 'certificados') {
      cargarCertificados();
    }
  }, [activeTab, cargarCertificados]);

  // 4. Cargar Revisión
  const cargarRevision = useCallback(async () => {
    setCargandoRevision(true);
    try {
      const res = await fetch('/api/admin/revision', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setRevisionData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoRevision(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'revision') {
      cargarRevision();
    }
  }, [activeTab, cargarRevision]);

  // 5. Cargar Inscritos Stats
  const cargarInscritos = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/inscritos', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStatsInscritos(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'inscritos') {
      cargarInscritos();
    }
  }, [activeTab, cargarInscritos]);

  // Acción: ABRIR o CERRAR Ponencia
  const handleCambiarEstadoPonencia = async (ponenciaId: number, accion: 'abrir' | 'cerrar') => {
    setAccionEnCurso(ponenciaId);
    setErrorBanner(null);
    setAlertaExito(null);

    try {
      const res = await fetch('/api/admin/ponencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ponenciaId, accion }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorBanner(data.error || 'No se pudo cambiar el estado de la ponencia.');
      } else {
        setAlertaExito(data.mensaje);
        await cargarPonencias();
        setTimeout(() => setAlertaExito(null), 4000);
      }
    } catch {
      setErrorBanner('Error de red al intentar actualizar la ponencia.');
    } finally {
      setAccionEnCurso(null);
    }
  };

  // Acción: Cerrar Sesión
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      router.push('/admin/login');
    }
  };

  // Subir CSV de Inscritos Passline
  const handleSubirCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivoCsv) return;

    setSubiendoCsv(true);
    setErrorBanner(null);
    const formData = new FormData();
    formData.append('file', archivoCsv);

    try {
      const res = await fetch('/api/admin/inscritos', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorBanner(data.error || 'Error al procesar el archivo CSV.');
      } else {
        setAlertaExito(data.mensaje);
        setArchivoCsv(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await cargarInscritos();
        setTimeout(() => setAlertaExito(null), 5000);
      }
    } catch {
      setErrorBanner('Error de conexión al subir el archivo CSV.');
    } finally {
      setSubiendoCsv(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* HEADER SUPERIOR DEL PANEL */}
      <header className="bg-adeic-navy-950 text-white border-b-4 border-adeic-gold-500 shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-adeic-gold-500 text-adeic-navy-950 font-black flex items-center justify-center text-xl shadow-md border border-adeic-gold-400">
              A
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-adeic-gold-400 bg-adeic-navy-800 px-2 py-0.5 rounded border border-adeic-navy-700">
                  Panel de Staff
                </span>
                <span className="text-xs text-slate-300 font-semibold">{EVENT_CONFIG.organizador}</span>
              </div>
              <h1 className="text-base md:text-lg font-black tracking-tight text-white leading-tight">
                {EVENT_CONFIG.nombreEvento}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href="/asistencia"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white bg-adeic-navy-800 px-3 py-1.5 rounded-lg border border-adeic-navy-700"
            >
              <span>Ver QR Asistente</span>
            </a>
            <button
              onClick={handleLogout}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN POR PESTAÑAS */}
        <div className="max-w-7xl mx-auto px-4 flex space-x-1 overflow-x-auto no-scrollbar border-t border-slate-800/80 pt-1">
          <button
            onClick={() => setActiveTab('ponencias')}
            className={`px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-t-lg transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'ponencias'
                ? 'bg-slate-100 text-adeic-navy-950 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Control de Ponencias</span>
          </button>

          <button
            onClick={() => setActiveTab('asistencias')}
            className={`px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-t-lg transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'asistencias'
                ? 'bg-slate-100 text-adeic-navy-950 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Asistencias ({totalGeneralAsistencias})</span>
          </button>

          <button
            onClick={() => setActiveTab('certificados')}
            className={`px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-t-lg transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'certificados'
                ? 'bg-slate-100 text-adeic-navy-950 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Certificados (≥ 4)</span>
          </button>

          <button
            onClick={() => setActiveTab('revision')}
            className={`px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-t-lg transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'revision'
                ? 'bg-slate-100 text-adeic-navy-950 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>
              Revisión Seguridad{' '}
              {revisionData && revisionData.totalCasosSospechosos > 0 && (
                <span className="ml-1 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {revisionData.totalCasosSospechosos}
                </span>
              )}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('inscritos')}
            className={`px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-t-lg transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'inscritos'
                ? 'bg-slate-100 text-adeic-navy-950 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Lista Passline</span>
          </button>
        </div>
      </header>

      {/* ALERTAS GLOBALES */}
      <div className="max-w-7xl mx-auto px-4 w-full pt-4">
        {errorBanner && (
          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-xl text-xs md:text-sm text-red-800 flex items-start space-x-2 shadow-sm mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="font-bold flex-1">{errorBanner}</div>
            <button onClick={() => setErrorBanner(null)} className="text-red-600 font-bold ml-2">
              ✕
            </button>
          </div>
        )}

        {alertaExito && (
          <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-xl text-xs md:text-sm text-emerald-900 flex items-start space-x-2 shadow-sm mb-4">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="font-bold flex-1">{alertaExito}</div>
            <button onClick={() => setAlertaExito(null)} className="text-emerald-600 font-bold ml-2">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 pb-12 w-full flex-1">
        {/* ============================================================== */}
        {/* PESTAÑA 1: CONTROL DE PONENCIAS (8 PONENCIAS)                  */}
        {/* ============================================================== */}
        {activeTab === 'ponencias' && (
          <div className="space-y-6">
            {/* MONITOR EN VIVO: PONENCIA ABIERTA ACTUAL */}
            <div className="bg-gradient-to-r from-adeic-navy-950 to-adeic-navy-900 rounded-3xl p-6 text-white shadow-xl border-4 border-adeic-gold-500 relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    {ponenciaAbierta ? (
                      <span className="inline-flex items-center space-x-1.5 bg-emerald-500 text-adeic-navy-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow">
                        <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                        <span>PONENCIA ABIERTA AHORA MISMO</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 bg-amber-500 text-adeic-navy-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                        <span>NINGUNA PONENCIA ABIERTA</span>
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      • Los asistentes registran en esta ponencia
                    </span>
                  </div>

                  <h2 className="text-xl md:text-3xl font-black text-white leading-tight">
                    {ponenciaAbierta ? ponenciaAbierta.nombre : 'No hay ponencia abierta actualmente'}
                  </h2>

                  {ponenciaAbierta?.expositor && (
                    <p className="text-sm text-slate-300 mt-1">
                      Expositor: <span className="text-white font-semibold">{ponenciaAbierta.expositor}</span>
                    </p>
                  )}
                </div>

                {/* CONTADOR EN VIVO */}
                <div className="flex items-center space-x-4 bg-adeic-navy-800/90 border border-adeic-gold-400/50 rounded-2xl p-4 flex-shrink-0">
                  <div className="text-center">
                    <div className="text-3xl md:text-5xl font-black text-adeic-gold-400 leading-none">
                      {ponenciaAbierta ? ponenciaAbierta.total_asistentes : 0}
                    </div>
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mt-1">
                      Asistentes en vivo
                    </div>
                  </div>

                  {ponenciaAbierta && (
                    <div className="border-l border-slate-700 pl-4">
                      <button
                        onClick={() => handleCambiarEstadoPonencia(ponenciaAbierta.id, 'cerrar')}
                        disabled={accionEnCurso === ponenciaAbierta.id}
                        className="min-h-[50px] px-5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow flex items-center space-x-2 transition"
                      >
                        <Square className="w-4 h-4 fill-current" />
                        <span>Cerrar Ponencia</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* TABLA RESUMEN DE LAS 8 PONENCIAS */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-black text-adeic-navy-950 uppercase tracking-tight">
                    Lista Oficial de las 8 Ponencias (ADEIC PUCP)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Control manual para el staff. Solo 1 ponencia puede estar abierta a la vez.
                  </p>
                </div>
                <button
                  onClick={() => cargarPonencias()}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-adeic-navy-900 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Actualizar lista</span>
                </button>
              </div>

              {/* LISTA / CARDS DE PONENCIAS CON BOTONES GRANDES (OPTIMIZADAS PARA CELULAR) */}
              <div className="divide-y divide-slate-200">
                {ponencias.map((p) => {
                  const estaAbierta = p.estado === 'abierta';
                  const procesando = accionEnCurso === p.id;

                  return (
                    <div
                      key={p.id}
                      className={`p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                        estaAbierta ? 'bg-amber-50/70 border-l-8 border-adeic-gold-500' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-adeic-navy-900 text-adeic-gold-400 text-xs font-black px-2.5 py-0.5 rounded-md">
                            Ponencia #{p.orden}
                          </span>
                          <span className="bg-slate-200 text-slate-800 text-xs font-bold px-2 py-0.5 rounded">
                            Día {p.dia} • {p.fecha}
                          </span>
                          {estaAbierta ? (
                            <span className="bg-emerald-600 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                              <span>ABIERTA</span>
                            </span>
                          ) : (
                            <span className="bg-slate-300 text-slate-700 text-xs font-bold px-2 py-0.5 rounded">
                              Cerrada
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-extrabold text-adeic-navy-950 leading-snug">
                          {p.nombre}
                        </h4>

                        {p.expositor && (
                          <p className="text-xs text-slate-600 font-medium">
                            Expositor: <span className="font-bold text-slate-800">{p.expositor}</span>
                          </p>
                        )}

                        <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                          {p.abierta_en && (
                            <span>Apertura: {new Date(p.abierta_en).toLocaleTimeString('es-PE', { hour12: true })}</span>
                          )}
                          {p.cerrada_en && (
                            <span>Cierre: {new Date(p.cerrada_en).toLocaleTimeString('es-PE', { hour12: true })}</span>
                          )}
                        </div>
                      </div>

                      {/* CONTEO Y BOTONES GRANDES PARA USO DESDE CELULAR */}
                      <div className="flex items-center justify-between md:justify-end space-x-4 border-t md:border-t-0 pt-3 md:pt-0">
                        <div className="text-center px-3 py-1 bg-slate-100 rounded-xl border border-slate-200">
                          <div className="text-xl md:text-2xl font-black text-adeic-navy-950">
                            {p.total_asistentes}
                          </div>
                          <div className="text-[10px] uppercase font-bold text-slate-500">Asistentes</div>
                        </div>

                        {estaAbierta ? (
                          <button
                            onClick={() => handleCambiarEstadoPonencia(p.id, 'cerrar')}
                            disabled={procesando}
                            className="min-h-[52px] px-6 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-md flex items-center space-x-2 transition"
                          >
                            {procesando ? (
                              <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                              <Square className="w-5 h-5 fill-current" />
                            )}
                            <span>CERRAR</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCambiarEstadoPonencia(p.id, 'abrir')}
                            disabled={procesando}
                            className="min-h-[52px] px-6 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-md flex items-center space-x-2 transition"
                          >
                            {procesando ? (
                              <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                              <Play className="w-5 h-5 fill-current" />
                            )}
                            <span>ABRIR</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 2: ASISTENCIAS (REGISTROS COMPLETOS Y CSV)             */}
        {/* ============================================================== */}
        {activeTab === 'asistencias' && (
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden space-y-4 p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-black text-adeic-navy-950">
                  Registro Consolidado de Asistencias
                </h3>
                <p className="text-xs text-slate-500">
                  Total general registrado: <strong>{totalGeneralAsistencias} asistencias</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="/api/admin/exportar?tipo=asistencias"
                  download
                  className="min-h-[44px] px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center space-x-2 shadow transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar Asistencias CSV</span>
                </a>
              </div>
            </div>

            {/* BARRA DE BÚSQUEDA */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por correo o por documento/código..."
                value={busquedaAsistencias}
                onChange={(e) => setBusquedaAsistencias(e.target.value)}
                className="w-full min-h-[46px] pl-10 pr-4 rounded-xl border-2 border-slate-300 focus:border-adeic-navy-900 focus:outline-none text-sm font-semibold"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* TABLA DE ASISTENCIAS */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase font-black tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">Correo</th>
                    <th className="py-3 px-3">Tipo</th>
                    <th className="py-3 px-3">Documento</th>
                    <th className="py-3 px-3">Ponencia</th>
                    <th className="py-3 px-3">Fecha y Hora (Lima)</th>
                    <th className="py-3 px-3 text-center">Passline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cargandoAsistencias ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Cargando registros...
                      </td>
                    </tr>
                  ) : asistencias.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                        No se encontraron registros de asistencia con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    asistencias.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-mono text-slate-500">{index + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-adeic-navy-950 break-all">
                          {item.correo}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              item.tipo_id === 'alumno_pucp'
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            {item.tipo_id === 'alumno_pucp' ? 'PUCP' : 'EXTERNO'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                          {item.documento}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-adeic-navy-900">
                            Ponencia #{item.ponencia_orden}
                          </span>
                          <span className="block text-[11px] text-slate-500 truncate max-w-xs">
                            {item.ponencia_nombre}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono">
                          {item.registrado_en_lima}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {item.es_inscrito ? (
                            <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              ✓ En lista
                            </span>
                          ) : (
                            <span className="inline-block bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded">
                              -
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 3: CERTIFICADOS (MÍNIMO 4 PONENCIAS)                   */}
        {/* ============================================================== */}
        {activeTab === 'certificados' && (
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-black text-adeic-navy-950 flex items-center space-x-2">
                  <Award className="w-5 h-5 text-adeic-gold-500" />
                  <span>Emisión y Control de Certificados</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Regla de certificación: <strong>mínimo 4 ponencias distintas</strong> asistidas.
                </p>
              </div>

              {/* BOTONES DE EXPORTACIÓN CSV */}
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="/api/admin/exportar?tipo=certificados_aptos"
                  download
                  className="min-h-[44px] px-4 bg-adeic-gold-500 hover:bg-adeic-gold-400 text-adeic-navy-950 font-black text-xs uppercase tracking-wider rounded-xl flex items-center space-x-2 shadow transition"
                >
                  <Award className="w-4 h-4" />
                  <span>Exportar Solo Aptos (≥ 4)</span>
                </a>

                <a
                  href="/api/admin/exportar?tipo=certificados_todos"
                  download
                  className="min-h-[44px] px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center space-x-2 shadow transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar Todos los Asistentes</span>
                </a>
              </div>
            </div>

            {/* ESTADÍSTICAS RÁPIDAS */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-2xl font-black text-adeic-navy-950">
                  {statsCertificados.totalAsistentesUnicos}
                </div>
                <div className="text-xs text-slate-500 font-semibold">Total Asistentes Únicos</div>
              </div>

              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3">
                <div className="text-2xl font-black text-emerald-800">
                  {statsCertificados.totalAptosCertificado}
                </div>
                <div className="text-xs text-emerald-700 font-bold">
                  Aptos para Certificado (≥ 4)
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 col-span-2 md:col-span-1">
                <div className="text-2xl font-black text-blue-900">
                  {statsCertificados.totalInscritosCruzados}
                </div>
                <div className="text-xs text-blue-700 font-semibold">
                  Cruzados con Lista Passline
                </div>
              </div>
            </div>

            {/* FILTROS Y BÚSQUEDA */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="Buscar por correo o por documento/código..."
                  value={busquedaCertificados}
                  onChange={(e) => setBusquedaCertificados(e.target.value)}
                  className="w-full min-h-[44px] pl-10 pr-4 rounded-xl border-2 border-slate-300 focus:border-adeic-navy-900 focus:outline-none text-sm font-semibold"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>

              <button
                type="button"
                onClick={() => setSoloAptosCertificados(!soloAptosCertificados)}
                className={`min-h-[44px] px-4 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition whitespace-nowrap ${
                  soloAptosCertificados
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {soloAptosCertificados ? '✓ Mostrando Solo Aptos (≥ 4)' : 'Filtrar Solo Aptos (≥ 4)'}
              </button>
            </div>

            {/* TABLA DE CERTIFICADOS */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase font-black tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">Asistente (Correo)</th>
                    <th className="py-3 px-3">Documento</th>
                    <th className="py-3 px-3 text-center">Ponencias</th>
                    <th className="py-3 px-3">Detalle Asistidas</th>
                    <th className="py-3 px-3 text-center">Estado Certificado</th>
                    <th className="py-3 px-3 text-center">Passline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cargandoCertificados ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Calculando ponencias asistidas...
                      </td>
                    </tr>
                  ) : certificados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                        No hay asistentes que coincidan con el criterio seleccionado.
                      </td>
                    </tr>
                  ) : (
                    certificados.map((item, index) => {
                      const cumple = item.total_ponencias >= 4;

                      return (
                        <tr key={item.correo} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-mono text-slate-500">{index + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-adeic-navy-950 break-all">
                            {item.correo}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-800">
                            {item.documento} ({item.tipo_id === 'alumno_pucp' ? 'PUCP' : 'EXT'})
                          </td>
                          <td className="py-2.5 px-3 text-center font-black text-sm">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full ${
                                cumple
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {item.total_ponencias} / 8
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap gap-1">
                              {item.ponencias_asistidas?.map((pNum) => (
                                <span
                                  key={pNum}
                                  className="bg-adeic-navy-100 text-adeic-navy-900 font-bold px-1.5 py-0.5 rounded text-[10px]"
                                >
                                  P{pNum}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {cumple ? (
                              <span className="inline-flex items-center space-x-1 bg-emerald-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-sm">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>APTO</span>
                              </span>
                            ) : (
                              <span className="inline-block bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded">
                                Falta ({4 - item.total_ponencias})
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {item.es_inscrito ? (
                              <span className="text-emerald-700 font-bold text-[10px]">
                                ✓ {item.nombre_inscrito || 'Inscrito'}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 4: REVISIÓN DE SEGURIDAD (INCONSISTENCIAS)              */}
        {/* ============================================================== */}
        {activeTab === 'revision' && (
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-lg font-black text-adeic-navy-950 flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <span>Auditoría de Seguridad y Detección de Anomalías</span>
              </h3>
              <p className="text-xs text-slate-500">
                Se detectan automáticamente inconsistencias para revisión del staff antes de emitir certificados.
              </p>
            </div>

            {cargandoRevision ? (
              <div className="py-8 text-center text-slate-400">Analizando inconsistencias...</div>
            ) : !revisionData || revisionData.totalCasosSospechosos === 0 ? (
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-6 text-center text-emerald-900">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-base font-extrabold">No se han detectado inconsistencias</h4>
                <p className="text-xs text-emerald-700 mt-1">
                  Todos los registros presentan correspondencia unívoca entre correos y documentos.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Un documento con múltiples correos */}
                <div>
                  <h4 className="text-sm font-black text-red-800 uppercase tracking-wide mb-2 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>
                      Mismo Documento / Código con Correos Distintos (
                      {revisionData.documentosConMultiplesCorreos.length})
                    </span>
                  </h4>
                  {revisionData.documentosConMultiplesCorreos.length === 0 ? (
                    <div className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg">
                      Ningún caso detectado.
                    </div>
                  ) : (
                    <div className="border border-red-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-red-50 text-red-900 font-black">
                          <tr>
                            <th className="p-2.5">Documento</th>
                            <th className="p-2.5">Correos Asociados</th>
                            <th className="p-2.5 text-center">Cant. Correos</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-100">
                          {revisionData.documentosConMultiplesCorreos.map((row) => (
                            <tr key={row.documento} className="hover:bg-red-50/50">
                              <td className="p-2.5 font-mono font-bold text-slate-900">
                                {row.documento}
                              </td>
                              <td className="p-2.5 text-slate-700">
                                {row.correos.join(', ')}
                              </td>
                              <td className="p-2.5 text-center font-bold text-red-600">
                                {row.total_correos}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 2. Un correo con múltiples documentos */}
                <div>
                  <h4 className="text-sm font-black text-amber-800 uppercase tracking-wide mb-2 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>
                      Mismo Correo Electrónico con Documentos Distintos (
                      {revisionData.correosConMultiplesDocumentos.length})
                    </span>
                  </h4>
                  {revisionData.correosConMultiplesDocumentos.length === 0 ? (
                    <div className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg">
                      Ningún caso detectado.
                    </div>
                  ) : (
                    <div className="border border-amber-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-amber-50 text-amber-900 font-black">
                          <tr>
                            <th className="p-2.5">Correo</th>
                            <th className="p-2.5">Documentos Registrados</th>
                            <th className="p-2.5 text-center">Cant. Documentos</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100">
                          {revisionData.correosConMultiplesDocumentos.map((row) => (
                            <tr key={row.correo} className="hover:bg-amber-50/50">
                              <td className="p-2.5 font-bold text-slate-900">{row.correo}</td>
                              <td className="p-2.5 font-mono text-slate-700">
                                {row.documentos.join(', ')}
                              </td>
                              <td className="p-2.5 text-center font-bold text-amber-700">
                                {row.total_documentos}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 3. Concentración inusual por IP */}
                {revisionData.ipsConMultiplesAsistentes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-2">
                      IPs con alta concentración de registros (≥ 4 asistentes distintos)
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-bold">
                          <tr>
                            <th className="p-2.5">IP Hash</th>
                            <th className="p-2.5">Muestra de Correos</th>
                            <th className="p-2.5 text-center">Asistentes Distintos</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {revisionData.ipsConMultiplesAsistentes.map((row) => (
                            <tr key={row.ip_hash}>
                              <td className="p-2.5 font-mono text-[10px] text-slate-500">
                                {row.ip_hash.slice(0, 16)}...
                              </td>
                              <td className="p-2.5 text-slate-700">
                                {row.correos_muestra.join(', ')}
                              </td>
                              <td className="p-2.5 text-center font-bold text-slate-900">
                                {row.total_correos}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 5: INSCRITOS PASSLINE (CARGA CSV)                       */}
        {/* ============================================================== */}
        {activeTab === 'inscritos' && (
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-lg font-black text-adeic-navy-950 flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>Lista Oficial de Inscritos (Passline)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Carga el archivo CSV descargado de Passline para cruzar la lista oficial con las asistencias registradas.
              </p>
            </div>

            {/* ESTADÍSTICAS DE CRUCE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="text-3xl font-black text-adeic-navy-950">
                  {statsInscritos.totalInscritos}
                </div>
                <div className="text-xs text-slate-600 font-bold mt-0.5">
                  Inscritos cargados en el sistema
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4">
                <div className="text-3xl font-black text-emerald-800">
                  {statsInscritos.totalCruzados}
                </div>
                <div className="text-xs text-emerald-700 font-bold mt-0.5">
                  Inscritos que ya han registrado asistencia
                </div>
              </div>
            </div>

            {/* FORMULARIO DE CARGA DE ARCHIVO CSV */}
            <form onSubmit={handleSubirCsv} className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center">
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-black text-slate-800">Selecciona o arrastra el archivo CSV</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                El archivo debe contener al menos una columna llamada &quot;correo&quot; o &quot;email&quot;. Opcionalmente columnas &quot;nombres&quot; y &quot;documento&quot;.
              </p>

              <div className="max-w-xs mx-auto space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => setArchivoCsv(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-adeic-navy-900 file:text-white hover:file:bg-adeic-navy-800 cursor-pointer"
                />

                <button
                  type="submit"
                  disabled={!archivoCsv || subiendoCsv}
                  className={`w-full min-h-[46px] rounded-xl font-bold text-xs uppercase tracking-wider text-white flex items-center justify-center space-x-2 transition ${
                    !archivoCsv || subiendoCsv
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 shadow'
                  }`}
                >
                  {subiendoCsv ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Procesando archivo CSV...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Importar Lista Passline</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
