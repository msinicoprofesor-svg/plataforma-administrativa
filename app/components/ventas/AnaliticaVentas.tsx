/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/ventas/AnaliticaVentas.tsx                         */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useMemo } from 'react';
import { 
    MdFilterList, MdTrendingUp, MdShowChart, MdTableChart, 
    MdStore, MdSignalCellularAlt, MdDateRange, MdRouter, MdPeople,
    MdClose, MdPerson, MdAssignment, MdAttachMoney
} from "react-icons/md";

export default function AnaliticaVentas({ ventas = [], colaboradores = [], comisiones = [] }) {
    const [vista, setVista] = useState('TABLA'); 
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null); // ESTADO PARA EL MODAL DE DETALLES
    
    // FILTROS
    const [filtroMes, setFiltroMes] = useState('TODOS');
    const [filtroRegion, setFiltroRegion] = useState('TODAS');
    const [filtroMarca, setFiltroMarca] = useState('TODAS');
    const [filtroCanal, setFiltroCanal] = useState('TODOS');

    // MOTOR ESTRICTO DE DESCUBRIMIENTO DE CANAL BASADO EN PUESTO
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

    // CALCULADORA DE COMISIONES EN TIEMPO REAL
    const calcularComision = (venta) => {
        let totalComision = 0;
        const canal = obtenerCanalVendedor(venta.vendedor?.id);
        const s = venta.servicio || {};
        const precioBase = (Number(s.costoInstalacion) || 0) + (Number(s.precioEquipo) || 0);

        const reglasAplicadas = [];

        comisiones.forEach(regla => {
            let aplica = false;
            if (regla.categoria === 'TIPO_VENTA' && regla.criterio === s.tipoVenta) aplica = true;
            if (regla.categoria === 'CANAL' && regla.criterio === canal) aplica = true;
            if (regla.categoria === 'REGION' && regla.criterio === s.region) aplica = true;
            if (regla.categoria === 'MARCA' && regla.criterio === s.marca) aplica = true;

            if (aplica) {
                let monto = 0;
                if (regla.tipoPago === 'MONTO_FIJO') {
                    monto = Number(regla.valor);
                } else if (regla.tipoPago === 'PORCENTAJE') {
                    monto = precioBase * (Number(regla.valor) / 100);
                }
                totalComision += monto;
                reglasAplicadas.push({ nombre: `${regla.categoria.replace('_', ' ')}: ${regla.criterio.replace('_', ' ')}`, monto });
            }
        });

        return { total: totalComision, desglose: reglasAplicadas };
    };

    const mesesDisponibles = useMemo(() => {
        const meses = ventas.map(v => v.fechaRegistro?.substring(0, 7)).filter(Boolean);
        return [...new Set(meses)].sort().reverse(); 
    }, [ventas]);
    
    const regionesDisponibles = useMemo(() => [...new Set(ventas.map(v => v.servicio?.region).filter(Boolean))], [ventas]);
    const marcasDisponibles = useMemo(() => [...new Set(ventas.map(v => v.servicio?.marca).filter(Boolean))], [ventas]);

    const ventasFiltradas = useMemo(() => {
        return ventas.filter(v => {
            const s = v.servicio || {};
            const mesVenta = v.fechaRegistro?.substring(0, 7);
            const canalVenta = obtenerCanalVendedor(v.vendedor?.id);
            
            const pasaMes = filtroMes === 'TODOS' || mesVenta === filtroMes;
            const pasaRegion = filtroRegion === 'TODAS' || s.region === filtroRegion;
            const pasaMarca = filtroMarca === 'TODAS' || s.marca === filtroMarca;
            const pasaCanal = filtroCanal === 'TODOS' || canalVenta === filtroCanal;
            
            return pasaMes && pasaRegion && pasaMarca && pasaCanal;
        });
    }, [ventas, filtroMes, filtroRegion, filtroMarca, filtroCanal, colaboradores]);

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

    const formatoMoneda = (num) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
    const formatoMes = (isoMes) => {
        if (!isoMes) return '';
        const [year, month] = isoMes.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).toUpperCase();
    };

    return (
        <div className="flex flex-col h-full space-y-6 animate-fade-in pb-8 relative w-full">
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
                        <MdPeople className="text-gray-400 text-lg"/>
                        <select value={filtroCanal} onChange={e => setFiltroCanal(e.target.value)} className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer uppercase">
                            <option value="TODOS">Todos los Canales</option>
                            <option value="CAMBACEO">Cambaceo</option>
                            <option value="DIGITAL">Ventas Digitales</option>
                            <option value="ATENCION_CLIENTE">Atención al Cliente</option>
                            <option value="TECNICOS">Técnicos</option>
                            <option value="ADMINISTRADORA">Administradora</option>
                            <option value="OTROS">Otros Colaboradores</option>
                        </select>
                    </div>
                </div>

                <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200/50 w-full xl:w-auto shrink-0">
                    <button onClick={() => setVista('TABLA')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${vista === 'TABLA' ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' : 'text-gray-400 hover:text-gray-600'}`}>
                        <MdTableChart className="text-lg" /> Filtro General
                    </button>
                    <button onClick={() => setVista('COMPARATIVA')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${vista === 'COMPARATIVA' ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' : 'text-gray-400 hover:text-gray-600'}`}>
                        <MdShowChart className="text-lg" /> Comparativa
                    </button>
                </div>
            </div>

            {vista === 'TABLA' ? (
                <div className="flex flex-col flex-1 min-h-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Volumen Total</p>
                            <h3 className="text-3xl font-black text-gray-800">{kpis.totalVentas} <span className="text-sm font-bold text-gray-400">Ventas</span></h3>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-3xl border border-green-100 shadow-sm">
                            <p className="text-[10px] font-black text-green-600/60 uppercase tracking-widest mb-1">Ingreso Único (Inst.)</p>
                            <h3 className="text-3xl font-black text-green-700">{formatoMoneda(kpis.ingresoUnico)}</h3>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 p-5 rounded-3xl border border-purple-100 shadow-sm lg:col-span-2">
                            <p className="text-[10px] font-black text-purple-600/60 uppercase tracking-widest mb-1">Ingreso Recurrente Añadido (Mensualidades)</p>
                            <h3 className="text-3xl font-black text-purple-700">{formatoMoneda(kpis.ingresoRecurrente)} <span className="text-sm font-bold text-purple-400">/ mes</span></h3>
                        </div>
                    </div>

                    <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col relative z-0">
                        <div className="overflow-y-auto custom-scrollbar flex-1">
                            {ventasFiltradas.length === 0 ? (
                                <div className="text-center py-20 text-gray-400 font-bold">No hay ventas con estos filtros.</div>
                            ) : (
                                <table className="w-full text-left border-collapse min-w-[900px]">
                                    <thead className="bg-gray-50/80 sticky top-0 backdrop-blur-sm z-10 border-b border-gray-100">
                                        <tr>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente / Fecha</th>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Servicio</th>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ubicación / Canal</th>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estado</th>
                                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {ventasFiltradas.map(v => (
                                            <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="p-4">
                                                    <p className="text-xs font-black text-gray-800">{v.cliente?.nombre}</p>
                                                    <p className="text-[10px] font-bold text-gray-400">{new Date(v.fechaRegistro).toLocaleDateString('es-MX', {day: '2-digit', month: 'short', year: 'numeric'})}</p>
                                                    <p className="text-[9px] font-black text-blue-600 mt-1 uppercase">Vendedor: {v.vendedor?.nombre?.split(' ')[0]}</p>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 shrink-0"><MdRouter/></div>
                                                        <div>
                                                            <p className="text-xs font-black text-gray-700 uppercase">{v.servicio?.marca}</p>
                                                            <p className="text-[9px] font-bold text-purple-600 bg-purple-50 inline-block px-1.5 rounded mt-0.5">{v.servicio?.tipoVenta === 'CAMBIO' ? 'CAMBIO PROVEEDOR' : 'NUEVA INSTALACIÓN'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <p className="text-xs font-bold text-gray-700">{v.servicio?.comunidad}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{v.servicio?.region}</p>
                                                    <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-black rounded uppercase">{obtenerCanalVendedor(v.vendedor?.id).replace('_', ' ')}</span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${v.estatus === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-700' : v.estatus === 'FINALIZADA' ? 'bg-green-100 text-green-700' : v.estatus === 'CANCELADA' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {v.estatus.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button onClick={() => setVentaSeleccionada(v)} className="px-3 py-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                                        Ver Detalles
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 overflow-y-auto custom-scrollbar">
                    <div className="mb-6"><h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><MdShowChart className="text-blue-500"/> Crecimiento Mensual</h3></div>
                    <div className="space-y-4">
                        {comparativaMensual.map((data) => {
                            const maxVentas = Math.max(...comparativaMensual.map(m => m.cantidad));
                            const porcentaje = maxVentas > 0 ? (data.cantidad / maxVentas) * 100 : 0;
                            return (
                                <div key={data.mes} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col md:flex-row items-center gap-6">
                                    <div className="w-full md:w-48 shrink-0"><p className="text-sm font-black text-gray-800">{formatoMes(data.mes)}</p></div>
                                    <div className="flex-1 w-full relative pt-2">
                                        <div className="flex justify-between text-xs font-black mb-2"><span className="text-blue-700">{data.cantidad} Ventas</span><span className="text-green-700">{formatoMoneda(data.ingresos)}</span></div>
                                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden"><div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: `${porcentaje}%` }}></div></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* MODAL DE DETALLES Y COMISIÓN */}
            {ventaSeleccionada && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-scale-in flex flex-col overflow-hidden max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-xl font-extrabold text-gray-800">Detalles de Venta</h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{ventaSeleccionada.id}</p>
                            </div>
                            <button onClick={() => setVentaSeleccionada(null)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm transition-all"><MdClose className="text-xl"/></button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                            {/* INFO CLIENTE */}
                            <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Datos del Cliente</h4>
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <p className="text-sm font-black text-gray-800 mb-1">{ventaSeleccionada.cliente?.nombre}</p>
                                    <p className="text-xs font-bold text-gray-500">{ventaSeleccionada.cliente?.telefono1} {ventaSeleccionada.cliente?.telefono2 ? `/ ${ventaSeleccionada.cliente?.telefono2}` : ''}</p>
                                    <p className="text-[10px] font-bold text-gray-400 mt-2"><MdStore className="inline text-gray-400"/> {ventaSeleccionada.cliente?.direccion}, {ventaSeleccionada.cliente?.comunidad}</p>
                                </div>
                            </div>

                            {/* INFO SERVICIO */}
                            <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Servicio Contratado</h4>
                                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-black text-gray-800 uppercase">{ventaSeleccionada.servicio?.marca} ({ventaSeleccionada.servicio?.tecnologia})</p>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">{ventaSeleccionada.servicio?.tipoVenta === 'CAMBIO' ? 'CAMBIO PROVEEDOR' : 'INSTALACIÓN NUEVA'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-green-700">Inst: {formatoMoneda((Number(ventaSeleccionada.servicio?.costoInstalacion) || 0) + (Number(ventaSeleccionada.servicio?.precioEquipo) || 0))}</p>
                                        <p className="text-[10px] font-bold text-gray-500 mt-1">Mensual: {formatoMoneda(ventaSeleccionada.servicio?.mensualidad)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* INFO VENDEDOR */}
                            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400"><MdPerson className="text-xl"/></div>
                                <div>
                                    <p className="text-xs font-black text-gray-800">{ventaSeleccionada.vendedor?.nombre}</p>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">Canal: {obtenerCanalVendedor(ventaSeleccionada.vendedor?.id).replace('_', ' ')}</p>
                                </div>
                            </div>

                            {/* CÁLCULO DE COMISIÓN (MAGIA PURA) */}
                            {(() => {
                                const comision = calcularComision(ventaSeleccionada);
                                return (
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border border-green-200 shadow-sm">
                                        <h4 className="text-sm font-black text-green-800 uppercase tracking-widest mb-4 flex items-center gap-2"><MdAttachMoney className="text-lg"/> Comisión Calculada</h4>
                                        
                                        {comision.desglose.length === 0 ? (
                                            <p className="text-xs font-bold text-green-600/70 italic text-center py-2">No hay reglas de comisión que apliquen a esta venta.</p>
                                        ) : (
                                            comision.desglose.map((r, i) => (
                                                <div key={i} className="flex justify-between items-center text-xs font-bold text-green-700 mb-2 bg-white/50 px-3 py-2 rounded-lg">
                                                    <span>{r.nombre}</span>
                                                    <span className="font-black">+{formatoMoneda(r.monto)}</span>
                                                </div>
                                            ))
                                        )}

                                        <div className="border-t border-green-200 mt-4 pt-4 flex justify-between items-center">
                                            <span className="text-xs font-black text-green-800">TOTAL A PAGAR</span>
                                            <span className="text-2xl font-black text-green-600">{formatoMoneda(comision.total)}</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}