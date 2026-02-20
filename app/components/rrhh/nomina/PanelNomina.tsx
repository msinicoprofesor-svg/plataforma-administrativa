/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/rrhh/nomina/PanelNomina.tsx (MIGRADO A SUPABASE)   */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect, useMemo } from 'react';
import { 
    MdHistory, MdCheckCircle, MdKeyboardArrowLeft, MdKeyboardArrowRight, 
    MdPrint, MdDelete, MdDescription, MdEmail, MdSmartphone, MdCheckBox, 
    MdCheckBoxOutlineBlank, MdFilterList, MdDoneAll, MdSave, MdDomain, MdPlace
} from "react-icons/md";
import { useColaboradores } from '../../../hooks/useColaboradores';
import { useNomina } from '../../../hooks/useNomina'; // <-- NUEVO CEREBRO DE NÓMINA

import Paso1_Resumen from './steps/Paso1_Resumen';
import Paso2_Asistencia from './steps/Paso2_Asistencia';
import Paso3_Comedor from './steps/Paso3_Comedor';
import Paso4_Cierre from './steps/Paso4_Cierre';
import ImpresionRecibos from './ImpresionRecibos';

const formatoMoneda = (cantidad) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(cantidad || 0);

const getPeriodoQuincenal = () => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = hoy.getMonth(); 
    const day = hoy.getDate();
    const formatDate = (d) => d.toISOString().split('T')[0];

    if (day <= 15) {
        return { inicio: formatDate(new Date(year, month, 1)), fin: formatDate(new Date(year, month, 15)) };
    } else {
        return { inicio: formatDate(new Date(year, month, 16)), fin: formatDate(new Date(year, month + 1, 0)) };
    }
};

