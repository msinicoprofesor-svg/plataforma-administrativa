/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/vehiculos/solicitudes/FormularioNueva.tsx          */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MdSend, MdLocationOn, MdLightbulbOutline } from 'react-icons/md';
import { useSolicitudesVehiculos } from '../../../hooks/useSolicitudesVehiculos';

export default function FormularioNueva({ usuarioActivo, setVistaActiva }) {
    // Al pasar false, el hook sabe que solo debe cargar y guardar lo de ESTE usuario
    const { crearSolicitud } = useSolicitudesVehiculos(usuarioActivo?.id, false);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formSolicitud, setFormSolicitud] = useState({ 
        tipo_duracion: 'DIAS',
        fecha_solicitud: '', 
        fecha_fin: '',
        hora_inicio: '',
        hora_fin: '',
        destino: '',
        motivo: '' 
    });

    // --- INTELIGENCIA DE SUGERENCIAS POR PUESTO ---
    const obtenerSugerencias = () => {
        const rol = usuarioActivo?.rol || '';
        const puesto = (usuarioActivo?.puesto || '').toLowerCase();

        if (rol.includes('MKT') || puesto.includes('marketing') || puesto.includes('diseño') || puesto.includes('contenido')) {
            return ["Estudio de mercado", "Grabación de contenido", "Activación de marca", "Visita a sucursal"];
        }
        if (rol.includes('SOPORTE') || puesto.includes('técnico') || puesto.includes('tecnico') || puesto.includes('ingeniero')) {
            return ["Reporte de emergencia", "Instalación en sitio", "Mantenimiento preventivo", "Atención a falla general"];
        }
        if (rol.includes('ALMACEN') || puesto.includes('logística') || puesto.includes('chofer')) {
            return ["Entrega de mercancía", "Recolección de insumos", "Traslado intersucursal", "Ruta de paquetería"];
        }
        
        // Mensajes por defecto para administrativos o generales
        return ["Visita a cliente", "Traslado de material corporativo", "Reunión externa", "Trámite administrativo"];
    };

    const sugerencias = obtenerSugerencias();

    const handleEnviarSolicitud = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const payload = {
            usuario_solicitante_id: usuarioActivo.id,
            tipo_duracion: formSolicitud.tipo_duracion,
            fecha_solicitud: formSolicitud.fecha_solicitud,
            fecha_fin: formSolicitud.tipo_duracion === 'DIAS' ? formSolicitud.fecha_fin : null,
            hora_inicio: formSolicitud.tipo_duracion === 'HORAS' ? formSolicitud.hora_inicio : null,
            hora_fin: formSolicitud.tipo_duracion === 'HORAS' ? formSolicitud.hora_fin : null,
            destino: formSolicitud.destino,
            motivo: formSolicitud.motivo
        };

        const res = await crearSolicitud(payload);
        setIsSubmitting(false);
        if (res.success) {
            alert("✅ Solicitud enviada exitosamente al administrador.");
            // Limpiamos el form y mandamos al usuario a ver su historial
            setFormSolicitud({ tipo_duracion: 'DIAS', fecha_solicitud: '', fecha_fin: '', hora_inicio: '', hora_fin: '', destino: '', motivo: '' });
            setVistaActiva('historial'); 
        }
    };

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 max-w-2xl mx-auto h-full overflow-y-auto custom-scrollbar">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6 border-b border-gray-100 pb-3">Generar Petición</h3>
            
            <form onSubmit={handleEnviarSolicitud} className="space-y-6 pb-4">
                {/* SELECTOR DE DURACIÓN */}
                <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">¿Por cuánto tiempo necesitas la unidad?</label>
                    <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-200 shadow-inner">
                        <button type="button" onClick={() => setFormSolicitud({...formSolicitud, tipo_duracion: 'HORAS'})} className={`flex-1 py-2.5 text-[11px] font-black uppercase rounded-lg transition-all ${formSolicitud.tipo_duracion === 'HORAS' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}>Por Horas</button>
                        <button type="button" onClick={() => setFormSolicitud({...formSolicitud, tipo_duracion: 'DIA'})} className={`flex-1 py-2.5 text-[11px] font-black uppercase rounded-lg transition-all ${formSolicitud.tipo_duracion === 'DIA' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}>1 Día</button>
                        <button type="button" onClick={() => setFormSolicitud({...formSolicitud, tipo_duracion: 'DIAS'})} className={`flex-1 py-2.5 text-[11px] font-black uppercase rounded-lg transition-all ${formSolicitud.tipo_duracion === 'DIAS' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}>Varios Días</button>
                    </div>
                </div>

                {/* CAMPOS DINÁMICOS DE FECHA Y HORA */}
                <div className="bg-purple-50/50 p-5 rounded-2xl border border-purple-100 space-y-4">
                    {formSolicitud.tipo_duracion === 'DIAS' ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-[10px] font-black text-purple-600 uppercase mb-2">Día de Salida</label><input required type="date" value={formSolicitud.fecha_solicitud} onChange={e => setFormSolicitud({...formSolicitud, fecha_solicitud: e.target.value})} className="w-full bg-white border border-purple-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-purple-500 shadow-sm" /></div>
                            <div><label className="block text-[10px] font-black text-purple-600 uppercase mb-2">Día de Regreso</label><input required type="date" value={formSolicitud.fecha_fin} onChange={e => setFormSolicitud({...formSolicitud, fecha_fin: e.target.value})} className="w-full bg-white border border-purple-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-purple-500 shadow-sm" /></div>
                        </div>
                    ) : (
                        <div><label className="block text-[10px] font-black text-purple-600 uppercase mb-2">¿Qué día la necesitas?</label><input required type="date" value={formSolicitud.fecha_solicitud} onChange={e => setFormSolicitud({...formSolicitud, fecha_solicitud: e.target.value})} className="w-full bg-white border border-purple-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-purple-500 shadow-sm" /></div>
                    )}

                    {formSolicitud.tipo_duracion === 'HORAS' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-[10px] font-black text-purple-600 uppercase mb-2">Hora de Salida</label><input required type="time" value={formSolicitud.hora_inicio} onChange={e => setFormSolicitud({...formSolicitud, hora_inicio: e.target.value})} className="w-full bg-white border border-purple-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-purple-500 shadow-sm" /></div>
                            <div><label className="block text-[10px] font-black text-purple-600 uppercase mb-2">Hora de Regreso</label><input required type="time" value={formSolicitud.hora_fin} onChange={e => setFormSolicitud({...formSolicitud, hora_fin: e.target.value})} className="w-full bg-white border border-purple-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-purple-500 shadow-sm" /></div>
                        </div>
                    )}
                </div>

                {/* DESTINO */}
                <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Destino de la Ruta</label>
                    <div className="relative">
                        <MdLocationOn className="absolute left-4 top-3.5 text-gray-400 text-lg" />
                        <input required type="text" value={formSolicitud.destino} onChange={e => setFormSolicitud({...formSolicitud, destino: e.target.value})} placeholder="Ej. Planta Monterrey, Oficina Central..." className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-purple-500" />
                    </div>
                </div>
                
                {/* MOTIVO CON SUGERENCIAS */}
                <div>
                    <div className="flex justify-between items-end mb-2 ml-1">
                        <label className="block text-[10px] font-black text-gray-500 uppercase">Motivo / Actividad</label>
                        <span className="text-[9px] font-bold text-purple-500 flex items-center gap-1"><MdLightbulbOutline/> Sugerencias rápidas:</span>
                    </div>
                    
                    {/* BOTONERA DE SUGERENCIAS */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {sugerencias.map((sug, idx) => (
                            <button 
                                key={idx} 
                                type="button" 
                                onClick={() => setFormSolicitud({...formSolicitud, motivo: sug})}
                                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100 rounded-lg text-[10px] font-black tracking-wide transition-colors"
                            >
                                {sug}
                            </button>
                        ))}
                    </div>

                    <textarea required value={formSolicitud.motivo} onChange={e => setFormSolicitud({...formSolicitud, motivo: e.target.value})} placeholder="Escribe o selecciona un motivo rápido arriba..." className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-bold text-gray-800 outline-none focus:border-purple-500 h-24 resize-none"></textarea>
                </div>
                
                <button type="submit" disabled={isSubmitting} className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-gray-900/20 disabled:opacity-50 flex justify-center items-center gap-2 active:scale-95">
                    <MdSend className="text-lg"/> Enviar Petición de Préstamo
                </button>
            </form>
        </div>
    );
}