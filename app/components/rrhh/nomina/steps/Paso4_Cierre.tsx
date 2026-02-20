/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/rrhh/nomina/steps/Paso4_Cierre.tsx (PRE-NÓMINA)    */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdCheckCircle, MdPerson, MdSend, MdHourglassEmpty, MdWarning } from "react-icons/md";

const formatoMoneda = (c) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(c || 0);

export default function Paso4_Cierre({ datos, total, periodo }) {
    // Estado para simular el envío a gerencia
    const [estadoAutorizacion, setEstadoAutorizacion] = useState('PENDIENTE'); // PENDIENTE | ENVIADO | APROBADO

    const handleEnviarAutorizacion = () => {
        if(confirm("¿Enviar esta pre-nómina a Gerencia General para su revisión y autorización?")) {
            setEstadoAutorizacion('ENVIADO');
            // Aquí en un futuro iría la conexión a la base de datos o envío de email
        }
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col animate-fade-in pb-24">
            
            {/* PANEL DE AUTORIZACIÓN */}
            <div className={`p-5 rounded-2xl mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border shadow-sm transition-colors ${estadoAutorizacion === 'ENVIADO' ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full shrink-0 ${estadoAutorizacion === 'ENVIADO' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                        {estadoAutorizacion === 'ENVIADO' ? <MdHourglassEmpty className="text-2xl animate-pulse"/> : <MdWarning className="text-2xl"/>}
                    </div>
                    <div>
                        <h3 className={`font-black text-lg ${estadoAutorizacion === 'ENVIADO' ? 'text-blue-800' : 'text-gray-800'}`}>
                            {estadoAutorizacion === 'ENVIADO' ? 'Esperando Autorización' : 'Revisión de Pre-nómina'}
                        </h3>
                        <p className={`text-xs mt-1 max-w-xl ${estadoAutorizacion === 'ENVIADO' ? 'text-blue-600' : 'text-gray-500'}`}>
                            {estadoAutorizacion === 'ENVIADO' 
                                ? 'La pre-nómina ha sido enviada a Gerencia General. Una vez autorizada, podrás cerrar y timbrar.'
                                : 'Revisa a detalle cada tarjeta antes de enviar el concentrado a Gerencia General para su visto bueno.'}
                        </p>
                    </div>
                </div>
                
                {estadoAutorizacion === 'PENDIENTE' && (
                    <button 
                        onClick={handleEnviarAutorizacion}
                        className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        <MdSend className="text-lg"/> Enviar a Gerencia
                    </button>
                )}
                {estadoAutorizacion === 'ENVIADO' && (
                    <div className="w-full md:w-auto px-6 py-3 bg-blue-100 text-blue-700 border border-blue-200 text-sm font-bold rounded-xl flex items-center justify-center gap-2">
                        <MdCheckCircle className="text-lg"/> Notificación Enviada
                    </div>
                )}
            </div>

            {/* ENCABEZADO DE RESUMEN */}
            <div className="flex justify-between items-end mb-4 px-2">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Periodo a dispersar</p>
                    <p className="text-sm font-black text-gray-800">{periodo}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Estimado</p>
                    <p className="text-2xl font-black text-[#DA291C]">{formatoMoneda(total)}</p>
                </div>
            </div>

            {/* TARJETAS DE REVISIÓN DETALLADA (GRID) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {datos.map((item) => (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                        
                        {/* Cabecera Tarjeta */}
                        <div className="p-4 bg-gray-50/80 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 border-2 border-white shadow-sm">
                                {item.foto ? <img src={item.foto} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-sm font-black text-gray-400">{item.nombre.charAt(0)}</div>}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-gray-900 truncate">{item.nombre}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{item.puesto}</span>
                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                    <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">{item.marca}</span>
                                </div>
                            </div>
                        </div>

                        {/* Cuerpo Tarjeta (Desglose) */}
                        <div className="p-4 flex-1 flex flex-col gap-4">
                            
                            {/* Percepciones */}
                            <div>
                                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2 border-b border-green-50 pb-1">Percepciones</p>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs"><span className="text-gray-600">Sueldo Base</span><span className="font-bold text-gray-900">{formatoMoneda(item.sueldo)}</span></div>
                                    {item.bonosFijos > 0 && <div className="flex justify-between text-xs"><span className="text-gray-600">Bonos y Premios</span><span className="font-bold text-gray-900">{formatoMoneda(item.bonosFijos)}</span></div>}
                                    {item.montoPrimaVacacional > 0 && <div className="flex justify-between text-xs bg-orange-50 px-1 rounded"><span className="text-orange-700 font-bold">Prima Vacacional</span><span className="font-black text-orange-700">{formatoMoneda(item.montoPrimaVacacional)}</span></div>}
                                </div>
                            </div>

                            {/* Deducciones */}
                            <div>
                                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2 border-b border-red-50 pb-1">Deducciones</p>
                                <div className="space-y-1">
                                    {item.descAlianza > 0 && <div className="flex justify-between text-xs"><span className="text-gray-600">Préstamo Alianza</span><span className="font-bold text-red-600">-{formatoMoneda(item.descAlianza)}</span></div>}
                                    {item.descInterno > 0 && <div className="flex justify-between text-xs"><span className="text-gray-600">Crédito Empresa</span><span className="font-bold text-red-600">-{formatoMoneda(item.descInterno)}</span></div>}
                                    {item.cajaAhorro > 0 && <div className="flex justify-between text-xs"><span className="text-gray-600">Caja de Ahorro</span><span className="font-bold text-red-600">-{formatoMoneda(item.cajaAhorro)}</span></div>}
                                    {item.infonavit > 0 && <div className="flex justify-between text-xs"><span className="text-gray-600">Infonavit</span><span className="font-bold text-red-600">-{formatoMoneda(item.infonavit)}</span></div>}
                                    {item.montoRetardos > 0 && <div className="flex justify-between text-xs"><span className="text-gray-600">Retardos ({item.retardos})</span><span className="font-bold text-red-600">-{formatoMoneda(item.montoRetardos)}</span></div>}
                                    {item.descComedor > 0 && <div className="flex justify-between text-xs"><span className="text-gray-600">Comedor</span><span className="font-bold text-red-600">-{formatoMoneda(item.descComedor)}</span></div>}
                                    {item.totalDeducciones === 0 && <div className="text-xs text-gray-400 italic">Sin deducciones en este periodo</div>}
                                </div>
                            </div>
                        </div>

                        {/* Footer Tarjeta (Neto) */}
                        <div className="p-4 bg-gray-900 text-white flex justify-between items-center shrink-0">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Neto a Pagar</span>
                            <span className="text-lg font-black">{formatoMoneda(item.neto)}</span>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}