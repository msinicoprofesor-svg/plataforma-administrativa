/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/vehiculos/BitacoraGlobal.tsx                       */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useMemo } from 'react';
import { 
    MdViewList, MdTimeline, MdSearch, MdFilterList, 
    MdDirectionsCar, MdLocationOn, MdWarning, MdCheckCircle,
    MdSpeed, MdOutlineDateRange, MdImage, MdClose
} from 'react-icons/md';
import { useHistorialGlobal } from '../../hooks/useHistorialGlobal';

export default function BitacoraGlobal({ onClose }) {
    const { historial, loading } = useHistorialGlobal();
    const [vistaActiva, setVistaActiva] = useState('lista'); // 'lista' o 'timeline'
    const [filtroTiempo, setFiltroTiempo] = useState('todos'); // 'hoy', 'semana', 'mes', 'todos'
    const [busqueda, setBusqueda] = useState('');
    const [viajeSeleccionado, setViajeSeleccionado] = useState(null); // Para el modal de detalles

    // --- MOTOR DE FILTRADO ---
    const historialFiltrado = useMemo(() => {
        let filtrado = historial;

        // Filtro de Búsqueda (Vehículo, Placas o Usuario)
        if (busqueda) {
            const b = busqueda.toLowerCase();
            filtrado = filtrado.filter(h => 
                h.vehiculo?.marca?.toLowerCase().includes(b) ||
                h.vehiculo?.modelo?.toLowerCase().includes(b) ||
                h.vehiculo?.placas?.toLowerCase().includes(b) ||
                h.usuario_id?.toLowerCase().includes(b)
            );
        }

        // Filtro de Tiempo
        const hoy = new Date();
        filtrado = filtrado.filter(h => {
            const fechaReg = new Date(h.created_at);
            if (filtroTiempo === 'hoy') return fechaReg.toDateString() === hoy.toLocaleDateString();
            if (filtroTiempo === 'semana') {
                const hace7Dias = new Date(hoy);
                hace7Dias.setDate(hace7Dias.getDate() - 7);
                return fechaReg >= hace7Dias;
            }
            if (filtroTiempo === 'mes') return fechaReg.getMonth() === hoy.getMonth() && fechaReg.getFullYear() === hoy.getFullYear();
            return true; // 'todos'
        });

        return filtrado;
    }, [historial, busqueda, filtroTiempo]);

    // --- MOTOR DE EMPAREJAMIENTO DE VIAJES (Para la vista de Lista) ---
    const viajes = useMemo(() => {
        // Ordenamos cronológicamente (del más viejo al más nuevo) para emparejar bien
        const registrosCronologicos = [...historialFiltrado].reverse();
        
        const vehiculosEnRuta = {};
        const viajesArmados = [];

        registrosCronologicos.forEach(reg => {
            if (reg.tipo_registro === 'SALIDA') {
                // Inicia un nuevo viaje
                const nuevoViaje = { id: reg.id, vehiculo: reg.vehiculo, responsable: reg.usuario_id, salida: reg, llegada: null, percances: [] };
                vehiculosEnRuta[reg.vehiculo_id] = nuevoViaje;
                viajesArmados.push(nuevoViaje);
            } 
            else if (reg.tipo_registro === 'LLEGADA') {
                // Cierra el viaje activo de ese vehículo
                if (vehiculosEnRuta[reg.vehiculo_id]) {
                    vehiculosEnRuta[reg.vehiculo_id].llegada = reg;
                    delete vehiculosEnRuta[reg.vehiculo_id]; // Ya terminó, lo quitamos de "en ruta"
                } else {
                    // Llegada huérfana (sin checklist previo registrado en el filtro)
                    viajesArmados.push({ id: reg.id, vehiculo: reg.vehiculo, responsable: reg.usuario_id, salida: null, llegada: reg, percances: [] });
                }
            } 
            else if (reg.tipo_registro === 'PERCANCE') {
                // Asignamos el percance al viaje activo. Si no hay, lo metemos como evento huérfano.
                if (vehiculosEnRuta[reg.vehiculo_id]) {
                    vehiculosEnRuta[reg.vehiculo_id].percances.push(reg);
                } else {
                    viajesArmados.push({ id: reg.id, vehiculo: reg.vehiculo, responsable: reg.usuario_id, salida: null, llegada: null, percances: [reg] });
                }
            }
        });

        // Devolvemos la lista de más reciente a más viejo
        return viajesArmados.reverse();
    }, [historialFiltrado]);

    const formatearHora = (fechaISO) => {
        if (!fechaISO) return '--:--';
        return new Date(fechaISO).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    };

    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return '';
        return new Date(fechaISO).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in pb-10">
            {/* ENCABEZADO Y CONTROLES */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-5 shrink-0 relative overflow-hidden">
                <div className="flex justify-between items-start z-10 relative">
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">Auditoría Global de Flotilla</h2>
                        <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Historial unificado de rutas y percances</p>
                    </div>
                    <button onClick={onClose} className="bg-gray-100 text-gray-500 hover:bg-gray-200 p-2 rounded-xl transition-colors">
                        <MdClose className="text-2xl" />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row justify-between gap-4 z-10 relative">
                    {/* Búsqueda y Filtro */}
                    <div className="flex flex-1 gap-3">
                        <div className="relative flex-1 max-w-sm">
                            <MdSearch className="absolute left-4 top-3.5 text-gray-400 text-lg" />
                            <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar unidad, placas o usuario..." className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 transition-colors" />
                        </div>
                        <div className="relative">
                            <MdOutlineDateRange className="absolute left-4 top-3.5 text-gray-400 text-lg pointer-events-none" />
                            <select value={filtroTiempo} onChange={(e) => setFiltroTiempo(e.target.value)} className="appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-10 py-3 text-sm font-bold text-gray-600 outline-none focus:border-blue-500 cursor-pointer">
                                <option value="todos">Todo el Tiempo</option>
                                <option value="hoy">Solo Hoy</option>
                                <option value="semana">Últimos 7 días</option>
                                <option value="mes">Este Mes</option>
                            </select>
                        </div>
                    </div>

                    {/* Switch de Vistas */}
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200/50 shrink-0">
                        <button onClick={() => setVistaActiva('lista')} className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase flex items-center gap-2 transition-all ${vistaActiva === 'lista' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <MdViewList className="text-lg"/> Tabla de Rutas
                        </button>
                        <button onClick={() => setVistaActiva('timeline')} className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase flex items-center gap-2 transition-all ${vistaActiva === 'timeline' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <MdTimeline className="text-lg"/> Eventos (Timeline)
                        </button>
                    </div>
                </div>
            </div>

            {/* CONTENEDOR PRINCIPAL */}
            <div className="flex-1 overflow-hidden bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                {loading ? (
                    <div className="flex-1 flex justify-center items-center"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>
                ) : (
                    <>
                        {/* ========================================================= */}
                        {/* VISTA DE LISTA (TABLA EMPAREJADA) */}
                        {/* ========================================================= */}
                        {vistaActiva === 'lista' && (
                            <div className="flex-1 overflow-auto custom-scrollbar p-2">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest rounded-tl-2xl">Unidad</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Responsable</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Salida</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Llegada</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Odómetro (Km)</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estado</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right rounded-tr-2xl">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {viajes.length === 0 ? (
                                            <tr><td colSpan="7" className="text-center py-10 text-gray-400 font-bold">No hay rutas registradas en este periodo.</td></tr>
                                        ) : (
                                            viajes.map((viaje, idx) => {
                                                const enRuta = viaje.salida && !viaje.llegada;
                                                const tienePercance = viaje.percances?.length > 0;

                                                return (
                                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <p className="text-sm font-black text-gray-800">{viaje.vehiculo?.marca} {viaje.vehiculo?.modelo}</p>
                                                            <p className="text-[10px] font-bold text-gray-500 uppercase">{viaje.vehiculo?.placas}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="bg-blue-50 text-blue-700 text-[10px] font-black uppercase px-3 py-1 rounded-lg">{viaje.responsable}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <p className="text-sm font-black text-gray-700">{formatearHora(viaje.salida?.created_at)}</p>
                                                            <p className="text-[9px] text-gray-400 font-bold uppercase">{formatearFecha(viaje.salida?.created_at)}</p>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {viaje.llegada ? (
                                                                <>
                                                                    <p className="text-sm font-black text-gray-700">{formatearHora(viaje.llegada.created_at)}</p>
                                                                    <p className="text-[9px] text-gray-400 font-bold uppercase">{formatearFecha(viaje.llegada.created_at)}</p>
                                                                </>
                                                            ) : (
                                                                <span className="text-gray-300 font-bold text-xs">--:--</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex items-center justify-center gap-2 text-xs font-black">
                                                                <span className="text-blue-500 bg-blue-50 px-2 py-1 rounded">{viaje.salida?.kilometraje || 'N/A'}</span>
                                                                <span className="text-gray-300">➔</span>
                                                                <span className="text-green-600 bg-green-50 px-2 py-1 rounded">{viaje.llegada?.kilometraje || 'N/A'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {enRuta ? (
                                                                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-[9px] font-black uppercase px-2 py-1 rounded-md"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></div> En Ruta</span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-[9px] font-black uppercase px-2 py-1 rounded-md"><MdLocationOn/> {viaje.llegada?.ubicacion_final || 'Entregado'}</span>
                                                            )}
                                                            {tienePercance && (
                                                                <div className="mt-1"><span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-[9px] font-black uppercase px-2 py-1 rounded-md"><MdWarning/> Percance</span></div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button onClick={() => setViajeSeleccionado(viaje)} className="text-[10px] font-black bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200 px-4 py-2 rounded-xl transition-all shadow-sm">
                                                                Detalles
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ========================================================= */}
                        {/* VISTA TIMELINE (HISTORIAL CRUDO GLOBAL) */}
                        {/* ========================================================= */}
                        {vistaActiva === 'timeline' && (
                            <div className="flex-1 overflow-auto custom-scrollbar p-8">
                                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                                    {historialFiltrado.length === 0 ? (
                                        <p className="text-center text-gray-400 font-bold py-10 relative z-10 bg-white">No hay eventos en este periodo.</p>
                                    ) : (
                                        historialFiltrado.map((bita) => {
                                            const esSalida = bita.tipo_registro === 'SALIDA';
                                            const esLlegada = bita.tipo_registro === 'LLEGADA';
                                            const esPercance = bita.tipo_registro === 'PERCANCE';

                                            let icon = <MdDirectionsCar />;
                                            let iconColor = 'bg-blue-500 shadow-blue-500/30';
                                            let tagTitle = 'Salida de Unidad';
                                            
                                            if (esLlegada) { icon = <MdLocationOn />; iconColor = 'bg-green-500 shadow-green-500/30'; tagTitle = 'Unidad Devuelta'; }
                                            if (esPercance) { icon = <MdWarning />; iconColor = bita.gravedad_percance === 'grave' ? 'bg-red-500 shadow-red-500/30' : 'bg-orange-500 shadow-orange-500/30'; tagTitle = 'Alerta de Percance'; }

                                            return (
                                                <div key={bita.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                    <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-white ${iconColor} text-white shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10`}>
                                                        {icon}
                                                    </div>
                                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-5 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${esSalida ? 'bg-blue-50 text-blue-600' : esLlegada ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{tagTitle}</span>
                                                            <span className="text-[10px] font-bold text-gray-400">{formatearFecha(bita.created_at)} {formatearHora(bita.created_at)}</span>
                                                        </div>
                                                        <h4 className="text-sm font-black text-gray-900 mb-1">{bita.vehiculo?.marca} {bita.vehiculo?.modelo}</h4>
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Conductor: {bita.usuario_id}</p>

                                                        {esSalida && <div className="text-xs bg-gray-50 p-2 rounded-xl text-gray-600"><MdSpeed className="inline mr-1"/> Salió con <strong>{bita.kilometraje} km</strong></div>}
                                                        {esLlegada && <div className="text-xs bg-gray-50 p-2 rounded-xl text-gray-600"><MdLocationOn className="inline mr-1"/> Dejado en <strong>{bita.ubicacion_final}</strong> con {bita.kilometraje} km</div>}
                                                        {esPercance && <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{bita.detalles_incidencia}</p>}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* MODAL DE DETALLES DE VIAJE */}
            {viajeSeleccionado && (
                <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[2rem] w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-black text-gray-800">Detalles del Viaje</h3>
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">{viajeSeleccionado.vehiculo?.marca} {viajeSeleccionado.vehiculo?.placas}</p>
                            </div>
                            <button onClick={() => setViajeSeleccionado(null)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400 hover:text-red-500"><MdClose/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* SALIDA */}
                            {viajeSeleccionado.salida && (
                                <div className="border border-blue-100 rounded-2xl p-4 bg-blue-50/30">
                                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 border-b border-blue-100 pb-2">Datos de Salida</h4>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div><p className="text-[9px] text-gray-400 uppercase font-bold">Fecha / Hora</p><p className="text-xs font-black text-gray-800">{formatearFecha(viajeSeleccionado.salida.created_at)} {formatearHora(viajeSeleccionado.salida.created_at)}</p></div>
                                        <div><p className="text-[9px] text-gray-400 uppercase font-bold">Odómetro Inicial</p><p className="text-xs font-black text-gray-800">{viajeSeleccionado.salida.kilometraje} km</p></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[9px] uppercase font-black tracking-widest">
                                        <div className={`p-2 rounded-lg border ${viajeSeleccionado.salida.llantas_ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>Llantas: {viajeSeleccionado.salida.llantas_ok ? 'OK' : 'Falla'}</div>
                                        <div className={`p-2 rounded-lg border ${viajeSeleccionado.salida.aceite_ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>Aceite: {viajeSeleccionado.salida.aceite_ok ? 'OK' : 'Falla'}</div>
                                        <div className={`p-2 rounded-lg border ${viajeSeleccionado.salida.anticongelante_ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>Líquidos: {viajeSeleccionado.salida.anticongelante_ok ? 'OK' : 'Falla'}</div>
                                        <div className={`p-2 rounded-lg border ${viajeSeleccionado.salida.frenos_ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>Frenos: {viajeSeleccionado.salida.frenos_ok ? 'OK' : 'Falla'}</div>
                                    </div>
                                </div>
                            )}

                            {/* PERCANCES EN MEDIO */}
                            {viajeSeleccionado.percances?.map(perc => (
                                <div key={perc.id} className="border border-red-200 rounded-2xl p-4 bg-red-50/50">
                                    <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2 flex items-center gap-1"><MdWarning/> Percance Reportado</h4>
                                    <p className="text-[9px] text-gray-500 font-bold mb-2">{formatearFecha(perc.created_at)} {formatearHora(perc.created_at)} • Gravedad: {perc.gravedad_percance}</p>
                                    <p className="text-xs text-gray-800 font-medium mb-3 bg-white p-3 rounded-xl border border-red-100">{perc.detalles_incidencia}</p>
                                    {perc.evidencia_url && <a href={perc.evidencia_url} target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase text-blue-600 hover:underline flex items-center gap-1"><MdImage/> Ver Evidencia</a>}
                                </div>
                            ))}

                            {/* LLEGADA */}
                            {viajeSeleccionado.llegada ? (
                                <div className="border border-green-200 rounded-2xl p-4 bg-green-50/30">
                                    <h4 className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-3 border-b border-green-100 pb-2">Datos de Llegada</h4>
                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div><p className="text-[9px] text-gray-400 uppercase font-bold">Fecha / Hora</p><p className="text-xs font-black text-gray-800">{formatearFecha(viajeSeleccionado.llegada.created_at)} {formatearHora(viajeSeleccionado.llegada.created_at)}</p></div>
                                        <div><p className="text-[9px] text-gray-400 uppercase font-bold">Odómetro Final</p><p className="text-xs font-black text-gray-800">{viajeSeleccionado.llegada.kilometraje} km</p></div>
                                        <div className="col-span-2"><p className="text-[9px] text-gray-400 uppercase font-bold">Dejado en</p><p className="text-xs font-black text-gray-800 uppercase">{viajeSeleccionado.llegada.ubicacion_final}</p></div>
                                    </div>
                                    {viajeSeleccionado.llegada.detalles_incidencia && viajeSeleccionado.llegada.detalles_incidencia !== 'Sin incidentes' && (
                                        <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 mt-2"><strong>Nota Cierre:</strong> {viajeSeleccionado.llegada.detalles_incidencia}</p>
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