/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/rrhh/nomina/ImpresionRecibos.tsx (CSS GRID PURO)   */
/* -------------------------------------------------------------------------- */
'use client';

const formatoMoneda = (c) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(c || 0);

export default function ImpresionRecibos({ empleados, periodo }) {
    if (!empleados || empleados.length === 0) return null;

    // Agrupar de 4 en 4
    const paginas = [];
    for (let i = 0; i < empleados.length; i += 4) {
        paginas.push(empleados.slice(i, i + 4));
    }

    const fechaHoy = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

    return (
        <div className="hidden print:block bg-white text-black w-full fixed inset-0 z-[9999]" id="area-impresion-recibos">
            {/* ESTILOS DE IMPRESIÓN FORZADOS */}
            <style jsx global>{`
                @media print {
                    /* Reset total del body */
                    body, html { 
                        margin: 0; 
                        padding: 0; 
                        height: 100%; 
                        overflow: visible !important; 
                    }
                    /* Ocultar todo lo que no sea el área de impresión */
                    body > *:not(#area-impresion-recibos) {
                        display: none !important;
                    }
                    /* Mostrar área de impresión */
                    #area-impresion-recibos { 
                        display: block !important;
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%;
                    }
                    /* Configuración de Hoja Carta */
                    @page { 
                        size: letter; 
                        margin: 5mm; /* Margen mínimo de impresora */
                    }
                    
                    /* Estructura de la hoja: 4 Cuadrantes exactos */
                    .hoja-recibos {
                        width: 100%;
                        height: 100vh; /* Ocupa toda la hoja */
                        box-sizing: border-box;
                        display: grid;
                        grid-template-columns: 1fr 1fr; /* 2 Columnas */
                        grid-template-rows: 1fr 1fr;    /* 2 Filas */
                        gap: 4mm;
                        padding: 2mm;
                        page-break-after: always;
                        break-after: page;
                    }
                    
                    /* Forzar colores de fondo (para las píldoras grises) */
                    * { 
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important; 
                    }
                }
            `}</style>

            {paginas.map((grupo, pageIndex) => (
                <div key={pageIndex} className="hoja-recibos">
                    {grupo.map(emp => (
                        <ReciboIndividual key={emp.id} emp={emp} periodo={periodo} fecha={fechaHoy} />
                    ))}
                </div>
            ))}
        </div>
    );
}

