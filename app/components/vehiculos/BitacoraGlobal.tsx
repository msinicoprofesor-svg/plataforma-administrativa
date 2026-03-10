/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/vehiculos/BitacoraGlobal.tsx                       */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useMemo } from 'react';
import { 
    MdSearch, MdDirectionsCar, MdLocationOn, MdWarning, 
    MdSpeed, MdOutlineDateRange, MdImage, MdClose, MdTimeline
} from 'react-icons/md';
import { useHistorialGlobal } from '../../hooks/useHistorialGlobal';
import ModalBitacoras from './ModalBitacoras'; 
import VisorImagen from './VisorImagen'; // <--- IMPORT DEL VISOR

export default function BitacoraGlobal({ onClose }) {
    const { historial, loading } = useHistorialGlobal();
    
    // Filtros
    const [filtroTiempo, setFiltroTiempo] = useState('todos'); 
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [vehiculoFiltro, setVehiculoFiltro] = useState('TODOS');
    const [busqueda, setBusqueda] = useState('');
    
    // Modales y Visor
    const [viajeSeleccionado, setViajeSeleccionado] = useState(null); 
    const [vehiculoTimeline, setVehiculoTimeline] = useState(null);   
    const [imagenAmpliada, setImagenAmpliada] = useState(null); // <--- ESTADO DEL VISOR

    const vehiculosUnicos = useMemo(() => {
        const map = new Map();
        historial.forEach(h => {
            if (h.vehiculo_id && h.vehiculo && !map.has(h.vehiculo_id)) {
                map.set(h.vehiculo_id, { id: h.vehiculo_id, ...h.vehiculo });
            }
        });
        return Array.from(map.values());
    }, [historial]);

    const historialFiltrado = useMemo(() => {
        let filtrado = historial;

        if (busqueda) {
            const b = busqueda.toLowerCase();
            filtrado = filtrado.filter(h => 
                h.vehiculo?.marca?.toLowerCase().includes(b) ||
                h.vehiculo?.modelo?.toLowerCase().includes(b) ||
                h.vehiculo?.placas?.toLowerCase().includes(b) ||
                h.usuario_id?.toLowerCase().includes(b)
            );
        }

        if (vehiculoFiltro !== 'TODOS') {
            filtrado = filtrado.filter(h => h.vehiculo_id === vehiculoFiltro);
        }

        const hoy = new Date();
        filtrado = filtrado.filter(h => {
            const fechaReg = new Date(h.created_at);
            if (filtroTiempo === 'hoy') return fechaReg.toDateString() === hoy.toDateString();
            if (filtroTiempo === 'semana') {
                const hace7Dias = new Date(hoy);
                hace7Dias.setDate(hace7Dias.getDate() - 7);
                return fechaReg >= hace7Dias;
            }
            if (filtroTiempo === 'mes') return fechaReg.getMonth() === hoy.getMonth() && fechaReg.getFullYear() === hoy.getFullYear();
            if (filtroTiempo === 'personalizado' && fechaDesde && fechaHasta) {
                const d = new Date(fechaDesde);
                d.setHours(0,0,0,0);
                const h_fin = new Date(fechaHasta);
                h_fin.setHours(23,59,59,999);
                return fechaReg >= d && fechaReg <= h_fin;
            }
            return true; 
        });

        return filtrado;
    }, [historial, busqueda, filtroTiempo, fechaDesde, fechaHasta, vehiculoFiltro]);

    const viajes = useMemo(() => {
        const registrosCronologicos = [...historialFiltrado].reverse();
        const vehiculosEnRuta = {};
        const viajesArmados = [];

        registrosCronologicos.forEach(reg => {
            if (reg.tipo_registro === 'SALIDA') {
                const nuevoViaje = { id: reg.id, vehiculo: reg.vehiculo, vehiculo_id: reg.vehiculo_id, responsable: reg.usuario_id, salida: reg, llegada: null, percances: [] };
                vehiculosEnRuta[reg.vehiculo_id] = nuevoViaje;
                viajesArmados.push(nuevoViaje);
            } else if (reg.tipo_registro === 'LLEGADA') {
                if (vehiculosEnRuta[reg.vehiculo_id]) {
                    vehiculosEnRuta[reg.vehiculo_id].llegada = reg;
                    delete vehiculosEnRuta[reg.vehiculo_id]; 
                } else {
                    viajesArmados.push({ id: reg.id, vehiculo: reg.vehiculo, vehiculo_id: reg.vehiculo_id, responsable: reg.usuario_id, salida: null, llegada: reg, percances: [] });
                }
            } else if (reg.tipo_registro === 'PERCANCE') {
                if (vehiculosEnRuta[reg.vehiculo_id]) {
                    vehiculosEnRuta[reg.vehiculo_id].percances.push(reg);
                } else {
                    viajesArmados.push({ id: reg.id, vehiculo: reg.vehiculo, vehiculo_id: reg.vehiculo_id, responsable: reg.usuario_id, salida: null, llegada: null, percances: [reg] });
                }
            }
        });

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
            {/* ENCABEZADO Y CONTROLES AVANZADOS */}
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

                <div className="flex flex-col lg:flex-row gap-4 z-10 relative">
                    <div className="relative flex-1 min-w-[250px]">
                        <MdSearch className="absolute left-4 top-3.5 text-gray-400 text-lg" />
                        <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar unidad, placas o usuario..." className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 transition-colors" />
                    </div>

                    <div className="flex flex-wrap lg:flex-nowrap gap-3">
                        <div className="relative w-full lg:w-48 shrink-0">
                            <MdDirectionsCar className="absolute left-4 top-3.5 text-gray-400 text-lg pointer-events-none" />
                            <select value={vehiculoFiltro} onChange={(e) => setVehiculoFiltro(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-8 py-3 text-sm font-bold text-gray-600 outline-none focus:border-blue-500 cursor-pointer appearance-none truncate">
                                <option value="TODOS">Todas las Unidades</option>
                                {vehiculosUnicos.map(v => (
                                    <option key={v.id} value={v.id}>{v.marca} {v.modelo} - {v.placas}</option>
                                ))}
                            </select>
                        </div>

                        <div className="relative w-full lg:w-48 shrink-0">
                            <MdOutlineDateRange className="absolute left-4 top-3.5 text-gray-400 text-lg pointer-events-none" />
                            <select value={filtroTiempo} onChange={(e) => setFiltroTiempo(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-8 py-3 text-sm font-bold text-gray-600 outline-none focus:border-blue-500 cursor-pointer appearance-none">
                                <option value="todos">Todo el Tiempo</option>
                                <option value="hoy">Solo Hoy</option>
                                <option value="semana">Últimos 7 días</option>
                                <option value="mes">Este Mes</option>
                                <option value="personalizado">Personalizado...</option>
                            </select>
                        </div>

                        {filtroTiempo === 'personalizado' && (
                            <div className="flex items-center gap-2 animate-fade-in w-full lg:w-auto">
                                <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-600 outline-none focus:border-blue-500 w-full" />
                                <span className="text-gray-400 font-bold">-</span>
                                <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-600 outline-none focus:border-blue-500 w-full" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* TABLA GLOBAL DE VIAJES EMPAREJADOS */}
            <div className="flex-1 overflow-hidden bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                {loading ? (
                    <div className="flex-1 flex justify-center items-center"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>
                ) : (
                    <div className="flex-1 overflow-auto custom-scrollbar p-2">
                        <table className="w-full text-left border-collapse min-w-[900px]">
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
                                    <tr><td colSpan="7" className="text-center py-10 text-gray-400 font-bold">No hay rutas registradas con estos filtros.</td></tr>
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
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setVehiculoTimeline({ id: viaje.vehiculo_id, ...viaje.vehiculo })} className="text-[10px] font-black bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1">
                                                            <MdTimeline className="text-base" /> Expediente
                                                        </button>
                                                        <button onClick={() => setViajeSeleccionado(viaje)} className="text-[10px] font-black bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200 px-3 py-2 rounded-xl transition-all shadow-sm">
                                                            Detalles
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL DE EXPEDIENTE INDIVIDUAL */}
            <ModalBitacoras 
                isOpen={!!vehiculoTimeline} 
                onClose={() => setVehiculoTimeline(null)} 
                vehiculo={vehiculoTimeline} 
            />

            {/* MODAL DE DETALLES DEL VIAJE RÁPIDO */}
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
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {/* SALIDA */}
                            {viajeSeleccionado.salida && (
                                <div className="border border-blue-100 rounded-2xl p-4 bg-blue-50/30">
                                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 border-b border-blue-100 pb-2">Datos de Salida</h4>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div><p className="text-[9px] text-gray-400 uppercase font-bold">Fecha / Hora</p><p className="text-xs font-black text-gray-800">{formatearFecha(viajeSeleccionado.salida.created_at)} {formatearHora(viajeSeleccionado.salida.created_at)}</p></div>
                                        <div><p className="text-[9px] text-gray-400 uppercase font-bold">Odómetro Inicial</p><p className="text-xs font-black text-gray-800">{viajeSeleccionado.salida.kilometraje} km</p></div>
                                    </div>
                                    {viajeSeleccionado.salida.detalles_incidencia && <p className="text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-200"><strong className="text-gray-800">Nota:</strong> {viajeSeleccionado.salida.detalles_incidencia}</p>}
                                    
                                    {/* BOTÓN MÁGICO PARA LA FOTO DE SALIDA */}
                                    {viajeSeleccionado.salida.evidencia_url && (
                                        <button type="button" onClick={() => setImagenAmpliada(viajeSeleccionado.salida.evidencia_url)} className="mt-3 w-full h-32 rounded-xl overflow-hidden border border-gray-200 relative block text-left group/img cursor-zoom-in">
                                            <div className="absolute top-2 left-2 bg-black/60 text-white text-[8px] px-2 py-1 rounded backdrop-blur-sm z-20 font-black uppercase">Foto de Salida</div>
                                            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors z-10 flex items-center justify-center"><MdImage className="text-white text-3xl opacity-0 group-hover/img:opacity-100 transition-opacity" /></div>
                                            <img src={viajeSeleccionado.salida.evidencia_url} alt="Evidencia Salida" className="w-full h-full object-cover transition-transform group-hover/img:scale-105"/>
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* PERCANCES */}
                            {viajeSeleccionado.percances?.map(perc => (
                                <div key={perc.id} className="border border-orange-200 rounded-2xl p-4 bg-orange-50/50">
                                    <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 flex items-center gap-1"><MdWarning/> Percance Reportado</h4>
                                    <p className="text-[9px] text-gray-500 font-bold mb-2">{formatearFecha(perc.created_at)} {formatearHora(perc.created_at)} • Gravedad: {perc.gravedad_percance}</p>
                                    <p className="text-xs text-gray-800 font-medium mb-3 bg-white p-3 rounded-xl border border-orange-100">{perc.detalles_incidencia}</p>
                                    
                                    {/* BOTÓN MÁGICO PARA LA FOTO DEL PERCANCE */}
                                    {perc.evidencia_url && (
                                        <button type="button" onClick={() => setImagenAmpliada(perc.evidencia_url)} className="w-full h-32 rounded-xl overflow-hidden border border-gray-200 relative block text-left group/img cursor-zoom-in">
                                            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors z-10 flex items-center justify-center"><MdImage className="text-white text-3xl opacity-0 group-hover/img:opacity-100 transition-opacity" /></div>
                                            <img src={perc.evidencia_url} alt="Evidencia Percance" className="w-full h-full object-cover transition-transform group-hover/img:scale-105"/>
                                        </button>
                                    )}
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
                                        <p className="text-xs text-red-600 bg-white p-3 rounded-xl border border-red-100 mt-2"><strong>Nota Cierre:</strong> {viajeSeleccionado.llegada.detalles_incidencia}</p>
                                    )}
                                    
                                    {/* BOTÓN MÁGICO PARA LA FOTO DEL ODÓMETRO FINAL */}
                                    {viajeSeleccionado.llegada.odometro_url && (
                                        <button type="button" onClick={() => setImagenAmpliada(viajeSeleccionado.llegada.odometro_url)} className="mt-3 w-full h-32 rounded-xl overflow-hidden border border-gray-200 relative block text-left group/img cursor-zoom-in">
                                            <div className="absolute top-2 left-2 bg-black/60 text-white text-[8px] px-2 py-1 rounded backdrop-blur-sm z-20 font-black uppercase">Foto Odómetro Final</div>
                                            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors z-10 flex items-center justify-center"><MdImage className="text-white text-3xl opacity-0 group-hover/img:opacity-100 transition-opacity" /></div>
                                            <img src={viajeSeleccionado.llegada.odometro_url} alt="Odómetro Final" className="w-full h-full object-cover transition-transform group-hover/img:scale-105"/>
                                        </button>
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

            {/* LIGHTBOX MAGISTRAL: Aparece encima de todo */}
            {imagenAmpliada && (
                <VisorImagen 
                    imageUrl={imagenAmpliada} 
                    onClose={() => setImagenAmpliada(null)} 
                />
            )}

        </div>
    );
}