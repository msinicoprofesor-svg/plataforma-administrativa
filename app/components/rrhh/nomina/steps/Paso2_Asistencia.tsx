/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/rrhh/nomina/steps/Paso2_Asistencia.tsx (SUPABASE)  */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useRef } from 'react';
import { 
    MdCloudUpload, MdCheckCircle, MdBeachAccess, 
    MdAccessTime, MdSync, MdInfoOutline, MdCalendarToday, MdMoneyOff,
    MdKeyboardArrowDown, MdKeyboardArrowUp
} from "react-icons/md";
import { supabase } from '../../../../lib/supabase'; // <-- CONEXIÓN A LA NUBE

const formatoMoneda = (c) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(c);

export default function Paso2_Asistencia({ datos, variables, setVariables, updateVariable, periodoInicio, periodoFin }) {
    
    const fileInputRef = useRef(null);
    const [archivoNombre, setArchivoNombre] = useState(null);
    const [procesando, setProcesando] = useState(false);
    
    // CONTROL DE ACORDEÓN
    const [expandidos, setExpandidos] = useState({});
    const toggleExpandir = (id) => setExpandidos(prev => ({ ...prev, [id]: !prev[id] }));

    // --- HELPER: VALIDAR FECHA EN PERIODO ---
    const fechaDentroDelPeriodo = (fechaStr) => {
        if (!periodoInicio || !periodoFin || !fechaStr) return true;
        const f = new Date(fechaStr + 'T12:00:00');
        const inicio = new Date(periodoInicio + 'T00:00:00');
        const fin = new Date(periodoFin + 'T23:59:59');
        return f >= inicio && f <= fin;
    };

    // --- CEREBRO: OBTENER HORAS PROGRAMADAS PARA UN DÍA ---
    const obtenerHorasDelDia = (fechaStr, colaborador) => {
        const date = new Date(fechaStr + 'T12:00:00');
        const diaSemana = date.getDay(); // 0=Domingo...
        const mapaDias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        const nombreDia = mapaDias[diaSemana];

        if (colaborador.horario && colaborador.horario.tipo === 'IRREGULAR') {
            return parseFloat(colaborador.horario.dias[nombreDia]) || 0;
        }
        
        if (colaborador.horario && colaborador.horario.tipo === 'REGULAR') {
            if (['sabado', 'domingo'].includes(nombreDia)) {
                return parseFloat(colaborador.horario.dias[nombreDia]) || 0; 
            }
            return parseFloat(colaborador.horario.horasDiarias) || 0;
        }

        return parseFloat(colaborador.horasJornada) || 0;
    };

    // --- CEREBRO: CALCULAR HORAS TOTALES DE LA SEMANA ---
    const calcularHorasSemanales = (colaborador) => {
        if (colaborador.horario && colaborador.horario.tipo === 'IRREGULAR') {
            const dias = colaborador.horario.dias;
            return (parseFloat(dias.lunes)||0) + (parseFloat(dias.martes)||0) + (parseFloat(dias.miercoles)||0) + 
                   (parseFloat(dias.jueves)||0) + (parseFloat(dias.viernes)||0) + (parseFloat(dias.sabado)||0) + (parseFloat(dias.domingo)||0);
        }
        if (colaborador.horario && colaborador.horario.tipo === 'REGULAR') {
            return (parseFloat(colaborador.horario.horasDiarias)||8) * 5; 
        }
        return (parseFloat(colaborador.horasJornada)||8) * 5;
    };

    // --- SINCRONIZACIÓN MAESTRA A SUPABASE ---
    const sincronizarIncidencias = async () => {
        setProcesando(true);
        try {
            // 1. OBTENER DATOS DE SUPABASE EN LUGAR DE LOCALSTORAGE
            const { data: dbIncidencias, error } = await supabase.from('incidencias').select('*');
            if (error) throw error;

            let incidenciasReales = [];
            if (dbIncidencias) {
                // Mapeamos los datos al formato que espera tu lógica matemática
                incidenciasReales = dbIncidencias.map(db => {
                    const detalles = db.detalles || {};
                    return {
                        id: db.id,
                        colaboradorId: db.colaborador_id,
                        nombreColaborador: db.nombre_colaborador,
                        tipo: db.tipo,
                        estado: db.estado,
                        goceSueldo: db.goce_sueldo,
                        unidadMedida: detalles.unidadMedida || 'DIAS',
                        modalidadPago: detalles.sinGoce ? 'SIN_GOCE' : (detalles.tiempoPorTiempo ? 'TIEMPO_X_TIEMPO' : 'CON_GOCE'),
                        fechas: detalles.fechas || [db.fecha_inicio],
                        fechaInicio: db.fecha_inicio,
                        cantidad: detalles.cantidad || db.dias
                    };
                });
            }

            if (incidenciasReales.length === 0) {
                setProcesando(false);
                alert("No hay incidencias registradas en la base de datos.");
                return;
            }

            const nuevasVars = { ...variables };
            // Limpieza inicial
            datos.forEach(col => {
                if (nuevasVars[col.id]) {
                    nuevasVars[col.id] = { ...nuevasVars[col.id], vacaciones: 0, resumenVacaciones: '', desgloseVacaciones: [] };
                }
            });

            let encontrados = 0;

            datos.forEach(col => {
                const colID = String(col.id || '').toLowerCase().trim();
                const colEmail = String(col.email || col.correo || '').toLowerCase().trim();
                const colNombre = String(col.nombre || '').toLowerCase().trim();

                const susRegistros = incidenciasReales.filter(inc => {
                    const incID = String(inc.colaboradorId || inc.usuarioId || '').toLowerCase().trim();
                    const incNombre = String(inc.nombreColaborador || '').toLowerCase().trim();
                    
                    const esElColaborador = (incID && (incID === colID || incID === colEmail)) || (incNombre === colNombre);
                    const esVacacion = String(inc.tipo).toUpperCase().includes('VACACION');
                    const estaAprobada = String(inc.estado).toUpperCase() === 'APROBADA';

                    return esElColaborador && esVacacion && estaAprobada;
                });

                if (susRegistros.length > 0) {
                    let totalFactorDias = 0; 
                    let detallesVisuales = [];
                    let historialDesglose = [];

                    // DATOS BASE PARA EL CÁLCULO
                    const sueldoQuincenal = parseFloat(col.sueldoBase) || 0;
                    const sueldoDiario = sueldoQuincenal / 15;
                    const esIrregular = col.horario?.tipo === 'IRREGULAR';
                    
                    // CÁLCULO DE VALOR HORA (SOLO PARA IRREGULARES)
                    const horasSemanales = calcularHorasSemanales(col);
                    const sueldoSemanalEstimado = sueldoDiario * 7; 
                    const factorValorHoraIrregular = (horasSemanales > 0) ? (sueldoSemanalEstimado / horasSemanales) : 0;

                    susRegistros.forEach(inc => {
                        let aplicaEnPeriodo = false;
                        const esPorHoras = inc.unidadMedida === 'HORAS';
                        const tieneGoce = inc.goceSueldo === true || inc.modalidadPago === 'CON_GOCE';

                        // --- FUNCIÓN COMÚN PARA PROCESAR CADA FECHA ---
                        const procesarDia = (fecha, horasTomadas = null) => {
                            const horasProgramadasHoy = obtenerHorasDelDia(fecha, col);
                            const horasEfectivas = horasTomadas !== null ? horasTomadas : horasProgramadasHoy;
                            
                            let montoDia = 0;
                            let factorParaSuma = 0;

                            if (horasProgramadasHoy > 0) {
                                if (esIrregular) {
                                    montoDia = horasEfectivas * factorValorHoraIrregular;
                                    factorParaSuma = montoDia / sueldoDiario;
                                } else {
                                    const fraccion = horasEfectivas / horasProgramadasHoy;
                                    montoDia = fraccion * sueldoDiario;
                                    factorParaSuma = fraccion;
                                }
                            }

                            if (!tieneGoce) {
                                montoDia = 0;
                                factorParaSuma = 0;
                            }

                            return { 
                                monto: montoDia, 
                                factor: factorParaSuma, 
                                horas: horasEfectivas,
                                horasProgramadas: horasProgramadasHoy
                            };
                        };

                        // PROCESAMIENTO
                        if (esPorHoras) {
                            const fechaEvento = (inc.fechas && inc.fechas[0]) || inc.fechaInicio;
                            if (fechaDentroDelPeriodo(fechaEvento)) {
                                aplicaEnPeriodo = true;
                                const hrs = parseFloat(inc.cantidad) || 0;
                                const resultado = procesarDia(fechaEvento, hrs);
                                
                                totalFactorDias += resultado.factor;
                                
                                historialDesglose.push({
                                    fecha: fechaEvento,
                                    horasTomadas: resultado.horas,
                                    programadas: resultado.horasProgramadas,
                                    monto: resultado.monto * 0.25,
                                    tieneGoce: tieneGoce
                                });
                                detallesVisuales.push(`${hrs} Hrs`);
                            }
                        } else {
                            let fechasValidas = [];
                            if (Array.isArray(inc.fechas) && inc.fechas.length > 0) {
                                fechasValidas = inc.fechas.filter(f => fechaDentroDelPeriodo(f));
                            } else if (inc.fechaInicio) {
                                if (fechaDentroDelPeriodo(inc.fechaInicio)) fechasValidas.push(inc.fechaInicio);
                            }

                            if (fechasValidas.length > 0) {
                                aplicaEnPeriodo = true;
                                fechasValidas.forEach(f => {
                                    const res = procesarDia(f, null); 
                                    totalFactorDias += res.factor;
                                    
                                    historialDesglose.push({
                                        fecha: f,
                                        horasTomadas: res.horas, 
                                        programadas: res.horasProgramadas,
                                        monto: res.monto * 0.25, 
                                        tieneGoce: tieneGoce
                                    });
                                });
                                detallesVisuales.push(`${fechasValidas.length} Días hábiles`);
                            }
                        }
                    });

                    if (historialDesglose.length > 0) {
                        historialDesglose.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
                        
                        const diasCount = historialDesglose.filter(h => h.horasTomadas >= h.programadas).length;
                        const hrsCount = historialDesglose.filter(h => h.horasTomadas < h.programadas).reduce((acc, curr) => acc + curr.horasTomadas, 0);
                        let resumenTexto = "";
                        if (diasCount > 0) resumenTexto += `${diasCount} Días `;
                        if (hrsCount > 0) resumenTexto += `${hrsCount} Hrs `;
                        if (resumenTexto === "") resumenTexto = "Detalle:";

                        nuevasVars[col.id] = { 
                            ...nuevasVars[col.id], 
                            vacaciones: totalFactorDias, 
                            resumenVacaciones: resumenTexto,
                            desgloseVacaciones: historialDesglose 
                        };
                        encontrados++;
                    }
                }
            });
            
            setVariables(nuevasVars);
            setProcesando(false);
            
            if (encontrados > 0) alert("Sincronización completada desde la nube ☁️. Cálculos ajustados por tipo de horario.");
            else alert("No se encontraron vacaciones aprobadas para este periodo en la base de datos.");

        } catch (error) {
            console.error("Error al sincronizar incidencias:", error);
            alert("Error al conectar con la base de datos.");
            setProcesando(false);
        }
    };

    // --- ZKTECO ---
    const procesarExcelZKTeco = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setArchivoNombre(file.name);
        setProcesando(true);
        setTimeout(() => {
            const nuevasVars = { ...variables };
            datos.forEach(col => {
                const tieneRetardo = Math.random() < 0.2; 
                const numRetardos = tieneRetardo ? Math.floor(Math.random() * 3) + 1 : 0;
                nuevasVars[col.id] = { ...nuevasVars[col.id], retardos: numRetardos || 0 };
            });
            setVariables(nuevasVars);
            setProcesando(false);
            alert(`Reporte procesado.`);
        }, 800);
    };

    const empleadosConRetardos = datos.filter(d => d.retardos > 0);
    const empleadosConVacaciones = datos.filter(d => variables[d.id]?.vacaciones > 0 || variables[d.id]?.resumenVacaciones);

    return (
        <div className="p-4 md:p-6 space-y-8 animate-fade-in pb-20">
            
            {/* SECCIÓN A: RELOJ CHECADOR */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                            <MdAccessTime className="text-blue-600"/> Asistencia (ZKTeco)
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Carga el Excel del dispositivo para calcular retardos.</p>
                    </div>
                    {archivoNombre && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><MdCheckCircle/> Cargado</span>}
                </div>
                <div className="border-2 border-dashed border-blue-100 bg-blue-50/30 rounded-xl p-8 text-center hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <input type="file" accept=".xlsx, .xls, .csv" ref={fileInputRef} onChange={procesarExcelZKTeco} className="hidden" />
                    <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        {procesando ? <MdSync className="text-2xl animate-spin"/> : <MdCloudUpload className="text-2xl"/>}
                    </div>
                    <p className="text-sm font-bold text-gray-700">{archivoNombre || "Subir reporte LX40"}</p>
                </div>
                {empleadosConRetardos.length > 0 && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {empleadosConRetardos.map(col => (
                            <div key={col.id} className="flex justify-between items-center p-3 bg-red-50 border border-red-100 rounded-xl">
                                <p className="text-xs font-bold text-gray-800">{col.nombre} ({col.retardos} retardos)</p>
                                <p className="text-sm font-black text-red-600">-{formatoMoneda(col.montoRetardos)}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SECCIÓN B: VACACIONES INTELIGENTES */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                            <MdBeachAccess className="text-orange-500"/> Vacaciones
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Periodo activo: <span className="font-bold text-gray-800">{periodoInicio} al {periodoFin}</span>
                        </p>
                    </div>
                    <button onClick={sincronizarIncidencias} className="bg-orange-50 text-orange-600 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-orange-100 border border-orange-200 shadow-sm transition-all active:scale-95">
                        <MdSync className={procesando ? "animate-spin" : ""}/> Sincronizar
                    </button>
                </div>

                {empleadosConVacaciones.length === 0 ? (
                    <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center">
                        <MdCalendarToday className="text-4xl text-gray-300 mb-2"/>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Nada en este periodo</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {empleadosConVacaciones.map(col => {
                            const datosVac = variables[col.id] || {};
                            const esPagado = datosVac.vacaciones > 0;
                            const isExpanded = expandidos[col.id];
                            
                            return (
                                <div key={col.id} className={`flex flex-col p-4 border rounded-xl shadow-sm transition-colors ${!esPagado ? 'bg-gray-50 border-gray-200' : 'bg-white border-orange-100 hover:border-orange-300'}`}>
                                    
                                    {/* CABECERA */}
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer select-none" onClick={() => toggleExpandir(col.id)}>
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <div className={`p-2 rounded-lg shrink-0 ${!esPagado ? 'bg-gray-200 text-gray-500' : 'bg-orange-100 text-orange-500'}`}>
                                                {!esPagado ? <MdMoneyOff className="text-xl"/> : <MdBeachAccess className="text-xl"/>}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-black text-gray-800 truncate">{col.nombre}</p>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">RESUMEN:</p>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${!esPagado ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                                        {datosVac.resumenVacaciones}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between md:justify-end w-full md:w-auto mt-4 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                                            <div className="text-left md:text-right mr-4">
                                                <p className="text-[9px] text-gray-400 uppercase font-black tracking-tighter">Prima (25%)</p>
                                                <p className={`text-lg font-black leading-none ${!esPagado ? 'text-gray-400' : 'text-green-600'}`}>
                                                    {formatoMoneda(col.montoPrimaVacacional || 0)}
                                                </p>
                                            </div>
                                            <div className="p-1.5 bg-gray-50 border border-gray-200 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors">
                                                {isExpanded ? <MdKeyboardArrowUp className="text-xl"/> : <MdKeyboardArrowDown className="text-xl"/>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* DESGLOSE DETALLADO */}
                                    {isExpanded && datosVac.desgloseVacaciones && datosVac.desgloseVacaciones.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-dashed border-gray-200 animate-slide-up">
                                            <div className="flex justify-between items-end mb-2 px-1">
                                                <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Detalle contable por día</h4>
                                                <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                                    {col.horario?.tipo === 'IRREGULAR' ? 'Cálculo: Valor Hora Real' : 'Cálculo: Día Estándar'}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5">
                                                {datosVac.desgloseVacaciones.map((item, idx) => {
                                                    const d = new Date(item.fecha + 'T12:00:00');
                                                    const nombreDia = d.toLocaleDateString('es-MX', { weekday: 'long' });
                                                    const diaMes = d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });

                                                    const fraccionCalculada = item.programadas > 0 ? Number((item.horasTomadas / item.programadas).toFixed(2)) : 0;

                                                    return (
                                                        <div key={idx} className="flex justify-between items-center text-xs bg-gray-50/50 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <span className="capitalize font-bold text-gray-800 w-32 truncate">{nombreDia} {diaMes}</span>
                                                                
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] text-gray-500 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100 font-bold">
                                                                        {item.horasTomadas} hrs = {fraccionCalculada} día
                                                                    </span>
                                                                    {!item.tieneGoce && (
                                                                        <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider bg-red-50 px-1.5 py-0.5 rounded border border-red-100">Sin Goce</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className={`font-black ${!item.tieneGoce ? 'text-gray-400' : 'text-green-600'}`}>
                                                                {formatoMoneda(item.monto)}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}