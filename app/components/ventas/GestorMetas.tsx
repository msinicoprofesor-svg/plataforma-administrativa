/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/ventas/GestorMetas.tsx                             */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useMemo } from 'react';
import { 
    MdFlag, MdDateRange, MdSave, MdMap, MdPeople, MdVerified, 
    MdAttachMoney, MdAdd, MdDelete, MdLabelOutline 
} from "react-icons/md";

const REGIONES_INTERNET = ['Centro', 'Comonfort', 'Tlalpujahua', 'Gandhó', 'San Diego de la Unión', 'Amealco', 'Xichú', 'Jalpan de Serra', 'Santa María del Río'];
const CANALES_VENTA = ['CAMBACEO', 'DIGITAL', 'ATENCION_CLIENTE', 'TECNICOS', 'ADMINISTRADORA', 'OTROS']; 
const MARCAS_ESPECIALES = ['RK', 'WifiCel'];
const MARCAS_TODAS = ['DMG NET', 'Intercheap', 'Fibrox MX', 'RK', 'WifiCel'];

export default function GestorMetas({ 
    ventas = [], metas = [], actualizarMeta = () => {}, colaboradores = [], 
    comisiones = [], guardarReglaComision = async () => {}, eliminarReglaComision = async () => {} 
}) {
    
    const [vistaInterna, setVistaInterna] = useState('METAS'); 
    const mesActual = new Date().toISOString().substring(0, 7);
    const [mesSeleccionado, setMesSeleccionado] = useState(mesActual);
    const [metasEditando, setMetasEditando] = useState({});
    const [guardando, setGuardando] = useState(false);

    // NUEVO ESTADO DEL FORMULARIO MULTI-CONDICIONAL
    const [formComision, setFormComision] = useState({ 
        beneficiarioTipo: 'CANAL', 
        beneficiarioValor: 'DIGITAL', 
        condicionMarca: 'TODAS',
        condicionTipoVenta: 'TODAS',
        tipoPago: 'MONTO_FIJO', 
        valor: '' 
    });

    // --- LÓGICA DE METAS ---
    const obtenerCanalVendedor = (vendedorId) => {
        const colab = colaboradores.find(c => c.id === vendedorId);
        if (!colab) return 'OTROS';
        const rol = (colab.rol || colab.puesto || '').toUpperCase();
        if (rol.includes('VENDEDOR') || rol.includes('CAMBACEO') || rol.includes('ASESOR')) return 'CAMBACEO';
        if (rol.includes('COMMUNITY') || rol.includes('COMMUNITY MANAGER')) return 'DIGITAL';
        if (rol.includes('ATENCION') || rol.includes('RECEPCION') || rol.includes('CALL')) return 'ATENCION_CLIENTE';
        if (rol.includes('TECNICO') || rol.includes('SOPORTE')) return 'TECNICOS';
        if (rol.includes('ADMINISTRADOR') || rol.includes('GERENTE')) return 'ADMINISTRADORA';
        return 'OTROS';
    };

    const esAdministradorDeMarca = (vendedorId) => {
        const colab = colaboradores.find(c => c.id === vendedorId);
        if (!colab) return false;
        const rol = (colab.rol || colab.puesto || '').toUpperCase();
        return rol.includes('ADMINISTRADOR') || rol.includes('GERENTE');
    };

    const { kpisRegiones, kpisCanales, kpisMarcas } = useMemo(() => {
        const ventasDelMes = ventas.filter(v => v.fechaRegistro?.startsWith(mesSeleccionado) && v.estatus !== 'CANCELADA');
        const procesarBloque = (listaKeys, tipoExtractor) => {
            return listaKeys.map(key => {
                const ventasReales = ventasDelMes.filter(tipoExtractor(key)).length;
                const idMeta = `${mesSeleccionado}-${key.replace(/\s+/g, '_')}`;
                const metaBD = metas.find(m => m.id === idMeta)?.meta || 0;
                const metaFinal = metasEditando[idMeta] !== undefined ? metasEditando[idMeta] : metaBD;
                const porcentaje = metaFinal > 0 ? Math.min(100, Math.round((ventasReales / metaFinal) * 100)) : 0;
                return { nombre: key, ventasReales, meta: metaFinal, porcentaje, idMeta };
            });
        };
        return {
            kpisRegiones: procesarBloque(REGIONES_INTERNET, (r) => (v) => v.servicio?.region === r),
            kpisCanales: procesarBloque(CANALES_VENTA, (c) => (v) => obtenerCanalVendedor(v.vendedor?.id) === c),
            kpisMarcas: procesarBloque(MARCAS_ESPECIALES, (m) => (v) => v.servicio?.marca === m && esAdministradorDeMarca(v.vendedor?.id))
        };
    }, [ventas, metas, mesSeleccionado, metasEditando, colaboradores]);

    const guardarCambiosMetas = async () => {
        setGuardando(true);
        const promesas = Object.entries(metasEditando).map(([idMeta, valor]) => {
            const partes = idMeta.split('-');
            return actualizarMeta(`${partes[0]}-${partes[1]}`, partes.slice(2).join('-'), valor);
        });
        await Promise.all(promesas);
        setMetasEditando({}); 
        setGuardando(false);
    };

    // --- LÓGICA DE COMISIONES ---
    const handleAddComision = async (e) => {
        e.preventDefault();
        setGuardando(true);
        await guardarReglaComision(formComision);
        setFormComision(prev => ({ ...prev, valor: '' })); // Limpiar solo el valor para cargar más rápido la siguiente
        setGuardando(false);
    };

    return (
        <div className="flex flex-col h-full animate-fade-in relative w-full">
            
            {/* CABECERA Y SELECTOR DE VISTA INTERNA */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0 z-10 mb-6">
                <div>
                    <h3 className="text-xl font-black text-gray-800 flex items-center gap-2"><MdFlag className="text-red-500"/> Gestión de Metas y Comisiones</h3>
                    <p className="text-xs font-bold text-gray-400 mt-1">Configura objetivos y reglas multi-condicionales para tus vendedores.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200/50 w-full sm:w-auto">
                        <button onClick={() => setVistaInterna('METAS')} className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${vistaInterna === 'METAS' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                            <MdMap className="text-lg"/> Ranking Metas
                        </button>
                        <button onClick={() => setVistaInterna('COMISIONES')} className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${vistaInterna === 'COMISIONES' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                            <MdAttachMoney className="text-lg"/> Esq. Comisiones
                        </button>
                    </div>
                </div>
            </div>

            {/* CONTENIDO DINÁMICO */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
                
                {vistaInterna === 'METAS' ? (
                    <div className="space-y-6 animate-slide-up">
                        <div className="flex justify-end mb-4">
                            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-200 shadow-sm">
                                <MdDateRange className="text-gray-400 text-lg"/>
                                <input type="month" value={mesSeleccionado} onChange={(e) => { setMesSeleccionado(e.target.value); setMetasEditando({}); }} className="bg-transparent text-sm font-black text-gray-700 outline-none cursor-pointer"/>
                            </div>
                            {Object.keys(metasEditando).length > 0 && (
                                <button onClick={guardarCambiosMetas} disabled={guardando} className="ml-3 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-black text-xs shadow-md transition-all flex items-center gap-2">
                                    {guardando ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <MdSave className="text-lg"/>} Guardar
                                </button>
                            )}
                        </div>

                        {/* TABLAS DE METAS */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
                                <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2"><MdMap className="text-blue-500"/> Regiones</h4>
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    {kpisRegiones.sort((a,b) => b.porcentaje - a.porcentaje).map((d, i) => (
                                        <div key={d.nombre} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 relative overflow-hidden group flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div className="absolute bottom-0 left-0 h-1 bg-gray-200 w-full"><div className={`h-full transition-all duration-1000 ${d.porcentaje >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${d.porcentaje}%` }}></div></div>
                                            <div className="flex-1 z-10">
                                                <h5 className="font-black text-gray-800">{d.nombre.replace('_', ' ')}</h5>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Avance: {d.porcentaje}% ({d.ventasReales} ventas)</p>
                                            </div>
                                            <input type="number" min="0" value={d.meta === 0 ? '' : d.meta} onChange={(e) => setMetasEditando(prev => ({ ...prev, [d.idMeta]: parseInt(e.target.value) || 0 }))} placeholder="Meta" className="w-16 text-center text-sm font-black text-gray-800 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-400 py-1.5 z-10 shadow-sm"/>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                                    <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2"><MdPeople className="text-green-500"/> Canales</h4>
                                    <div className="space-y-3">
                                        {kpisCanales.sort((a,b) => b.porcentaje - a.porcentaje).map((d) => (
                                            <div key={d.nombre} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <div><p className="text-xs font-black text-gray-800">{d.nombre.replace('_', ' ')}</p><p className="text-[9px] font-bold text-gray-400 uppercase">{d.ventasReales} ventas</p></div>
                                                <input type="number" min="0" value={d.meta === 0 ? '' : d.meta} onChange={(e) => setMetasEditando(prev => ({ ...prev, [d.idMeta]: parseInt(e.target.value) || 0 }))} placeholder="Meta" className="w-14 text-center text-xs font-black text-gray-800 bg-white border border-gray-200 rounded outline-none py-1"/>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                                    <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2"><MdVerified className="text-purple-500"/> Marcas Exclusivas</h4>
                                    <div className="space-y-3">
                                        {kpisMarcas.sort((a,b) => b.porcentaje - a.porcentaje).map((d) => (
                                            <div key={d.nombre} className="flex items-center justify-between bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                                                <div><p className="text-xs font-black text-gray-800">{d.nombre.replace('_', ' ')}</p><p className="text-[9px] font-bold text-gray-400 uppercase">{d.ventasReales} ventas</p></div>
                                                <input type="number" min="0" value={d.meta === 0 ? '' : d.meta} onChange={(e) => setMetasEditando(prev => ({ ...prev, [d.idMeta]: parseInt(e.target.value) || 0 }))} placeholder="Meta" className="w-14 text-center text-xs font-black text-gray-800 bg-white border border-gray-200 rounded outline-none py-1"/>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ---------------------------------------------------- */
                    /* ESQUEMA DE COMISIONES (MULTICONDICIONAL)             */
                    /* ---------------------------------------------------- */
                    <div className="space-y-6 animate-slide-up max-w-6xl mx-auto">
                        <div className="bg-green-50 rounded-[2rem] p-6 border border-green-200 shadow-sm">
                            <h4 className="text-sm font-black text-green-800 uppercase tracking-widest mb-4 flex items-center gap-2"><MdAdd/> Agregar Regla de Comisión Avanzada</h4>
                            
                            <form onSubmit={handleAddComision} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                
                                <div className="bg-white p-4 rounded-2xl border border-green-100 shadow-sm">
                                    <h5 className="text-[10px] font-black text-green-600 uppercase mb-3">1. ¿A quién le pagas?</h5>
                                    <select value={formComision.beneficiarioTipo} onChange={e => setFormComision({...formComision, beneficiarioTipo: e.target.value, beneficiarioValor: e.target.value === 'CANAL' ? CANALES_VENTA[0] : REGIONES_INTERNET[0]})} className="w-full bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 outline-none mb-2">
                                        <option value="CANAL">Por Canal de Venta</option>
                                        <option value="REGION">Por Región Operativa</option>
                                    </select>
                                    <select value={formComision.beneficiarioValor} onChange={e => setFormComision({...formComision, beneficiarioValor: e.target.value})} className="w-full bg-green-50/50 px-3 py-2 rounded-lg border border-green-200 text-xs font-bold text-green-800 outline-none">
                                        {(formComision.beneficiarioTipo === 'CANAL' ? CANALES_VENTA : REGIONES_INTERNET).map(opt => <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>)}
                                    </select>
                                </div>

                                <div className="bg-white p-4 rounded-2xl border border-green-100 shadow-sm">
                                    <h5 className="text-[10px] font-black text-green-600 uppercase mb-3">2. Condiciones de Venta</h5>
                                    <select value={formComision.condicionMarca} onChange={e => setFormComision({...formComision, condicionMarca: e.target.value})} className="w-full bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 outline-none mb-2">
                                        <option value="TODAS">Cualquier Marca</option>
                                        {MARCAS_TODAS.map(opt => <option key={opt} value={opt}>Solo {opt}</option>)}
                                    </select>
                                    <select value={formComision.condicionTipoVenta} onChange={e => setFormComision({...formComision, condicionTipoVenta: e.target.value})} className="w-full bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 outline-none">
                                        <option value="TODAS">Instalación y Cambio</option>
                                        <option value="NUEVA">Solo Instalación Nueva</option>
                                        <option value="CAMBIO">Solo Cambio de Proveedor</option>
                                    </select>
                                </div>

                                <div className="bg-white p-4 rounded-2xl border border-green-100 shadow-sm flex flex-col">
                                    <h5 className="text-[10px] font-black text-green-600 uppercase mb-3">3. ¿Cuánto le pagas?</h5>
                                    <div className="flex gap-2 mb-2">
                                        <select value={formComision.tipoPago} onChange={e => setFormComision({...formComision, tipoPago: e.target.value})} className="w-full bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 outline-none">
                                            <option value="MONTO_FIJO">Monto Fijo ($)</option>
                                            <option value="PORCENTAJE">Porcentaje (%)</option>
                                            <option value="MENSUALIDAD">Mensualidad(es)</option>
                                        </select>
                                        <input type="number" required min="0" step="0.01" value={formComision.valor} onChange={e => setFormComision({...formComision, valor: e.target.value})} placeholder="Valor" className="w-20 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-xs font-black text-gray-800 outline-none"/>
                                    </div>
                                    <button type="submit" disabled={guardando} className="mt-auto w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-black text-sm shadow-md transition-all flex items-center justify-center">
                                        {guardando ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Guardar Regla'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* LISTA DE REGLAS ACTIVAS (FORMATO HUMANO) */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                            <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2"><MdLabelOutline className="text-blue-500"/> Reglas Activas en el Sistema</h4>
                            {comisiones.length === 0 ? (
                                <p className="text-sm text-gray-400 font-bold text-center py-10">No hay reglas configuradas.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {comisiones.map(c => (
                                        <div key={c.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 relative group hover:border-green-300 hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="bg-gray-200 text-gray-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">{c.beneficiarioTipo}: {c.beneficiarioValor.replace('_', ' ')}</span>
                                                <button onClick={() => { if(window.confirm('¿Eliminar regla?')) eliminarReglaComision(c.id); }} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><MdDelete className="text-lg"/></button>
                                            </div>
                                            
                                            <p className="text-xs font-bold text-gray-600 mt-2">
                                                Si vende <span className="font-black text-gray-800">{c.condicionMarca === 'TODAS' ? 'Cualquier Marca' : c.condicionMarca}</span> 
                                                <br/>(Tipo: <span className="font-black text-gray-800">{c.condicionTipoVenta === 'TODAS' ? 'Todas' : c.condicionTipoVenta}</span>)
                                            </p>
                                            
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Recibe de comisión:</p>
                                                <span className="text-sm font-black text-green-600 bg-green-100/50 px-2 py-1 rounded">
                                                    {c.tipoPago === 'MONTO_FIJO' ? `$${c.valor} MXN` : c.tipoPago === 'PORCENTAJE' ? `${c.valor}% (Del Monto Inicial)` : `${c.valor} Mensualidad(es)`}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}