/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/vehiculos/ModalBitacoras.tsx                       */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect, useMemo } from 'react';
import { 
    MdClose, MdHistory, MdDirectionsCar, MdWarning, 
    MdCheckCircle, MdBuild, MdImage, MdLocationOn, MdSpeed,
    MdViewList, MdTimeline
} from 'react-icons/md';
import { supabase } from '../../lib/supabase';

export default function ModalBitacoras({ isOpen, onClose, vehiculo }) {
    const [bitacoras, setBitacoras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [vistaActiva, setVistaActiva] = useState('lista'); // 'lista' o 'timeline'
    const [viajeSeleccionado, setViajeSeleccionado] = useState(null); // Para el modal de detalles

    useEffect(() => {
        if (isOpen && vehiculo) {
            cargarHistorial();
            setVistaActiva('lista'); // Resetear a lista por defecto
        } else {
            setBitacoras([]);
        }
    }, [isOpen, vehiculo]);

    const cargarHistorial = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('vehiculos_bitacora')
            .select('*')
            .eq('vehiculo_id', vehiculo.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setBitacoras(data);
        } else {
            console.error("Error al cargar historial:", error);
        }
        setLoading(false);
    };

    // --- MOTOR DE EMPAREJAMIENTO DE VIAJES (Para una sola unidad) ---
    const viajes = useMemo(() => {
        const registrosCronologicos = [...bitacoras].reverse();
        let viajeActivo = null;
        const viajesArmados = [];

        registrosCronologicos.forEach(reg => {
            if (reg.tipo_registro === 'SALIDA') {
                if (viajeActivo) viajesArmados.push(viajeActivo); // Si había uno abierto sin cerrar, lo guardamos
                viajeActivo = { id: reg.id, salida: reg, llegada: null, percances: [] };
            } else if (reg.tipo_registro === 'LLEGADA') {
                if (viajeActivo) {
                    viajeActivo.llegada = reg;
                    viajesArmados.push(viajeActivo);
                    viajeActivo = null;
                } else {
                    viajesArmados.push({ id: reg.id, salida: null, llegada: reg, percances: [] });
                }
            } else if (reg.tipo_registro === 'PERCANCE') {
                if (viajeActivo) {
                    viajeActivo.percances.push(reg);
                } else {
                    viajesArmados.push({ id: reg.id, salida: null, llegada: null, percances: [reg] });
                }
            }
        });
        if (viajeActivo) viajesArmados.push(viajeActivo); // Guardar si quedó en ruta

        return viajesArmados.reverse();
    }, [bitacoras]);

    const formatearHora = (fechaISO) => {
        if (!fechaISO) return '--:--';
        return new Date(fechaISO).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    };

    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return '';
        return new Date(fechaISO).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-gray-50 rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up relative">
                
                {/* ENCABEZADO */}
                <div className="p-6 bg-white border-b border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
                    <div>
                        <h3 className="text-xl font-black text-gray-800 flex items-center gap-2"><MdHistory className="text-blue-600 text-2xl"/> Expediente de Unidad</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                            {vehiculo?.marca} {vehiculo?.modelo} • {vehiculo?.placas}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {/* PESTAÑAS DE VISTA */}
                        <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200/50">
                            <button onClick={() => setVistaActiva('lista')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 transition-all ${vistaActiva === 'lista' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                <MdViewList className="text-base"/> Rutas
                            </button>
                            <button onClick={() => setVistaActiva('timeline')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 transition-all ${vistaActiva === 'timeline' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                <MdTimeline className="text-base"/> Eventos
                            </button>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><MdClose className="text-xl"/></button>
                    </div>
                </div>

                {/* CONTENIDO PRINCIPAL */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar relative">
                    {loading ? (
                        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>
                    ) : bitacoras.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                            <MdHistory className="text-6xl text-gray-300 mb-4"/>
                            <p className="text-sm font-black text-gray-500 uppercase tracking-widest">Aún no hay registros de este vehículo</p>
                        </div>
                    ) : (
                        <>
                            {/* ========================================================= */}
                            {/* VISTA DE LISTA (TABLA DE VIAJES DEL VEHÍCULO) */}
                            {/* ========================================================= */}
                            {vistaActiva === 'lista' && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse min-w-[600px]">
                                            <thead className="bg-gray-50/80 border-b border-gray-100">
                                                <tr>
                                                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Conductor</th>
                                                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Salida</th>
                                                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Llegada</th>
                                                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Recorrido</th>
                                                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estado</th>
                                                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {viajes.map((viaje, idx) => {
                                                    const enRuta = viaje.salida && !viaje.llegada;
                                                    const tienePercance = viaje.percances?.length > 0;
                                                    const kmRecorridos = (viaje.salida && viaje.llegada && viaje.llegada.kilometraje >= viaje.salida.kilometraje) 
                                                                        ? (viaje.llegada.kilometraje - viaje.salida.kilometraje) 
                                                                        : '--';

                                                    return (
                                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-5 py-4">
                                                                <span className="bg-blue-50 text-blue-700 text-[10px] font-black uppercase px-3 py-1 rounded-lg">{viaje.salida?.usuario_id || viaje.llegada?.usuario_id || 'Desconocido'}</span>
                                                            </td>
                                                            <td className="px-5 py-4 text-center">
                                                                <p className="text-sm font-black text-gray-700">{formatearHora(viaje.salida?.created_at)}</p>
                                                                <p className="text-[9px] text-gray-400 font-bold uppercase">{formatearFecha(viaje.salida?.created_at)}</p>
                                                            </td>
                                                            <td className="px-5 py-4 text-center">
                                                                {viaje.llegada ? (
                                                                    <>
                                                                        <p className="text-sm font-black text-gray-700">{formatearHora(viaje.llegada.created_at)}</p>
                                                                        <p className="text-[9px] text-gray-400 font-bold uppercase">{formatearFecha(viaje.llegada.created_at)}</p>
                                                                    </>
                                                                ) : <span className="text-gray-300 font-bold text-xs">--:--</span>}
                                                            </td>
                                                            <td className="px-5 py-4 text-center">
                                                                <p className="text-xs font-black text-gray-800">{kmRecorridos} km</p>
                                                            </td>
                                                            <td className="px-5 py-4 text-center">
                                                                {enRuta ? (
                                                                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-[9px] font-black uppercase px-2 py-1 rounded-md"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></div> En Ruta</span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-[9px] font-black uppercase px-2 py-1 rounded-md"><MdLocationOn/> {viaje.llegada?.ubicacion_final || 'Entregado'}</span>
                                                                )}
                                                                {tienePercance && <div className="mt-1"><span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-[9px] font-black uppercase px-2 py-1 rounded-md"><MdWarning/> Percance</span></div>}
                                                            </td>
                                                            <td className="px-5 py-4 text-right">
                                                                <button onClick={() => setViajeSeleccionado(viaje)} className="text-[10px] font-black bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200 px-4 py-2 rounded-xl transition-all shadow-sm">
                                                                    Detalles Completos
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* ========================================================= */}
                            {/* VISTA DE TIMELINE (EVENTOS CRUDOS) */}
                            {/* ========================================================= */}
                            {vistaActiva === 'timeline' && (
                                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                                    {bitacoras.map((bita) => {
                                        const esSalida = bita.tipo_registro === 'SALIDA';
                                        const esLlegada = bita.tipo_registro === 'LLEGADA';
                                        const esPercance = bita.tipo_registro === 'PERCANCE';

                                        let icon = <MdDirectionsCar />; let iconColor = 'bg-blue-500 shadow-blue-500/30'; let tagTitle = 'Salida a Ruta';
                                        if (esLlegada) { icon = <MdLocationOn />; iconColor = 'bg-green-500 shadow-green-500/30'; tagTitle = 'Cierre de Ruta'; }
                                        if (esPercance) { icon = <MdWarning />; iconColor = bita.gravedad_percance === 'grave' ? 'bg-red-500 shadow-red-500/30' : 'bg-orange-500 shadow-orange-500/30'; tagTitle = 'Percance Reportado'; }

                                        return (
                                            <div key={bita.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-gray-50 ${iconColor} text-white shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10`}>{icon}</div>
                                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-4 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${esSalida ? 'bg-blue-50 text-blue-600' : esLlegada ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{tagTitle}</span>
                                                        <span className="text-[10px] font-bold text-gray-400">{formatearFecha(bita.created_at)} {formatearHora(bita.created_at)}</span>
                                                    </div>

                                                    <p className="text-[10px] font-black text-gray-800 uppercase tracking-widest mb-3">Conductor: {bita.usuario_id}</p>

                                                    {esSalida && (
                                                        <div className="space-y-3">
                                                            <div className="flex gap-2 text-xs font-bold text-gray-700 bg-gray-50 p-2 rounded-xl border border-gray-100"><MdSpeed className="text-gray-400 text-base"/> Odómetro: {bita.kilometraje} km</div>
                                                            {bita.detalles_incidencia && <p className="text-xs text-gray-600 bg-orange-50 p-3 rounded-xl border border-orange-100"><strong className="text-orange-800">Nota:</strong> {bita.detalles_incidencia}</p>}
                                                            {bita.evidencia_url && (
                                                                <div className="mt-2 w-full h-32 rounded-xl overflow-hidden border border-gray-200">
                                                                    <a href={bita.evidencia_url} target="_blank" rel="noreferrer"><img src={bita.evidencia_url} alt="Evidencia Daño" className="w-full h-full object-cover hover:scale-105 transition-transform"/></a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {esLlegada && (
                                                        <div className="space-y-3">
                                                            <div className="flex gap-2 text-xs font-bold text-gray-700 bg-gray-50 p-2 rounded-xl border border-gray-100"><MdSpeed className="text-gray-400 text-base"/> Finalizó con: {bita.kilometraje} km</div>
                                                            <p className="text-[10px] font-bold text-gray-500 uppercase">Vehículo dejado en: <strong className="text-gray-800">{bita.ubicacion_final}</strong></p>
                                                            {bita.detalles_incidencia && bita.detalles_incidencia !== 'Sin incidentes' && <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100"><strong className="text-red-800">Incidente:</strong> {bita.detalles_incidencia}</p>}
                                                            {bita.odometro_url && (
                                                                <div className="mt-2 w-full h-32 rounded-xl overflow-hidden border border-gray-200 relative group/img">
                                                                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[8px] px-2 py-1 rounded backdrop-blur-sm z-10 font-black uppercase">Foto Odómetro</div>
                                                                    <a href={bita.odometro_url} target="_blank" rel="noreferrer"><img src={bita.odometro_url} alt="Odómetro" className="w-full h-full object-cover hover:scale-105 transition-transform"/></a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {esPercance && (
                                                        <div className="space-y-3">
                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${bita.gravedad_percance === 'grave' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>Gravedad: {bita.gravedad_percance}</span>
                                                            <p className="text-sm font-medium text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">{bita.detalles_incidencia}</p>
                                                            {bita.evidencia_url && (
                                                                <div className="w-full h-32 rounded-xl overflow-hidden border border-gray-200">
                                                                    <a href={bita.evidencia_url} target="_blank" rel="noreferrer"><img src={bita.evidencia_url} alt="Evidencia Percance" className="w-full h-full object-cover hover:scale-105 transition-transform"/></a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* MODAL HIJO: DETALLES DE VIAJE (MUESTRA FOTOS) */}
            {viajeSeleccionado && (
                <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[2rem] w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-black text-gray-800">Expediente del Viaje</h3>
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">Conductor: {viajeSeleccionado.salida?.usuario_id || viajeSeleccionado.llegada?.usuario_id}</p>
                            </div>
                            <button onClick={() => setViajeSeleccionado(null)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400 hover:text-red-500"><MdClose/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {/* SALIDA */}
                            {viajeSeleccionado.salida && (
                                <div className="border border-blue-100 rounded-2xl p-4 bg-blue-50/30">
                                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 border-b border-blue-100 pb-2">1. Datos de Salida</h4>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div><p className="text-[9px] text-gray-400 uppercase font-bold">Fecha / Hora</p><p className="text-xs font-black text-gray-800">{formatearFecha(viajeSeleccionado.salida.created_at)} {formatearHora(viajeSeleccionado.salida.created_at)}</p></div>
                                        <div><p className="text-[9px] text-gray-400 uppercase font-bold">Odómetro Inicial</p><p className="text-xs font-black text-gray-800">{viajeSeleccionado.salida.kilometraje} km</p></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[9px] uppercase font-black tracking-widest mb-3">
                                        <div className={`p-2 rounded-lg border ${viajeSeleccionado.salida.llantas_ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>Llantas: {viajeSeleccionado.salida.llantas_ok ? 'OK' : 'Falla'}</div>
                                        <div className={`p-2 rounded-lg border ${viajeSeleccionado.salida.aceite_ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>Aceite: {viajeSeleccionado.salida.aceite_ok ? 'OK' : 'Falla'}</div>
                                        <div className={`p-2 rounded-lg border ${viajeSeleccionado.salida.anticongelante_ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>Líquidos: {viajeSeleccionado.salida.anticongelante_ok ? 'OK' : 'Falla'}</div>
                                        <div className={`p-2 rounded-lg border ${viajeSeleccionado.salida.frenos_ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>Frenos: {viajeSeleccionado.salida.frenos_ok ? 'OK' : 'Falla'}</div>
                                    </div>
                                    {viajeSeleccionado.salida.detalles_incidencia && <p className="text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-200"><strong className="text-gray-800">Nota:</strong> {viajeSeleccionado.salida.detalles_incidencia}</p>}
                                    {/* FOTO DE SALIDA */}
                                    {viajeSeleccionado.salida.evidencia_url && (
                                        <div className="mt-3 w-full h-32 rounded-xl overflow-hidden border border-gray-200">
                                            <a href={viajeSeleccionado.salida.evidencia_url} target="_blank" rel="noreferrer"><img src={viajeSeleccionado.salida.evidencia_url} alt="Evidencia Salida" className="w-full h-full object-cover"/></a>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* PERCANCES */}
                            {viajeSeleccionado.percances?.map(perc => (
                                <div key={perc.id} className="border border-orange-200 rounded-2xl p-4 bg-orange-50/50">
                                    <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 flex items-center gap-1"><MdWarning/> Percance Reportado</h4>
                                    <p className="text-[9px] text-gray-500 font-bold mb-2">{formatearFecha(perc.created_at)} {formatearHora(perc.created_at)} • Gravedad: {perc.gravedad_percance}</p>
                                    <p className="text-xs text-gray-800 font-medium mb-3 bg-white p-3 rounded-xl border border-orange-100">{perc.detalles_incidencia}</p>
                                    {perc.evidencia_url && (
                                        <div className="w-full h-32 rounded-xl overflow-hidden border border-gray-200">
                                            <a href={perc.evidencia_url} target="_blank" rel="noreferrer"><img src={perc.evidencia_url} alt="Evidencia Percance" className="w-full h-full object-cover"/></a>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* LLEGADA */}
                            {viajeSeleccionado.llegada ? (
                                <div className="border border-green-200 rounded-2xl p-4 bg-green-50/30">
                                    <h4 className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-3 border-b border-green-100 pb-2">2. Datos de Llegada</h4>
                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div><p className="text-[9px] text-gray-400 uppercase font-bold">Fecha / Hora</p><p className="text-xs font-black text-gray-800">{formatearFecha(viajeSeleccionado.llegada.created_at)} {formatearHora(viajeSeleccionado.llegada.created_at)}</p></div>
                                        <div><p className="text-[9px] text-gray-400 uppercase font-bold">Odómetro Final</p><p className="text-xs font-black text-gray-800">{viajeSeleccionado.llegada.kilometraje} km</p></div>
                                        <div className="col-span-2"><p className="text-[9px] text-gray-400 uppercase font-bold">Dejado en</p><p className="text-xs font-black text-gray-800 uppercase">{viajeSeleccionado.llegada.ubicacion_final}</p></div>
                                    </div>
                                    {viajeSeleccionado.llegada.detalles_incidencia && viajeSeleccionado.llegada.detalles_incidencia !== 'Sin incidentes' && (
                                        <p className="text-xs text-red-600 bg-white p-3 rounded-xl border border-red-100 mt-2"><strong>Nota Cierre:</strong> {viajeSeleccionado.llegada.detalles_incidencia}</p>
                                    )}
                                    {/* FOTO DE ODÓMETRO FINAL */}
                                    {viajeSeleccionado.llegada.odometro_url && (
                                        <div className="mt-3 w-full h-32 rounded-xl overflow-hidden border border-gray-200 relative">
                                            <div className="absolute top-2 left-2 bg-black/60 text-white text-[8px] px-2 py-1 rounded backdrop-blur-sm z-10 font-black uppercase">Foto Odómetro Final</div>
                                            <a href={viajeSeleccionado.llegada.odometro_url} target="_blank" rel="noreferrer"><img src={viajeSeleccionado.llegada.odometro_url} alt="Odómetro Final" className="w-full h-full object-cover"/></a>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center p-4 bg-gray-50 border border-dashed border-gray-300 rounded-2xl">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping mx-auto mb-2"></div>
                                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Vehículo actualmente en ruta</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}