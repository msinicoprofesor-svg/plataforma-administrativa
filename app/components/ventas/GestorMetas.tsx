/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/ventas/GestorMetas.tsx                             */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useMemo } from 'react';
import { MdFlag, MdDateRange, MdTrendingUp, MdPeople, MdSave } from "react-icons/md";

const CANALES_VENTA = [
    { id: 'CAMBACEO', nombre: 'Cambaceo / Vendedores', roles: ['VENDEDOR', 'CAMBACEO', 'ASESOR'] },
    { id: 'DIGITAL', nombre: 'Ventas Digitales (CM)', roles: ['COMMUNITY_MANAGER', 'CREADOR_CONTENIDO', 'GERENTE_MKT', 'MARKETING'] },
    { id: 'ATENCION_CLIENTE', nombre: 'Atención al Cliente', roles: ['ATENCION_CLIENTE', 'RECEPCION', 'CALL_CENTER'] },
    { id: 'TECNICOS', nombre: 'Técnicos (En campo)', roles: ['TECNICO', 'SOPORTE'] },
    { id: 'ADMINISTRADORA', nombre: 'Administradora', roles: ['ADMINISTRADOR', 'GERENTE_GENERAL'] },
    { id: 'OTROS', nombre: 'Otros Colaboradores', roles: [] } // Fallback
];

