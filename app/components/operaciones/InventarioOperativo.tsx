/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/InventarioOperativo.tsx                */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdInventory2, MdDashboard, MdList, MdShoppingCart, MdLocalShipping, MdAddBox } from "react-icons/md";

// IMPORTAMOS LOS 5 SUBMÓDULOS (Los crearemos en el siguiente paso)
import DashboardAlmacen from './almacen/DashboardAlmacen';
import CatalogoProductos from './almacen/CatalogoProductos';
import RegistroCompras from './almacen/RegistroCompras.tsx';
import MesaLogistica from './almacen/MesaLogistica';
import PortalSolicitudes from './almacen/PortalSolicitudes';

export default function InventarioOperativo({ useData, usuarioActivo, colaboradores = [] }) {
    
    // Definimos quiénes son los dioses del almacén
    const ROLES_ADMIN_ALMACEN = ['ENCARGADO_ALMACEN', 'GERENTE_GENERAL', 'DIRECTOR', 'SOPORTE_GENERAL', 'GERENTE_MKT'];
    const esEncargado = usuarioActivo && ROLES_ADMIN_ALMACEN.includes(usuarioActivo.rol);

    // El admin entra al dashboard, el usuario común entra directo a pedir material
    const [vistaActiva, setVistaActiva] = useState(esEncargado ? 'dashboard' : 'portal');

    return (
        <div className="h-full flex flex-col animate-fade-in pb-2">
            {/* ENCABEZADO Y PESTAÑAS */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 shrink-0 z-10">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                        <MdInventory2 className="text-blue-600"/> 
                        {esEncargado ? 'Centro de Logística y Almacén' : 'Materiales y Herramientas'}
                    </h2>
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                        {esEncargado ? 'Warehouse Management System (WMS)' : 'Solicita insumos para tus actividades'}
                    </p>
                </div>

                <div className="flex flex-wrap bg-gray-50 p-1.5 rounded-2xl border border-gray-200/50 w-full xl:w-auto">
                    {!esEncargado ? (
                        <button onClick={() => setVistaActiva('portal')} className={`flex-1 xl:flex-none px-5 py-2.5 rounded-xl text-[11px] font-black uppercase flex justify-center items-center gap-2 transition-all ${vistaActiva === 'portal' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <MdAddBox className="text-lg"/> Mis Pedidos
                        </button>
                    ) : (
                        <>
                            <button onClick={() => setVistaActiva('dashboard')} className={`flex-1 xl:flex-none px-4 py-2.5 rounded-xl text-[11px] font-black uppercase flex justify-center items-center gap-1.5 transition-all ${vistaActiva === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                <MdDashboard className="text-lg"/> Dashboard
                            </button>
                            <button onClick={() => setVistaActiva('catalogo')} className={`flex-1 xl:flex-none px-4 py-2.5 rounded-xl text-[11px] font-black uppercase flex justify-center items-center gap-1.5 transition-all ${vistaActiva === 'catalogo' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                <MdList className="text-lg"/> Catálogo
                            </button>
                            <button onClick={() => setVistaActiva('compras')} className={`flex-1 xl:flex-none px-4 py-2.5 rounded-xl text-[11px] font-black uppercase flex justify-center items-center gap-1.5 transition-all ${vistaActiva === 'compras' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                <MdShoppingCart className="text-lg"/> Compras
                            </button>
                            <button onClick={() => setVistaActiva('logistica')} className={`flex-1 xl:flex-none px-4 py-2.5 rounded-xl text-[11px] font-black uppercase flex justify-center items-center gap-1.5 transition-all ${vistaActiva === 'logistica' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                <MdLocalShipping className="text-lg"/> Logística
                            </button>
                            <button onClick={() => setVistaActiva('portal')} className={`flex-1 xl:flex-none px-4 py-2.5 rounded-xl text-[11px] font-black uppercase flex justify-center items-center gap-1.5 transition-all ${vistaActiva === 'portal' ? 'bg-white text-blue-600 shadow-sm border border-blue-100' : 'text-gray-500 hover:text-gray-700'}`}>
                                Portal
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* CONTENEDOR DINÁMICO */}
            <div className="flex-1 min-h-0 mt-6 relative">
                {vistaActiva === 'dashboard' && <DashboardAlmacen useData={useData} />}
                {vistaActiva === 'catalogo' && <CatalogoProductos useData={useData} />}
                {vistaActiva === 'compras' && <RegistroCompras useData={useData} usuarioActivo={usuarioActivo} />}
                {vistaActiva === 'logistica' && <MesaLogistica useData={useData} colaboradores={colaboradores} usuarioActivo={usuarioActivo} />}
                {vistaActiva === 'portal' && <PortalSolicitudes useData={useData} usuarioActivo={usuarioActivo} colaboradores={colaboradores} />}
            </div>
        </div>
    );
}