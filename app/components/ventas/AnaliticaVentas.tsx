/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/ventas/AnaliticaVentas.tsx                         */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useMemo } from 'react';
import { 
    MdFilterList, MdAttachMoney, MdTrendingUp, 
    MdShowChart, MdTableChart, MdStore, MdSignalCellularAlt, 
    MdDateRange, MdRouter 
} from "react-icons/md";

export default function AnaliticaVentas({ ventas = [] }) {
    const [vista, setVista] = useState('TABLA'); // 'TABLA' | 'COMPARATIVA'
    
    // FILTROS
    const [filtroMes, setFiltroMes] = useState('TODOS');
    const [filtroRegion, setFiltroRegion] = useState('TODAS');
    const [filtroMarca, setFiltroMarca] = useState('TODAS');
    const [filtroCanal, setFiltroCanal] = useState('TODOS');

    // EXTRACCIÓN DINÁMICA DE OPCIONES PARA FILTROS
    const mesesDisponibles = useMemo(() => {
        const meses = ventas.map(v => v.fechaRegistro?.substring(0, 7)).filter(Boolean);
        return [...new Set(meses)].sort().reverse(); 
    }, [ventas]);
    
    const regionesDisponibles = useMemo(() => [...new Set(ventas.map(v => v.servicio?.region).filter(Boolean))], [ventas]);
    const marcasDisponibles = useMemo(() => [...new Set(ventas.map(v => v.servicio?.marca).filter(Boolean))], [ventas]);

    // MOTOR DE FILTRADO
    const ventasFiltradas = useMemo(() => {
        return ventas.filter(v => {
            const s = v.servicio || {};
            const mesVenta = v.fechaRegistro?.substring(0, 7);
            
            const pasaMes = filtroMes === 'TODOS' || mesVenta === filtroMes;
            const pasaRegion = filtroRegion === 'TODAS' || s.region === filtroRegion;
            const pasaMarca = filtroMarca === 'TODAS' || s.marca === filtroMarca;
            const pasaCanal = filtroCanal === 'TODOS' || s.tipoVenta === filtroCanal;
            
            return pasaMes && pasaRegion && pasaMarca && pasaCanal;
        });
    }, [ventas, filtroMes, filtroRegion, filtroMarca, filtroCanal]);

    // CÁLCULO DE KPIs
    const kpis = useMemo(() => {
        let totalInstalaciones = 0;
        let totalMensualidades = 0;
        let ventasCerradas = 0;

        ventasFiltradas.forEach(v => {
            const s = v.servicio || {};
            totalInstalaciones += (Number(s.costoInstalacion) || 0) + (Number(s.precioEquipo) || 0);
            totalMensualidades += (Number(s.mensualidad) || 0);
            if (v.estatus === 'FINALIZADA') ventasCerradas++;
        });

        return {
            totalVentas: ventasFiltradas.length,
            ventasCerradas,
            tasaCierre: ventasFiltradas.length > 0 ? Math.round((ventasCerradas / ventasFiltradas.length) * 100) : 0,
            ingresoUnico: totalInstalaciones,
            ingresoRecurrente: totalMensualidades
        };
    }, [ventasFiltradas]);

    // DATA PARA LA COMPARATIVA MENSUAL
    const comparativaMensual = useMemo(() => {
        const agrupado = {};
        ventas.forEach(v => {
            const mes = v.fechaRegistro?.substring(0, 7);
            if (!mes) return;
            if (!agrupado[mes]) agrupado[mes] = { mes, cantidad: 0, ingresos: 0, canceladas: 0 };
            
            agrupado[mes].cantidad += 1;
            agrupado[mes].ingresos += (Number(v.servicio?.costoInstalacion) || 0) + (Number(v.servicio?.precioEquipo) || 0);
            if (v.estatus === 'CANCELADA') agrupado[mes].canceladas += 1;
        });
        return Object.values(agrupado).sort((a, b) => a.mes.localeCompare(b.mes));
    }, [ventas]);

    // FORMATEADORES
    const formatoMoneda = (num) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
    const formatoMes = (isoMes) => {
        if (!isoMes) return '';
        const [year, month] = isoMes.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).toUpperCase();
    };

    return (
        <div className="flex flex-col h-full space-y-6 animate-fade-in pb-8 relative">
            
            {/* BARRA DE FILTROS SUPERIOR */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col xl:flex-row justify-between gap-4 shrink-0 z-10">
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-2xl border border-gray-200">
                        <MdDateRange className="text-gray-400 text-lg"/>
                        <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)} className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer">
                            <option value="TODOS">Todos los Meses</option>
                            {mesesDisponibles.map(m => <option key={m} value={m}>{formatoMes(m)}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-2xl border border-gray-200">
                        <MdStore className="text-gray-400 text-lg"/>
                        <select value={filtroRegion} onChange={e => setFiltroRegion(e.target.value)} className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer uppercase">
                            <option value="TODAS">Todas las Regiones</option>
                            {regionesDisponibles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-2xl border border-gray-200">
                        <MdSignalCellularAlt className="text-gray-400 text-lg"/>
                        <select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)} className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer uppercase">
                            <option value="TODAS">Todas las Marcas</option>
                            {marcasDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-2xl border border-gray-200">
                        <MdFilterList className="text-gray-400 text-lg"/>
                        <select value={filtroCanal} onChange={e => setFiltroCanal(e.target.value)} className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer uppercase">
                            <option value="TODOS">Todos los Canales</option>
                            <option value="NUEVA">Instalación Nueva</option>
                            <option value="CAMBIO">Cambio de Compañía</option>
                        </select>
                    </div>
                </div>

                <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200/50 w-full xl:w-auto shrink-0">
                    <button onClick={() => setVista('TABLA')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${vista === 'TABLA' ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' : 'text-gray-400 hover:text-gray-600'}`}>
                        <MdTableChart className="text-lg" /> Filtro General
                    </button>
                    <button onClick={() => setVista('COMPARATIVA')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${vista === 'COMPARATIVA' ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' : 'text-gray-400 hover:text-gray-600'}`}>
                        <MdShowChart className="text-lg" /> Comparativa Meses
                    </button>
                </div>
            </div>

            {vista === 'TABLA' ? (
                <>
                    {/* TARJETAS KPI */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Volumen Total</p>
                            <h3 className="text-3xl font-black text-gray-800">{kpis.totalVentas} <span className="text-sm font-bold text-gray-400">Ventas</span></h3>
                            <p className="text-xs font-bold text-blue-500 mt-2 flex items-center gap-1"><MdTrendingUp/> {kpis.ventasCerradas} Instaladas ({kpis.tasaCierre}%)</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-3xl border border-green-100 shadow-sm">
                            <p className="text-[10px] font-black text-green-600/60 uppercase tracking-widest mb-1">Ingreso Único (Equipos/Inst.)</p>
                            <h3 className="text-3xl font-black text-green-700">{formatoMoneda(kpis.ingresoUnico)}</h3>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 p-5 rounded-3xl border border-purple-100 shadow-sm lg:col-span-2">
                            <p className="text-[10px] font-black text-purple-600/60 uppercase tracking-widest mb-1">Ingreso Recurrente Añadido (Mensualidades)</p>
                            <h3 className="text-3xl font-black text-purple-700">{formatoMoneda(kpis.ingresoRecurrente)} <span className="text-sm font-bold text-purple-400">/ mes</span></h3>
                        </div>
                    </div>

                    {/* TABLA DE VENTAS FILTRADAS */}
                    <div className="flex-1 min-h-[300px] bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col relative z-0">
                        <div className="overflow-y-auto custom-scrollbar flex-1">
                            {ventasFiltradas.length === 0 ? (
                                <div className="text-center py-20 text-gray-400 font-bold">No hay ventas registradas con estos filtros.</div>
                            ) : (
                                <table className="w-full text-left border-collapse min-w-[900px]">
                                    <thead className="bg-gray-50/80 sticky top-0 backdrop-blur-sm z-10 border-b border-gray-100">
                                        <tr>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente / Fecha</th>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Servicio</th>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ubicación</th>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Finanzas</th>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {ventasFiltradas.map(v => (
                                            <tr key={v.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="p-4">
                                                    <p className="text-xs font-black text-gray-800">{v.cliente?.nombre}</p>
                                                    <p className="text-[10px] font-bold text-gray-400">{new Date(v.fechaRegistro).toLocaleDateString('es-MX', {day: '2-digit', month: 'short', year: 'numeric'})}</p>
                                                    <p className="text-[9px] font-black text-blue-600 mt-1 uppercase">Vendedor: {v.vendedor?.nombre?.split(' ')[0]}</p>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 shrink-0"><MdRouter/></div>
                                                        <div>
                                                            <p className="text-xs font-black text-gray-700 uppercase">{v.servicio?.marca} <span className="text-gray-400 font-bold ml-1">({v.servicio?.tecnologia})</span></p>
                                                            <p className="text-[9px] font-bold text-purple-600 bg-purple-50 inline-block px-1.5 rounded mt-0.5">{v.servicio?.tipoVenta === 'CAMBIO' ? 'CAMBIO PROVEEDOR' : 'NUEVO'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <p className="text-xs font-bold text-gray-700">{v.servicio?.comunidad}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{v.servicio?.region}</p>
                                                </td>
                                                <td className="p-4">
                                                    <p className="text-xs font-black text-green-700">Inst: {formatoMoneda((Number(v.servicio?.costoInstalacion)||0) + (Number(v.servicio?.precioEquipo)||0))}</p>
                                                    {v.servicio?.tipoServicio === 'INTERNET' && <p className="text-[10px] font-bold text-gray-500 mt-0.5">Mensual: {formatoMoneda(v.servicio?.mensualidad)}</p>}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${v.estatus === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-700' : v.estatus === 'FINALIZADA' ? 'bg-green-100 text-green-700' : v.estatus === 'CANCELADA' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {v.estatus.replace('_', ' ')}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                /* VISTA DE COMPARATIVA ESTADÍSTICA (MES A MES) */
                <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 overflow-y-auto custom-scrollbar">
                    <div className="mb-6">
                        <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><MdShowChart className="text-blue-500"/> Crecimiento y Comparativa Mensual</h3>
                        <p className="text-xs font-bold text-gray-400 mt-1">Análisis de volumen de ventas e ingresos únicos por mes operativo.</p>
                    </div>

                    <div className="space-y-4">
                        {comparativaMensual.map((data, index) => {
                            // Cálculo para barra de progreso visual (Relativo al mes mayor)
                            const maxVentas = Math.max(...comparativaMensual.map(m => m.cantidad));
                            const porcentaje = maxVentas > 0 ? (data.cantidad / maxVentas) * 100 : 0;

                            return (
                                <div key={data.mes} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col md:flex-row items-center gap-6">
                                    <div className="w-full md:w-48 shrink-0">
                                        <p className="text-sm font-black text-gray-800">{formatoMes(data.mes)}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Periodo</p>
                                    </div>
                                    
                                    <div className="flex-1 w-full relative pt-2">
                                        <div className="flex justify-between text-xs font-black mb-2">
                                            <span className="text-blue-700">{data.cantidad} Ventas Brutas</span>
                                            <span className="text-green-700">{formatoMoneda(data.ingresos)}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                            <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-1000" style={{ width: `${porcentaje}%` }}></div>
                                        </div>
                                        {data.canceladas > 0 && (
                                            <p className="text-[10px] font-bold text-red-500 mt-2 flex items-center gap-1">
                                                Caída: {data.canceladas} ventas canceladas en este mes.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}