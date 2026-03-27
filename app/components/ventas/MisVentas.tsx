/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/ventas/MisVentas.tsx                               */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useMemo } from 'react';
import { 
    MdSearch, MdAttachMoney, MdRouter, MdLocationOn 
} from "react-icons/md";

export default function MisVentas({ ventas = [], vendedorActual, comisiones = [], colaboradores = [] }) {
    // ESTADOS DE FILTROS
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('TODOS');
    const [filtroMes, setFiltroMes] = useState('TODOS');
    const [filtroRegion, setFiltroRegion] = useState('TODAS');
    const [filtroMarca, setFiltroMarca] = useState('TODAS');

    // FILTRAR SOLO LAS VENTAS DEL VENDEDOR ACTUAL
    const misVentasBase = useMemo(() => 
        ventas.filter(v => v.vendedor?.id === vendedorActual?.id),
    [ventas, vendedorActual]);

    // EXTRACCIÓN DINÁMICA DE OPCIONES (Solo lo que el vendedor ha vendido)
    const mesesDisponibles = useMemo(() => {
        const meses = misVentasBase.map(v => v.fechaRegistro?.substring(0, 7)).filter(Boolean);
        return [...new Set(meses)].sort().reverse();
    }, [misVentasBase]);

    const regionesDisponibles = useMemo(() => {
        const regiones = misVentasBase.map(v => v.servicio?.region).filter(Boolean);
        return [...new Set(regiones)].sort();
    }, [misVentasBase]);

    const marcasDisponibles = useMemo(() => {
        const marcas = misVentasBase.map(v => v.servicio?.marca).filter(Boolean);
        return [...new Set(marcas)].sort();
    }, [misVentasBase]);

    // MOTOR DE CÁLCULO DE COMISIÓN (Paga solo en FINALIZADA)
    const calcularComisionVenta = (venta) => {
        if (venta.estatus !== 'FINALIZADA') return 0; 

        let total = 0;
        const s = venta.servicio || {};
        const precioBase = (Number(s.costoInstalacion) || 0) + (Number(s.precioEquipo) || 0);
        const mensualidad = Number(s.mensualidad) || 0;

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

    // APLICAR TODOS LOS FILTROS SIMULTÁNEAMENTE
    const ventasFiltradas = useMemo(() => {
        return misVentasBase.filter(v => {
            const s = v.servicio || {};
            const coincideBusqueda = v.cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase());
            const coincideEstado = filtroEstado === 'TODOS' || v.estatus === filtroEstado;
            const coincideMes = filtroMes === 'TODOS' || v.fechaRegistro?.startsWith(filtroMes);
            const coincideRegion = filtroRegion === 'TODAS' || s.region === filtroRegion;
            const coincideMarca = filtroMarca === 'TODAS' || s.marca === filtroMarca;
            
            return coincideBusqueda && coincideEstado && coincideMes && coincideRegion && coincideMarca;
        });
    }, [misVentasBase, busqueda, filtroEstado, filtroMes, filtroRegion, filtroMarca]);

    // SUMA DE COMISIONES LOGRADAS
    const totalComisiones = useMemo(() => {
        return ventasFiltradas.reduce((acc, v) => acc + calcularComisionVenta(v), 0);
    }, [ventasFiltradas, comisiones]);

    // FORMATOS BONITOS
    const formatoMoneda = (num) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
    const formatoMesCapsula = (isoMes) => {
        if (!isoMes) return '';
        const [year, month] = isoMes.split('-');
        return new Date(year, month - 1).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }).toUpperCase().replace('.', '');
    };

    // Estilos compartidos para ocultar scrollbar en cápsulas
    const scrollbarInvisible = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* WIDGET DE RESUMEN Y COMISIONES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 shrink-0">
                <div className="md:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between overflow-hidden relative group">
                    <div className="z-10">
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Comisiones Ganadas (Instalaciones)</p>
                        <h3 className="text-4xl font-black text-green-600 mt-1">{formatoMoneda(totalComisiones)}</h3>
                        <p className="text-[10px] font-bold text-gray-400 mt-2 italic">*Solo se reflejan ventas instaladas (FINALIZADA)</p>
                    </div>
                    <MdAttachMoney className="absolute -right-4 -bottom-4 text-9xl text-green-50 group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="bg-[#DA291C] p-6 rounded-[2rem] shadow-xl shadow-red-500/20 flex flex-col justify-center text-white">
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Total Ventas</p>
                    <h3 className="text-4xl font-black">{ventasFiltradas.length}</h3>
                </div>
            </div>

            {/* SÚPER BARRA DE FILTROS EN CÁPSULAS */}
            <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 mb-6 flex flex-col gap-3 shrink-0">
                {/* 1. Búsqueda y Estados */}
                <div className={`flex items-center gap-4 overflow-x-auto pb-1 ${scrollbarInvisible}`}>
                    <div className="bg-gray-100 rounded-2xl px-4 py-2 flex items-center gap-2 text-gray-500 min-w-[200px] shrink-0">
                        <MdSearch className="text-lg" />
                        <input type="text" placeholder="Buscar cliente..." className="bg-transparent outline-none text-sm font-bold w-full" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                    </div>
                    <div className="w-px h-6 bg-gray-200 shrink-0"></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0">Estatus:</span>
                    {['TODOS', 'PENDIENTE', 'FINALIZADA', 'CANCELADA'].map(estado => (
                        <button key={estado} onClick={() => setFiltroEstado(estado)} className={`shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${filtroEstado === estado ? (estado === 'FINALIZADA' ? 'bg-green-500 text-white' : estado === 'PENDIENTE' ? 'bg-yellow-400 text-white' : estado === 'CANCELADA' ? 'bg-red-400 text-white' : 'bg-gray-800 text-white') : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-50'}`}>
                            {estado}
                        </button>
                    ))}
                </div>

                {/* 2. Meses y Categorías */}
                <div className={`flex items-center gap-4 overflow-x-auto pb-1 ${scrollbarInvisible}`}>
                    {/* Meses */}
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">Mes:</span>
                        <button onClick={() => setFiltroMes('TODOS')} className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroMes === 'TODOS' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-transparent text-gray-400 hover:bg-gray-50 border border-transparent'}`}>Histórico</button>
                        {mesesDisponibles.map(m => (
                            <button key={m} onClick={() => setFiltroMes(m)} className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroMes === m ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-transparent text-gray-400 hover:bg-gray-50 border border-transparent'}`}>{formatoMesCapsula(m)}</button>
                        ))}
                    </div>

                    <div className="w-px h-6 bg-gray-200 shrink-0"></div>

                    {/* Región */}
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">Región:</span>
                        <button onClick={() => setFiltroRegion('TODAS')} className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroRegion === 'TODAS' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-transparent text-gray-400 hover:bg-gray-50 border border-transparent'}`}>Todas</button>
                        {regionesDisponibles.map(r => (
                            <button key={r} onClick={() => setFiltroRegion(r)} className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroRegion === r ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-transparent text-gray-400 hover:bg-gray-50 border border-transparent'}`}>{r}</button>
                        ))}
                    </div>

                    <div className="w-px h-6 bg-gray-200 shrink-0"></div>

                    {/* Marca */}
                    <div className="flex items-center gap-2 shrink-0 pr-4">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">Marca:</span>
                        <button onClick={() => setFiltroMarca('TODAS')} className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroMarca === 'TODAS' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-transparent text-gray-400 hover:bg-gray-50 border border-transparent'}`}>Todas</button>
                        {marcasDisponibles.map(m => (
                            <button key={m} onClick={() => setFiltroMarca(m)} className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroMarca === m ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-transparent text-gray-400 hover:bg-gray-50 border border-transparent'}`}>{m}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* LISTADO DE VENTAS EN TARJETAS */}
            <div className={`flex-1 overflow-y-auto space-y-3 pr-2 pb-10 custom-scrollbar`}>
                {ventasFiltradas.length === 0 ? (
                    <div className="text-center py-10 bg-white/50 rounded-3xl border border-dashed border-gray-200">
                        <MdRouter className="text-4xl text-gray-200 mx-auto mb-2" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No tienes registros con estos filtros</p>
                    </div>
                ) : (
                    ventasFiltradas.map(venta => {
                        const comision = calcularComisionVenta(venta);
                        return (
                            <div key={venta.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-4 hover:shadow-md transition-all group">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl text-white shrink-0 shadow-inner ${venta.estatus === 'PENDIENTE' ? 'bg-yellow-400' : venta.estatus === 'FINALIZADA' ? 'bg-green-500' : 'bg-red-400'}`}>
                                    <MdRouter />
                                </div>
                                <div className="flex-1 text-center sm:text-left min-w-0 w-full">
                                    <h4 className="font-black text-gray-800 truncate text-lg">{venta.cliente?.nombre}</h4>
                                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-1.5">
                                        <span className="text-[9px] font-black text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded uppercase tracking-tighter"><MdLocationOn className="inline"/> {venta.servicio?.comunidad} ({venta.servicio?.region})</span>
                                        <span className="text-[9px] font-black text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded uppercase tracking-tighter">{venta.servicio?.marca}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between w-full sm:w-auto sm:gap-6 shrink-0 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                                    <div className="text-left sm:text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Comisión</p>
                                        <p className={`text-sm font-black ${comision > 0 ? 'text-green-600' : 'text-gray-400 italic'}`}>{comision > 0 ? formatoMoneda(comision) : 'En espera'}</p>
                                    </div>
                                    <div className="text-right min-w-[90px]">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${venta.estatus === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : venta.estatus === 'FINALIZADA' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
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