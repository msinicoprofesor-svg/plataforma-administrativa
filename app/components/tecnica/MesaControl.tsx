/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/MesaControl.tsx (VISOR DETALLADO + PADDING FIX)    */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { 
  MdCheckCircle, MdSchedule, MdEngineering, MdClose, MdLocationOn, 
  MdPerson, MdWarning, MdFactCheck, MdAdminPanelSettings, MdRouter,
  MdMap, MdPhone, MdSpeed, MdDns, MdCable, MdVisibility, MdCameraAlt, MdSwapHoriz, MdImage, MdCalendarToday, MdAccessTime, MdArrowBack
} from "react-icons/md";

// --- RESPUESTAS RÁPIDAS ---
const NOTAS_PREDEFINIDAS = {
  'TECNICO_VALIDACION': [
    'Cobertura Confirmada (Línea de Vista OK)',
    'Factibilidad Positiva (Puerto Disponible)',
    'Requiere Mástil / Torreta adicional',
    'Sin Cobertura (Rechazar Venta)',
    'Zona Saturada (Lista de Espera)'
  ],
  'ADMIN_AGENDA': [
    'Confirmada en horario sugerido',
    'Agendada (Cambio de horario acordado)',
    'Pospuesta por Cliente',
    'Falta de Material (En espera)',
    'Pago/Contrato no validado'
  ],
  'TECNICO_INSTALACION': [
    'Instalación Exitosa (Parámetros OK)',
    'Instalación Exitosa (Material Adicional usado)',
    'Cliente No Estaba',
    'Sitio Inaccesible',
    'Cancelada en Sitio'
  ]
};

