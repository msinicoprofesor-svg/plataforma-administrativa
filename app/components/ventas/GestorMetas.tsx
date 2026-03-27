/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/ventas/GestorMetas.tsx                             */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useMemo } from 'react';
import { MdFlag, MdDateRange, MdSave, MdMap, MdPeople, MdVerified } from "react-icons/md";

// CONFIGURACIÓN EXACTA DE TU EMPRESA
const REGIONES_INTERNET = ['Centro', 'Comonfort', 'Tlalpujahua', 'Gandhó', 'San Diego de la Unión', 'Amealco', 'Xichú', 'Jalpan de Serra', 'Santa María del Río'];
const CANALES_VENTA = ['CAMBACEO', 'DIGITAL', 'ATENCION_CLIENTE', 'TECNICOS', 'ADMINISTRADORA'];
const MARCAS_ESPECIALES = ['RK', 'WifiCel'];

export default function GestorMetas({ ventas = [], metas = [], actualizarMeta, colaboradores = [] }) {
    const mesActual = new Date().toISOString().substring(0, 7);
    const [mesSeleccionado, setMesSeleccionado] = useState(mesActual);
    const [metasEditando, setMetasEditando] = useState({});
    const [guardando, setGuardando] = useState(false);

    // FUNCIÓN: DESCUBRE EL CANAL DEL VENDEDOR
    const obtenerCanalVendedor = (vendedorId) => {
        const colab = colaboradores.find(c => c.id === vendedorId);
        if (!colab) return 'OTROS';
        const rol = (colab.rol || colab.puesto || '').toUpperCase();
        if (rol.includes('VENDEDOR') || rol.includes('CAMBACEO') || rol.includes('ASESOR')) return 'CAMBACEO';
        if (rol.includes('COMMUNITY') || rol.includes('CREADOR') || rol.includes('MARKETING') || rol.includes('MKT')) return 'DIGITAL';
        if (rol.includes('ATENCION') || rol.includes('RECEPCION') || rol.includes('CALL')) return 'ATENCION_CLIENTE';
        if (rol.includes('TECNICO') || rol.includes('SOPORTE')) return 'TECNICOS';
        if (rol.includes('ADMINISTRADOR') || rol.includes('GERENTE')) return 'ADMINISTRADORA';
        return 'OTROS';
    };

    // FUNCIÓN: VALIDA SI EL VENDEDOR ES ADMINISTRADOR (Para RK y WifiCel)
    const esAdministradorDeMarca = (vendedorId) => {
        const colab = colaboradores.find(c => c.id === vendedorId);
        if (!colab) return false;
        const rol = (colab.rol || colab.puesto || '').toUpperCase();
        return rol.includes('ADMINISTRADOR') || rol.includes('GERENTE');
    };

    // CÁLCULOS PESADOS Y SEGUROS
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

    const handleCambioMeta = (idMeta, valor) => setMetasEditando(prev => ({ ...prev, [idMeta]: parseInt(valor) || 0 }));

    const guardarCambios = async () => {
        setGuardando(true);
        const promesas = Object.entries(metasEditando).map(([idMeta, valor]) => {
            const partes = idMeta.split('-');
            const mes = `${partes[0]}-${partes[1]}`;
            const canal = partes.slice(2).join('-');
            return actualizarMeta(mes, canal, valor);
        });
        await Promise.all(promesas);
        setMetasEditando({}); 
        setGuardando(false);
    };

    const RenderFilaMeta = ({ dato, index }) => (
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 relative overflow-hidden group flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="absolute bottom-0 left-0 h-1 bg-gray-200 w-full"><div className={`h-full transition-all duration-1000 ${dato.porcentaje >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${dato.porcentaje}%` }}></div></div>
            <div className="flex-1 flex items-center gap-3 z-10">
                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-black text-gray-400 shadow-sm">{index + 1}</div>
                <div><h5 className="font-black text-gray-800">{dato.nombre}</h5><p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Avance: {dato.porcentaje}%</p></div>
            </div>
            <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-gray-200 w-full sm:w-auto shadow-sm z-10">
                <div className="text-center"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Real</p><p className="text-lg font-black text-blue-600 leading-none">{dato.ventasReales}</p></div>
                <div className="text-2xl text-gray-300 font-light">/</div>
                <div className="text-center"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Meta</p><input type="number" min="0" value={dato.meta === 0 ? '' : dato.meta} onChange={(e) => handleCambioMeta(dato.idMeta, e.target.value)} placeholder="0" className="w-14 text-center text-lg font-black text-gray-800 bg-gray-100 border border-gray-200 rounded outline-none focus:border-blue-400 focus:bg-white leading-none py-0.5"/></div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full animate-fade-in relative w-full">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 z-10 mb-6">
                <div>
                    <h3 className="text-xl font-black text-gray-800 flex items-center gap-2"><MdFlag className="text-red-500"/> Tablero de Metas</h3>
                    <p className="text-xs font-bold text-gray-400 mt-1">Establece objetivos mensuales y mide el ranking en tiempo real.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-200">
                        <MdDateRange className="text-gray-400 text-lg"/>
                        <input type="month" value={mesSeleccionado} onChange={(e) => { setMesSeleccionado(e.target.value); setMetasEditando({}); }} className="bg-transparent text-sm font-black text-gray-700 outline-none cursor-pointer"/>
                    </div>
                    {Object.keys(metasEditando).length > 0 && (
                        <button onClick={guardarCambios} disabled={guardando} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-black text-xs shadow-md transition-all flex items-center gap-2">
                            {guardando ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <MdSave className="text-lg"/>} Guardar
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6 pb-10">
                {/* 1. SECCIÓN REGIONES */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2"><MdMap className="text-blue-500"/> Ranking por Regiones</h4>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {kpisRegiones.sort((a,b) => b.porcentaje - a.porcentaje).map((dato, i) => <RenderFilaMeta key={dato.nombre} dato={dato} index={i} />)}
                    </div>
                </div>

                {/* 2. SECCIÓN CANALES */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2"><MdPeople className="text-green-500"/> Rendimiento por Canal</h4>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {kpisCanales.sort((a,b) => b.porcentaje - a.porcentaje).map((dato, i) => <RenderFilaMeta key={dato.nombre} dato={dato} index={i} />)}
                    </div>
                </div>

                {/* 3. SECCIÓN MARCAS EXCLUSIVAS */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-1 flex items-center gap-2"><MdVerified className="text-purple-500"/> Marcas Exclusivas</h4>
                    <p className="text-[10px] font-bold text-gray-400 mb-4">*Solo se contabilizan ventas cerradas por el Administrador de la marca.</p>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {kpisMarcas.sort((a,b) => b.porcentaje - a.porcentaje).map((dato, i) => <RenderFilaMeta key={dato.nombre} dato={dato} index={i} />)}
                    </div>
                </div>
            </div>
        </div>
    );
}