export default function GestorMetas({ ventas, metas, actualizarMeta, colaboradores = [] }) {
    
    const mesActual = new Date().toISOString().substring(0, 7);
    const [mesSeleccionado, setMesSeleccionado] = useState(mesActual);
    const [metasEditando, setMetasEditando] = useState({});
    const [guardando, setGuardando] = useState(false);

    // FUNCIÓN PARA DESCUBRIR EL CANAL DE UN VENDEDOR
    const obtenerCanalVendedor = (vendedorId) => {
        const colab = colaboradores.find(c => c.id === vendedorId);
        if (!colab) return 'OTROS';
        
        const rol = (colab.rol || colab.puesto || '').toUpperCase();
        
        for (const canal of CANALES_VENTA) {
            if (canal.roles.some(r => rol.includes(r))) return canal.id;
        }
        return 'OTROS';
    };

    // CÁLCULOS: VENTAS REALES VS METAS DEL MES
    const datosCanales = useMemo(() => {
        const ventasDelMes = ventas.filter(v => v.fechaRegistro?.startsWith(mesSeleccionado) && v.estatus !== 'CANCELADA');
        
        return CANALES_VENTA.map(canal => {
            // Contar ventas reales
            const ventasReales = ventasDelMes.filter(v => obtenerCanalVendedor(v.vendedor?.id) === canal.id).length;
            
            // Buscar meta establecida
            const idMeta = `${mesSeleccionado}-${canal.id}`;
            const metaBD = metas.find(m => m.id === idMeta)?.meta || 0;
            
            // Usar meta en edición si existe, si no la de BD
            const metaFinal = metasEditando[idMeta] !== undefined ? metasEditando[idMeta] : metaBD;

            const porcentaje = metaFinal > 0 ? Math.min(100, Math.round((ventasReales / metaFinal) * 100)) : 0;

            return { ...canal, ventasReales, meta: metaFinal, porcentaje, idMeta };
        });
    }, [ventas, metas, mesSeleccionado, metasEditando, colaboradores]);

    const totalVentasMes = datosCanales.reduce((acc, curr) => acc + curr.ventasReales, 0);
    const totalMetaMes = datosCanales.reduce((acc, curr) => acc + curr.meta, 0);
    const porcentajeGlobal = totalMetaMes > 0 ? Math.round((totalVentasMes / totalMetaMes) * 100) : 0;

    const handleCambioMeta = (idMeta, valor) => {
        setMetasEditando(prev => ({ ...prev, [idMeta]: parseInt(valor) || 0 }));
    };

    const guardarCambios = async () => {
        setGuardando(true);
        const promesas = Object.entries(metasEditando).map(([idMeta, valor]) => {
            const [mes, canal] = idMeta.split('-');
            return actualizarMeta(mes, canal, valor);
        });
        await Promise.all(promesas);
        setMetasEditando({}); // Limpiar edición
        setGuardando(false);
    };

    const hayCambios = Object.keys(metasEditando).length > 0;

    return (
        <div className="flex flex-col h-full animate-fade-in relative">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 z-10 mb-6">
                <div>
                    <h3 className="text-xl font-black text-gray-800 flex items-center gap-2"><MdFlag className="text-red-500"/> Gestión de Metas (CRM)</h3>
                    <p className="text-xs font-bold text-gray-400 mt-1">Establece objetivos mensuales por canal de venta.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-200">
                        <MdDateRange className="text-gray-400 text-lg"/>
                        <input 
                            type="month" 
                            value={mesSeleccionado} 
                            onChange={(e) => { setMesSeleccionado(e.target.value); setMetasEditando({}); }}
                            className="bg-transparent text-sm font-black text-gray-700 outline-none cursor-pointer"
                        />
                    </div>
                    {hayCambios && (
                        <button onClick={guardarCambios} disabled={guardando} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-black text-xs shadow-md transition-all flex items-center gap-2">
                            {guardando ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <MdSave className="text-lg"/>}
                            Guardar Metas
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                
                {/* PANEL IZQUIERDO: RESUMEN GLOBAL */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center items-center text-center">
                    <div className="w-32 h-32 relative flex items-center justify-center mb-6">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="64" cy="64" r="56" className="stroke-current text-gray-100" strokeWidth="12" fill="transparent"/>
                            <circle cx="64" cy="64" r="56" className={`stroke-current ${porcentajeGlobal >= 100 ? 'text-green-500' : 'text-blue-500'} transition-all duration-1000 ease-out`} strokeWidth="12" fill="transparent" strokeDasharray="351.85" strokeDashoffset={351.85 - (351.85 * Math.min(porcentajeGlobal, 100)) / 100} strokeLinecap="round"/>
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-gray-800">{porcentajeGlobal}%</span>
                        </div>
                    </div>
                    <h4 className="text-lg font-black text-gray-800 mb-1">Meta Global del Mes</h4>
                    <p className="text-sm font-bold text-gray-400">Progreso consolidado de la empresa</p>
                    
                    <div className="w-full bg-gray-50 rounded-2xl p-4 mt-6 flex justify-around">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ventas Reales</p>
                            <p className="text-2xl font-black text-blue-600">{totalVentasMes}</p>
                        </div>
                        <div className="w-px bg-gray-200"></div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Meta Total</p>
                            <p className="text-2xl font-black text-gray-800">{totalMetaMes}</p>
                        </div>
                    </div>
                </div>

                {/* PANEL DERECHO: CANALES DE VENTA */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 overflow-y-auto custom-scrollbar space-y-5">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2"><MdPeople/> Desglose por Canal</h4>
                    
                    {datosCanales.map(canal => (
                        <div key={canal.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 relative overflow-hidden group">
                            <div className="absolute bottom-0 left-0 h-1 bg-gray-200 w-full">
                                <div className={`h-full transition-all duration-1000 ${canal.porcentaje >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${canal.porcentaje}%` }}></div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex-1">
                                    <h5 className="font-black text-gray-800 flex items-center gap-2">{canal.nombre}</h5>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Rendimiento: {canal.porcentaje}%</p>
                                </div>
                                
                                <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-gray-200 w-full sm:w-auto shadow-sm">
                                    <div className="text-center">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Logrado</p>
                                        <p className="text-lg font-black text-blue-600 leading-none">{canal.ventasReales}</p>
                                    </div>
                                    <div className="text-2xl text-gray-300 font-light">/</div>
                                    <div className="text-center">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Meta</p>
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={canal.meta === 0 ? '' : canal.meta} 
                                            onChange={(e) => handleCambioMeta(canal.idMeta, e.target.value)}
                                            placeholder="0"
                                            className="w-14 text-center text-lg font-black text-gray-800 bg-gray-100 border border-gray-200 rounded outline-none focus:border-blue-400 focus:bg-white leading-none py-0.5"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}