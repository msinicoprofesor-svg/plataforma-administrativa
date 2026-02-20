/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/rrhh/nomina/ModalAjusteNomina.tsx (HOJA DE CAPTURA) */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect } from 'react';
import { 
    MdClose, MdRestaurant, MdWarning, MdAccessTime, MdAttachMoney, 
    MdSave, MdNoteAlt, MdMoneyOff 
} from "react-icons/md";

export default function ModalAjusteNomina({ isOpen, onClose, colaborador, valoresActuales, onSave }) {
    
    // ESTADOS DEL FORMULARIO
    const [ajustes, setAjustes] = useState({
        comedor: 0,
        sancion: 0,
        horasExtra: 0,
        bonoEventual: 0,
        nota: ''
    });

    // CARGAR VALORES AL ABRIR
    useEffect(() => {
        if (isOpen && valoresActuales) {
            setAjustes({
                comedor: valoresActuales.comedor || 0,
                sancion: valoresActuales.sancion || 0,
                horasExtra: valoresActuales.horasExtra || 0,
                bonoEventual: valoresActuales.bonoEventual || 0,
                nota: valoresActuales.nota || ''
            });
        } else {
            // Reset si es nuevo o no hay datos previos
            setAjustes({ comedor: 0, sancion: 0, horasExtra: 0, bonoEventual: 0, nota: '' });
        }
    }, [isOpen, valoresActuales, colaborador]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Si es nota es texto, si no es número
        setAjustes(prev => ({
            ...prev,
            [name]: name === 'nota' ? value : parseFloat(value) || 0
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(colaborador.id, ajustes);
        onClose();
    };

    if (!isOpen || !colaborador) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-scale-in overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* HEADER */}
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm shrink-0">
                            {colaborador.foto ? <img src={colaborador.foto} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-gray-400">{colaborador.nombre?.charAt(0)}</div>}
                        </div>
                        <div>
                            <h3 className="font-extrabold text-gray-800 text-lg leading-tight">{colaborador.nombre}</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ajustes Variables Quincenales</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-900 shadow-sm transition-all"><MdClose className="text-xl" /></button>
                </div>

                {/* FORMULARIO */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                    
                    {/* SECCIÓN 1: DEDUCCIONES VARIABLES (ROJO) */}
                    <div className="bg-red-50/50 p-5 rounded-3xl border border-red-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-red-100 rounded-full mix-blend-multiply filter blur-xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                        <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                            <MdMoneyOff className="text-lg"/> Descuentos de Quincena
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="group">
                                <label className="text-[10px] font-bold text-red-400 uppercase mb-1 block flex items-center gap-1">
                                    <MdRestaurant/> Comedor ($)
                                </label>
                                <input 
                                    type="number" 
                                    name="comedor" 
                                    value={ajustes.comedor || ''} 
                                    onChange={handleChange} 
                                    placeholder="0.00" 
                                    className="w-full px-4 py-3 bg-white rounded-xl text-red-600 font-bold outline-none focus:ring-2 focus:ring-red-200 transition-all placeholder-red-200"
                                />
                            </div>
                            <div className="group">
                                <label className="text-[10px] font-bold text-red-400 uppercase mb-1 block flex items-center gap-1">
                                    <MdWarning/> Sanciones ($)
                                </label>
                                <input 
                                    type="number" 
                                    name="sancion" 
                                    value={ajustes.sancion || ''} 
                                    onChange={handleChange} 
                                    placeholder="0.00" 
                                    className="w-full px-4 py-3 bg-white rounded-xl text-red-600 font-bold outline-none focus:ring-2 focus:ring-red-200 transition-all placeholder-red-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: PERCEPCIONES EXTRAS (VERDE) */}
                    <div className="bg-green-50/50 p-5 rounded-3xl border border-green-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-full mix-blend-multiply filter blur-xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                        <h4 className="text-xs font-black text-green-600 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                            <MdAttachMoney className="text-lg"/> Pagos Adicionales
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="group">
                                <label className="text-[10px] font-bold text-green-500 uppercase mb-1 block flex items-center gap-1">
                                    <MdAccessTime/> Horas Extra ($)
                                </label>
                                <input 
                                    type="number" 
                                    name="horasExtra" 
                                    value={ajustes.horasExtra || ''} 
                                    onChange={handleChange} 
                                    placeholder="0.00" 
                                    className="w-full px-4 py-3 bg-white rounded-xl text-green-700 font-bold outline-none focus:ring-2 focus:ring-green-200 transition-all placeholder-green-200"
                                />
                            </div>
                            <div className="group">
                                <label className="text-[10px] font-bold text-green-500 uppercase mb-1 block flex items-center gap-1">
                                    <MdAttachMoney/> Bono Eventual ($)
                                </label>
                                <input 
                                    type="number" 
                                    name="bonoEventual" 
                                    value={ajustes.bonoEventual || ''} 
                                    onChange={handleChange} 
                                    placeholder="0.00" 
                                    className="w-full px-4 py-3 bg-white rounded-xl text-green-700 font-bold outline-none focus:ring-2 focus:ring-green-200 transition-all placeholder-green-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* NOTAS */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block flex items-center gap-1">
                            <MdNoteAlt/> Observaciones (Opcional)
                        </label>
                        <textarea 
                            name="nota" 
                            value={ajustes.nota} 
                            onChange={handleChange} 
                            rows={2} 
                            placeholder="Ej: Faltó el lunes 12 por enfermedad..." 
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium text-gray-600 outline-none focus:border-blue-300 resize-none"
                        ></textarea>
                    </div>

                </form>

                {/* FOOTER */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 text-gray-400 font-bold hover:bg-gray-200 rounded-xl transition-all text-xs">Cancelar</button>
                    <button onClick={handleSubmit} className="flex-[2] py-3 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2 text-xs">
                        <MdSave className="text-lg"/> Guardar Ajustes
                    </button>
                </div>
            </div>
        </div>
    );
}