/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/vehiculos/PanelVehiculos.tsx                       */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdDirectionsCar, MdBuild, MdListAlt } from 'react-icons/md';

// CORRECCIÓN: Eran solo dos saltos (../../) no tres (../../../)
import { useVehiculos } from '../../hooks/useVehiculos';

export default function PanelVehiculos({ usuarioActivo }) {
    const { vehiculos, loading } = useVehiculos();
    
    // Por ahora validamos de forma general si tiene un rol administrativo
    const ROLES_ADMIN = ['GERENTE_MKT', 'DIRECTOR', 'GERENTE_GENERAL', 'SOPORTE_GENERAL'];
    const esEncargado = ROLES_ADMIN.includes(usuarioActivo?.rol);

    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in pb-10">
            {/* ENCABEZADO */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                    <h2 className="text-xl font-black text-gray-800 flex items-center gap-2 uppercase tracking-wide">
                        <MdDirectionsCar className="text-blue-600 text-2xl" /> Control Vehicular
                    </h2>
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                        {esEncargado ? 'Panel de Administración de Flotilla' : 'Panel de Usuario y Bitácora'}
                    </p>
                </div>
            </div>

            {/* ÁREA DE TRABAJO */}
            <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner animate-pulse">
                    <MdDirectionsCar />
                </div>
                <h3 className="text-lg font-black text-gray-800 mb-2">Módulo Conectado a Supabase</h3>
                <p className="text-sm font-medium text-gray-500 max-w-md">
                    La estructura base está lista. En el siguiente paso construiremos las miniaturas de los vehículos y la bitácora interactiva 3D.
                </p>
            </div>
        </div>
    );
}