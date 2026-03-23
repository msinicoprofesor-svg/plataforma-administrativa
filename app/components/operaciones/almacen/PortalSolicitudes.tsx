/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/almacen/PortalSolicitudes.tsx          */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdAddBox, MdSend, MdHistory, MdHourglassEmpty, MdCheckCircle, MdLocalShipping, MdCancel } from "react-icons/md";

export default function PortalSolicitudes({ useData, usuarioActivo }) {
    const { inventario, solicitudes, crearSolicitud, cargando } = useData;
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Formulario
    const [form, setForm] = useState({ productoId: '', cantidad: 1, destino: '', motivo: '' });

    // Historial exclusivo del usuario activo
    const misSolicitudes = solicitudes.filter(s => s.usuario_solicitante_id === usuarioActivo?.id);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const productoSeleccionado = inventario.find(p => p.id === form.productoId);
        if (!productoSeleccionado) return alert("Selecciona un producto válido del catálogo.");
        if (form.cantidad < 1) return alert("La cantidad debe ser al menos 1.");

        setIsSubmitting(true);
        
        // 1. Cabecera del pedido
        const payload = {
            usuario_solicitante_id: usuarioActivo.id,
            destino: form.destino,
            motivo: form.motivo
        };
        
        // 2. Detalle del pedido (Qué producto y cuánto)
        // Guardamos el nombre y marca para que el admin lo lea fácil, y el ID para la lógica
        const detalles = [{
            producto_id: `${productoSeleccionado.nombre} (${productoSeleccionado.marca})`, 
            cantidad_solicitada: form.cantidad
        }];

        const res = await crearSolicitud(payload, detalles);
        setIsSubmitting(false);

        if (res.success) {
            alert("📦 Solicitud de material enviada exitosamente al almacén.");
            setForm({ productoId: '', cantidad: 1, destino: '', motivo: '' });
        } else {
            alert("Error al enviar la solicitud. Intenta de nuevo.");
        }
    };

    const RenderEstado = ({ estado }) => {
        if(estado === 'PENDIENTE') return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md text-[10px] font-black uppercase flex items-center gap-1 w-fit"><MdHourglassEmpty/> Pendiente</span>;
        if(estado === 'EN_ENVIO') return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-[10px] font-black uppercase flex items-center gap-1 w-fit"><MdLocalShipping/> En Camino</span>;
        if(estado === 'ENTREGADO') return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-black uppercase flex items-center gap-1 w-fit"><MdCheckCircle/> Entregado</span>;
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-[10px] font-black uppercase flex items-center gap-1 w-fit"><MdCancel/> Cancelado</span>;
    };

    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return '--';
        return new Date(fechaISO).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' });
    };

    return (
        <div className="h-full flex flex-col xl:flex-row gap-6 animate-fade-in pb-10">
            
            {/* COLUMNA IZQUIERDA: FORMULARIO DE PEDIDO */}
            <div className="xl:w-[40%] bg-white p-6 rounded-3xl shadow-sm border border-gray-100 shrink-0 overflow-y-auto custom-scrollbar">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6 border-b border-gray-100 pb-3 flex items-center gap-2"><MdAddBox className="text-blue-600"/> Nuevo Pedido de Material</h3>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-blue-800 uppercase mb-2 ml-1">Selecciona el Material / Herramienta</label>
                            <select required value={form.productoId} onChange={e => setForm({...form, productoId: e.target.value})} className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 shadow-sm">
                                <option value="">Buscar en el catálogo disponible...</option>
                                {inventario.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.marca})</option>)}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-[10px] font-black text-blue-800 uppercase mb-2 ml-1">Cantidad Requerida</label>
                            <input required type="number" min="1" value={form.cantidad} onChange={e => setForm({...form, cantidad: parseInt(e.target.value)})} className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm font-black text-gray-800 outline-none focus:border-blue-500 shadow-sm text-center" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Destino de Entrega</label>
                        <input required type="text" value={form.destino} onChange={e => setForm({...form, destino: e.target.value})} placeholder="Ej. Obra Valle de Juriquilla, Oficina Central..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Motivo / Justificación</label>
                        <textarea required value={form.motivo} onChange={e => setForm({...form, motivo: e.target.value})} placeholder="Ej. Instalación de red para nuevo cliente, reposición de herramienta dañada..." className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 h-24 resize-none"></textarea>
                    </div>
                    
                    <button type="submit" disabled={isSubmitting} className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-gray-900/20 disabled:opacity-50 flex justify-center items-center gap-2 active:scale-95 mt-4">
                        <MdSend className="text-lg"/> Enviar Solicitud al Almacén
                    </button>
                </form>
            </div>

            {/* COLUMNA DERECHA: RASTREO Y PESTAÑAS */}
            <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2"><MdHistory className="text-gray-400"/> Historial y Rastreo de Mis Pedidos</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                    {cargando ? (
                        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>
                    ) : misSolicitudes.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-bold">Aún no has solicitado ningún material o herramienta.</div>
                    ) : (
                        <div className="space-y-4">
                            {misSolicitudes.map(sol => (
                                <div key={sol.id} className="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow bg-white flex flex-col md:flex-row gap-4 items-start">
                                    <div className="flex-1 space-y-3 w-full">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <RenderEstado estado={sol.estado} />
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{formatearFecha(sol.fecha_solicitud)}</span>
                                        </div>
                                        
                                        {/* DETALLE DEL PEDIDO */}
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <h4 className="text-xs font-black text-gray-800 mb-2">Artículos Solicitados:</h4>
                                            <ul className="space-y-1 mb-3">
                                                {sol.detalles?.map(det => (
                                                    <li key={det.id} className="text-xs font-bold text-blue-600 flex justify-between border-b border-blue-50 pb-1">
                                                        <span>{det.producto_id}</span>
                                                        <span className="bg-white px-2 py-0.5 rounded shadow-sm text-[10px]">{det.cantidad_solicitada} unid.</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                                                <div><span className="font-black text-gray-400 uppercase block mb-0.5">Destino:</span><span className="font-bold text-gray-700">{sol.destino}</span></div>
                                                <div><span className="font-black text-gray-400 uppercase block mb-0.5">Motivo:</span><span className="font-bold text-gray-700 truncate block">{sol.motivo}</span></div>
                                            </div>
                                        </div>

                                        {/* COMENTARIOS DEL ADMIN (Si existen) */}
                                        {sol.comentarios_admin && (
                                            <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-100 text-xs">
                                                <p className="text-yellow-800"><strong>Nota de Almacén:</strong> {sol.comentarios_admin}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}