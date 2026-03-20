/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/vehiculos/solicitudes/HistorialMisSolicitudes.tsx  */
/* -------------------------------------------------------------------------- */
'use client';
import { MdCheckCircle, MdCancel, MdHourglassEmpty, MdAccessTime, MdOutlineDateRange } from 'react-icons/md';
import { useSolicitudesVehiculos } from '../../../hooks/useSolicitudesVehiculos';

export default function HistorialMisSolicitudes({ usuarioActivo }) {
    const { solicitudes, loading } = useSolicitudesVehiculos(usuarioActivo?.id, false);

    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return '--';
        return new Date(fechaISO).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
    };

    const renderizarPeriodo = (sol) => {
        const inicio = formatearFecha(sol.fecha_solicitud);
        if (sol.tipo_duracion === 'HORAS') return `${inicio} • ${sol.hora_inicio} a ${sol.hora_fin}`;
        if (sol.tipo_duracion === 'DIA') return `${inicio} (Todo el día)`;
        return `${inicio} al ${formatearFecha(sol.fecha_fin)}`;
    };

    const RenderEtiquetaEstado = ({ estado }) => {
        if (estado === 'APROBADA') return <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-black uppercase px-2 py-1 rounded-md"><MdCheckCircle/> Aprobada</span>;
        if (estado === 'RECHAZADA') return <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-black uppercase px-2 py-1 rounded-md"><MdCancel/> Rechazada</span>;
        return <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-[10px] font-black uppercase px-2 py-1 rounded-md animate-pulse"><MdHourglassEmpty/> Pendiente</span>;
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden max-w-4xl mx-auto">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Mis Solicitudes Activas e Históricas</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                {loading ? (
                    <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div></div>
                ) : solicitudes.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 font-bold">No tienes solicitudes registradas en el sistema.</div>
                ) : (
                    <div className="space-y-4">
                        {solicitudes.map(sol => (
                            <div key={sol.id} className="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow bg-white">
                                <div className="flex flex-wrap items-center gap-3 mb-3">
                                    <RenderEtiquetaEstado estado={sol.estado} />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1">
                                        {sol.tipo_duracion === 'HORAS' ? <MdAccessTime/> : <MdOutlineDateRange/>} 
                                        {renderizarPeriodo(sol)}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Destino</p>
                                        <p className="text-xs font-bold text-gray-800">{sol.destino}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Motivo</p>
                                        <p className="text-xs font-bold text-gray-800 truncate">{sol.motivo}</p>
                                    </div>
                                </div>
                                
                                {sol.estado !== 'PENDIENTE' && (
                                    <div className="mt-3 p-3 rounded-xl bg-purple-50/50 border border-purple-100 text-xs">
                                        {sol.estado === 'APROBADA' && <p className="font-black text-gray-800 mb-1">🚗 Asignado: <span className="text-blue-600">{sol.vehiculo?.marca} {sol.vehiculo?.modelo} ({sol.vehiculo?.placas})</span></p>}
                                        {sol.comentarios_admin && <p className="text-gray-600"><strong>Nota de Admin:</strong> {sol.comentarios_admin}</p>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}