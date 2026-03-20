/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/almacen/DashboardAlmacen.tsx           */
/* -------------------------------------------------------------------------- */
'use client';
import { MdWarning, MdInventory2, MdTrendingUp, MdLocalShipping, MdErrorOutline } from "react-icons/md";

export default function DashboardAlmacen({ useData }) {
    const { inventario, movimientos, solicitudes, cargando } = useData;

    // Métricas calculadas al vuelo
    const totalProductos = inventario.length;
    const productosEnAlerta = inventario.filter(p => p.stock <= p.minimo);
    const solicitudesPendientes = solicitudes.filter(s => s.estado === 'PENDIENTE').length;
    const totalMovimientos = movimientos.length;

    if (cargando) {
        return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>;
    }

    return (
        <div className="h-full flex flex-col gap-6 animate-fade-in pb-10 overflow-y-auto custom-scrollbar">
            
            {/* KPI CARDS (Indicadores Clave) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-2xl shrink-0"><MdInventory2 /></div>
                    <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Catálogo</p><p className="text-2xl font-black text-gray-800">{totalProductos} <span className="text-xs text-gray-500 font-bold">Items</span></p></div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-2xl shrink-0 animate-pulse"><MdWarning /></div>
                    <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock Crítico</p><p className="text-2xl font-black text-red-600">{productosEnAlerta.length} <span className="text-xs text-red-400 font-bold">Alertas</span></p></div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-2xl shrink-0"><MdLocalShipping /></div>
                    <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ped. Pendientes</p><p className="text-2xl font-black text-gray-800">{solicitudesPendientes} <span className="text-xs text-gray-500 font-bold">Por enviar</span></p></div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-2xl shrink-0"><MdTrendingUp /></div>
                    <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Movimientos</p><p className="text-2xl font-black text-gray-800">{totalMovimientos} <span className="text-xs text-gray-500 font-bold">Históricos</span></p></div>
                </div>
            </div>

            {/* TABLA DE ALERTAS CRÍTICAS */}
            <div className="bg-white rounded-3xl shadow-sm border border-red-100 flex flex-col flex-1 overflow-hidden min-h-[300px]">
                <div className="p-5 border-b border-red-50 bg-red-50/30 shrink-0 flex items-center gap-2">
                    <MdErrorOutline className="text-red-500 text-xl" />
                    <h3 className="text-sm font-black text-red-600 uppercase tracking-widest">Atención Requerida: Material por agotarse</h3>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {productosEnAlerta.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-bold flex flex-col items-center"><MdCheckCircle className="text-5xl text-green-200 mb-2"/> Todo el inventario está en niveles óptimos.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="text-[10px] text-gray-400 uppercase bg-white sticky top-0 z-10 shadow-sm">
                                <tr><th className="p-4 rounded-tl-xl">Producto</th><th className="p-4">Categoría</th><th className="p-4">Ubicación</th><th className="p-4 text-center">Mínimo</th><th className="p-4 text-center rounded-tr-xl">Stock Actual</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {productosEnAlerta.map(p => (
                                    <tr key={p.id} className="hover:bg-red-50/50 transition-colors">
                                        <td className="p-4">
                                            <p className="font-black text-gray-800 text-xs">{p.nombre}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{p.marca}</p>
                                        </td>
                                        <td className="p-4"><span className="bg-gray-100 text-gray-600 text-[9px] font-black px-2 py-1 rounded uppercase">{p.categoria}</span></td>
                                        <td className="p-4 text-xs font-bold text-gray-600">{p.almacen} {p.region !== 'N/A' && `• ${p.region}`}</td>
                                        <td className="p-4 text-center text-xs font-black text-gray-400">{p.minimo} {p.unidad}</td>
                                        <td className="p-4 text-center">
                                            <span className="bg-red-100 text-red-700 text-xs font-black px-3 py-1 rounded-lg border border-red-200">{p.stock} {p.unidad}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}