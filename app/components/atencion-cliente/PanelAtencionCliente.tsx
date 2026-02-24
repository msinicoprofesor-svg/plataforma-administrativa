/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/atencion-cliente/PanelAtencionCliente.tsx          */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdSupportAgent, MdAddCircleOutline, MdListAlt, MdMap, MdPeopleAlt } from "react-icons/md";

// Importamos las vistas
import RegistroReporte from './views/RegistroReporte';
import DirectorioClientes from './views/DirectorioClientes';

export default function PanelAtencionCliente() {
    const [vistaActual, setVistaActual] = useState('REGISTRO'); 

    return (
        <div className="h-full flex flex-col bg-[#F5F7FA] animate-fade-in">
            {/* TOP BAR TIPO LIKESTORE */}
            <div className="bg-white px-6 py-5 border-b border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-600/20">
                        <MdSupportAgent />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Atención al Cliente</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Gestión de Reportes y Rutas</p>
                    </div>
                </div>

                {/* TABS DE NAVEGACIÓN CENTRALES */}
                <div className="flex bg-gray-50/80 p-1.5 rounded-xl border border-gray-200 shadow-inner overflow-x-auto w-full md:w-auto custom-scrollbar">
                    <button 
                        onClick={() => setVistaActual('REGISTRO')}
                        className={`flex items-center whitespace-nowrap gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${vistaActual === 'REGISTRO' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                    >
                        <MdAddCircleOutline className="text-base" /> Nuevo Reporte
                    </button>
                    <button 
                        onClick={() => setVistaActual('REPORTES')}
                        className={`flex items-center whitespace-nowrap gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${vistaActual === 'REPORTES' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                    >
                        <MdListAlt className="text-base" /> Reportes Activos
                    </button>
                    <button 
                        onClick={() => setVistaActual('RUTAS')}
                        className={`flex items-center whitespace-nowrap gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${vistaActual === 'RUTAS' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                    >
                        <MdMap className="text-base" /> Gestión de Rutas
                    </button>
                    
                    {/* NUEVA PESTAÑA: DIRECTORIO DE CLIENTES */}
                    <div className="w-px h-6 bg-gray-300 mx-1 hidden md:block"></div>
                    
                    <button 
                        onClick={() => setVistaActual('CLIENTES')}
                        className={`flex items-center whitespace-nowrap gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${vistaActual === 'CLIENTES' ? 'bg-white text-blue-600 shadow-sm border border-blue-200' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'}`}
                    >
                        <MdPeopleAlt className="text-base" /> Directorio Clientes
                    </button>
                </div>
            </div>

            {/* CONTENEDOR DE LA VISTA ACTIVA */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                
                {vistaActual === 'REGISTRO' && <RegistroReporte />}
                {vistaActual === 'CLIENTES' && <DirectorioClientes />}

                {vistaActual === 'REPORTES' && (
                    <div className="h-full border-2 border-dashed border-gray-200 rounded-3xl flex items-center justify-center text-gray-400 font-bold bg-white/50">
                        [Aquí irán las Tarjetas de los reportes más actuales]
                    </div>
                )}
                {vistaActual === 'RUTAS' && (
                    <div className="h-full border-2 border-dashed border-gray-200 rounded-3xl flex items-center justify-center text-gray-400 font-bold bg-white/50">
                        [Aquí irá el Tablero de Técnicos y Drag & Drop]
                    </div>
                )}
            </div>
        </div>
    );
}