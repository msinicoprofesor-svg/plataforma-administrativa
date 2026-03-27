/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/ventas/MisVentas.tsx                               */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useMemo } from 'react';
import { 
    MdSearch, MdFilterList, MdAttachMoney, MdRouter, 
    MdCalendarToday, MdLocationOn, MdCheckCircle 
} from "react-icons/md";

export default function MisVentas({ ventas = [], vendedorActual, comisiones = [], colaboradores = [] }) {
    // FILTROS
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('TODOS');
    const [filtroMes, setFiltroMes] = useState('TODOS');

    // FILTRAR SOLO LAS VENTAS DEL VENDEDOR ACTUAL
    const misVentasBase = useMemo(() => 
        ventas.filter(v => v.vendedor?.id === vendedorActual?.id),
    [ventas, vendedorActual]);

    // EXTRACCIÓN DE MESES DISPONIBLES
    const mesesDisponibles = useMemo(() => {
        const meses = misVentasBase.map(v => v.fechaRegistro?.substring(0, 7)).filter(Boolean);
        return [...new Set(meses)].sort().reverse();
    }, [misVentasBase]);

    // MOTOR DE CÁLCULO DE COMISIÓN (REUTILIZADO)
    const calcularComisionVenta = (venta) => {
        if (venta.estatus !== 'FINALIZADA') return 0; // REGLA: Solo paga si está instalado

        let total = 0;
        const s = venta.servicio || {};
        const precioBase = (Number(s.costoInstalacion) || 0) + (Number(s.precioEquipo) || 0);
        const mensualidad = Number(s.mensualidad) || 0;

        // Determinar canal del vendedor
        const colab = colaboradores.find(c => c.id === vendedorActual?.id);
        const rol = (colab?.rol || colab?.puesto || '').toUpperCase();
        let canal = 'OTROS';
        if (rol.includes('VENDEDOR') || rol.includes('CAMBACEO')) canal = 'CAMBACEO';
        if (rol.includes('COMMUNITY MANAGER')) canal = 'DIGITAL';
        if (rol.includes('ATENCION')) canal = 'ATENCION_CLIENTE';
        if (rol.includes('TECNICO')) canal = 'TECNICOS';

        comisiones.forEach(regla => {
            let aplica = false;
            if (regla.beneficiarioTipo === 'CANAL' && regla.beneficiarioValor === canal) aplica = true;
            if (regla.beneficiarioTipo === 'REGION' && regla.beneficiarioValor === s.region) aplica = true;

            if (aplica) {
                if (regla.condicionMarca !== 'TODAS' && regla.condicionMarca !== s.marca) aplica = false;
                if (regla.condicionTipoVenta !== 'TODAS' && regla.condicionTipoVenta !== s.tipoVenta) aplica = false;
            }

            if (aplica) {
                if (regla.tipoPago === 'MONTO_FIJO') total += Number(regla.valor);
                else if (regla.tipoPago === 'PORCENTAJE') total += precioBase * (Number(regla.valor) / 100);
                else if (regla.tipoPago === 'MENSUALIDAD') total += mensualidad * Number(regla.valor);
            }
        });
        return total;
    };

    // APLICAR FILTROS DE CAPSULAS Y BÚSQUEDA
    const ventasFiltradas = useMemo(() => {
        return misVentasBase.filter(v => {
            const coincideBusqueda = v.cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase());
            const coincideEstado = filtroEstado === 'TODOS' || v.estatus === filtroEstado;
            const coincideMes = filtroMes === 'TODOS' || v.fechaRegistro?.startsWith(filtroMes);
            return coincideBusqueda && coincideEstado && coincideMes;
        });
    }, [misVentasBase, busqueda, filtroEstado, filtroMes]);

    // SUMA DE COMISIONES LOGRADAS
    const totalComisiones = useMemo(() => {
        return ventasFiltradas.reduce((acc, v) => acc + calcularComisionVenta(v), 0);
    }, [ventasFiltradas, comisiones]);

    const formatoMoneda = (num) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* WIDGET DE RESUMEN Y COMISIONES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shrink-0">
                <div className="md:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between overflow-hidden relative group">
                    <div className="z-10">
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Comisiones Ganadas (Instalaciones)</p>
                        <h3 className="text-4xl font-black text-green-600 mt-1">{formatoMoneda(totalComisiones)}</h3>
                        <p className="text-[10px] font-bold text-gray-400 mt-2 italic">*Solo ventas con estatus FINALIZADA</p>
                    </div>
                    <MdAttachMoney className="absolute -right-4 -bottom-4 text-9xl text-green-50 group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="bg-[#DA291C] p-6 rounded-[2rem] shadow-xl shadow-red-500/20 flex flex-col justify-center text-white">
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Total Ventas</p>
                    <h3 className="text-4xl font-black">{ventasFiltradas.length}</h3>
                </div>
            </div>

            {/* BARRA DE FILTROS (CÁPSULAS) */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-4 shrink-0">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="bg-gray-100 rounded-2xl px-4 py-2 flex items-center gap-2 text-gray-500 flex-1 min-w-[200px]">
                        <MdSearch /><input type="text" placeholder="Buscar cliente..." className="bg-transparent outline-none text-sm font-bold w-full" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                    </div>
                    <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 text-xs font-black text-gray-600 outline-none cursor-pointer">
                        <option value="TODOS">Todos los Meses</option>
                        {mesesDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    {['TODOS', 'PENDIENTE', 'FINALIZADA', 'CANCELADA'].map(estado => (
                        <button key={estado} onClick={() => setFiltroEstado(estado)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filtroEstado === estado ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                            {estado}
                        </button>
                    ))}
                </div>
            </div>

            {/* LISTADO DE VENTAS */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {ventasFiltradas.length === 0 ? (
                    <div className="text-center py-20 text-gray-300 font-bold uppercase tracking-widest">No hay registros con estos filtros</div>
                ) : (
                    ventasFiltradas.map(venta => {
                        const comision = calcularComisionVenta(venta);
                        return (
                            <div key={venta.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-4 hover:shadow-md transition-all group">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl text-white shrink-0 ${venta.estatus === 'PENDIENTE' ? 'bg-yellow-400' : venta.estatus === 'FINALIZADA' ? 'bg-green-500' : 'bg-red-400'}`}>
                                    <MdRouter />
                                </div>
                                <div className="flex-1 text-center sm:text-left min-w-0">
                                    <h4 className="font-black text-gray-800 truncate">{venta.cliente?.nombre}</h4>
                                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-1">
                                        <span className="text-[9px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded uppercase tracking-tighter"><MdLocationOn className="inline"/> {venta.servicio?.comunidad}</span>
                                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-tighter">{venta.servicio?.marca}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 shrink-0">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Comisión</p>
                                        <p className={`text-sm font-black ${comision > 0 ? 'text-green-600' : 'text-gray-400 italic'}`}>{comision > 0 ? formatoMoneda(comision) : 'En espera'}</p>
                                    </div>
                                    <div className="text-right min-w-[80px]">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${venta.estatus === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-700' : venta.estatus === 'FINALIZADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {venta.estatus}
                                        </span>
                                        <p className="text-[10px] font-bold text-gray-400 mt-1">{new Date(venta.fechaRegistro).toLocaleDateString('es-MX')}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}