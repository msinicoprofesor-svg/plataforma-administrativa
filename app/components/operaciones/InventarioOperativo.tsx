/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/InventarioOperativo.tsx (AISLAMIENTO)  */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdInventory2, MdDashboard, MdList, MdShoppingCart, MdLocalShipping, MdAddBox } from "react-icons/md";

// 🔴 AISLAMIENTO: Comentamos los imports temporalmente para encontrar al culpable
// import DashboardAlmacen from './almacen/DashboardAlmacen';
// import CatalogoProductos from './almacen/CatalogoProductos';
// import RegistroCompras from './almacen/RegistroCompras';
// import MesaLogistica from './almacen/MesaLogistica';
// import PortalSolicitudes from './almacen/PortalSolicitudes';

export default function InventarioOperativo({ useData, usuarioActivo, colaboradores = [] }) {
    const ROLES_ADMIN_ALMACEN = ['ENCARGADO_ALMACEN', 'GERENTE_GENERAL', 'DIRECTOR', 'SOPORTE_GENERAL', 'GERENTE_MKT'];
    const esEncargado = usuarioActivo && ROLES_ADMIN_ALMACEN.includes(usuarioActivo.rol);
    const [vistaActiva, setVistaActiva] = useState(esEncargado ? 'dashboard' : 'portal');

    return (
        <div className="h-full flex flex-col animate-fade-in pb-2">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 shrink-0 z-10">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                        <MdInventory2 className="text-blue-600"/> 
                        {esEncargado ? 'Centro de Logística y Almacén' : 'Materiales y Herramientas'}
                    </h2>
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Diagnóstico de Enrutador</p>
                </div>

                <div className="flex flex-wrap bg-gray-50 p-1.5 rounded-2xl border border-gray-200/50 w-full xl:w-auto">
                    {!esEncargado ? (
                        <button onClick={() => setVistaActiva('portal')} className={`flex-1 xl:flex-none px-5 py-2.5 rounded-xl text-[11px] font-black uppercase flex justify-center items-center gap-2 ${vistaActiva === 'portal' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Mis Pedidos</button>
                    ) : (
                        <>
                            <button onClick={() => setVistaActiva('dashboard')} className={`flex-1 xl:flex-none px-4 py-2.5 rounded-xl text-[11px] font-black uppercase flex justify-center items-center gap-1.5 ${vistaActiva === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Dashboard</button>
                            <button onClick={() => setVistaActiva('catalogo')} className={`flex-1 xl:flex-none px-4 py-2.5 rounded-xl text-[11px] font-black uppercase flex justify-center items-center gap-1.5 ${vistaActiva === 'catalogo' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Catálogo</button>
                            <button onClick={() => setVistaActiva('compras')} className={`flex-1 xl:flex-none px-4 py-2.5 rounded-xl text-[11px] font-black uppercase flex justify-center items-center gap-1.5 ${vistaActiva === 'compras' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Compras</button>
                            <button onClick={() => setVistaActiva('logistica')} className={`flex-1 xl:flex-none px-4 py-2.5 rounded-xl text-[11px] font-black uppercase flex justify-center items-center gap-1.5 ${vistaActiva === 'logistica' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Logística</button>
                            <button onClick={() => setVistaActiva('portal')} className={`flex-1 xl:flex-none px-4 py-2.5 rounded-xl text-[11px] font-black uppercase flex justify-center items-center gap-1.5 ${vistaActiva === 'portal' ? 'bg-white text-blue-600 shadow-sm border border-blue-100' : 'text-gray-500'}`}>Portal</button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 min-h-0 mt-6 relative bg-white rounded-3xl border border-gray-100 p-10 flex items-center justify-center">
                {/* 🔴 AISLAMIENTO: Renderizamos vistas falsas seguras */}
                {vistaActiva === 'dashboard' && <h1 className="text-2xl font-black text-blue-600">✅ Vista Dashboard Aislada</h1>}
                {vistaActiva === 'catalogo' && <h1 className="text-2xl font-black text-blue-600">✅ Vista Catálogo Aislada</h1>}
                {vistaActiva === 'compras' && <h1 className="text-2xl font-black text-blue-600">✅ Vista Compras Aislada</h1>}
                {vistaActiva === 'logistica' && <h1 className="text-2xl font-black text-blue-600">✅ Vista Logística Aislada</h1>}
                {vistaActiva === 'portal' && <h1 className="text-2xl font-black text-blue-600">✅ Vista Portal Aislada</h1>}
            </div>
        </div>
    );
}