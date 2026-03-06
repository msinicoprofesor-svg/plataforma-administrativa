/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/atencion-cliente/views/DirectorioClientes.tsx      */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect } from 'react';
import { 
    MdSearch, MdPersonAdd, MdFilterList, MdEdit, MdDelete, 
    MdLocationOn, MdDomain, MdWifi, MdFiberManualRecord, MdClose, MdSave,
    MdPerson, MdMap, MdSettingsEthernet, MdCheckCircle
} from "react-icons/md";

// Importamos el hook
import { useClientes } from '../../../hooks/useClientes';

export default function DirectorioClientes() {
    // ESTADOS DE UI
    const [busqueda, setBusqueda] = useState('');
    const [filtroMarca, setFiltroMarca] = useState('TODAS');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // DATOS DE SUPABASE
    const { clientes, marcas, regiones, loading, agregarCliente } = useClientes();

    // ESTADO DEL FORMULARIO COMPLETO (Añadido latitud y longitud ocultas)
    const estadoInicial = {
        nombre_completo: '', numero_contrato: '', telefono: '', telefono_adicional: '',
        cp: '', estado: '', municipio: '', comunidad: '', direccion: '', coordenadas: '',
        latitud: null, longitud: null, 
        marca_id: '', region_id: '', paquete: '', costo: '', tipo_conexion: '', fecha_instalacion: '', ip: '',
        estado_servicio: 'ACTIVO'
    };
    const [formData, setFormData] = useState(estadoInicial);
    const [buscandoCP, setBuscandoCP] = useState(false);

    // LÓGICA DE FILTRADO
    const clientesFiltrados = clientes.filter(c => {
        const matchTexto = c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || c.contrato?.toLowerCase().includes(busqueda.toLowerCase());
        const matchMarca = filtroMarca === 'TODAS' || c.marca === filtroMarca;
        return matchTexto && matchMarca;
    });

    // LÓGICA DE AUTO-COMPLETADO DE CP
    const handleCPChange = async (e) => {
        const cp = e.target.value;
        setFormData({ ...formData, cp });

        if (cp.length === 5) {
            setBuscandoCP(true);
            try {
                const res = await fetch(`https://api.zippopotam.us/mx/${cp}`);
                if (res.ok) {
                    const data = await res.json();
                    setFormData(prev => ({
                        ...prev,
                        estado: data.places[0].state,
                        municipio: data.places[0]['place name']
                    }));
                }
            } catch (error) {
                console.error("No se encontró el CP");
            }
            setBuscandoCP(false);
        }
    };

    // --- NUEVA LÓGICA: TRADUCTOR DE ENLACES A COORDENADAS ---
    const handleLinkChange = (e) => {
        const link = e.target.value;
        
        // Expresión regular para buscar patrones de latitud y longitud en links de Maps
        // Busca patrones como @21.144,-100.31 o q=21.144,-100.31
        const regexCoordenadas = /@?(-?\d+\.\d+),(-?\d+\.\d+)/;
        const match = link.match(regexCoordenadas);

        setFormData(prev => ({
            ...prev,
            coordenadas: link,
            latitud: match ? parseFloat(match[1]) : null,
            longitud: match ? parseFloat(match[2]) : null
        }));
    };

    // LÓGICA CONDICIONAL: ¿Es marca de internet?
    const marcaSeleccionada = marcas.find(m => m.id.toString() === formData.marca_id.toString())?.nombre || '';
    const esMarcaInternet = ['JAVAK', 'Fibrox MX', 'DMG', 'WifiCel'].includes(marcaSeleccionada);

    // GUARDAR CLIENTE 
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const datosLimpios = { ...formData };

        if (datosLimpios.costo === '') datosLimpios.costo = null;
        if (datosLimpios.fecha_instalacion === '') datosLimpios.fecha_instalacion = null;
        if (datosLimpios.marca_id === '') datosLimpios.marca_id = null;
        if (datosLimpios.region_id === '') datosLimpios.region_id = null;
        
        if (!esMarcaInternet) datosLimpios.tipo_conexion = null;

        await agregarCliente(datosLimpios);
        setIsModalOpen(false);
        setFormData(estadoInicial);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-10 h-full flex flex-col relative">
            
            {/* BARRA DE HERRAMIENTAS SUPERIOR */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-200 shrink-0">
                <div className="relative w-full md:w-96">
                    <MdSearch className="absolute left-3 top-3 text-gray-400 text-lg"/>
                    <input 
                        type="text" placeholder="Buscar cliente por nombre o contrato..." 
                        value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-blue-400 focus:bg-white transition-all"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                        <MdFilterList className="text-gray-400"/>
                        <select value={filtroMarca} onChange={(e) => setFiltroMarca(e.target.value)} className="bg-transparent text-xs font-bold text-gray-600 outline-none cursor-pointer">
                            <option value="TODAS">Todas las Marcas</option>
                            {marcas.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
                        </select>
                    </div>

                    <button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95">
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
                        </div>
                    )}
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente / Contrato</th>
                                <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Servicio</th>
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
                                            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">{cliente.contrato}</span>
                                            <span className="text-[10px] text-gray-400">{cliente.telefono}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        {cliente.ip && <p className="text-xs font-bold text-gray-600">IP: {cliente.ip}</p>}
                                        <p className="text-[10px] text-gray-400">{cliente.paquete ? `${cliente.paquete} - $${cliente.costo || 0}` : 'Sin paquete'}</p>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700"><MdDomain className="text-blue-400"/> {cliente.marca}</div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400"><MdLocationOn/> {cliente.region}</div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${cliente.estado === 'ACTIVO' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                            <MdFiberManualRecord className="text-[8px]"/> {cliente.estado}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 transition-colors" title="Editar"><MdEdit/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL EXPEDIENTE CLIENTE */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col animate-slide-up overflow-hidden border border-gray-200">
                        
                        <div className="flex justify-between items-center px-8 py-5 border-b border-gray-100 bg-white shrink-0">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><MdPersonAdd /></div>
                                    Expediente de Nuevo Cliente
                                </h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 ml-13">Alta en base de datos central</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 p-2.5 rounded-full">
                                <MdClose className="text-xl"/>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-gray-50/50">
                            <form id="formCliente" onSubmit={handleSubmit} className="space-y-8">
                                
                                {/* SECCIÓN 1 */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h4 className="text-sm font-black text-gray-800 flex items-center gap-2 mb-4 border-b border-gray-50 pb-3"><MdPerson className="text-blue-500"/> 1. Datos Generales</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Nombre Completo</label>
                                            <input type="text" required value={formData.nombre_completo} onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:bg-white focus:border-blue-400 transition-all"/>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">ID / Contrato / Folio</label>
                                            <input type="text" required value={formData.numero_contrato} onChange={(e) => setFormData({...formData, numero_contrato: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:bg-white focus:border-blue-400 transition-all"/>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Marca Principal</label>
                                            <select required value={formData.marca_id} onChange={(e) => setFormData({...formData, marca_id: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:bg-white focus:border-blue-400 cursor-pointer">
                                                <option value="">Selecciona marca...</option>
                                                {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Teléfono Principal</label>
                                            <input type="text" required value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:bg-white focus:border-blue-400 transition-all"/>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Teléfono Adicional (Opcional)</label>
                                            <input type="text" value={formData.telefono_adicional} onChange={(e) => setFormData({...formData, telefono_adicional: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:bg-white focus:border-blue-400 transition-all"/>
                                        </div>
                                    </div>
                                </div>

                                {/* SECCIÓN 2: DIRECCIÓN Y MAPS */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h4 className="text-sm font-black text-gray-800 flex items-center gap-2 mb-4 border-b border-gray-50 pb-3"><MdMap className="text-green-500"/> 2. Ubicación de Instalación</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 flex justify-between">
                                                Código Postal {buscandoCP && <span className="text-blue-500 animate-pulse">Buscando...</span>}
                                            </label>
                                            <input type="text" maxLength={5} value={formData.cp} onChange={handleCPChange} placeholder="Ej. 76000" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:bg-white focus:border-blue-400 transition-all"/>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Estado</label>
                                            <input type="text" value={formData.estado} onChange={(e) => setFormData({...formData, estado: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:bg-white focus:border-blue-400 transition-all"/>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Municipio</label>
                                            <input type="text" value={formData.municipio} onChange={(e) => setFormData({...formData, municipio: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:bg-white focus:border-blue-400 transition-all"/>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Región / Zona Operativa</label>
                                            <select required value={formData.region_id} onChange={(e) => setFormData({...formData, region_id: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:bg-white focus:border-blue-400 cursor-pointer">
                                                <option value="">Selecciona región...</option>
                                                {regiones.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Comunidad / Colonia</label>
                                            <input type="text" value={formData.comunidad} onChange={(e) => setFormData({...formData, comunidad: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:bg-white focus:border-blue-400 transition-all"/>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Calle y Número</label>
                                            <input type="text" required value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:bg-white focus:border-blue-400 transition-all"/>
                                        </div>
                                        
                                        {/* ENLACE MAPS CON LECTOR INTELIGENTE */}
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 flex justify-between items-center">
                                                Enlace Maps
                                                {formData.latitud && <span className="text-[9px] text-green-500 font-black flex items-center gap-1"><MdCheckCircle/> ¡Coordenadas detectadas!</span>}
                                            </label>
                                            <input 
                                                type="text" 
                                                value={formData.coordenadas} 
                                                onChange={handleLinkChange} 
                                                placeholder="Pega el enlace web aquí..." 
                                                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm font-bold outline-none transition-all ${formData.latitud ? 'border-green-300 text-green-700 focus:border-green-500 focus:bg-white' : 'border-gray-200 text-blue-600 focus:bg-white focus:border-blue-400'}`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* SECCIÓN 3 */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h4 className="text-sm font-black text-gray-800 flex items-center gap-2 mb-4 border-b border-gray-50 pb-3"><MdSettingsEthernet className="text-orange-500"/> 3. Información Técnica</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Paquete de Velocidad</label>
                                            <input type="text" value={formData.paquete} onChange={(e) => setFormData({...formData, paquete: e.target.value})} placeholder="Ej. 50 Megas" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:bg-white focus:border-blue-400 transition-all"/>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Costo Mensual ($)</label>
                                            <input type="number" value={formData.costo} onChange={(e) => setFormData({...formData, costo: e.target.value})} placeholder="0.00" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:bg-white focus:border-blue-400 transition-all"/>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Fecha de Instalación</label>
                                            <input type="date" value={formData.fecha_instalacion} onChange={(e) => setFormData({...formData, fecha_instalacion: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:bg-white focus:border-blue-400 transition-all cursor-pointer"/>
                                        </div>
                                        
                                        {esMarcaInternet && (
                                            <div>
                                                <label className="block text-[10px] font-bold text-orange-500 uppercase mb-1.5">Tipo de Conexión</label>
                                                <select value={formData.tipo_conexion} onChange={(e) => setFormData({...formData, tipo_conexion: e.target.value})} className="w-full px-4 py-2.5 bg-orange-50 border border-orange-200 rounded-xl text-sm font-bold text-orange-800 outline-none focus:bg-white focus:border-orange-400 cursor-pointer">
                                                    <option value="">Seleccionar...</option>
                                                    <option value="Antena">Inalámbrico (Antena)</option>
                                                    <option value="FO">Fibra Óptica (FO)</option>
                                                </select>
                                            </div>
                                        )}
                                        
                                        <div className={esMarcaInternet ? "md:col-span-2" : "md:col-span-3"}>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Dirección IP Asignada</label>
                                            <input type="text" value={formData.ip} onChange={(e) => setFormData({...formData, ip: e.target.value})} placeholder="Ej. 192.168.1.100" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:bg-white focus:border-blue-400 transition-all font-mono"/>
                                        </div>
                                    </div>
                                </div>

                            </form>
                        </div>

                        <div className="p-5 border-t border-gray-100 bg-white shrink-0 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                                Cancelar
                            </button>
                            <button form="formCliente" type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95">
                                <MdSave className="text-base"/> Guardar Expediente
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}