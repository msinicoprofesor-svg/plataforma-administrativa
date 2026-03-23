/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/almacen/ActivosFijos.tsx               */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdComputer, MdAdd, MdSearch } from "react-icons/md";

export default function ActivosFijos({ useData, usuarioActivo, colaboradores }) {
    const { activos, agregarActivoFijo, cargando } = useData; // Usamos el estado 'activos' que ya existe en tu Hook
    const [busqueda, setBusqueda] = useState('');

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
            
            {/* CABECERA */}
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><MdComputer className="text-gray-700"/> Control de Activos Fijos</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Mobiliario, Equipo de Cómputo, Vehículos y Herramienta Mayor</p>
                </div>
                
                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-64">
                        <MdSearch className="absolute left-4 top-2.5 text-gray-400 text-lg" />
                        <input type="text" placeholder="Buscar por serie o nombre..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full bg-white border border-gray-200 rounded-full pl-11 pr-4 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-gray-500 shadow-sm" />
                    </div>
                    <button className="px-5 py-2.5 bg-gray-800 hover:bg-black text-white rounded-full font-black text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 shrink-0">
                        <MdAdd className="text-lg"/> Registrar Activo
                    </button>
                </div>
            </div>

            {/* ZONA DE TRABAJO (TABLA) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex items-center justify-center bg-gray-50/30">
                <div className="text-center">
                    <MdComputer className="text-6xl text-gray-300 mx-auto mb-4" />
                    <h4 className="text-gray-500 font-black text-lg">Módulo de Activos Independiente</h4>
                    <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
                        Aquí controlaremos las computadoras, escritorios y vehículos, separados del material consumible.
                    </p>
                </div>
            </div>
        </div>
    );
}