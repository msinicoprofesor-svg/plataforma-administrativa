/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/rrhh/nomina/steps/Paso3_Comedor.tsx                */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { 
    MdRestaurant, MdSearch, MdAttachMoney, MdDeleteSweep, MdCheck
} from "react-icons/md";

const formatoMoneda = (c) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(c);

export default function Paso3_Comedor({ datos, variables, setVariables, updateVariable }) {
    
    // Estado local para el buscador interno de este paso
    const [busquedaLocal, setBusquedaLocal] = useState('');

    // Filtrar la lista que recibimos (datos) con el buscador local
    const empleadosFiltrados = datos.filter(c => 
        c.nombre.toLowerCase().includes(busquedaLocal.toLowerCase())
    );

    // --- ACCIÓN MASIVA ---
    const aplicarMasivo = () => {
        const montoStr = prompt("Ingresa el monto a descontar a TODOS los empleados en lista ($):");
        if (!montoStr) return;
        
        const monto = parseFloat(montoStr) || 0;
        if (monto <= 0) return;

        // Actualizamos variables para todos
        const nuevasVars = { ...variables };
        datos.forEach(c => {
            nuevasVars[c.id] = { 
                ...nuevasVars[c.id], 
                comedor: monto 
            };
        });
        setVariables(nuevasVars);
    };

    const limpiarTodo = () => {
        if(!confirm("¿Borrar todos los descuentos de comedor?")) return;
        const nuevasVars = { ...variables };
        datos.forEach(c => {
            if (nuevasVars[c.id]) {
                nuevasVars[c.id].comedor = 0;
            }
        });
        setVariables(nuevasVars);
    };

    return (
        <div className="p-4 md:p-6 space-y-6 animate-fade-in pb-24">
            
            {/* 1. HEADER Y CONTROLES */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                            <MdRestaurant className="text-orange-500"/> Descuentos de Comedor
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Busca al colaborador y asigna el costo de sus consumos.</p>
                    </div>
                    
                    {/* Botones de Acción Rápida */}
                    <div className="flex gap-2 w-full md:w-auto">
                        <button 
                            onClick={limpiarTodo}
                            className="flex-1 md:flex-none px-4 py-2 border border-red-100 text-red-500 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <MdDeleteSweep className="text-lg"/> Limpiar
                        </button>
                        <button 
                            onClick={aplicarMasivo}
                            className="flex-1 md:flex-none px-4 py-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-xl text-xs font-bold hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <MdCheck className="text-lg"/> Aplicar a Todos
                        </button>
                    </div>
                </div>

                {/* BUSCADOR */}
                <div className="relative group">
                    <MdSearch className="absolute left-4 top-3.5 text-gray-400 text-lg group-focus-within:text-orange-500 transition-colors"/>
                    <input 
                        type="text" 
                        placeholder="Buscar empleado para asignar comida..." 
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-200 focus:bg-white transition-all"
                        value={busquedaLocal}
                        onChange={(e) => setBusquedaLocal(e.target.value)}
                    />
                </div>
            </div>

            {/* 2. LISTA DE EMPLEADOS */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Encabezados */}
                <div className="grid grid-cols-12 bg-gray-50 p-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200">
                    <div className="col-span-8 md:col-span-9 pl-2">Colaborador</div>
                    <div className="col-span-4 md:col-span-3 text-right pr-2">Monto a Descontar</div>
                </div>

                {/* Filas */}
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar divide-y divide-gray-50">
                    {empleadosFiltrados.length === 0 ? (
                        <div className="p-10 text-center text-gray-400 opacity-60">
                            <MdRestaurant className="text-4xl mx-auto mb-2"/>
                            <p className="text-xs">No se encontraron colaboradores.</p>
                        </div>
                    ) : (
                        empleadosFiltrados.map(c => {
                            const montoActual = variables[c.id]?.comedor || 0;
                            return (
                                <div key={c.id} className={`grid grid-cols-12 p-3 items-center hover:bg-gray-50 transition-colors ${montoActual > 0 ? 'bg-orange-50/30' : ''}`}>
                                    
                                    {/* Info Colaborador */}
                                    <div className="col-span-8 md:col-span-9 flex items-center gap-3 pl-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${montoActual > 0 ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                                            {c.nombre.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-sm font-bold truncate ${montoActual > 0 ? 'text-orange-900' : 'text-gray-700'}`}>{c.nombre}</p>
                                            {montoActual > 0 && <p className="text-[9px] text-orange-500 font-bold">Descuento aplicado</p>}
                                        </div>
                                    </div>

                                    {/* Input Monto */}
                                    <div className="col-span-4 md:col-span-3 text-right">
                                        <div className="relative">
                                            <MdAttachMoney className={`absolute left-2 top-2 text-xs ${montoActual > 0 ? 'text-orange-500' : 'text-gray-400'}`}/>
                                            <input 
                                                type="number" 
                                                className={`w-full text-right py-1.5 pl-6 pr-3 rounded-lg text-sm font-bold outline-none border transition-all ${
                                                    montoActual > 0 
                                                    ? 'border-orange-200 bg-white text-orange-600 focus:ring-2 focus:ring-orange-200' 
                                                    : 'border-transparent bg-gray-50 text-gray-500 focus:bg-white focus:border-gray-200 focus:text-gray-800'
                                                }`}
                                                placeholder="0.00"
                                                value={montoActual || ''}
                                                onChange={(e) => updateVariable(c.id, 'comedor', e.target.value)}
                                                onFocus={(e) => e.target.select()} // Auto-seleccionar al hacer clic
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}