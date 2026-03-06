/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/atencion-cliente/views/MapaRutas.tsx               */
/* -------------------------------------------------------------------------- */
'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix profesional para los iconos de Leaflet en Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// AÑADIDO: Recibe la variable "dibujarRuta" para saber si debe conectar los puntos con una línea
export default function MapaRutas({ tickets, onVerDetalles, dibujarRuta = false }) {
    // Centro por defecto: Doctor Mora, Guanajuato
    const defaultCenter = [21.1444, -100.3167];

    // Preparamos las coordenadas para asegurar que todas tengan un punto y la línea se pueda dibujar
    const puntosValidos = tickets.map((ticket, index) => {
        // En lugar de usar random() (que hacía bailar los pines), usamos un offset matemático predecible 
        // para los tickets que aún no tienen coordenadas reales, así la línea se dibuja estable.
        const lat = ticket.latitud || defaultCenter[0] + (index * 0.003);
        const lng = ticket.longitud || defaultCenter[1] + (index * 0.003);
        return { ...ticket, lat, lng };
    });

    // Extraemos solo los arreglos de [lat, lng] requeridos por la etiqueta Polyline
    const routeCoordinates = puntosValidos.map(t => [t.lat, t.lng]);

    return (
        <MapContainer 
            center={defaultCenter} 
            zoom={14} 
            style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
            {/* Capa de OpenStreetMap (Gratuita y profesional) */}
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            
            {/* LA MAGIA: Dibuja la línea conectando los puntos si seleccionaste a un técnico */}
            {dibujarRuta && routeCoordinates.length > 1 && (
                <Polyline 
                    positions={routeCoordinates} 
                    pathOptions={{ color: '#2563EB', weight: 4, dashArray: '10, 10', opacity: 0.8 }} 
                />
            )}

            {puntosValidos.map((ticket, index) => {
                return (
                    <Marker key={ticket.id} position={[ticket.lat, ticket.lng]}>
                        <Popup className="rounded-2xl">
                            <div className="text-center p-1">
                                
                                {/* Mostramos el número de orden encima del badge de prioridad si estamos viendo una ruta */}
                                {dibujarRuta && (
                                    <div className="mb-2 flex justify-center">
                                        <span className="w-6 h-6 bg-blue-600 text-white text-[10px] font-black flex items-center justify-center rounded-full shadow-md">
                                            {index + 1}
                                        </span>
                                    </div>
                                )}

                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-white shadow-sm mb-2 inline-block ${
                                    ticket.prioridad === 'Crítica' ? 'bg-red-500' : 
                                    ticket.prioridad === 'Alta' ? 'bg-orange-500' : 
                                    ticket.prioridad === 'Media' ? 'bg-blue-500' : 'bg-gray-400'
                                }`}>
                                    {ticket.prioridad}
                                </span>
                                <h4 className="text-sm font-black text-gray-800 leading-tight mb-1">{ticket.cliente}</h4>
                                <p className="text-[10px] font-bold text-gray-500 mb-3">{ticket.zona}</p>
                                <button 
                                    onClick={() => onVerDetalles(ticket)}
                                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-black py-2 rounded-lg transition-colors"
                                >
                                    Ver Detalles
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}