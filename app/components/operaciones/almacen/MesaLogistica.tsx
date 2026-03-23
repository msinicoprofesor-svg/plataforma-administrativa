/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/almacen/MesaLogistica.tsx              */
/* -------------------------------------------------------------------------- */
'use client';
import { MdLocalShipping, MdCheckCircle, MdCancel, MdHourglassEmpty } from "react-icons/md";

export default function MesaLogistica({ useData, colaboradores }) {
    const { solicitudes, actualizarEstadoSolicitud } = useData;

    const getNombre = (id) => {
        const col = colaboradores.find(c => c.id === id);
        return col ? col.nombre : 'Usuario Desconocido';
    };

    const handleActualizar = async (id, estado) => {
        const comentario = prompt(`Escribe un comentario para el estado ${estado} (Opcional):`, "");
        if(comentario !== null) {
            await actualizarEstadoSolicitud(id, estado, comentario);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><MdLocalShipping className="text-blue-600"/> Mesa de Control Logístico</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gestiona los envíos y entregas a técnicos/regiones</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                {solicitudes.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 font-bold">No hay solicitudes de material activas.</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {solicitudes.map(sol => (
                            <div key={sol.id} className="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow bg-white flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-sm font-black text-blue-700">{getNombre(sol.usuario_solicitante_id)}</h4>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Destino: {sol.destino}</p>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${sol.estado === 'PENDIENTE' ? 'bg-orange-100 text-orange-700' : sol.estado === 'EN_ENVIO' ? 'bg-blue-100 text-blue-700' : sol.estado === 'ENTREGADO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{sol.estado.replace('_', ' ')}</span>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <p className="text-xs font-bold text-gray-600 mb-2">Motivo: {sol.motivo}</p>
                                    <div className="space-y-1">
                                        {sol.detalles?.map(det => (
                                            <div key={det.id} className="text-[10px] font-bold text-gray-500 flex justify-between">
                                                <span>• {det.producto_id}</span>
                                                <span className="text-gray-800">{det.cantidad_solicitada} solic.</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {sol.estado !== 'ENTREGADO' && sol.estado !== 'CANCELADO' && (
                                    <div className="flex gap-2 mt-2">
                                        {sol.estado === 'PENDIENTE' && <button onClick={() => handleActualizar(sol.id, 'EN_ENVIO')} className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-black transition-colors">Marcar En Envío</button>}
                                        {sol.estado === 'EN_ENVIO' && <button onClick={() => handleActualizar(sol.id, 'ENTREGADO')} className="flex-1 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-black transition-colors">Marcar Entregado</button>}
                                        <button onClick={() => handleActualizar(sol.id, 'CANCELADO')} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-black transition-colors">Cancelar</button>
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