export default function MesaControl({ ventas, cobertura, onActualizarEstado, usuarioActual }) {
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [modoVisor, setModoVisor] = useState(false); 
  const [notaAccion, setNotaAccion] = useState('');
  const [fechaAccion, setFechaAccion] = useState('');

  // --- LÓGICA DE INFRAESTRUCTURA ---
  const getInfoInfraestructura = (venta) => {
    if (!venta.servicio.zonaId || !cobertura) return null;
    const zona = cobertura.find(z => z.id === venta.servicio.zonaId);
    if (!zona) return null;

    let detalleCaja = null;
    if (venta.servicio.tecnologia === 'FIBRA' && venta.servicio.cajaId) {
        const caja = zona.cajas?.find(c => c.id === venta.servicio.cajaId);
        if (caja) detalleCaja = { nombre: caja.nombre, puertos: caja.puertosLibres };
    }
    return { zonaNombre: `${zona.comunidad || zona.nombreAp} (${zona.municipio})`, caja: detalleCaja };
  };

  const getLinkMaps = (gps) => {
    if (!gps) return '#';
    const gpsLimpio = gps.trim();
    if (gpsLimpio.startsWith('http')) return gpsLimpio;
    return `https://www.google.com/maps/search/?api=1&query=$?q=${encodeURIComponent(gpsLimpio)}`;
  };

  // --- FILTROS ---
  const porValidar = ventas.filter(v => v.estatus === 'PENDIENTE');
  const porAgendar = ventas.filter(v => v.estatus === 'VALIDADA_TECNICA');
  const enInstalacion = ventas.filter(v => v.estatus === 'AGENDADA' || v.estatus === 'EN_PROCESO');

  // --- PERMISOS ---
  const getPermisosAccion = (venta) => {
    const rol = usuarioActual.rol;
    const estatus = venta.estatus;

    if (estatus === 'PENDIENTE') {
        const puedeValidar = ['LIDER_TECNICO', 'DIRECTOR', 'GERENTE_MKT', 'ADMINISTRADOR'].includes(rol); 
        return { permitido: puedeValidar, accion: 'VALIDADA_TECNICA', titulo: 'Validación de Cobertura', icono: <MdRouter />, opciones: NOTAS_PREDEFINIDAS.TECNICO_VALIDACION, requiereFecha: false, mensaje: 'Esperando Validación Técnica' };
    }
    if (estatus === 'VALIDADA_TECNICA') {
        const puedeAgendar = ['ADMINISTRADOR', 'DIRECTOR', 'GERENTE_MKT'].includes(rol);
        return { permitido: puedeAgendar, accion: 'AGENDADA', titulo: 'Agendar Instalación', icono: <MdAdminPanelSettings />, opciones: NOTAS_PREDEFINIDAS.ADMIN_AGENDA, requiereFecha: true, mensaje: 'Esperando Agenda Administrativa' };
    }
    if (estatus === 'AGENDADA') {
        const puedeInstalar = ['LIDER_TECNICO', 'TECNICO', 'DIRECTOR', 'ADMINISTRADOR'].includes(rol);
        return { permitido: puedeInstalar, accion: 'FINALIZADA', titulo: 'Reporte de Instalación', icono: <MdEngineering />, opciones: NOTAS_PREDEFINIDAS.TECNICO_INSTALACION, requiereFecha: false, mensaje: 'Asignado a Técnico' };
    }
    return { permitido: false, mensaje: 'Venta Finalizada' };
  };

  const ejecutarAccion = () => {
    const config = getPermisosAccion(ventaSeleccionada);
    if (!config || !config.permitido) return;
    if (!notaAccion) return alert("Selecciona una nota o escribe una observación.");

    let notaFinal = notaAccion;
    if (fechaAccion) notaFinal += ` | Fecha Definitiva: ${fechaAccion.replace('T', ' ')}`;

    if (notaAccion.includes('Rechazar') || notaAccion.includes('Cancelada')) {
        if(window.confirm("¿Estás seguro de CANCELAR esta venta definitivamente?")) {
            onActualizarEstado(ventaSeleccionada.id, 'CANCELADA', notaFinal, usuarioActual.nombre);
        }
    } else {
        onActualizarEstado(ventaSeleccionada.id, config.accion, notaFinal, usuarioActual.nombre);
    }
    setVentaSeleccionada(null); setNotaAccion(''); setFechaAccion('');
  };

  // TARJETA DE VENTA
  const VentaCard = ({ venta, color }) => (
    <div className={`bg-white p-4 rounded-2xl shadow-sm border-l-4 mb-3 transition-all relative group hover:shadow-md cursor-pointer active:scale-95`} style={{ borderLeftColor: color }} onClick={() => { setVentaSeleccionada(venta); setModoVisor(false); }}>
        <div className="flex justify-between items-start mb-1">
            <span className="font-bold text-gray-800 text-sm truncate pr-2">{venta.cliente.nombre}</span>
            <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase font-bold">{venta.servicio.marca}</span>
        </div>
        
        <div className="flex items-center gap-2 mb-1">
             <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-bold uppercase">{venta.servicio.tecnologia}</span>
             {venta.servicio.tipoVenta === 'CAMBIO' && <span className="text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1"><MdSwapHoriz/> Cambio</span>}
             {venta.servicio.fotosEvidencia && (venta.servicio.fotosEvidencia.router || venta.servicio.fotosEvidencia.antena) && <MdImage className="text-gray-400 text-xs" title="Tiene fotos"/>}
        </div>

        <p className="text-xs text-gray-500 flex items-center gap-1 truncate"><MdLocationOn className="text-gray-300"/> {venta.servicio.region}</p>
        
        <div className="mt-2 pt-2 border-t border-gray-50 text-[10px] text-gray-400">
            <p>{venta.fechaRegistro}</p>
        </div>
    </div>
  );

  const configModal = ventaSeleccionada ? getPermisosAccion(ventaSeleccionada) : null;
  const infoInfra = ventaSeleccionada ? getInfoInfraestructura(ventaSeleccionada) : null;
  const tieneFotos = ventaSeleccionada?.servicio?.fotosEvidencia && (ventaSeleccionada.servicio.fotosEvidencia.router || ventaSeleccionada.servicio.fotosEvidencia.antena);

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 pb-10 overflow-hidden px-1">
      {/* COLUMNAS */}
      <div className="flex-1 flex flex-col min-w-[300px] bg-gray-50 rounded-[2rem] border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-100 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10"><h3 className="font-bold text-gray-700 flex items-center gap-2"><MdRouter /> Validación Técnica</h3><span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">{porValidar.length}</span></div>
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            {porValidar.map(v => <VentaCard key={v.id} venta={v} color="#F59E0B" />)}
            {porValidar.length === 0 && <p className="text-center text-xs text-gray-400 mt-10">Sin pendientes</p>}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col min-w-[300px] bg-blue-50/50 rounded-[2rem] border border-blue-100 overflow-hidden">
        <div className="p-4 bg-blue-100/50 border-b border-blue-200 flex justify-between items-center sticky top-0 z-10"><h3 className="font-bold text-blue-900 flex items-center gap-2"><MdAdminPanelSettings /> Agenda Admin</h3><span className="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">{porAgendar.length}</span></div>
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">{porAgendar.map(v => <VentaCard key={v.id} venta={v} color="#3B82F6" />)}</div>
      </div>
      
      <div className="flex-1 flex flex-col min-w-[300px] bg-green-50/50 rounded-[2rem] border border-green-100 overflow-hidden">
        <div className="p-4 bg-green-100/50 border-b border-green-200 flex justify-between items-center sticky top-0 z-10"><h3 className="font-bold text-green-900 flex items-center gap-2"><MdEngineering /> Instalaciones</h3><span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-1 rounded-full">{enInstalacion.length}</span></div>
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">{enInstalacion.map(v => <VentaCard key={v.id} venta={v} color="#10B981" />)}</div>
      </div>

      {/* --- MODAL UNIFICADO --- */}
      {ventaSeleccionada && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
                
                {/* HEADER CON BOTÓN OJO */}
                <div className="p-6 bg-gray-50 border-b border-gray-100 shrink-0 flex justify-between items-center rounded-t-[2.5rem]">
                    <div className="flex items-center gap-3">
                        {modoVisor && (
                            <button onClick={() => setModoVisor(false)} className="p-2 bg-white rounded-full text-gray-500 shadow-sm hover:bg-gray-100">
                                <MdArrowBack />
                            </button>
                        )}
                        <div>
                            <h2 className="text-lg font-extrabold text-gray-800">{modoVisor ? 'Hoja de Venta' : 'Gestionar Venta'}</h2>
                            <div className="flex gap-2 mt-1">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded border ${ventaSeleccionada.estatus === 'PENDIENTE' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>{ventaSeleccionada.estatus.replace('_', ' ')}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {/* BOTÓN OJO (INTERNO) */}
                        {!modoVisor && (
                            <button 
                                onClick={() => setModoVisor(true)} 
                                className="px-4 py-2 bg-white border border-blue-100 text-blue-600 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-50 transition-colors shadow-sm"
                            >
                                <MdVisibility className="text-lg"/> Ver Detalles
                            </button>
                        )}
                        <button onClick={() => setVentaSeleccionada(null)} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-900 shadow-sm"><MdClose /></button>
                    </div>
                </div>

                {/* CONTENIDO SCROLLABLE CON PADDING EXTRA AL FINAL */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 pb-20">
                    
                    {/* VISTA 1: MODO VISOR (DETALLES COMPLETOS) */}
                    {modoVisor ? (
                        <div className="space-y-6 animate-fade-in">
                            
                            {/* FECHAS IMPORTANTES */}
                            <div className="grid grid-cols-2 gap-4 bg-orange-50 p-4 rounded-2xl border border-orange-100">
                                <div>
                                    <p className="text-[10px] font-bold text-orange-400 uppercase mb-1">Fecha Registro</p>
                                    <p className="font-bold text-gray-700 flex items-center gap-2"><MdCalendarToday/> {ventaSeleccionada.fechaRegistro}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-orange-400 uppercase mb-1">Sugerencia Cliente</p>
                                    <p className="font-bold text-gray-700 flex items-center gap-2">
                                        <MdAccessTime/> 
                                        {ventaSeleccionada.servicio.fechaConexion ? `${ventaSeleccionada.servicio.fechaConexion} ${ventaSeleccionada.servicio.horaConexion || ''}` : 'Sin preferencia'}
                                    </p>
                                </div>
                            </div>

                            {/* EVIDENCIAS */}
                            {tieneFotos && (
                                <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                                    <h4 className="text-xs font-black text-purple-500 uppercase mb-3 flex items-center gap-1"><MdCameraAlt/> Evidencia Equipo Actual</h4>
                                    <div className="flex gap-4 overflow-x-auto pb-2">
                                        {ventaSeleccionada.servicio.fotosEvidencia.router && (
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-32 h-32 bg-white rounded-xl overflow-hidden shadow-sm border border-purple-200">
                                                    <img src={ventaSeleccionada.servicio.fotosEvidencia.router} className="w-full h-full object-cover hover:scale-150 transition-transform cursor-zoom-in" alt="Router"/>
                                                </div>
                                                <span className="text-[10px] font-bold text-purple-400">Router</span>
                                            </div>
                                        )}
                                        {ventaSeleccionada.servicio.fotosEvidencia.antena && (
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-32 h-32 bg-white rounded-xl overflow-hidden shadow-sm border border-purple-200">
                                                    <img src={ventaSeleccionada.servicio.fotosEvidencia.antena} className="w-full h-full object-cover hover:scale-150 transition-transform cursor-zoom-in" alt="Antena"/>
                                                </div>
                                                <span className="text-[10px] font-bold text-purple-400">Antena</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* DATOS COMPLETOS */}
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                                <h4 className="text-xs font-black text-gray-400 uppercase border-b border-gray-100 pb-2">Cliente</h4>
                                <p className="text-sm font-bold text-gray-800">{ventaSeleccionada.cliente.nombre}</p>
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                    <p><span className="font-bold">Tel 1:</span> {ventaSeleccionada.cliente.telefono1}</p>
                                    <p><span className="font-bold">Tel 2:</span> {ventaSeleccionada.cliente.telefono2 || '-'}</p>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded-lg"><span className="font-bold">Dirección:</span> {ventaSeleccionada.cliente.direccion}, {ventaSeleccionada.cliente.comunidad}, {ventaSeleccionada.cliente.municipio}</p>
                                <p className="text-xs text-gray-500 bg-yellow-50 p-2 rounded-lg italic border border-yellow-100">"{ventaSeleccionada.cliente.referencias}"</p>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 space-y-3">
                                <h4 className="text-xs font-black text-blue-400 uppercase border-b border-blue-200 pb-2">Servicio</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><p className="text-[10px] font-bold text-gray-400 uppercase">Tipo</p><p className="font-bold text-gray-800">{ventaSeleccionada.servicio.tipoVenta}</p></div>
                                    <div><p className="text-[10px] font-bold text-gray-400 uppercase">Tecnología</p><p className="font-bold text-gray-800">{ventaSeleccionada.servicio.tecnologia}</p></div>
                                    <div><p className="text-[10px] font-bold text-gray-400 uppercase">Plan</p><p className="font-bold text-gray-800">{ventaSeleccionada.servicio.velocidad}</p></div>
                                    <div><p className="text-[10px] font-bold text-gray-400 uppercase">Mensualidad</p><p className="font-bold text-gray-800">${ventaSeleccionada.servicio.mensualidad}</p></div>
                                </div>
                                <a href={getLinkMaps(ventaSeleccionada.cliente.gps)} target="_blank" rel="noreferrer" className="block text-center text-xs bg-white text-blue-600 px-3 py-3 rounded-xl font-bold border border-blue-200 hover:bg-blue-50 shadow-sm mt-2">
                                    Ver Ubicación GPS
                                </a>
                            </div>
                        </div>
                    ) : (
                        // VISTA 2: MODO GESTIÓN (RESUMEN + ACCIONES)
                        <div className="space-y-6">
                            {/* RESUMEN RÁPIDO */}
                            <div className="flex gap-4 items-start bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm shrink-0"><MdPerson /></div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800">{ventaSeleccionada.cliente.nombre}</h3>
                                    <p className="text-xs text-gray-500">{ventaSeleccionada.cliente.comunidad}, {ventaSeleccionada.cliente.municipio}</p>
                                    <div className="flex gap-2 mt-2">
                                        <a href={`tel:${ventaSeleccionada.cliente.telefono1}`} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-green-200"><MdPhone /> Llamar</a>
                                        <a href={getLinkMaps(ventaSeleccionada.cliente.gps)} target="_blank" rel="noreferrer" className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-blue-200"><MdMap /> Mapa</a>
                                    </div>
                                </div>
                            </div>

                            {/* INFRAESTRUCTURA ASIGNADA */}
                            <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm">
                                <p className="text-[10px] font-bold text-blue-400 uppercase mb-2">Infraestructura Asignada</p>
                                {infoInfra ? (
                                    <>
                                        <p className="font-bold text-gray-700 text-sm flex items-center gap-2"><MdDns className="text-blue-500"/> {infoInfra.zonaNombre}</p>
                                        {infoInfra.caja && <p className="font-bold text-gray-600 text-xs flex items-center gap-2 mt-1 ml-1"><MdCable className="text-purple-500"/> Caja: {infoInfra.caja.nombre} <span className="bg-green-100 text-green-700 px-2 rounded-full text-[9px]">{infoInfra.caja.puertos} L</span></p>}
                                    </>
                                ) : <p className="text-xs text-gray-400 italic">No requiere infraestructura específica o zona no encontrada.</p>}
                            </div>

                            {/* ZONA DE ACCIÓN (FORMULARIO) */}
                            {configModal && configModal.permitido ? (
                                <div className="animate-slide-up border-t border-gray-100 pt-4">
                                    <h4 className="text-sm font-black text-gray-800 uppercase flex items-center gap-2 mb-3">{configModal.icono} {configModal.titulo}</h4>
                                    
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {configModal.opciones.map((op, i) => (
                                            <button 
                                                key={i} 
                                                onClick={() => setNotaAccion(op)}
                                                className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${notaAccion === op ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
                                            >
                                                {op}
                                            </button>
                                        ))}
                                    </div>

                                    <textarea 
                                        value={notaAccion} 
                                        onChange={e => setNotaAccion(e.target.value)} 
                                        className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none text-sm font-medium text-gray-800 resize-none focus:ring-2 focus:ring-blue-100 min-h-[80px] mb-3" 
                                        placeholder="Escribe observaciones..." 
                                    />

                                    {configModal.requiereFecha && (
                                        <div className="bg-blue-50 p-4 rounded-2xl mb-4">
                                            <label className="text-[10px] font-bold text-blue-500 uppercase mb-2 block">Fecha Instalación Definitiva</label>
                                            <input type="datetime-local" value={fechaAccion} onChange={e => setFechaAccion(e.target.value)} className="w-full px-4 py-3 bg-white rounded-xl text-sm font-bold text-gray-700 outline-none" />
                                            <p className="text-[10px] text-blue-400 mt-2">Sugerido por cliente: {ventaSeleccionada.servicio.fechaConexion || 'N/A'} {ventaSeleccionada.servicio.horaConexion || ''}</p>
                                        </div>
                                    )}

                                    <button onClick={ejecutarAccion} className="w-full py-4 bg-[#DA291C] text-white font-bold rounded-2xl shadow-lg hover:shadow-red-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                                        <MdCheckCircle className="text-xl" /> Confirmar y Avanzar
                                    </button>
                                </div>
                            ) : (
                                <div className="p-4 bg-gray-100 rounded-2xl text-center text-xs text-gray-400">
                                    Solo lectura o sin permisos para gestionar esta etapa.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}