/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/rrhh/nomina/steps/Paso1_Resumen.tsx                */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { 
    MdViewModule, MdViewList, MdSearch, MdFilterList, 
    MdCalculate, MdKeyboardArrowDown 
} from "react-icons/md";

// LISTAS DE FILTROS
const MARCAS = ['Todas', 'JAVAK (Corporativo)', 'DMG NET', 'Intercheap', 'Fibrox MX', 'RK', 'WifiCel', 'Fundación Frenxo'];
const REGIONES = ['Todas', 'Centro', 'Comonfort', 'Tlalpujahua', 'Gandhó', 'San Diego de la Unión', 'Amealco', 'Xichú', 'Jalpan de Serra', 'Santa María del Río'];

const formatoMoneda = (c) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(c);

export default function Paso1_Resumen({ datos, filtros, setFiltros }) {
    const [vista, setVista] = useState('GRID'); // 'GRID' | 'LIST'

    return (
        <div className="p-4 md:p-6 space-y-6 animate-fade-in">
            
            {/* 1. BARRA DE HERRAMIENTAS (Resumen + Filtros + Vistas) */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                
                {/* Info Izquierda */}
                <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                    <div className="p-2 bg-white rounded-full text-blue-600 shadow-sm"><MdCalculate/></div>
                    <div>
                        <p className="text-xs font-bold text-blue-800 uppercase">Cálculo Base</p>
                        <p className="text-[10px] text-blue-600">Sueldo + Bonos Fijos - Préstamos</p>
                    </div>
                </div>

                {/* Controles Derecha */}
                <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
                    
                    {/* Buscador */}
                    <div className="relative group flex-1">
                        <MdSearch className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-500"/>
                        <input 
                            type="text" 
                            placeholder="Buscar colaborador..." 
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                            value={filtros.busqueda}
                            onChange={(e) => setFiltros(prev => ({...prev, busqueda: e.target.value}))}
                        />
                    </div>

                    {/* Filtros Dropdown */}
                    <div className="flex gap-2">
                        <div className="relative min-w-[100px] flex-1">
                            <select 
                                className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none appearance-none cursor-pointer hover:bg-gray-100 text-gray-600"
                                value={filtros.marca}
                                onChange={(e) => setFiltros(prev => ({...prev, marca: e.target.value}))}
                            >
                                {MARCAS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <MdKeyboardArrowDown className="absolute right-2 top-2.5 text-gray-400 pointer-events-none"/>
                        </div>
                        <div className="relative min-w-[100px] flex-1">
                            <select 
                                className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none appearance-none cursor-pointer hover:bg-gray-100 text-gray-600"
                                value={filtros.region}
                                onChange={(e) => setFiltros(prev => ({...prev, region: e.target.value}))}
                            >
                                {REGIONES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <MdKeyboardArrowDown className="absolute right-2 top-2.5 text-gray-400 pointer-events-none"/>
                        </div>
                    </div>

                    {/* Switch Vista */}
                    <div className="flex bg-gray-100 p-1 rounded-xl shrink-0 self-end md:self-auto">
                        <button onClick={() => setVista('GRID')} className={`p-2 rounded-lg transition-all ${vista === 'GRID' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><MdViewModule/></button>
                        <button onClick={() => setVista('LIST')} className={`p-2 rounded-lg transition-all ${vista === 'LIST' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><MdViewList/></button>
                    </div>
                </div>
            </div>

            {/* 2. CONTENIDO (GRID o LIST) */}
            <div className="pb-20">
                {datos.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 opacity-50">No hay colaboradores que coincidan con los filtros.</div>
                ) : vista === 'GRID' ? (
                    /* VISTA TARJETAS */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {datos.map(col => (
                            <div key={col.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                                        {col.foto ? <img src={col.foto} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 text-xs">{col.nombre.charAt(0)}</div>}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-800 text-sm truncate">{col.nombre}</p>
                                        <p className="text-[10px] text-gray-400 truncate uppercase">{col.puesto}</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-xs bg-gray-50/50 p-3 rounded-xl border border-gray-50">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 font-medium">Sueldo Base</span>
                                        <span className="font-bold text-gray-700">{formatoMoneda(col.sueldo)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 font-medium">Bonos Fijos</span>
                                        <span className="font-bold text-green-600">+{formatoMoneda(col.bonosFijos)}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-2">
                                        <span className="text-gray-400 font-medium">Deducciones Fijas</span>
                                        <span className="font-bold text-red-500">-{formatoMoneda(col.descAlianza + col.descInterno + col.cajaAhorro + col.infonavit)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* VISTA LISTA */
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="grid grid-cols-12 bg-gray-50 p-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200">
                            <div className="col-span-4 pl-2">Colaborador</div>
                            <div className="col-span-2">Marca/Sede</div>
                            <div className="col-span-2 text-right">Sueldo Base</div>
                            <div className="col-span-2 text-right">Bonos Fijos</div>
                            <div className="col-span-2 text-right pr-2">Deducciones Fijas</div>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {datos.map(col => (
                                <div key={col.id} className="grid grid-cols-12 p-3 items-center hover:bg-gray-50 transition-colors text-xs">
                                    <div className="col-span-4 font-bold text-gray-700 pl-2">{col.nombre}</div>
                                    <div className="col-span-2 text-gray-500 text-[10px]">{col.marca}</div>
                                    <div className="col-span-2 text-right text-gray-600">{formatoMoneda(col.sueldo)}</div>
                                    <div className="col-span-2 text-right text-green-600 font-bold">+{formatoMoneda(col.bonosFijos)}</div>
                                    <div className="col-span-2 text-right text-red-500 font-bold pr-2">-{formatoMoneda(col.descAlianza + col.descInterno + col.cajaAhorro + col.infonavit)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}