export default function PanelNomina({ usuario }) {
    const { colaboradoresReales } = useColaboradores();
    
    // --- HOOK DE SUPABASE ---
    const { historialNominas, variables, actualizarVariables, cerrarNominaBD, borrarHistorialBD } = useNomina();
    
    const [vistaActual, setVistaActual] = useState('ACTUAL'); 
    const [pasoActual, setPasoActual] = useState(1);
    const [nominaRecienCerrada, setNominaRecienCerrada] = useState(null); 
    
    // --- ESTADOS PARA DISTRIBUCIÓN ---
    const [seleccionadosFisicos, setSeleccionadosFisicos] = useState({}); 
    const [filtroDistribucion, setFiltroDistribucion] = useState({ marca: '', region: '' });

    const [periodoInicio, setPeriodoInicio] = useState('');
    const [periodoFin, setPeriodoFin] = useState('');
    const [filtros, setFiltros] = useState({ busqueda: '', marca: 'Todas', region: 'Todas' });

    useEffect(() => {
        const { inicio, fin } = getPeriodoQuincenal();
        setPeriodoInicio(inicio);
        setPeriodoFin(fin);
    }, []);

    // --- ADAPTADOR PARA COMPONENTES HIJOS ---
    // Permite que los pasos sigan usando setVariables(prev => ...) sin romperse
    const setVariablesWrapper = (accion) => {
        if (typeof accion === 'function') {
            actualizarVariables(accion(variables));
        } else {
            actualizarVariables(accion);
        }
    };

    const nominaCalculada = useMemo(() => {
        if (!colaboradoresReales) return [];

        return colaboradoresReales.map(col => {
            const misVars = variables[col.id] || { retardos: 0, vacaciones: 0, comedor: 0 };

            const sueldo = parseFloat(col.sueldoBase) || 0;
            const sueldoDiario = sueldo / 15; 
            const bonosFijos = (parseFloat(col.bonoEspecial)||0) + (parseFloat(col.premioPuntualidad)||0) + (parseFloat(col.premioAsistencia)||0);
            
            const diasVacaciones = parseFloat(misVars.vacaciones) || 0;
            const montoPrimaVacacional = diasVacaciones > 0 ? (sueldoDiario * diasVacaciones * 0.25) : 0;
            
            const totalPercepciones = sueldo + bonosFijos + montoPrimaVacacional;

            const descAlianza = typeof col.prestamoAlianza === 'object' ? (parseFloat(col.prestamoAlianza?.descuento)||0) : (parseFloat(col.prestamoAlianza)||0);
            const descInterno = typeof col.prestamoEmpresa === 'object' ? (parseFloat(col.prestamoEmpresa?.descuento)||0) : (parseFloat(col.prestamoEmpresa)||0);
            const cajaAhorro = parseFloat(col.cajaAhorro) || 0;
            const infonavit = parseFloat(col.creditoInfonavit) || 0;
            const montoRetardos = (misVars.retardos || 0) * 30; 
            const descComedor = parseFloat(misVars.comedor) || 0;
            const totalDeducciones = descAlianza + descInterno + cajaAhorro + infonavit + montoRetardos + descComedor;

            const neto = totalPercepciones - totalDeducciones;

            return {
                ...col, 
                sueldo, bonosFijos,
                descAlianza, descInterno, cajaAhorro, infonavit,
                retardos: misVars.retardos || 0,
                montoRetardos, diasVacaciones, montoPrimaVacacional, descComedor,
                totalPercepciones, totalDeducciones, neto,
                resumenVacaciones: misVars.resumenVacaciones,
                desgloseVacaciones: misVars.desgloseVacaciones,
                alertaRetardos: (misVars.retardos || 0) > 3
            };
        });
    }, [colaboradoresReales, variables]);

    const datosFiltrados = useMemo(() => {
        return nominaCalculada.filter(item => {
            const matchTexto = item.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase());
            const matchMarca = filtros.marca === 'Todas' || item.marca === filtros.marca;
            const matchRegion = filtros.region === 'Todas' || item.region === filtros.region;
            return matchTexto && matchMarca && matchRegion;
        });
    }, [nominaCalculada, filtros]);

    const totalNomina = useMemo(() => datosFiltrados.reduce((acc, curr) => acc + curr.neto, 0), [datosFiltrados]);

    const updateVariable = (id, field, value) => {
        const nuevasVars = { ...variables, [id]: { ...variables[id], [field]: parseFloat(value) || 0 } };
        actualizarVariables(nuevasVars);
    };

    const cerrarNomina = async () => {
        if(!confirm("¿Confirmas cerrar y timbrar esta nómina? La operación es irreversible.")) return;
        
        const nuevaNomina = {
            id: `NOM-${Date.now()}`,
            fechaCierre: new Date().toLocaleDateString('es-MX'),
            periodo: `${periodoInicio} al ${periodoFin}`,
            periodoInicio, 
            periodoFin,    
            total: totalNomina,
            empleadosCount: datosFiltrados.length,
            detalles: datosFiltrados
        };
        
        // Guardar en Supabase a través del hook
        const exito = await cerrarNominaBD(nuevaNomina);
        
        if (exito) {
            setNominaRecienCerrada(nuevaNomina);
            
            // --- CARGAR PREFERENCIAS GUARDADAS ---
            const prefsGuardadas = localStorage.getItem('preferencias_impresion_nomina');
            if (prefsGuardadas) {
                setSeleccionadosFisicos(JSON.parse(prefsGuardadas));
            } else {
                setSeleccionadosFisicos({}); 
            }
            
            setVistaActual('DISTRIBUCION');
        }
    };

    const finalizarDistribucion = () => {
        setVariablesWrapper({});
        setPasoActual(1);
        setNominaRecienCerrada(null);
        setVistaActual('HISTORIAL');
    };

    const borrarHistorial = (id) => {
        if(!confirm("¿Borrar registro permanentemente?")) return;
        borrarHistorialBD(id);
    };

    // --- LÓGICA DE SELECCIÓN INTELIGENTE ---
    const toggleSeleccionFisica = (id) => {
        setSeleccionadosFisicos(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleSeleccionarTodos = () => {
        if (!nominaRecienCerrada) return;
        
        const todosIds = nominaRecienCerrada.detalles.map(c => c.id);
        const estanTodos = todosIds.every(id => seleccionadosFisicos[id]);

        if (estanTodos) {
            setSeleccionadosFisicos({}); 
        } else {
            const nuevaSeleccion = {};
            todosIds.forEach(id => nuevaSeleccion[id] = true);
            setSeleccionadosFisicos(nuevaSeleccion);
        }
    };

    const seleccionarPorFiltro = (tipo, valor) => {
        if (!nominaRecienCerrada || !valor) return;
        
        const matches = nominaRecienCerrada.detalles.filter(c => c[tipo] === valor);
        const nuevaSeleccion = { ...seleccionadosFisicos };
        
        matches.forEach(c => {
            nuevaSeleccion[c.id] = true; 
        });
        
        setSeleccionadosFisicos(nuevaSeleccion);
        setFiltroDistribucion(prev => ({ ...prev, [tipo]: '' })); 
    };

    const guardarPreferencias = () => {
        localStorage.setItem('preferencias_impresion_nomina', JSON.stringify(seleccionadosFisicos));
        alert("Configuración guardada. La próxima quincena se pre-seleccionarán estos mismos colaboradores.");
    };

    // --- LISTAS ÚNICAS PARA FILTROS ---
    const marcasDisponibles = useMemo(() => {
        if (!nominaRecienCerrada) return [];
        return [...new Set(nominaRecienCerrada.detalles.map(c => c.marca))];
    }, [nominaRecienCerrada]);

    const regionesDisponibles = useMemo(() => {
        if (!nominaRecienCerrada) return [];
        return [...new Set(nominaRecienCerrada.detalles.map(c => c.region))];
    }, [nominaRecienCerrada]);


    // 1. VISTA DE DISTRIBUCIÓN
    if (vistaActual === 'DISTRIBUCION' && nominaRecienCerrada) {
        const countFisicos = Object.values(seleccionadosFisicos).filter(v => v).length;
        const countDigitales = nominaRecienCerrada.empleadosCount - countFisicos;
        
        const todosIds = nominaRecienCerrada.detalles.map(c => c.id);
        const estanTodosSeleccionados = todosIds.length > 0 && todosIds.every(id => seleccionadosFisicos[id]);

        return (
            <div className="h-full flex flex-col bg-[#F5F7FA] animate-fade-in relative min-h-0">
                <div className="bg-white px-8 py-6 border-b border-gray-200 shadow-sm flex justify-between items-center print:hidden shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                            <MdPrint className="text-blue-600"/> Centro de Impresión y Entrega
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Nómina Cerrada: <b>{nominaRecienCerrada.periodo}</b></p>
                    </div>
                    <div className="flex gap-4 text-right">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Físicos (Papel)</p>
                            <p className="text-xl font-black text-gray-800">{countFisicos}</p>
                        </div>
                        <div className="border-l pl-4 border-gray-200">
                            <p className="text-xs font-bold text-gray-400 uppercase">Digitales (App)</p>
                            <p className="text-xl font-black text-blue-600">{countDigitales}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row p-4 md:p-6 gap-6 print:hidden min-h-0">
                    <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-200 flex flex-col min-h-0">
                        <div className="p-3 border-b border-gray-100 bg-gray-50 shrink-0 rounded-t-3xl flex flex-wrap gap-2 items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button onClick={toggleSeleccionarTodos} className={`text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${estanTodosSeleccionados ? 'bg-blue-100 text-blue-700' : 'bg-white border text-gray-600 hover:bg-gray-100'}`}>
                                    {estanTodosSeleccionados ? <MdCheckBox/> : <MdCheckBoxOutlineBlank/>}
                                    {estanTodosSeleccionados ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                                </button>
                                
                                <div className="relative group">
                                    <MdDomain className="absolute left-2.5 top-2 text-gray-400"/>
                                    <select 
                                        value={filtroDistribucion.marca}
                                        onChange={(e) => seleccionarPorFiltro('marca', e.target.value)}
                                        className="pl-8 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 outline-none focus:border-blue-300 cursor-pointer"
                                    >
                                        <option value="">Marcar por Empresa...</option>
                                        {marcasDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>

                                <div className="relative group">
                                    <MdPlace className="absolute left-2.5 top-2 text-gray-400"/>
                                    <select 
                                        value={filtroDistribucion.region}
                                        onChange={(e) => seleccionarPorFiltro('region', e.target.value)}
                                        className="pl-8 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 outline-none focus:border-blue-300 cursor-pointer"
                                    >
                                        <option value="">Marcar por Región...</option>
                                        {regionesDisponibles.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            </div>

                            <button onClick={guardarPreferencias} className="text-xs font-bold text-green-600 hover:bg-green-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-1" title="Guardar esta selección para futuras nóminas">
                                <MdSave className="text-sm"/> Guardar Configuración
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                            {nominaRecienCerrada.detalles.map(col => {
                                const isSelected = seleccionadosFisicos[col.id];
                                return (
                                    <div key={col.id} 
                                        onClick={() => toggleSeleccionFisica(col.id)}
                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border mb-2 ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100 hover:border-gray-300'}`}
                                    >
                                        <div className={`text-2xl ${isSelected ? 'text-blue-600' : 'text-gray-300'}`}>
                                            {isSelected ? <MdCheckBox/> : <MdCheckBoxOutlineBlank/>}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-sm font-bold truncate ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>{col.nombre}</p>
                                            <div className="flex gap-2 text-[10px] text-gray-400 uppercase font-bold">
                                                <span>{col.marca}</span>
                                                <span>•</span>
                                                <span>{col.region}</span>
                                            </div>
                                        </div>
                                        <div className="ml-auto text-right shrink-0">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${isSelected ? 'bg-white text-blue-600 shadow-sm' : 'bg-gray-100 text-gray-400'}`}>
                                                {isSelected ? 'Imprimir' : 'Digital'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="w-full md:w-80 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 text-center shrink-0">
                            <div className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg shadow-gray-900/20">
                                <MdPrint/>
                            </div>
                            <h3 className="font-black text-gray-900">Imprimir Recibos</h3>
                            <p className="text-xs text-gray-500 mt-2 mb-6">Genera el PDF con formato de 4 recibos por hoja.</p>
                            <button 
                                onClick={() => window.print()} 
                                disabled={countFisicos === 0}
                                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${countFisicos > 0 ? 'bg-gray-900 text-white hover:bg-black shadow-lg' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                            >
                                Generar PDF ({countFisicos})
                            </button>
                        </div>

                        <div className="bg-blue-600 p-6 rounded-3xl shadow-lg shadow-blue-600/20 text-center text-white shrink-0">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 backdrop-blur-sm">
                                <MdSmartphone/>
                            </div>
                            <h3 className="font-black">Enviar Digitales</h3>
                            <p className="text-xs text-blue-100 mt-2 mb-6">Dispersar recibos a la App y Correo.</p>
                            <button 
                                onClick={() => alert(`Se han enviado ${countDigitales} recibos digitales exitosamente.`)}
                                disabled={countDigitales === 0}
                                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${countDigitales > 0 ? 'bg-white text-blue-700 hover:bg-blue-50 shadow-lg' : 'bg-blue-700 text-blue-400 cursor-not-allowed'}`}
                            >
                                Enviar ({countDigitales})
                            </button>
                        </div>

                        <button onClick={finalizarDistribucion} className="mt-4 py-4 text-gray-500 font-bold hover:text-gray-800 transition-colors bg-white rounded-2xl border border-gray-200 shadow-sm shrink-0">
                            Terminar y Salir
                        </button>
                    </div>
                </div>

                <ImpresionRecibos 
                    empleados={nominaRecienCerrada.detalles.filter(col => seleccionadosFisicos[col.id])} 
                    periodo={nominaRecienCerrada.periodo} 
                />

            </div>
        );
    }

    if (vistaActual === 'HISTORIAL') {
        return (
            <div className="h-full flex flex-col bg-[#F5F7FA] animate-fade-in">
                <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center shadow-sm">
                    <h2 className="text-xl font-black text-gray-800 flex items-center gap-2"><MdHistory/> Historial de Nóminas</h2>
                    <button onClick={() => setVistaActual('ACTUAL')} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg hover:bg-black transition-all">Volver al Asistente</button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {historialNominas.length === 0 ? <div className="text-center py-20 text-gray-400 opacity-50">No hay nóminas cerradas.</div> : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {historialNominas.map(h => (
                                <div key={h.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all relative group">
                                    <button onClick={() => borrarHistorial(h.id)} className="absolute top-3 right-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><MdDelete/></button>
                                    <div className="mb-2"><span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded">TIMBRADA</span></div>
                                    <p className="text-xs text-gray-400 font-bold uppercase">Periodo</p>
                                    <p className="font-bold text-gray-800 text-sm mb-3">{h.periodo}</p>
                                    <p className="text-2xl font-black text-gray-900">{formatoMoneda(h.total)}</p>
                                    <p className="text-xs text-gray-500 mt-1">{h.empleadosCount} empleados</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#F5F7FA] animate-fade-in">
            <div className="bg-white px-6 py-4 border-b border-gray-200 sticky top-0 z-40 shadow-sm print:hidden">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setVistaActual('HISTORIAL')} className="bg-gray-100 text-gray-500 p-2 rounded-lg hover:bg-gray-200" title="Ver Historial"><MdHistory className="text-xl"/></button>
                        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                            <span className="w-8 h-8 bg-[#DA291C] text-white rounded-lg flex items-center justify-center text-sm shadow-red-500/30 shadow-lg">{pasoActual}</span>
                            <span className="hidden md:inline">
                                {pasoActual === 1 && "Revisión General"}
                                {pasoActual === 2 && "Asistencia y Vacaciones"}
                                {pasoActual === 3 && "Comedor"}
                                {pasoActual === 4 && "Cierre y Timbrado"}
                            </span>
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                            <input type="date" value={periodoInicio} onChange={(e)=>setPeriodoInicio(e.target.value)} className="bg-transparent font-bold text-gray-500 text-[10px] outline-none w-24"/>
                            <span className="text-gray-300">-</span>
                            <input type="date" value={periodoFin} onChange={(e)=>setPeriodoFin(e.target.value)} className="bg-transparent font-bold text-gray-500 text-[10px] outline-none w-24"/>
                        </div>
                        <div className="text-right pl-4 border-l border-gray-100">
                            <p className="text-[9px] font-bold text-gray-400 uppercase">Total Estimado</p>
                            <p className="text-xl font-black text-gray-900">{formatoMoneda(totalNomina)}</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map(step => (<div key={step} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step <= pasoActual ? 'bg-[#DA291C]' : 'bg-gray-200'}`}></div>))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                {pasoActual === 1 && <Paso1_Resumen datos={datosFiltrados} filtros={filtros} setFiltros={setFiltros} />}
                {pasoActual === 2 && <Paso2_Asistencia datos={datosFiltrados} variables={variables} setVariables={setVariablesWrapper} updateVariable={updateVariable} periodoInicio={periodoInicio} periodoFin={periodoFin}/>}
                {pasoActual === 3 && <Paso3_Comedor datos={datosFiltrados} variables={variables} setVariables={setVariablesWrapper} updateVariable={updateVariable} />}
                {pasoActual === 4 && <Paso4_Cierre datos={datosFiltrados} total={totalNomina} periodo={`${periodoInicio} al ${periodoFin}`} />}
            </div>

            <div className="bg-white border-t border-gray-200 p-4 flex justify-between items-center z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] print:hidden">
                <button disabled={pasoActual === 1} onClick={() => setPasoActual(p => p - 1)} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${pasoActual === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <MdKeyboardArrowLeft className="text-lg"/> Anterior
                </button>

                {pasoActual < 4 ? (
                    <button onClick={() => setPasoActual(p => p + 1)} className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-black transition-all active:scale-95">
                        Siguiente <MdKeyboardArrowRight className="text-lg"/>
                    </button>
                ) : (
                    <div className="flex gap-3">
                        <button onClick={cerrarNomina} className="flex items-center gap-2 px-8 py-3 bg-[#DA291C] text-white rounded-xl font-bold text-sm shadow-lg hover:bg-[#b02117] transition-all active:scale-95">
                            <MdCheckCircle className="text-lg"/> Cerrar y Timbrar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}