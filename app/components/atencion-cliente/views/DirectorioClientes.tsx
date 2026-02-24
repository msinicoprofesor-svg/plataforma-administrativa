/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/atencion-cliente/views/DirectorioClientes.tsx      */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { 
    MdSearch, MdPersonAdd, MdFilterList, MdEdit, MdDelete, 
    MdLocationOn, MdDomain, MdWifi, MdFiberManualRecord 
} from "react-icons/md";

// DATOS DUMMY PARA VISUALIZACIÓN (LUEGO CONECTAREMOS A SUPABASE)
const CLIENTES_MOCK = [
    { id: '1', nombre: 'Roberto Gómez Bolaños', contrato: '10045-DMG', marca: 'DMG', region: 'San Diego de la Unión', estado: 'ACTIVO', telefono: '442-555-0199' },
    { id: '2', nombre: 'Florinda Meza', contrato: '20012-JAV', marca: 'JAVAK', region: 'Centro', estado: 'SUSPENDIDO', telefono: '442-555-0144' },
    { id: '3', nombre: 'Carlos Villagrán', contrato: '30056-FIB', marca: 'Fibrox MX', region: 'Xichú', estado: 'ACTIVO', telefono: '442-555-0122' },
    { id: '4', nombre: 'Rubén Aguirre', contrato: '40088-RK', marca: 'RK', region: 'Michoacán', estado: 'CANCELADO', telefono: '442-555-0111' },
    { id: '5', nombre: 'María Antonieta de las Nieves', contrato: '50021-WIF', marca: 'WifiCel', region: 'Amealco', estado: 'ACTIVO', telefono: '442-555-0188' },
];

export default function DirectorioClientes() {
    const [busqueda, setBusqueda] = useState('');
    const [filtroMarca, setFiltroMarca] = useState('TODAS');

    // Lógica de filtrado
    const clientesFiltrados = CLIENTES_MOCK.filter(c => {
        const matchTexto = c.nombre.toLowerCase().includes(busqueda.toLowerCase()) || c.contrato.toLowerCase().includes(busqueda.toLowerCase());
        const matchMarca = filtroMarca === 'TODAS' || c.marca === filtroMarca;
        return matchTexto && matchMarca;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-10 h-full flex flex-col">
            
            {/* BARRA DE HERRAMIENTAS SUPERIOR */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-200 shrink-0">
                
                {/* BUSCADOR */}
                <div className="relative w-full md:w-96">
                    <MdSearch className="absolute left-3 top-3 text-gray-400 text-lg"/>
                    <input 
                        type="text" 
                        placeholder="Buscar cliente por nombre o contrato..." 
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-blue-400 focus:bg-white transition-all"
                    />
                </div>

                {/* FILTROS Y ACCIONES */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                        <MdFilterList className="text-gray-400"/>
                        <select 
                            value={filtroMarca}
                            onChange={(e) => setFiltroMarca(e.target.value)}
                            className="bg-transparent text-xs font-bold text-gray-600 outline-none cursor-pointer"
                        >
                            <option value="TODAS">Todas las Marcas</option>
                            <option value="JAVAK">JAVAK</option>
                            <option value="DMG">DMG</option>
                            <option value="Fibrox MX">Fibrox MX</option>
                            <option value="WifiCel">WifiCel</option>
                            <option value="RK">RK</option>
                        </select>
                    </div>

                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95">
                        <MdPersonAdd className="text-base"/> Nuevo Cliente
                    </button>
                </div>
            </div>

            {/* TABLA DE CLIENTES */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="overflow-x-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente / Contrato</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Marca & Región</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estado</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {clientesFiltrados.map((cliente) => (
                                <tr key={cliente.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="py-4 px-6">
                                        <p className="text-sm font-bold text-gray-800">{cliente.nombre}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                                                {cliente.contrato}
                                            </span>
                                            <span className="text-[10px] text-gray-400">{cliente.telefono}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                                                <MdDomain className="text-blue-400"/> {cliente.marca}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400">
                                                <MdLocationOn/> {cliente.region}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                                            cliente.estado === 'ACTIVO' ? 'bg-green-50 text-green-600 border-green-100' :
                                            cliente.estado === 'SUSPENDIDO' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                            'bg-red-50 text-red-600 border-red-100'
                                        }`}>
                                            <MdFiberManualRecord className="text-[8px]"/> {cliente.estado}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 transition-colors" title="Editar">
                                                <MdEdit/>
                                            </button>
                                            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors" title="Eliminar / Dar de baja">
                                                <MdDelete/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {clientesFiltrados.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <MdWifi className="text-4xl mb-2 opacity-20"/>
                            <p className="text-xs font-bold">No se encontraron clientes</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}