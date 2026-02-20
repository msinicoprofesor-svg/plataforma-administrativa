/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/rrhh/incidencias/ModalIncidencia.tsx (V2)          */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useMemo, useEffect } from 'react';
import { MdClose, MdSearch, MdAccessTime, MdCalendarToday } from "react-icons/md";

// --- COMPONENTE INTERNO: CALENDARIO ---
const MiniCalendarioSelector = ({ seleccionados, onToggleDia }) => {
    const hoy = new Date();
    const [mesBase, setMesBase] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1));

    const diasDelMes = useMemo(() => {
        const año = mesBase.getFullYear();
        const mes = mesBase.getMonth();
        const primerDia = new Date(año, mes, 1).getDay();
        const totalDias = new Date(año, mes + 1, 0).getDate();
        const vacios = Array(primerDia).fill(null);
        const dias = Array.from({ length: totalDias }, (_, i) => new Date(año, mes, i + 1));
        return [...vacios, ...dias];
    }, [mesBase]);

    const esSeleccionado = (fecha) => {
        if (!fecha) return false;
        const iso = fecha.toISOString().split('T')[0];
        return seleccionados.includes(iso);
    };

    return (
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 h-full">
            <div className="flex justify-between items-center mb-3">
                <button onClick={() => setMesBase(new Date(mesBase.getFullYear(), mesBase.getMonth() - 1, 1))} className="text-gray-400 hover:text-gray-600 font-bold">{'<'}</button>
                <span className="text-xs font-black text-gray-700 uppercase">
                    {mesBase.toLocaleString('es-MX', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => setMesBase(new Date(mesBase.getFullYear(), mesBase.getMonth() + 1, 1))} className="text-gray-400 hover:text-gray-600 font-bold">{'>'}</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {['D','L','M','M','J','V','S'].map(d => <span key={d} className="text-[9px] font-bold text-gray-400">{d}</span>)}
                {diasDelMes.map((dia, i) => {
                    if (!dia) return <div key={i}></div>;
                    const selected = esSeleccionado(dia);
                    return (
                        <button 
                            key={i} 
                            onClick={() => onToggleDia(dia.toISOString().split('T')[0])}
                            className={`
                                w-7 h-7 rounded-full text-[10px] font-bold transition-all
                                ${selected 
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 scale-110' 
                                    : 'text-gray-600 hover:bg-white hover:shadow-sm'}
                            `}
                        >
                            {dia.getDate()}
                        </button>
                    );
                })}
            </div>
            <p className="text-[9px] text-gray-400 mt-2 text-center">Palomea los días</p>
        </div>
    );
};

