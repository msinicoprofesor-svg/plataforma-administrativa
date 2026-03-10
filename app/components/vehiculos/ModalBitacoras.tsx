/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/vehiculos/ModalBitacoras.tsx                       */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect } from 'react';
import { 
    MdClose, MdHistory, MdDirectionsCar, MdWarning, 
    MdCheckCircle, MdBuild, MdImage, MdLocationOn, MdSpeed
} from 'react-icons/md';
import { supabase } from '../../lib/supabase';

export default function ModalBitacoras({ isOpen, onClose, vehiculo }) {
    const [bitacoras, setBitacoras] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && vehiculo) {
            cargarHistorial();
        } else {
            setBitacoras([]);
        }
    }, [isOpen, vehiculo]);

    const cargarHistorial = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('vehiculos_bitacora')
            .select('*')
            .eq('vehiculo_id', vehiculo.id)
            .order('created_at', { ascending: false }); // Más recientes primero

        if (!error && data) {
            setBitacoras(data);
        } else {
            console.error("Error al cargar historial:", error);
        }
        setLoading(false);
    };

    const formatearFecha = (fechaISO) => {
        const opciones = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(fechaISO).toLocaleDateString('es-MX', opciones);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-gray-50 rounded-[2rem] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
                
                {/* ENCABEZADO */}
                <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-xl font-black text-gray-800 flex items-center gap-2"><MdHistory className="text-blue-600 text-2xl"/> Historial de Auditoría</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                            {vehiculo?.marca} {vehiculo?.modelo} • {vehiculo?.placas}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><MdClose className="text-xl"/></button>
                </div>

                {/* TIMELINE DE BITÁCORAS */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
                    {loading ? (
                        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>
                    ) : bitacoras.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                            <MdHistory className="text-6xl text-gray-300 mb-4"/>
                            <p className="text-sm font-black text-gray-500 uppercase tracking-widest">Aún no hay registros de este vehículo</p>
                        </div>
                    ) : (
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                            {bitacoras.map((bita, index) => {
                                // Determinar estilos según el tipo de registro
                                const esSalida = bita.tipo_registro === 'SALIDA';
                                const esLlegada = bita.tipo_registro === 'LLEGADA';
                                const esPercance = bita.tipo_registro === 'PERCANCE';

                                let icon = <MdDirectionsCar />;
                                let iconColor = 'bg-blue-500 shadow-blue-500/30';
                                let tagTitle = 'Salida a Ruta';
                                
                                if (esLlegada) { icon = <MdLocationOn />; iconColor = 'bg-green-500 shadow-green-500/30'; tagTitle = 'Cierre de Ruta'; }
                                if (esPercance) { icon = <MdWarning />; iconColor = bita.gravedad_percance === 'grave' ? 'bg-red-500 shadow-red-500/30' : 'bg-orange-500 shadow-orange-500/30'; tagTitle = 'Percance Reportado'; }

                                return (
                                    <div key={bita.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        {/* Icono Central */}
                                        <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-gray-50 ${iconColor} text-white shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10`}>
                                            {icon}
                                        </div>

                                        {/* Tarjeta de Información */}
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-4 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${esSalida ? 'bg-blue-50 text-blue-600' : esLlegada ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{tagTitle}</span>
                                                <span className="text-[10px] font-bold text-gray-400">{formatearFecha(bita.created_at)}</span>
                                            </div>

                                            {/* Contenido Dinámico según tipo */}
                                            {esSalida && (
                                                <div className="space-y-3">
                                                    <div className="flex gap-2 text-xs font-bold text-gray-700 bg-gray-50 p-2 rounded-xl border border-gray-100"><MdSpeed className="text-gray-400 text-base"/> Odómetro: {bita.kilometraje} km</div>
                                                    <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-black tracking-widest">
                                                        <div className={`flex items-center gap-1 p-1.5 rounded-lg border ${bita.llantas_ok ? 'text-green-600 bg-green-50 border-green-100' : 'text-red-600 bg-red-50 border-red-100'}`}>{bita.llantas_ok ? <MdCheckCircle/> : <MdWarning/>} Llantas</div>
                                                        <div className={`flex items-center gap-1 p-1.5 rounded-lg border ${bita.aceite_ok ? 'text-green-600 bg-green-50 border-green-100' : 'text-red-600 bg-red-50 border-red-100'}`}>{bita.aceite_ok ? <MdCheckCircle/> : <MdWarning/>} Aceite</div>
                                                        <div className={`flex items-center gap-1 p-1.5 rounded-lg border ${bita.anticongelante_ok ? 'text-green-600 bg-green-50 border-green-100' : 'text-red-600 bg-red-50 border-red-100'}`}>{bita.anticongelante_ok ? <MdCheckCircle/> : <MdWarning/>} Líquidos</div>
                                                        <div className={`flex items-center gap-1 p-1.5 rounded-lg border ${bita.frenos_ok ? 'text-green-600 bg-green-50 border-green-100' : 'text-red-600 bg-red-50 border-red-100'}`}>{bita.frenos_ok ? <MdCheckCircle/> : <MdWarning/>} Frenos</div>
                                                    </div>
                                                    {bita.detalles_incidencia && (
                                                        <p className="text-xs text-gray-600 bg-orange-50 p-3 rounded-xl border border-orange-100"><strong className="text-orange-800">Nota:</strong> {bita.detalles_incidencia}</p>
                                                    )}
                                                </div>
                                            )}

                                            {esLlegada && (
                                                <div className="space-y-3">
                                                    <div className="flex gap-2 text-xs font-bold text-gray-700 bg-gray-50 p-2 rounded-xl border border-gray-100"><MdSpeed className="text-gray-400 text-base"/> Finalizó con: {bita.kilometraje} km</div>
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Vehículo dejado en: <strong className="text-gray-800">{bita.ubicacion_final}</strong></p>
                                                    {bita.detalles_incidencia && bita.detalles_incidencia !== 'Sin incidentes' && (
                                                        <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100"><strong className="text-red-800">Incidente:</strong> {bita.detalles_incidencia}</p>
                                                    )}
                                                    {bita.odometro_url && (
                                                        <a href={bita.odometro_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-black text-blue-500 uppercase hover:underline"><MdImage className="text-base"/> Ver Evidencia Odómetro</a>
                                                    )}
                                                </div>
                                            )}

                                            {esPercance && (
                                                <div className="space-y-3">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${bita.gravedad_percance === 'grave' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        Gravedad: {bita.gravedad_percance}
                                                    </span>
                                                    <p className="text-sm font-medium text-gray-700 bg-gray-50 p-3 rounded-xl">{bita.detalles_incidencia}</p>
                                                    {bita.evidencia_url && (
                                                        <div className="w-full h-32 rounded-xl overflow-hidden border border-gray-200">
                                                            <a href={bita.evidencia_url} target="_blank" rel="noreferrer"><img src={bita.evidencia_url} alt="Evidencia" className="w-full h-full object-cover hover:scale-105 transition-transform"/></a>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
                                                <p className="text-[9px] font-black text-gray-400 uppercase">Conductor: {bita.usuario_id}</p>
                                                {bita.evidencia_url && !esPercance && (
                                                    <a href={bita.evidencia_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 font-bold hover:underline">Ver Foto Daño</a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}