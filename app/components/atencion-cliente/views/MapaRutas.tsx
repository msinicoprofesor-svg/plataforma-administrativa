/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/atencion-cliente/views/MapaRutas.tsx               */
/* -------------------------------------------------------------------------- */
'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix profesional para los iconos de Leaflet en Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapaRutas({ tickets, onVerDetalles }) {
    // Centro por defecto: Doctor Mora, Guanajuato
    const defaultCenter = [21.1444, -100.3167];

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
            
            {tickets.map((ticket, index) => {
                // Si la BD tiene coordenadas, las usa. Si no, genera unas falsas cerca del centro para visualización inicial
                const lat = ticket.latitud || defaultCenter[0] + (Math.random() - 0.5) * 0.02;
                const lng = ticket.longitud || defaultCenter[1] + (Math.random() - 0.5) * 0.02;

                return (
                    <Marker key={ticket.id} position={[lat, lng]}>
                        <Popup className="rounded-2xl">
                            <div className="text-center p-1">
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