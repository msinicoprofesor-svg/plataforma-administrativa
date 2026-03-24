/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/operaciones/almacen/ActivosFijos.tsx               */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdComputer, MdAdd, MdClose, MdSearch, MdPerson, MdQrCode, MdStickyNote2, MdHistory } from "react-icons/md";
import ModalHistorialGlobal from './ModalHistorialGlobal';

const CATEGORIAS_ACTIVOS = ['EQUIPO_COMPUTO', 'MOBILIARIO', 'HERRAMIENTA_MAYOR'];
const UBICACIONES_FISICAS = ['Almacén General', 'Centro', 'Comonfort', 'Tlalpujahua', 'Gandhó', 'San Diego de la Unión', 'Amealco', 'Xichú', 'Jalpan de Serra', 'Santa María del Río', 'WifiCel', 'RK', 'Fibrox MX', 'Intercheap', 'JAVAK (Corporativo)'];
const ESTADOS_ACTIVOS = ['ACTIVO', 'EN_REPARACION', 'DADO_DE_BAJA'];

export default function ActivosFijos({ useData, usuarioActivo, colaboradores = [] }) {
    const { activos = [], agregarActivoFijo, cargando } = useData;
    const [busqueda, setBusqueda] = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalHistorial, setModalHistorial] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const rolNormalizado = (usuarioActivo?.rol || usuarioActivo?.puesto || '').toUpperCase().trim();
    const ROLES_ADMIN_GENERAL = ['ENCARGADO_ALMACEN', 'ENCARGADO DE ALMACÉN', 'ENCARGADO DE ALMACEN', 'GERENTE_GENERAL', 'GERENTE GENERAL', 'DIRECTOR', 'SOPORTE_GENERAL'];
    const esAdminGeneral = rolNormalizado !== '' && ROLES_ADMIN_GENERAL.includes(rolNormalizado);
    
    let miRegion = (usuarioActivo?.region && usuarioActivo.region !== 'N/A') ? usuarioActivo.region : UBICACIONES_FISICAS[0];
    if (miRegion === 'Centro') miRegion = 'Almacén General'; 
    const miMarca = usuarioActivo?.marca || 'N/A';

    const [nuevoActivo, setNuevoActivo] = useState({ nombre: '', marca: '', numero_serie: '', categoria: CATEGORIAS_ACTIVOS[0], region: miRegion, responsable_id: '', estado: 'ACTIVO', notas: '' });

    const activosPermitidos = esAdminGeneral ? activos : activos.filter(a => a.region === miRegion || a.region === miMarca);

    const activosFiltrados = activosPermitidos.filter(a => {
        if(!busqueda) return true;
        const q = busqueda.toLowerCase();
        const responsableInfo = colaboradores.find(c => c.id === a.responsable_id);
        const nombreResponsable = responsableInfo ? responsableInfo.nombre.toLowerCase() : '';
        return a.nombre.toLowerCase().includes(q) || (a.numero_serie && a.numero_serie.toLowerCase().includes(q)) || (a.marca && a.marca.toLowerCase().includes(q)) || nombreResponsable.includes(q);
    });

    const handleGuardar = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const res = await agregarActivoFijo(nuevoActivo);
        setIsSubmitting(false);

        if (res.success) {
            alert("✅ Activo fijo registrado y asignado exitosamente.");
            setModalAbierto(false);
            setNuevoActivo({ nombre: '', marca: '', numero_serie: '', categoria: CATEGORIAS_ACTIVOS[0], region: miRegion, responsable_id: '', estado: 'ACTIVO', notas: '' });
        } else alert("❌ Ocurrió un error al guardar el activo en la base de datos.");
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden relative">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><MdComputer className="text-gray-700"/> Control de Activos Fijos</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Mobiliario, Equipo de Cómputo y Herramienta Mayor</p>
                </div>
                
                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-64">
                        <MdSearch className="absolute left-4 top-2.5 text-gray-400 text-lg" />
                        <input type="text" placeholder="Buscar activo..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full bg-white border border-gray-200 rounded-full pl-11 pr-4 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-blue-500 shadow-sm" />
                    </div>
                    <button onClick={() => setModalHistorial(true)} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-black text-xs transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 shrink-0">
                        <MdHistory className="text-lg"/>
                    </button>
                    <button onClick={() => setModalAbierto(true)} className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-full font-black text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 shrink-0">
                        <MdAdd className="text-lg"/> Registrar Activo
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {cargando ? (
                    <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>
                ) : activosFiltrados.length === 0 ? (
                    <div className="text-center py-20"><MdComputer className="text-5xl text-gray-200 mx-auto mb-3" /><p className="text-gray-400 font-bold">No hay activos registrados.</p></div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="text-[9px] text-gray-400 uppercase bg-white sticky top-0 z-10 shadow-sm">
                            <tr><th className="p-4 rounded-tl-xl font-black tracking-widest">Activo / Marca</th><th className="p-4 font-black tracking-widest">Número de Serie</th><th className="p-4 font-black tracking-widest">Ubicación Física</th><th className="p-4 font-black tracking-widest">Asignado a</th><th className="p-4 text-center font-black tracking-widest rounded-tr-xl">Estado</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {activosFiltrados.map(a => {
                                const colaborador = colaboradores.find(c => c.id === a.responsable_id);
                                return (
                                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <p className="font-black text-gray-800 text-xs">{a.nombre}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{a.categoria.replace('_', ' ')} • {a.marca || 'S/M'}</p>
                                        </td>
                                        <td className="p-4">
                                            {a.numero_serie ? <span className="text-[10px] font-black text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200">{a.numero_serie}</span> : <span className="text-[9px] font-bold text-gray-300 italic">S/N</span>}
                                        </td>
                                        <td className="p-4"><span className="text-xs font-bold text-gray-800">{a.region}</span></td>
                                        <td className="p-4">
                                            {colaborador ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-[10px] shrink-0">{colaborador.nombre.charAt(0)}</div>
                                                    <div><p className="text-[10px] font-black text-gray-700">{colaborador.nombre}</p><p className="text-[8px] font-bold text-gray-400 uppercase">{colaborador.puesto}</p></div>
                                                </div>
                                            ) : <span className="text-[9px] font-bold text-gray-400 italic flex items-center gap-1"><MdPerson/> Sin asignar</span>}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`text-[9px] font-black px-2 py-1.5 rounded-lg border uppercase tracking-widest ${a.estado === 'ACTIVO' ? 'bg-green-50 text-green-700 border-green-200' : a.estado === 'EN_REPARACION' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                {a.estado.replace('_', ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* MODAL DE ALTA DE ACTIVO FIJO */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <form onSubmit={handleGuardar} className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                            <div>
                                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><MdComputer className="text-blue-600"/> Registrar Activo Fijo</h3>
                            </div>
                            <button type="button" onClick={() => setModalAbierto(false)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm transition-colors"><MdClose className="text-xl"/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Descripción del Activo *</label>
                                    <input required type="text" value={nuevoActivo.nombre} onChange={e => setNuevoActivo({...nuevoActivo, nombre: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Marca / Fabricante</label>
                                    <input type="text" value={nuevoActivo.marca} onChange={e => setNuevoActivo({...nuevoActivo, marca: e.target.value})} placeholder="Ej. Dell, Truper, HP..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1 flex items-center gap-1"><MdQrCode className="text-gray-400"/> Número de Serie</label>
                                    <input type="text" value={nuevoActivo.numero_serie} onChange={e => setNuevoActivo({...nuevoActivo, numero_serie: e.target.value})} placeholder="S/N..." className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono font-bold text-gray-600 outline-none focus:border-blue-500 shadow-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Categoría *</label>
                                    <select required value={nuevoActivo.categoria} onChange={e => setNuevoActivo({...nuevoActivo, categoria: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500">
                                        {CATEGORIAS_ACTIVOS.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Ubicación Física *</label>
                                    <select required disabled={!esAdminGeneral} value={nuevoActivo.region} onChange={e => setNuevoActivo({...nuevoActivo, region: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 disabled:bg-gray-200 disabled:text-gray-500">
                                        {UBICACIONES_FISICAS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-blue-600 uppercase mb-2 ml-1 flex items-center gap-1"><MdPerson/> Asignar a Responsable (Colaborador)</label>
                                    <select value={nuevoActivo.responsable_id} onChange={e => setNuevoActivo({...nuevoActivo, responsable_id: e.target.value})} className="w-full bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm font-black text-blue-900 outline-none focus:border-blue-500 shadow-sm">
                                        <option value="">-- Sin Asignar (Se queda en almacén) --</option>
                                        {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.puesto})</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2 border-t border-gray-100 pt-5 mt-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Estado de Operación *</label>
                                            <select required value={nuevoActivo.estado} onChange={e => setNuevoActivo({...nuevoActivo, estado: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500">
                                                {ESTADOS_ACTIVOS.map(e => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1 flex items-center gap-1"><MdStickyNote2 className="text-gray-400"/> Notas</label>
                                            <input type="text" value={nuevoActivo.notas} onChange={e => setNuevoActivo({...nuevoActivo, notas: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
                            <button type="button" onClick={() => setModalAbierto(false)} disabled={isSubmitting} className="flex-1 bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 font-black py-4 rounded-xl transition-all shadow-sm active:scale-95">Cancelar</button>
                            <button type="submit" disabled={isSubmitting} className="flex-1 bg-gray-900 hover:bg-black text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-gray-900/20 active:scale-95 flex justify-center items-center gap-2">Registrar Activo</button>
                        </div>
                    </form>
                </div>
            )}
            
            <ModalHistorialGlobal isOpen={modalHistorial} onClose={() => setModalHistorial(false)} useData={useData} usuarioActivo={usuarioActivo} colaboradores={colaboradores} contextoInicial="ACTIVOS" />
        </div>
    );
}