function ReciboIndividual({ emp, periodo, fecha }) {
    const saldoAlianza = parseFloat(emp.prestamoAlianza?.saldo) || 0;
    const pendienteAlianza = saldoAlianza > 0 ? saldoAlianza - emp.descAlianza : 0;
    
    const saldoInterno = parseFloat(emp.prestamoEmpresa?.saldo) || 0;
    const pendienteInterno = saldoInterno > 0 ? saldoInterno - emp.descInterno : 0;

    return (
        <div className="border border-gray-400 rounded-2xl p-2 flex flex-col justify-between h-full bg-white overflow-hidden text-[7px] leading-snug">
            
            {/* 1. ENCABEZADO */}
            <div className="flex justify-between items-center mb-1 shrink-0">
                <div className="bg-gray-800 text-white px-3 py-1 rounded-full font-black uppercase tracking-widest text-[8px]">Recibo de Nómina</div>
                <div className="flex gap-1 text-[7px]">
                    <div className="bg-gray-600 text-white px-2 py-0.5 rounded-full font-bold">{periodo}</div>
                    <div className="bg-gray-600 text-white px-2 py-0.5 rounded-full font-bold">{fecha}</div>
                </div>
            </div>

            {/* 2. INFO EMPRESA Y COLABORADOR */}
            <div className="grid grid-cols-2 gap-2 mb-1 shrink-0">
                <fieldset className="border border-gray-300 rounded-xl px-2 py-1 m-0 min-w-0">
                    <legend className="px-1 text-center font-bold text-gray-500 uppercase tracking-widest text-[6px] mx-auto bg-white">Empresa</legend>
                    <div className="flex gap-2 items-center">
                        <div className="w-8 h-8 border border-gray-200 flex items-center justify-center font-bold text-gray-300 text-[6px] shrink-0 rounded">LOGO</div>
                        <div className="min-w-0">
                            <p className="font-black text-[8px] text-gray-900 truncate">{emp.marca}</p>
                            <p className="text-gray-500 truncate">XAXX010101000</p>
                            <p className="text-gray-500 truncate">rh@empresa.com</p>
                        </div>
                    </div>
                </fieldset>

                <fieldset className="border border-gray-300 rounded-xl px-2 py-1 m-0 min-w-0">
                    <legend className="px-1 text-center font-bold text-gray-500 uppercase tracking-widest text-[6px] mx-auto bg-white">Colaborador</legend>
                    <div className="grid grid-cols-2 gap-x-1">
                        <div className="min-w-0">
                            <p><span className="text-gray-400">ID:</span> <b className="text-gray-900">{emp.id}</b></p>
                            <p className="font-black text-[8px] text-gray-900 truncate">{emp.nombre}</p>
                        </div>
                        <div className="min-w-0 text-right">
                            <p className="truncate text-gray-500">{emp.puesto}</p>
                            <p className="truncate font-bold">{emp.departamento}</p>
                        </div>
                    </div>
                </fieldset>
            </div>

            {/* 3. CRÉDITOS */}
            <fieldset className="border border-gray-300 rounded-xl px-2 py-1 m-0 mb-1 shrink-0">
                <legend className="px-1 text-center font-bold text-gray-500 uppercase tracking-widest text-[6px] mx-auto bg-white">Créditos</legend>
                <table className="w-full text-center text-gray-700">
                    <thead className="text-gray-400 font-bold border-b border-gray-100 text-[6px]">
                        <tr><th className="text-left">Tipo</th><th>Total</th><th>Abono</th><th>Pendiente</th></tr>
                    </thead>
                    <tbody className="font-bold">
                        <tr>
                            <td className="text-left">Alianza</td>
                            <td>{saldoAlianza > 0 ? formatoMoneda(saldoAlianza) : '-'}</td>
                            <td className="text-red-600">{emp.descAlianza > 0 ? formatoMoneda(emp.descAlianza) : '-'}</td>
                            <td>{pendienteAlianza > 0 ? formatoMoneda(pendienteAlianza) : '-'}</td>
                        </tr>
                        <tr>
                            <td className="text-left">Empresa</td>
                            <td>{saldoInterno > 0 ? formatoMoneda(saldoInterno) : '-'}</td>
                            <td className="text-red-600">{emp.descInterno > 0 ? formatoMoneda(emp.descInterno) : '-'}</td>
                            <td>{pendienteInterno > 0 ? formatoMoneda(pendienteInterno) : '-'}</td>
                        </tr>
                    </tbody>
                </table>
            </fieldset>

            {/* 4. PERCEPCIONES Y DEDUCCIONES (EXPANDIBLES) */}
            <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
                <fieldset className="border border-gray-300 rounded-xl px-2 py-1 m-0 flex flex-col min-w-0">
                    <legend className="px-1 text-center font-bold text-gray-500 uppercase tracking-widest text-[6px] mx-auto bg-white">Percepciones</legend>
                    <div className="flex-1 space-y-0.5 overflow-hidden">
                        <div className="flex justify-between"><span className="text-gray-500">Sueldo Base</span><b className="text-gray-900">{formatoMoneda(emp.sueldo)}</b></div>
                        <div className="flex justify-between"><span className="text-gray-500">Puntualidad</span><b className="text-gray-900">{formatoMoneda(emp.premioPuntualidad)}</b></div>
                        <div className="flex justify-between"><span className="text-gray-500">Asistencia</span><b className="text-gray-900">{formatoMoneda(emp.premioAsistencia)}</b></div>
                        <div className="flex justify-between"><span className="text-gray-500">Bono Esp.</span><b className="text-gray-900">{formatoMoneda(emp.bonoEspecial)}</b></div>
                        <div className="flex justify-between"><span className="text-gray-500">Prima Vac.</span><b className="text-gray-900">{formatoMoneda(emp.montoPrimaVacacional)}</b></div>
                        {emp.montoPrimaVacacional > 0 && (
                            <div className="text-[6px] text-gray-400 leading-tight truncate border-t border-gray-100 pt-0.5 mt-0.5">{emp.resumenVacaciones}</div>
                        )}
                    </div>
                </fieldset>

                <fieldset className="border border-gray-300 rounded-xl px-2 py-1 m-0 flex flex-col min-w-0">
                    <legend className="px-1 text-center font-bold text-gray-500 uppercase tracking-widest text-[6px] mx-auto bg-white">Deducciones</legend>
                    <div className="flex-1 space-y-0.5 overflow-hidden">
                        <div className="flex justify-between"><span className="text-gray-500">Caja Ahorro</span><b className="text-gray-900">{formatoMoneda(emp.cajaAhorro)}</b></div>
                        <div className="flex justify-between"><span className="text-gray-500">Abono Alianza</span><b className="text-gray-900">{formatoMoneda(emp.descAlianza)}</b></div>
                        <div className="flex justify-between"><span className="text-gray-500">Abono Empresa</span><b className="text-gray-900">{formatoMoneda(emp.descInterno)}</b></div>
                        <div className="flex justify-between"><span className="text-gray-500">Infonavit</span><b className="text-gray-900">{formatoMoneda(emp.infonavit)}</b></div>
                        <div className="flex justify-between"><span className="text-gray-500">Faltas</span><b className="text-gray-900">{formatoMoneda(emp.montoRetardos)}</b></div>
                        <div className="flex justify-between"><span className="text-gray-500">Comedor</span><b className="text-gray-900">{formatoMoneda(emp.descComedor)}</b></div>
                    </div>
                </fieldset>
            </div>

            {/* 5. TOTALES */}
            <div className="grid grid-cols-2 gap-2 my-1 text-white font-black text-[7px] uppercase tracking-wider shrink-0">
                <div className="bg-gray-500 rounded-full py-1 flex justify-between px-3">
                    <span>Total Perc.</span> <span>{formatoMoneda(emp.totalPercepciones)}</span>
                </div>
                <div className="bg-gray-500 rounded-full py-1 flex justify-between px-3">
                    <span>Total Ded.</span> <span>{formatoMoneda(emp.totalDeducciones)}</span>
                </div>
            </div>

            {/* 6. NETO A PAGAR Y FIRMA */}
            <div className="flex justify-between items-end shrink-0 pt-1">
                <div className="bg-gray-900 text-white rounded-full py-1.5 px-4 font-black text-[10px] flex gap-2 shadow-sm items-center">
                    <span className="text-[6px] font-normal opacity-70">NETO</span>
                    <span>{formatoMoneda(emp.neto)}</span>
                </div>
                <div className="flex-1 ml-4 border-t border-black text-center pt-0.5">
                    <p className="text-[6px] text-gray-500 font-bold uppercase tracking-widest">Firma de conformidad</p>
                </div>
            </div>
        </div>
    );
}