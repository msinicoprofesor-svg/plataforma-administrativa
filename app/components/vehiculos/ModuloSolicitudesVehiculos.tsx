/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/vehiculos/ModuloSolicitudesVehiculos.tsx           */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdAssignment, MdAdd, MdHistory, MdAdminPanelSettings } from 'react-icons/md';

// IMPORTAMOS LOS 3 SUBMÓDULOS (Los crearemos en el siguiente paso)
import FormularioNueva from './solicitudes/FormularioNueva';
import HistorialMisSolicitudes from './solicitudes/HistorialMisSolicitudes';
import BandejaAprobacion from './solicitudes/BandejaAprobacion';

export default function ModuloSolicitudesVehiculos({ usuarioActivo, esEncargado, colaboradores = [], vehiculos = [], onClose }) {
    // El admin entra directo a la bandeja, el usuario común entra a crear una nueva
    const [vistaActiva, setVistaActiva] = useState(esEncargado ? 'bandeja' : 'nueva');

    return (
        <div className="h-full flex flex-col animate-fade-in pb-2">
            {/* ENCABEZADO Y PESTAÑAS */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 shrink-0 z-10">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                        <MdAssignment className="text-purple-600"/> 
                        {esEncargado ? 'Gestión de Solicitudes' : 'Centro de Préstamos'}
                    </h2>
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                        {esEncargado ? 'Administración de unidades vehiculares' : 'Solicita un vehículo para tus actividades'}
                    </p>
                </div>

                <div className="flex flex-wrap bg-gray-50 p-1.5 rounded-2xl border border-gray-200/50 w-full xl:w-auto">
                    <button onClick={() => setVistaActiva('nueva')} className={`flex-1 xl:flex-none px-5 py-2.5 rounded-xl text-[11px] font-black uppercase flex justify-center items-center gap-2 transition-all ${vistaActiva === 'nueva' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        <MdAdd className="text-lg"/> Nueva Petición
                    </button>
                    <button onClick={() => setVistaActiva('historial')} className={`flex-1 xl:flex-none px-5 py-2.5 rounded-xl text-[11px] font-black uppercase flex justify-center items-center gap-2 transition-all ${vistaActiva === 'historial' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        <MdHistory className="text-lg"/> Mi Historial
                    </button>
                    {esEncargado && (
                        <button onClick={() => setVistaActiva('bandeja')} className={`flex-1 xl:flex-none px-5 py-2.5 rounded-xl text-[11px] font-black uppercase flex justify-center items-center gap-2 transition-all ${vistaActiva === 'bandeja' ? 'bg-white text-purple-600 shadow-sm border border-purple-100' : 'text-gray-500 hover:text-gray-700'}`}>
                            <MdAdminPanelSettings className="text-lg"/> Bandeja Admin
                        </button>
                    )}
                </div>
            </div>

            {/* CONTENEDOR DINÁMICO (Con fix de overflow para evitar cortes) */}
            <div className="flex-1 min-h-0 mt-6 relative">
                {vistaActiva === 'nueva' && (
                    <FormularioNueva 
                        usuarioActivo={usuarioActivo} 
                        setVistaActiva={setVistaActiva} 
                    />
                )}
                
                {vistaActiva === 'historial' && (
                    <HistorialMisSolicitudes 
                        usuarioActivo={usuarioActivo} 
                    />
                )}
                
                {esEncargado && vistaActiva === 'bandeja' && (
                    <BandejaAprobacion 
                        usuarioActivo={usuarioActivo} 
                        colaboradores={colaboradores} 
                        vehiculos={vehiculos} 
                    />
                )}
            </div>
        </div>
    );
}