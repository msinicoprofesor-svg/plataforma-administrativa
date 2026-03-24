/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/almacen/ModuloLogistica.tsx            */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdLocalShipping, MdAddBox } from "react-icons/md";
import MesaLogistica from './MesaLogistica';
import PortalSolicitudes from './PortalSolicitudes';

export default function ModuloLogistica({ useData, usuarioActivo, colaboradores }) {
    const rolNormalizado = (usuarioActivo?.rol || usuarioActivo?.puesto || '').toUpperCase().trim();
    
    // Matriz de permisos
    const ROLES_ADMIN_GENERAL = ['ENCARGADO_ALMACEN', 'ENCARGADO DE ALMACÉN', 'ENCARGADO DE ALMACEN', 'GERENTE_GENERAL', 'GERENTE GENERAL', 'DIRECTOR', 'SOPORTE_GENERAL'];
    const ROLES_ADMIN_ALMACEN = [...ROLES_ADMIN_GENERAL, 'GERENTE_MKT', 'GERENTE MARKETING', 'ADMINISTRADOR'];
    
    const esEncargado = rolNormalizado !== '' && ROLES_ADMIN_ALMACEN.includes(rolNormalizado);
    
    // Si es encargado inicia en mesa, si no, directo a portal
    const [vistaActiva, setVistaActiva] = useState(esEncargado ? 'mesa' : 'portal');

    return (
        <div className="h-full flex flex-col animate-fade-in pb-2">
            
            {esEncargado && (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 shrink-0 z-10 mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                            <MdLocalShipping className="text-blue-600"/> 
                            Centro de Logística
                        </h2>
                        <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            Gestión de Envíos y Solicitudes
                        </p>
                    </div>
                    <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-200/50 w-full sm:w-auto">
                        <button onClick={() => setVistaActiva('mesa')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-[11px] font-black uppercase flex justify-center items-center gap-2 transition-all ${vistaActiva === 'mesa' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <MdLocalShipping className="text-lg"/> Despachos
                        </button>
                        <button onClick={() => setVistaActiva('portal')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-[11px] font-black uppercase flex justify-center items-center gap-2 transition-all ${vistaActiva === 'portal' ? 'bg-white text-blue-600 shadow-sm border border-blue-100' : 'text-gray-500 hover:text-gray-700'}`}>
                            <MdAddBox className="text-lg"/> Mi Portal
                        </button>
                    </div>
                </div>
            )}
            
            <div className="flex-1 min-h-0 relative">
                {vistaActiva === 'mesa' && esEncargado && <MesaLogistica useData={useData} colaboradores={colaboradores} usuarioActivo={usuarioActivo} />}
                {vistaActiva === 'portal' && <PortalSolicitudes useData={useData} usuarioActivo={usuarioActivo} />}
            </div>
        </div>
    );
}