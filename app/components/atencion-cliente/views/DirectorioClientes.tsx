/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/atencion-cliente/views/DirectorioClientes.tsx      */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { 
    MdSearch, MdPersonAdd, MdFilterList, MdEdit, MdDelete, 
    MdLocationOn, MdDomain, MdWifi, MdFiberManualRecord, MdClose, MdSave
} from "react-icons/md";

// Importamos el hook que acabamos de crear
import { useClientes } from '../../../hooks/useClientes';

export default function DirectorioClientes() {
    // ESTADOS DE UI
    const [busqueda, setBusqueda] = useState('');
    const [filtroMarca, setFiltroMarca] = useState('TODAS');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // DATOS REALES DE SUPABASE
    const { clientes, marcas, regiones, loading, agregarCliente } = useClientes();

    // ESTADO DEL FORMULARIO
    const [formData, setFormData] = useState({
        nombre_completo: '',
        numero_contrato: '',
        telefono: '',
        direccion: '',
        marca_id: '',
        region_id: '',
        estado_servicio: 'ACTIVO'
    });

    // LÓGICA DE FILTRADO
    const clientesFiltrados = clientes.filter(c => {
        const matchTexto = c.nombre.toLowerCase().includes(busqueda.toLowerCase()) || c.contrato.toLowerCase().includes(busqueda.toLowerCase());
        const matchMarca = filtroMarca === 'TODAS' || c.marca === filtroMarca;
        return matchTexto && matchMarca;
    });

    // MANEJO DEL FORMULARIO
    const handleSubmit = async (e) => {
        e.preventDefault();
        await agregarCliente(formData);
        setIsModalOpen(false);
        // Limpiar formulario
        setFormData({ nombre_completo: '', numero_contrato: '', telefono: '', direccion: '', marca_id: '', region_id: '', estado_servicio: 'ACTIVO' });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-10 h-full flex flex-col relative">
            
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
                            {marcas.map(m => (
                                <option key={m.id} value={m.nombre}>{m.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                    >
                        <MdPersonAdd className="text-base"/> Nuevo Cliente
                    </button>
                </div>
            </div>

            {/* TABLA DE CLIENTES */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="overflow-x-auto custom-scrollbar flex-1 relative">
                    
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-xs font-bold text-gray-500 mt-3 animate-pulse">Cargando base de datos...</p>
                        </div>
                    )}

                    <table className="w-full text-left border-collapse min-w-[600px]">
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
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {!loading && clientesFiltrados.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <MdWifi className="text-4xl mb-2 opacity-20"/>
                            <p className="text-xs font-bold">No se encontraron clientes</p>
                            {busqueda === '' && <p className="text-[10px] mt-1">Haz clic en "Nuevo Cliente" para empezar a llenar tu base de datos.</p>}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL NUEVO CLIENTE */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-slide-up">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                                <MdPersonAdd className="text-blue-600"/> Registrar Nuevo Cliente
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors bg-white p-2 rounded-full shadow-sm">
                                <MdClose className="text-xl"/>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* NOMBRE */}
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nombre Completo</label>
                                    <input 
                                        type="text" required
                                        value={formData.nombre_completo}
                                        onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-blue-400 focus:bg-white transition-all"
                                        placeholder="Ej. Juan Pérez López"
                                    />
                                </div>

                                {/* CONTRATO Y TELEFONO */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">No. de Contrato</label>
                                    <input 
                                        type="text" required
                                        value={formData.numero_contrato}
                                        onChange={(e) => setFormData({...formData, numero_contrato: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-blue-400 focus:bg-white transition-all"
                                        placeholder="Ej. 10045-DMG"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Teléfono</label>
                                    <input 
                                        type="text" required
                                        value={formData.telefono}
                                        onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-blue-400 focus:bg-white transition-all"
                                        placeholder="10 dígitos"
                                    />
                                </div>

                                {/* MARCA Y REGION */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Marca</label>
                                    <select 
                                        required value={formData.marca_id}
                                        onChange={(e) => setFormData({...formData, marca_id: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-blue-400 cursor-pointer"
                                    >
                                        <option value="">Selecciona marca...</option>
                                        {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Región / Zona</label>
                                    <select 
                                        required value={formData.region_id}
                                        onChange={(e) => setFormData({...formData, region_id: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-blue-400 cursor-pointer"
                                    >
                                        <option value="">Selecciona región...</option>
                                        {regiones.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                                    </select>
                                </div>

                                {/* DIRECCION */}
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Dirección de Instalación</label>
                                    <textarea 
                                        required value={formData.direccion}
                                        onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-blue-400 focus:bg-white transition-all resize-none h-20 custom-scrollbar"
                                        placeholder="Calle, número, colonia, referencias..."
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95">
                                    <MdSave className="text-base"/> Guardar Cliente
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}