export default function ModalIncidencia({ isOpen, onClose, onSave, colaboradores }) {
    if (!isOpen) return null;

    // --- ESTADOS ---
    const [unidad, setUnidad] = useState('DIAS'); // 'DIAS' | 'HORAS'
    const [busquedaColab, setBusquedaColab] = useState('');
    const [diasSeleccionados, setDiasSeleccionados] = useState([]); // Para días completos
    
    // Estado para "Por Horas"
    const [fechaHora, setFechaHora] = useState(new Date().toISOString().split('T')[0]);
    const [horaInicio, setHoraInicio] = useState('');
    const [horaFin, setHoraFin] = useState('');

    const [formData, setFormData] = useState({
        colaboradorId: '',
        nombreColaborador: '',
        tipo: 'FALTA',
        modalidadPago: 'SIN_GOCE', // 'CON_GOCE' | 'SIN_GOCE' | 'TIEMPO_X_TIEMPO'
        motivo: ''
    });

    // --- SUGERENCIAS INTELIGENTES (AMPLIADAS) ---
    const sugerencias = useMemo(() => {
        switch (formData.tipo) {
            case 'FALTA': return ['Asuntos personales graves', 'Enfermedad sin justificante', 'Problema de transporte', 'Emergencia familiar', 'Trámite administrativo'];
            case 'VACACIONES': return ['Periodo anual correspondiente', 'Días a cuenta', 'Adelanto de vacaciones', 'Solicitud especial'];
            case 'INCAPACIDAD': return ['Enfermedad general (IMSS)', 'Riesgo de trabajo', 'Maternidad', 'Accidente de trayecto'];
            case 'RETARDO': return ['Tráfico pesado inusual', 'Cita médica previa', 'Problema mecánico', 'Bloqueo en la vía'];
            case 'PERMISO': return ['Trámite escolar de hijos', 'Graduación/Evento escolar', 'Mudanza', 'Fallecimiento familiar', 'Cita gubernamental'];
            default: return [];
        }
    }, [formData.tipo]);

    // --- CÁLCULOS ---
    const totalDias = diasSeleccionados.length;
    
    const totalHoras = useMemo(() => {
        if (!horaInicio || !horaFin) return 0;
        const [h1, m1] = horaInicio.split(':').map(Number);
        const [h2, m2] = horaFin.split(':').map(Number);
        const inicio = h1 * 60 + m1;
        const fin = h2 * 60 + m2;
        const diff = fin - inicio;
        return diff > 0 ? (diff / 60).toFixed(1) : 0;
    }, [horaInicio, horaFin]);

    // --- MANEJADORES ---
    const handleGuardar = () => {
        // Validaciones
        if (!formData.colaboradorId || !formData.motivo) return;
        if (unidad === 'DIAS' && totalDias === 0) return;
        if (unidad === 'HORAS' && (Number(totalHoras) <= 0)) return;

        // Construir objeto final
        onSave({
            ...formData,
            unidadMedida: unidad, // 'DIAS' o 'HORAS'
            // Mapeamos la modalidad a las banderas que usa el sistema (o guardamos el string directo)
            goceSueldo: formData.modalidadPago === 'CON_GOCE',
            tiempoPorTiempo: formData.modalidadPago === 'TIEMPO_X_TIEMPO',
            sinGoce: formData.modalidadPago === 'SIN_GOCE',
            
            // Datos de tiempo
            fechas: unidad === 'DIAS' ? diasSeleccionados.sort() : [fechaHora],
            cantidad: unidad === 'DIAS' ? totalDias : Number(totalHoras),
            detalleHoras: unidad === 'HORAS' ? { inicio: horaInicio, fin: horaFin } : null
        });
        handleClose();
    };

    const handleClose = () => {
        setFormData({ colaboradorId: '', nombreColaborador: '', tipo: 'FALTA', modalidadPago: 'SIN_GOCE', motivo: '' });
        setDiasSeleccionados([]);
        setBusquedaColab('');
        setUnidad('DIAS');
        setHoraInicio('');
        setHoraFin('');
        onClose();
    };

    const seleccionarColaborador = (col) => {
        setFormData({ ...formData, colaboradorId: col.email, nombreColaborador: col.nombre });
        setBusquedaColab(col.nombre);
    };

    const toggleDia = (fechaIso) => {
        setDiasSeleccionados(prev => prev.includes(fechaIso) ? prev.filter(d => d !== fechaIso) : [...prev, fechaIso]);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                
                {/* Header */}
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-lg font-black text-gray-800">Nueva Incidencia</h3>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wide">Registro de Evento</p>
                    </div>
                    <button onClick={handleClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm transition-all"><MdClose className="text-lg"/></button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto custom-scrollbar space-y-6 bg-white">
                    {/* Buscador */}
                    <div className="relative z-20">
                        <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block tracking-widest ml-1">Colaborador</label>
                        <div className="relative group">
                            <MdSearch className="absolute left-4 top-3.5 text-gray-400 text-lg" />
                            <input 
                                type="text" 
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-200 transition-all text-sm"
                                placeholder="Escribe para buscar..."
                                value={busquedaColab}
                                onChange={(e) => {
                                    setBusquedaColab(e.target.value);
                                    if (e.target.value === '') setFormData({ ...formData, colaboradorId: '', nombreColaborador: '' });
                                }}
                            />
                            {busquedaColab && !formData.colaboradorId && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-40 overflow-y-auto p-2 animate-slide-up z-30">
                                    {colaboradores
                                        .filter(c => c.nombre.toLowerCase().includes(busquedaColab.toLowerCase()))
                                        .map(c => (
                                            <div key={c.id} onClick={() => seleccionarColaborador(c)} className="p-2 hover:bg-orange-50 rounded-lg cursor-pointer flex items-center gap-2 transition-colors">
                                                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500 text-[10px]">{c.nombre.charAt(0)}</div>
                                                <p className="text-xs font-bold text-gray-800">{c.nombre}</p>
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* COLUMNA IZQUIERDA: CONFIGURACIÓN */}
                        <div className="space-y-6">
                            {/* Tipo */}
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block tracking-widest ml-1">Tipo de Incidencia</label>
                                <select 
                                    className="w-full p-3 bg-gray-50 border-none rounded-xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer text-sm"
                                    value={formData.tipo}
                                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                                >
                                    <option value="FALTA">Falta</option>
                                    <option value="VACACIONES">Vacaciones</option>
                                    <option value="INCAPACIDAD">Incapacidad</option>
                                    <option value="RETARDO">Retardo</option>
                                    <option value="PERMISO">Permiso</option>
                                </select>
                            </div>

                            {/* Modalidad de Pago (3 Opciones) */}
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block tracking-widest ml-1">Modalidad</label>
                                <div className="flex flex-col gap-2">
                                    <button 
                                        onClick={() => setFormData({...formData, modalidadPago: 'CON_GOCE'})}
                                        className={`w-full py-2 px-3 rounded-lg border-2 font-bold text-xs transition-all text-left flex items-center justify-between ${formData.modalidadPago === 'CON_GOCE' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                    >
                                        <span>Con Goce de Sueldo</span>
                                        {formData.modalidadPago === 'CON_GOCE' && <span className="text-green-600 font-black">($)</span>}
                                    </button>
                                    <button 
                                        onClick={() => setFormData({...formData, modalidadPago: 'SIN_GOCE'})}
                                        className={`w-full py-2 px-3 rounded-lg border-2 font-bold text-xs transition-all text-left ${formData.modalidadPago === 'SIN_GOCE' ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                    >
                                        Sin Goce de Sueldo
                                    </button>
                                    <button 
                                        onClick={() => setFormData({...formData, modalidadPago: 'TIEMPO_X_TIEMPO'})}
                                        className={`w-full py-2 px-3 rounded-lg border-2 font-bold text-xs transition-all text-left ${formData.modalidadPago === 'TIEMPO_X_TIEMPO' ? 'border-purple-500 bg-purple-50 text-purple-600' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                    >
                                        Tiempo x Tiempo (TxT)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA DERECHA: TIEMPO */}
                        <div className="bg-white rounded-xl">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Duración</label>
                                {/* Switch Días/Horas */}
                                <div className="flex bg-gray-100 p-0.5 rounded-lg">
                                    <button 
                                        onClick={() => setUnidad('DIAS')}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${unidad === 'DIAS' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}
                                    >
                                        Días
                                    </button>
                                    <button 
                                        onClick={() => setUnidad('HORAS')}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${unidad === 'HORAS' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}
                                    >
                                        Horas
                                    </button>
                                </div>
                            </div>

                            {unidad === 'DIAS' ? (
                                <div className="h-64">
                                    <MiniCalendarioSelector seleccionados={diasSeleccionados} onToggleDia={toggleDia} />
                                </div>
                            ) : (
                                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 h-64 flex flex-col justify-center gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Fecha del evento</label>
                                        <div className="relative">
                                            <MdCalendarToday className="absolute left-3 top-3 text-gray-400"/>
                                            <input 
                                                type="date" 
                                                className="w-full pl-9 p-2.5 rounded-xl border border-gray-200 font-bold text-gray-700 text-sm outline-none focus:border-orange-300"
                                                value={fechaHora}
                                                onChange={(e) => setFechaHora(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Inicio</label>
                                            <div className="relative">
                                                <MdAccessTime className="absolute left-3 top-3 text-gray-400"/>
                                                <input 
                                                    type="time" 
                                                    className="w-full pl-9 p-2.5 rounded-xl border border-gray-200 font-bold text-gray-700 text-sm outline-none focus:border-orange-300"
                                                    value={horaInicio}
                                                    onChange={(e) => setHoraInicio(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Fin</label>
                                            <div className="relative">
                                                <MdAccessTime className="absolute left-3 top-3 text-gray-400"/>
                                                <input 
                                                    type="time" 
                                                    className="w-full pl-9 p-2.5 rounded-xl border border-gray-200 font-bold text-gray-700 text-sm outline-none focus:border-orange-300"
                                                    value={horaFin}
                                                    onChange={(e) => setHoraFin(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {Number(totalHoras) > 0 && (
                                        <div className="mt-2 text-center bg-orange-100 text-orange-700 font-black rounded-lg py-1 text-sm">
                                            Total: {totalHoras} Horas
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Justificación */}
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block tracking-widest ml-1">Justificación</label>
                        <textarea 
                            rows={2}
                            className="w-full p-4 bg-gray-50 border-none rounded-2xl font-medium text-gray-700 outline-none resize-none focus:ring-2 focus:ring-orange-200 mb-2 text-sm"
                            placeholder="Describe el motivo..."
                            value={formData.motivo}
                            onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                        ></textarea>
                        {/* Chips de Sugerencias Scrollables */}
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                            {sugerencias.map(sug => (
                                <button key={sug} onClick={() => setFormData({...formData, motivo: sug})} className="px-3 py-1.5 bg-gray-100 hover:bg-orange-50 hover:text-orange-600 text-gray-500 text-[10px] font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 border border-transparent hover:border-orange-100">
                                    {sug}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-4">
                    <button onClick={handleClose} className="flex-1 py-3.5 text-gray-500 font-bold hover:bg-gray-200 rounded-2xl transition-all text-sm">Cancelar</button>
                    <button 
                        onClick={handleGuardar}
                        disabled={!formData.colaboradorId || !formData.motivo || (unidad === 'DIAS' && totalDias === 0) || (unidad === 'HORAS' && Number(totalHoras) <= 0)}
                        className="flex-1 py-3.5 bg-orange-500 text-white font-bold rounded-2xl shadow-xl shadow-orange-200 hover:bg-orange-600 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:shadow-none disabled:scale-100 text-sm"
                    >
                        Registrar
                    </button>
                </div>
            </div>
        </div>
    );
}