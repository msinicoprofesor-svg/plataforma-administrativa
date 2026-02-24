/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/atencion-cliente/PanelAtencionCliente.tsx          */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdSupportAgent, MdAddCircleOutline, MdListAlt, MdMap, MdSearch, MdNotificationsNone } from "react-icons/md";

// Importamos las vistas (Ya no importamos DirectorioClientes aquí)
import RegistroReporte from './views/RegistroReporte';
import ListaReportes from './views/ListaReportes';
import GestionRutas from './views/GestionRutas';

export default function PanelAtencionCliente() {
    const [vistaActual, setVistaActual] = useState('REGISTRO'); 

    return (
        <div className="h-full flex flex-col bg-[#F5F7FA] animate-fade-in relative">
            
            {/* TOP BAR ESTILO LIKESTORE (Flotante y Redondeada) */}
            <div className="bg-white rounded-[2rem] m-4 md:m-6 px-6 py-4 border border-gray-100 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-4 shrink-0 z-10">
                
                {/* IZQUIERDA: ICONO Y TÍTULO */}
                <div className="flex items-center gap-4 w-full xl:w-auto">
                    <div className="w-14 h-14 bg-blue-600 text-white rounded-[1.25rem] flex items-center justify-center text-3xl shadow-lg shadow-blue-600/30 shrink-0">
                        <MdSupportAgent />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Atención al Cliente</h2>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1.5">Centro de Control JAVAK</p>
                    </div>
                </div>

                {/* CENTRO: TABS TIPO PÍLDORA (ESTILO LIKESTORE) */}
                <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200/50 flex-nowrap overflow-x-auto w-full xl:w-auto custom-scrollbar">
                    <button 
                        onClick={() => setVistaActual('REGISTRO')}
                        className={`flex items-center whitespace-nowrap gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${vistaActual === 'REGISTRO' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                    >
                        <MdAddCircleOutline className="text-lg" /> Nuevo Reporte
                    </button>
                    <button 
                        onClick={() => setVistaActual('REPORTES')}
                        className={`flex items-center whitespace-nowrap gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${vistaActual === 'REPORTES' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                    >
                        <MdListAlt className="text-lg" /> Reportes Activos
                    </button>
                    <button 
                        onClick={() => setVistaActual('RUTAS')}
                        className={`flex items-center whitespace-nowrap gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${vistaActual === 'RUTAS' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                    >
                        <MdMap className="text-lg" /> Gestión de Rutas
                    </button>
                </div>

                {/* DERECHA: BUSCADOR Y NOTIFICACIONES */}
                <div className="hidden xl:flex items-center gap-3">
                    <div className="relative">
                        <MdSearch className="absolute left-4 top-3 text-gray-400 text-lg" />
                        <input 
                            type="text" 
                            placeholder="Buscar en el panel..." 
                            className="pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-600 outline-none focus:bg-white focus:border-blue-300 transition-all w-60"
                        />
                    </div>
                    <button className="w-11 h-11 flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-500 rounded-2xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all">
                        <MdNotificationsNone className="text-xl" />
                    </button>
                </div>
            </div>

            {/* CONTENEDOR DE LA VISTA ACTIVA */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-6 pb-6">
                {vistaActual === 'REGISTRO' && <RegistroReporte />}
                {vistaActual === 'REPORTES' && <ListaReportes />}
                {vistaActual === 'RUTAS' && <GestionRutas />}
            </div>
        </div>
    );
}