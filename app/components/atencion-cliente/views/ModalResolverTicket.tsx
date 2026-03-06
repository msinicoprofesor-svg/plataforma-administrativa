/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/atencion-cliente/views/ModalResolverTicket.tsx     */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect } from 'react';
import { MdClose, MdCheckCircle, MdNoteAlt } from "react-icons/md";

const SOLUCIONES_SUGERIDAS = [
    "Reinicio de equipo de forma remota",
    "Configuración / Actualización de IP",
    "Instrucción al cliente exitosa (Falla de capa 8)",
    "Restablecimiento de servicio tras pago",
    "Reparación física en sitio (Por técnico)",
    "Falla masiva solucionada en la zona",
    "Otro (Especificar en notas)"
];

export default function ModalResolverTicket({ isOpen, onClose, ticket, onConfirm }) {
    const [solucion, setSolucion] = useState(SOLUCIONES_SUGERIDAS[0]);
    const [notasExtra, setNotasExtra] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSolucion(SOLUCIONES_SUGERIDAS[0]);
            setNotasExtra('');
            setIsSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen || !ticket) return null;

    const handleConfirm = async () => {
        setIsSubmitting(true);
        const notaFinal = solucion === "Otro (Especificar en notas)" 
            ? notasExtra 
            : `${solucion}. ${notasExtra}`.trim();
        
        await onConfirm(ticket.id, notaFinal);
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl flex flex-col animate-slide-up overflow-hidden border border-gray-100">
                
                <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 bg-green-50/50">
                    <h3 className="text-lg font-black text-green-900 flex items-center gap-2">
                        <MdCheckCircle className="text-green-500 text-2xl"/> Resolver Reporte
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors bg-white hover:bg-red-50 p-2 rounded-full shadow-sm">
                        <MdClose className="text-xl"/>
                    </button>
                </div>

                <div className="p-6 space-y-5 bg-gray-50/30">
                    <p className="text-xs font-bold text-gray-500 bg-white p-3 rounded-xl border border-gray-100">
                        Cerrando el ticket <span className="text-gray-800 font-black">{ticket.folio_corto}</span>. Por favor, documenta la solución para el historial del cliente.
                    </p>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <MdNoteAlt/> Acción que solucionó el problema
                        </label>
                        <select 
                            value={solucion} 
                            onChange={(e) => setSolucion(e.target.value)}
                            className="w-full text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
                        >
                            {SOLUCIONES_SUGERIDAS.map((m, i) => <option key={i} value={m}>{m}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Detalles adicionales (Opcional)</label>
                        <textarea 
                            value={notasExtra}
                            onChange={(e) => setNotasExtra(e.target.value)}
                            placeholder="Ej. Se cambió el cable de red, el cliente cambió su contraseña..."
                            className="w-full text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all resize-none h-24 custom-scrollbar"
                        ></textarea>
                    </div>
                </div>

                <div className="p-5 border-t border-gray-100 bg-white flex justify-end gap-3">
                    <button onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                        Cancelar
                    </button>
                    <button 
                        onClick={handleConfirm} 
                        disabled={isSubmitting}
                        className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-green-500 hover:bg-green-600 transition-colors shadow-md shadow-green-500/20 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting ? 'Guardando...' : 'Marcar como Resuelto'}
                    </button>
                </div>
            </div>
        </div>
    );
}