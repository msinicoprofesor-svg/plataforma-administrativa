/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/vehiculos/CentroNotificaciones.tsx                 */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect } from 'react';
import { MdClose, MdNotifications, MdWarning, MdBuild, MdInventory, MdDirectionsCar, MdCheckCircle } from 'react-icons/md';
import { supabase } from '../../lib/supabase';

export default function CentroNotificaciones({ isOpen, onClose }) {
    const [alertas, setAlertas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            cargarAlertas();
        }
    }, [isOpen]);

    const cargarAlertas = async () => {
        setLoading(true);
        try {
            let nuevasAlertas = [];

            // 1. EVALUAR STOCK BAJO
            const { data: inventario } = await supabase.from('vehiculos_inventario').select('*').lte('cantidad', 5);
            if (inventario) {
                inventario.forEach(item => {
                    nuevasAlertas.push({
                        id: `inv-${item.id}`,
                        tipo: 'INVENTARIO',
                        prioridad: item.cantidad === 0 ? 'ALTA' : 'MEDIA',
                        titulo: 'Stock Crítico',
                        mensaje: `Solo quedan ${item.cantidad} ${item.unidad_medida} de ${item.nombre}. Resurtir pronto.`,
                        fecha: new Date()
                    });
                });
            }

            // 2. EVALUAR SERVICIOS PROGRAMADOS
            const { data: servicios } = await supabase.from('vehiculos_mantenimiento').select('*, vehiculo:vehiculo_id(marca, placas)').eq('estado', 'PROGRAMADO');
            if (servicios) {
                const hoy = new Date();
                servicios.forEach(srv => {
                    let prioridad = 'BAJA';
                    let mensaje = '';
                    if (srv.fecha_programada) {
                        const fechaSrv = new Date(srv.fecha_programada);
                        const diffTime = fechaSrv - hoy;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays < 0) { 
                            prioridad = 'ALTA'; 
                            mensaje = `Servicio VENCIDO hace ${Math.abs(diffDays)} días para ${srv.vehiculo?.marca} (${srv.vehiculo?.placas}).`; 
                        } else if (diffDays <= 7) { 
                            prioridad = 'MEDIA'; 
                            mensaje = `Servicio próximo a vencer en ${diffDays} días para ${srv.vehiculo?.marca}.`; 
                        } else {
                            mensaje = `Servicio programado el ${fechaSrv.toLocaleDateString('es-MX')} para ${srv.vehiculo?.marca}.`;
                        }
                    } else if (srv.kilometraje_programado) {
                        prioridad = 'MEDIA';
                        mensaje = `Atención al kilometraje de ${srv.vehiculo?.marca} (${srv.vehiculo?.placas}). Servicio toca a los ${srv.kilometraje_programado} km.`;
                    }
                    
                    if (prioridad !== 'BAJA' || srv.kilometraje_programado) {
                        nuevasAlertas.push({
                            id: `srv-${srv.id}`,
                            tipo: 'SERVICIO',
                            prioridad,
                            titulo: 'Mantenimiento Pendiente',
                            mensaje,
                            fecha: srv.fecha_programada ? new Date(srv.fecha_programada) : new Date()
                        });
                    }
                });
            }

            // 3. EVALUAR PERCANCES RECIENTES
            const hace3Dias = new Date();
            hace3Dias.setDate(hace3Dias.getDate() - 3);
            const { data: percances } = await supabase.from('vehiculos_bitacora').select('*, vehiculo:vehiculo_id(marca, placas)').eq('tipo_registro', 'PERCANCE').gte('created_at', hace3Dias.toISOString());
            if (percances) {
                percances.forEach(perc => {
                    nuevasAlertas.push({
                        id: `perc-${perc.id}`,
                        tipo: 'PERCANCE',
                        prioridad: perc.gravedad_percance === 'grave' ? 'ALTA' : 'MEDIA',
                        titulo: 'Percance Reportado',
                        mensaje: `Unidad ${perc.vehiculo?.marca} (${perc.vehiculo?.placas}): ${perc.detalles_incidencia}`,
                        fecha: new Date(perc.created_at)
                    });
                });
            }

            const orden = { 'ALTA': 1, 'MEDIA': 2, 'BAJA': 3 };
            nuevasAlertas.sort((a, b) => orden[a.prioridad] - orden[b.prioridad]);

            setAlertas(nuevasAlertas);
        } catch (error) {
            console.error("Error cargando alertas:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[400] flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right relative">
                
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                    <div>
                        <h3 className="text-xl font-black text-gray-800 flex items-center gap-2"><MdNotifications className="text-blue-600"/> Centro de Alertas</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Radar Proactivo de Flotilla</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm"><MdClose className="text-xl"/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50/30">
                    {loading ? (
                        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>
                    ) : alertas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                            <MdCheckCircle className="text-6xl text-green-500 mb-4"/>
                            <p className="text-sm font-black text-gray-500 uppercase tracking-widest">Todo está en orden</p>
                            <p className="text-xs text-gray-400 mt-2 font-medium">No hay alertas de mantenimiento ni stock bajo.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {alertas.map(alerta => {
                                let Icon = MdNotifications;
                                let colorClass = '';
                                if (alerta.tipo === 'INVENTARIO') { Icon = MdInventory; colorClass = 'text-orange-500 bg-orange-50 border-orange-200'; }
                                if (alerta.tipo === 'SERVICIO') { Icon = MdBuild; colorClass = 'text-blue-500 bg-blue-50 border-blue-200'; }
                                if (alerta.tipo === 'PERCANCE') { Icon = MdWarning; colorClass = 'text-red-500 bg-red-50 border-red-200'; }

                                if (alerta.prioridad === 'ALTA') colorClass = 'text-red-600 bg-red-50 border-red-200';

                                // DISEÑO CORREGIDO: Barra lateral absoluta dentro de un contenedor overflow-hidden
                                return (
                                    <div key={alerta.id} className="relative p-4 rounded-2xl border border-gray-100 bg-white shadow-sm flex gap-4 overflow-hidden group hover:shadow-md transition-shadow">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${alerta.prioridad === 'ALTA' ? 'bg-red-500 animate-pulse' : alerta.prioridad === 'MEDIA' ? 'bg-orange-400' : 'bg-blue-400'}`}></div>
                                        
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border z-10 ${colorClass}`}>
                                            <Icon className="text-lg" />
                                        </div>
                                        <div className="z-10">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-sm font-black text-gray-800">{alerta.titulo}</h4>
                                                {alerta.prioridad === 'ALTA' && <span className="bg-red-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded animate-pulse">Urgente</span>}
                                            </div>
                                            <p className="text-xs text-gray-600 font-medium leading-relaxed mb-2">{alerta.mensaje}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{alerta.fecha.toLocaleDateString('es-MX')}</p>
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