/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/atencion-cliente/views/ModalEscalarVisita.tsx      */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect } from 'react';
import { MdClose, MdEngineering, MdAccessTime, MdNoteAlt } from "react-icons/md";

const MOTIVOS_SUGERIDOS = [
    "Falla física en el equipo del cliente",
    "Cableado interno dañado o cortado",
    "Requiere reemplazo de piezas o router",
    "Problema de cobertura o señal débil en domicilio",
    "El cliente no supo seguir las instrucciones remotas",
    "Otro (Especificar en notas)"
];

export default function ModalEscalarVisita({ isOpen, onClose, ticket, onConfirm }) {
    const [motivo, setMotivo] = useState(MOTIVOS_SUGERIDOS[0]);
    const [notasExtra, setNotasExtra] = useState('');
    const [horario, setHorario] = useState('Lo antes posible');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Limpiar el formulario cada vez que se abre
    useEffect(() => {
        if (isOpen) {
            setMotivo(MOTIVOS_SUGERIDOS[0]);
            setNotasExtra('');
            setHorario('Lo antes posible');
            setIsSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen || !ticket) return null;

    const handleConfirm = async () => {
        setIsSubmitting(true);
        const notaFinal = motivo === "Otro (Especificar en notas)" 
            ? notasExtra 
            : `${motivo}. ${notasExtra}`.trim();
        
        await onConfirm(ticket.id, horario, notaFinal);
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl flex flex-col animate-slide-up overflow-hidden border border-gray-100">
                
                <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 bg-orange-50/50">
                    <h3 className="text-lg font-black text-orange-900 flex items-center gap-2">
                        <MdEngineering className="text-orange-500 text-2xl"/> Escalar a Visita Técnica
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors bg-white hover:bg-red-50 p-2 rounded-full shadow-sm">
                        <MdClose className="text-xl"/>
                    </button>
                </div>

                <div className="p-6 space-y-5 bg-gray-50/30">
                    <p className="text-xs font-bold text-gray-500 bg-white p-3 rounded-xl border border-gray-100">
                        Estás a punto de enviar el ticket <span className="text-gray-800 font-black">{ticket.folio_corto}</span> de <span className="text-gray-800 font-black">{ticket.cliente}</span> al tablero de Gestión de Rutas.
                    </p>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <MdNoteAlt/> Motivo del escalamiento
                        </label>
                        <select 
                            value={motivo} 
                            onChange={(e) => setMotivo(e.target.value)}
                            className="w-full text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                        >
                            {MOTIVOS_SUGERIDOS.map((m, i) => <option key={i} value={m}>{m}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notas adicionales para el técnico</label>
                        <textarea 
                            value={notasExtra}
                            onChange={(e) => setNotasExtra(e.target.value)}
                            placeholder="Ej. Llevar escalera larga, el cliente tiene perro, etc..."
                            className="w-full text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all resize-none h-20 custom-scrollbar"
                        ></textarea>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <MdAccessTime/> Horario de preferencia del cliente
                        </label>
                        <select 
                            value={horario} 
                            onChange={(e) => setHorario(e.target.value)}
                            className="w-full text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                        >
                            <option value="Lo antes posible">Lo antes posible</option>
                            <option value="Por la mañana (9am - 1pm)">Por la mañana (9am - 1pm)</option>
                            <option value="Por la tarde (2pm - 6pm)">Por la tarde (2pm - 6pm)</option>
                        </select>
                    </div>
                </div>

                <div className="p-5 border-t border-gray-100 bg-white flex justify-end gap-3">
                    <button onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                        Cancelar
                    </button>
                    <button 
                        onClick={handleConfirm} 
                        disabled={isSubmitting}
                        className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-orange-500 hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting ? 'Procesando...' : 'Confirmar y Enviar a Rutas'}
                    </button>
                </div>
            </div>
        </div>
    );
}