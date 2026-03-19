/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/vehiculos/ModuloSolicitudesVehiculos.tsx           */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { 
    MdAssignment, MdClose, MdCheckCircle, MdCancel, MdDirectionsCar, 
    MdOutlineDateRange, MdSend, MdHourglassEmpty, MdLocationOn, MdAccessTime
} from 'react-icons/md';
import { useSolicitudesVehiculos } from '../../hooks/useSolicitudesVehiculos';

export default function ModuloSolicitudesVehiculos({ usuarioActivo, esEncargado, colaboradores = [], vehiculos = [], onClose }) {
    const { solicitudes, loading, crearSolicitud, responderSolicitud } = useSolicitudesVehiculos(usuarioActivo?.id, esEncargado);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Vista Colaborador (FORMULARIO INTELIGENTE)
    const [formSolicitud, setFormSolicitud] = useState({ 
        tipo_duracion: 'DIAS', // 'HORAS', 'DIA', 'DIAS'
        fecha_inicio: '', 
        fecha_fin: '',
        hora_inicio: '',
        hora_fin: '',
        destino: '',
        motivo: '' 
    });
    
    // Vista Admin
    const [solicitudAProcesar, setSolicitudAProcesar] = useState(null); 
    const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState('');
    const [comentariosAdmin, setComentariosAdmin] = useState('');

    const vehiculosDisponibles = vehiculos.filter(v => v.estado === 'DISPONIBLE' && !v.responsable_id);

    const getNombreColaborador = (id) => {
        const col = colaboradores.find(c => c.id === id);
        return col ? col.nombre : 'Usuario Desconocido';
    };

    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return '--';
        return new Date(fechaISO).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
    };

    // Renderizador Inteligente de Periodo
    const renderizarPeriodo = (sol) => {
        const inicio = formatearFecha(sol.fecha_inicio);
        if (sol.tipo_duracion === 'HORAS') return `${inicio} • ${sol.hora_inicio} a ${sol.hora_fin}`;
        if (sol.tipo_duracion === 'DIA') return `${inicio} (Todo el día)`;
        return `${inicio} al ${formatearFecha(sol.fecha_fin)}`;
    };

    const handleEnviarSolicitud = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Construimos el Payload dependiendo de lo que eligió el usuario
        const payload = {
            usuario_id: usuarioActivo.id,
            tipo_duracion: formSolicitud.tipo_duracion,
            fecha_inicio: formSolicitud.fecha_inicio,
            fecha_fin: formSolicitud.tipo_duracion === 'DIAS' ? formSolicitud.fecha_fin : null,
            hora_inicio: formSolicitud.tipo_duracion === 'HORAS' ? formSolicitud.hora_inicio : null,
            hora_fin: formSolicitud.tipo_duracion === 'HORAS' ? formSolicitud.hora_fin : null,
            destino: formSolicitud.destino,
            motivo: formSolicitud.motivo
        };

        const res = await crearSolicitud(payload);
        setIsSubmitting(false);
        if (res.success) {
            alert("✅ Solicitud enviada exitosamente al administrador.");
            setFormSolicitud({ tipo_duracion: 'DIAS', fecha_inicio: '', fecha_fin: '', hora_inicio: '', hora_fin: '', destino: '', motivo: '' });
        } else {
            alert("❌ Hubo un error al enviar la solicitud. Verifica tu conexión.");
        }
    };

    const handleAprobar = async (e) => {
        e.preventDefault();
        if (!vehiculoSeleccionado) return alert("Debes seleccionar un vehículo para aprobar la solicitud.");
        
        setIsSubmitting(true);
        const res = await responderSolicitud(solicitudAProcesar.id, 'APROBADA', vehiculoSeleccionado, comentariosAdmin, solicitudAProcesar.usuario_id);
        setIsSubmitting(false);
        
        if (res.success) {
            setSolicitudAProcesar(null);
            setVehiculoSeleccionado('');
            setComentariosAdmin('');
        }
    };

    const handleRechazar = async () => {
        if (!comentariosAdmin) return alert("Por favor escribe un motivo de rechazo en los comentarios.");
        
        setIsSubmitting(true);
        const res = await responderSolicitud(solicitudAProcesar.id, 'RECHAZADA', null, comentariosAdmin, solicitudAProcesar.usuario_id);
        setIsSubmitting(false);
        
        if (res.success) {
            setSolicitudAProcesar(null);
            setComentariosAdmin('');
        }
    };

    const RenderEtiquetaEstado = ({ estado }) => {
        if (estado === 'APROBADA') return <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-black uppercase px-2 py-1 rounded-md"><MdCheckCircle/> Aprobada</span>;
        if (estado === 'RECHAZADA') return <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-black uppercase px-2 py-1 rounded-md"><MdCancel/> Rechazada</span>;
        return <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-[10px] font-black uppercase px-2 py-1 rounded-md animate-pulse"><MdHourglassEmpty/> Pendiente</span>;
    };

    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in pb-10">
            {/* ENCABEZADO */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-start shrink-0 relative">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2"><MdAssignment className="text-purple-600"/> {esEncargado ? 'Bandeja de Solicitudes' : 'Solicitar Vehículo'}</h2>
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">{esEncargado ? 'Gestiona las peticiones de los colaboradores' : 'Pide una unidad al administrador'}</p>
                </div>
                {onClose && <button onClick={onClose} className="bg-gray-100 text-gray-500 hover:bg-gray-200 p-2 rounded-xl transition-colors"><MdClose className="text-2xl" /></button>}
            </div>

            <div className="flex-1 flex flex-col xl:flex-row gap-6 overflow-hidden">
                
                {/* COLUMNA IZQUIERDA: FORMULARIO INTELIGENTE (Solo si NO es admin) */}
                {!esEncargado && (
                    <div className="xl:w-[40%] bg-white p-6 rounded-3xl shadow-sm border border-gray-100 shrink-0 overflow-y-auto custom-scrollbar">
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Nueva Solicitud</h3>
                        <form onSubmit={handleEnviarSolicitud} className="space-y-5">
                            
                            {/* SELECTOR DE DURACIÓN */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">¿Por cuánto tiempo necesitas la unidad?</label>
                                <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-200 shadow-inner">
                                    <button type="button" onClick={() => setFormSolicitud({...formSolicitud, tipo_duracion: 'HORAS'})} className={`flex-1 py-2 text-[11px] font-black uppercase rounded-lg transition-all ${formSolicitud.tipo_duracion === 'HORAS' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}>Por Horas</button>
                                    <button type="button" onClick={() => setFormSolicitud({...formSolicitud, tipo_duracion: 'DIA'})} className={`flex-1 py-2 text-[11px] font-black uppercase rounded-lg transition-all ${formSolicitud.tipo_duracion === 'DIA' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}>1 Día</button>
                                    <button type="button" onClick={() => setFormSolicitud({...formSolicitud, tipo_duracion: 'DIAS'})} className={`flex-1 py-2 text-[11px] font-black uppercase rounded-lg transition-all ${formSolicitud.tipo_duracion === 'DIAS' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}>Varios Días</button>
                                </div>
                            </div>

                            {/* CAMPOS DINÁMICOS DE FECHA Y HORA */}
                            <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 space-y-4">
                                {formSolicitud.tipo_duracion === 'DIAS' ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-[10px] font-black text-purple-600 uppercase mb-2">Día de Salida</label><input required type="date" value={formSolicitud.fecha_inicio} onChange={e => setFormSolicitud({...formSolicitud, fecha_inicio: e.target.value})} className="w-full bg-white border border-purple-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-purple-500 shadow-sm" /></div>
                                        <div><label className="block text-[10px] font-black text-purple-600 uppercase mb-2">Día de Regreso</label><input required type="date" value={formSolicitud.fecha_fin} onChange={e => setFormSolicitud({...formSolicitud, fecha_fin: e.target.value})} className="w-full bg-white border border-purple-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-purple-500 shadow-sm" /></div>
                                    </div>
                                ) : (
                                    <div><label className="block text-[10px] font-black text-purple-600 uppercase mb-2">¿Qué día la necesitas?</label><input required type="date" value={formSolicitud.fecha_inicio} onChange={e => setFormSolicitud({...formSolicitud, fecha_inicio: e.target.value})} className="w-full bg-white border border-purple-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-purple-500 shadow-sm" /></div>
                                )}

                                {formSolicitud.tipo_duracion === 'HORAS' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-[10px] font-black text-purple-600 uppercase mb-2">Hora de Salida</label><input required type="time" value={formSolicitud.hora_inicio} onChange={e => setFormSolicitud({...formSolicitud, hora_inicio: e.target.value})} className="w-full bg-white border border-purple-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-purple-500 shadow-sm" /></div>
                                        <div><label className="block text-[10px] font-black text-purple-600 uppercase mb-2">Hora de Regreso</label><input required type="time" value={formSolicitud.hora_fin} onChange={e => setFormSolicitud({...formSolicitud, hora_fin: e.target.value})} className="w-full bg-white border border-purple-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-purple-500 shadow-sm" /></div>
                                    </div>
                                )}
                            </div>

                            {/* DESTINO Y MOTIVO */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Destino de la Ruta</label>
                                    <div className="relative">
                                        <MdLocationOn className="absolute left-4 top-3.5 text-gray-400 text-lg" />
                                        <input required type="text" value={formSolicitud.destino} onChange={e => setFormSolicitud({...formSolicitud, destino: e.target.value})} placeholder="Ej. Planta Monterrey, Oficina Central..." className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-purple-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Motivo / Actividad a realizar</label>
                                    <textarea required value={formSolicitud.motivo} onChange={e => setFormSolicitud({...formSolicitud, motivo: e.target.value})} placeholder="Ej. Traslado de material de papelería, visita a cliente..." className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-bold text-gray-800 outline-none focus:border-purple-500 h-24 resize-none"></textarea>
                                </div>
                            </div>
                            
                            <button type="submit" disabled={isSubmitting} className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-gray-900/20 disabled:opacity-50 flex justify-center items-center gap-2 active:scale-95">
                                <MdSend className="text-lg"/> Enviar Petición de Préstamo
                            </button>
                        </form>
                    </div>
                )}

                {/* COLUMNA DERECHA: LISTA DE SOLICITUDES */}
                <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50"><h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">{esEncargado ? 'Todas las Solicitudes' : 'Historial de Mis Solicitudes'}</h3></div>
                    
                    <div className="flex-1 overflow-auto custom-scrollbar p-4">
                        {loading ? (
                            <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div></div>
                        ) : solicitudes.length === 0 ? (
                            <div className="text-center py-20 text-gray-400 font-bold">No hay solicitudes registradas.</div>
                        ) : (
                            <div className="space-y-4">
                                {solicitudes.map(sol => (
                                    <div key={sol.id} className="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow bg-white flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                                        <div className="space-y-2 flex-1 w-full">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <RenderEtiquetaEstado estado={sol.estado} />
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1">
                                                    {sol.tipo_duracion === 'HORAS' ? <MdAccessTime/> : <MdOutlineDateRange/>} 
                                                    {renderizarPeriodo(sol)}
                                                </span>
                                            </div>
                                            
                                            {esEncargado && <h4 className="text-sm font-black text-purple-700 uppercase">{getNombreColaborador(sol.usuario_id)}</h4>}
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100"><p className="text-[9px] font-black text-gray-400 uppercase mb-1">Destino</p><p className="text-xs font-bold text-gray-800">{sol.destino}</p></div>
                                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100"><p className="text-[9px] font-black text-gray-400 uppercase mb-1">Motivo</p><p className="text-xs font-bold text-gray-800 truncate">{sol.motivo}</p></div>
                                            </div>
                                            
                                            {sol.estado !== 'PENDIENTE' && (
                                                <div className="mt-3 p-3 rounded-xl bg-purple-50/50 border border-purple-100 text-xs">
                                                    {sol.estado === 'APROBADA' && <p className="font-black text-gray-800 mb-1">🚗 Asignado: <span className="text-blue-600">{sol.vehiculo?.marca} {sol.vehiculo?.modelo} ({sol.vehiculo?.placas})</span></p>}
                                                    {sol.comentarios_admin && <p className="text-gray-600"><strong>Nota de Admin:</strong> {sol.comentarios_admin}</p>}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {esEncargado && sol.estado === 'PENDIENTE' && (
                                            <button onClick={() => setSolicitudAProcesar(sol)} className="w-full md:w-auto px-6 py-3 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white rounded-xl font-black text-xs transition-colors border border-purple-100 shadow-sm shrink-0 active:scale-95">
                                                Evaluar Petición
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL DEL ADMIN PARA APROBAR / RECHAZAR */}
            {solicitudAProcesar && (
                <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <form onSubmit={handleAprobar} className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-slide-up">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><MdAssignment className="text-purple-600"/> Evaluar Solicitud</h3>
                                <p className="text-[10px] font-bold text-purple-600 uppercase mt-1">De: {getNombreColaborador(solicitudAProcesar.usuario_id)}</p>
                            </div>
                            <button type="button" onClick={() => setSolicitudAProcesar(null)} className="text-gray-400 hover:text-red-500"><MdClose className="text-xl"/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs text-gray-600 space-y-1">
                                <p><strong>Periodo:</strong> {renderizarPeriodo(solicitudAProcesar)}</p>
                                <p><strong>Destino:</strong> {solicitudAProcesar.destino}</p>
                                <p><strong>Motivo:</strong> {solicitudAProcesar.motivo}</p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Asignar Vehículo (Solo si apruebas)</label>
                                <select value={vehiculoSeleccionado} onChange={e => setVehiculoSeleccionado(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-purple-500 shadow-sm">
                                    <option value="">Seleccionar del catálogo disponible...</option>
                                    {vehiculosDisponibles.length === 0 && <option disabled>No hay vehículos disponibles en este momento</option>}
                                    {vehiculosDisponibles.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} - {v.placas}</option>)}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Comentarios (Opcional si apruebas, Obligatorio si rechazas)</label>
                                <textarea value={comentariosAdmin} onChange={e => setComentariosAdmin(e.target.value)} placeholder="Instrucciones de entrega o motivo de rechazo..." className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-800 outline-none focus:border-purple-500 h-24 resize-none shadow-sm"></textarea>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                            <button type="button" onClick={handleRechazar} disabled={isSubmitting} className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-black py-3 rounded-xl transition-all shadow-sm active:scale-95">Rechazar</button>
                            <button type="submit" disabled={isSubmitting} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-xl transition-all shadow-md shadow-green-500/30 active:scale-95">Aprobar y Asignar</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}