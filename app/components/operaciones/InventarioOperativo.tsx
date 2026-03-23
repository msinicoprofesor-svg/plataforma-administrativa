/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/InventarioOperativo.tsx                */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdInventory2, MdList, MdShoppingCart, MdLocalShipping, MdAddBox, MdComputer } from "react-icons/md";

import CatalogoProductos from './almacen/CatalogoProductos';
import RegistroCompras from './almacen/RegistroCompras';
import MesaLogistica from './almacen/MesaLogistica';
import PortalSolicitudes from './almacen/PortalSolicitudes';
import ActivosFijos from './almacen/ActivosFijos';

export default function InventarioOperativo({ useData, usuarioActivo, colaboradores = [] }) {
    
    // --- NUEVA LÓGICA SINCRONIZADA DE ROLES ---
    // Usamos .rol o .puesto dependiendo de cómo lo guarde tu sistema de Login
    const rolUsuario = usuarioActivo?.rol || usuarioActivo?.puesto || '';

    // Los "Dioses": Ven todo de todas las sucursales
    const ROLES_ADMIN_GENERAL = ['Encargado de almacén', 'Gerente General', 'Director', 'Soporte General'];
    
    // Los que tienen acceso al módulo WMS (Dioses + Administradores Regionales)
    const ROLES_ADMIN_ALMACEN = [...ROLES_ADMIN_GENERAL, 'Gerente Marketing', 'Administrador'];

    const esEncargado = rolUsuario && ROLES_ADMIN_ALMACEN.includes(rolUsuario);
    const esAdminGeneral = rolUsuario && ROLES_ADMIN_GENERAL.includes(rolUsuario);
    
    const [vistaActiva, setVistaActiva] = useState(esEncargado ? 'catalogo' : 'portal');

    // Título dinámico
    let tituloPrincipal = 'Materiales y Herramientas';
    if (esAdminGeneral) {
        tituloPrincipal = 'Centro de Logística y Almacén General';
    } else if (esEncargado) {
        const miRegionOMarca = (usuarioActivo?.region && usuarioActivo.region !== 'N/A') ? usuarioActivo.region : (usuarioActivo?.marca && usuarioActivo.marca !== 'N/A' ? usuarioActivo.marca : 'Regional');
        tituloPrincipal = `Centro de Logística y Almacén ${miRegionOMarca}`;
    }

    return (
        <div className="h-full flex flex-col animate-fade-in pb-2">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 shrink-0 z-10">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                        <MdInventory2 className="text-blue-600"/> 
                        {tituloPrincipal}
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
                            <button onClick={() => setVistaActiva('catalogo')} className={`flex-1 xl:flex-none px-4 py-2.5 rounded-xl text-[11px] font-black uppercase flex justify-center items-center gap-1.5 transition-all ${vistaActiva === 'catalogo' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                <MdList className="text-lg"/> Catálogo
                            </button>
                            <button onClick={() => setVistaActiva('compras')} className={`flex-1 xl:flex-none px-4 py-2.5 rounded-xl text-[11px] font-black uppercase flex justify-center items-center gap-1.5 transition-all ${vistaActiva === 'compras' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                <MdShoppingCart className="text-lg"/> Compras
                            </button>
                            <button onClick={() => setVistaActiva('activos')} className={`flex-1 xl:flex-none px-4 py-2.5 rounded-xl text-[11px] font-black uppercase flex justify-center items-center gap-1.5 transition-all ${vistaActiva === 'activos' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                <MdComputer className="text-lg"/> Activos Fijos
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

            <div className="flex-1 min-h-0 mt-6 relative">
                {vistaActiva === 'catalogo' && <CatalogoProductos useData={useData} usuarioActivo={usuarioActivo} />}
                {vistaActiva === 'compras' && <RegistroCompras useData={useData} usuarioActivo={usuarioActivo} />}
                {vistaActiva === 'activos' && <ActivosFijos useData={useData} usuarioActivo={usuarioActivo} colaboradores={colaboradores} />}
                {vistaActiva === 'logistica' && <MesaLogistica useData={useData} colaboradores={colaboradores} usuarioActivo={usuarioActivo} />}
                {vistaActiva === 'portal' && <PortalSolicitudes useData={useData} usuarioActivo={usuarioActivo} />}
            </div>
        </div>
    );
}