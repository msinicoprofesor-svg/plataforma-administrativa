/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/InventarioOperativo.tsx                */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdInventory2, MdList, MdShoppingCart } from "react-icons/md";

import CatalogoProductos from './almacen/CatalogoProductos';
import RegistroCompras from './almacen/RegistroCompras';

export default function InventarioOperativo({ useData, usuarioActivo, colaboradores = [] }) {
    
    const rolNormalizado = (usuarioActivo?.rol || usuarioActivo?.puesto || '').toUpperCase().trim();

    const ROLES_ADMIN_GENERAL = [
        'ENCARGADO_ALMACEN', 'ENCARGADO DE ALMACÉN', 'ENCARGADO DE ALMACEN',
        'GERENTE_GENERAL', 'GERENTE GENERAL', 
        'DIRECTOR', 'SOPORTE_GENERAL', 'SOPORTE GENERAL'
    ];
    const ROLES_ADMIN_ALMACEN = [...ROLES_ADMIN_GENERAL, 'GERENTE_MKT', 'GERENTE MARKETING', 'ADMINISTRADOR'];

    const esEncargado = rolNormalizado !== '' && ROLES_ADMIN_ALMACEN.includes(rolNormalizado);
    const esAdminGeneral = rolNormalizado !== '' && ROLES_ADMIN_GENERAL.includes(rolNormalizado);
    
    const [vistaActiva, setVistaActiva] = useState('catalogo');

    let tituloPrincipal = 'Almacén General';
    if (esEncargado && !esAdminGeneral) {
        const miRegionOMarca = (usuarioActivo?.region && usuarioActivo.region !== 'N/A') ? usuarioActivo.region : (usuarioActivo?.marca && usuarioActivo.marca !== 'N/A' ? usuarioActivo.marca : 'Regional');
        tituloPrincipal = `Almacén ${miRegionOMarca}`;
    }

    return (
        <div className="h-full flex flex-col animate-fade-in pb-2">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 shrink-0 z-10">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                        <MdInventory2 className="text-blue-600"/> 
                        {tituloPrincipal}
                    </h2>
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                        Warehouse Management System (WMS)
                    </p>
                </div>

                <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-200/50 w-full sm:w-auto">
                    <button onClick={() => setVistaActiva('catalogo')} className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-[11px] font-black uppercase flex justify-center items-center gap-1.5 transition-all ${vistaActiva === 'catalogo' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        <MdList className="text-lg"/> Catálogo
                    </button>
                    <button onClick={() => setVistaActiva('compras')} className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-[11px] font-black uppercase flex justify-center items-center gap-1.5 transition-all ${vistaActiva === 'compras' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        <MdShoppingCart className="text-lg"/> Compras
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 mt-6 relative">
                {vistaActiva === 'catalogo' && <CatalogoProductos useData={useData} usuarioActivo={usuarioActivo} colaboradores={colaboradores} />}
                {vistaActiva === 'compras' && <RegistroCompras useData={useData} usuarioActivo={usuarioActivo} colaboradores={colaboradores} />}
            </div>
        </div>
    );
}