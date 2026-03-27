/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/tecnica/MapaGlobal.tsx (VISUALIZADOR GIS)          */
/* -------------------------------------------------------------------------- */
'use client';
import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MdWifi, MdCable } from 'react-icons/md';

// ICONOS MINIMALISTAS
const crearIcono = (color, iconoSVG, size = 32) => L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"><span style="color: white; font-size: ${size * 0.5}px;">${iconoSVG}</span></div>`,
    iconSize: [size, size], iconAnchor: [size/2, size]
});
const AntenaIcon = crearIcono('#ea580c', '📡', 34); 
const OltIcon = crearIcono('#8b5cf6', '🏢', 34); 
const CajaIcon = crearIcono('#22c55e', '🔌', 24);

// MOTOR MATEMÁTICO DE DIBUJO (Misma lógica que el editor)
const calcularPoligonoSector = (lat, lng, radioMetros, anguloInicio, amplitud) => {
    if (!lat || !lng || !radioMetros || !amplitud) return [];
    const puntos = [[lat, lng]]; 
    const R_TIERRA = 6378137; 
    const latRad = (lat * Math.PI) / 180;
    const lngRad = (lng * Math.PI) / 180;
    const dRad = radioMetros / R_TIERRA;

    for (let i = anguloInicio; i <= anguloInicio + amplitud; i += 2) {
        const brng = (i * Math.PI) / 180;
        const pLatRad = Math.asin(Math.sin(latRad)*Math.cos(dRad) + Math.cos(latRad)*Math.sin(dRad)*Math.cos(brng));
        const pLngRad = lngRad + Math.atan2(Math.sin(brng)*Math.sin(dRad)*Math.cos(latRad), Math.cos(dRad)-Math.sin(latRad)*Math.sin(pLatRad));
        puntos.push([(pLatRad * 180) / Math.PI, (pLngRad * 180) / Math.PI]);
    }
    puntos.push([lat, lng]); 
    return puntos;
};

// COMPONENTE PARA MOVER EL MAPA
function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function MapaGlobal({ zonas = [] }) {
    const [zonaFocuseada, setZonaFocuseada] = useState(null);

    const centroDefecto = [21.4646, -100.8767];
    const centroDinamico = zonaFocuseada && zonaFocuseada.lat ? [parseFloat(zonaFocuseada.lat), parseFloat(zonaFocuseada.lng)] : centroDefecto;

    return (
        <div className="w-full h-full rounded-[2.5rem] overflow-hidden relative z-0 border border-gray-200 shadow-inner bg-gray-50 flex flex-col">
            
            {/* MINI TARJETAS HORIZONTALES FLOTANTES */}
            <div className="absolute top-4 left-4 right-4 z-[400] flex gap-3 overflow-x-auto pb-4 custom-scrollbar pointer-events-auto">
                {zonas.slice(0, 10).map(z => ( // Mostramos max 10 para no saturar la memoria
                    <div key={z.id} onClick={() => setZonaFocuseada(z)} className={`shrink-0 w-64 p-3 rounded-2xl bg-white/90 backdrop-blur-md shadow-lg border cursor-pointer transition-all hover:scale-105 ${zonaFocuseada?.id === z.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'}`}>
                        <div className="flex justify-between items-center mb-1">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${z.tipo === 'FIBRA' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>{z.tipo}</span>
                            <span className="text-[10px] font-bold text-gray-400">{z.sede}</span>
                        </div>
                        <h4 className="text-sm font-black text-gray-800 truncate">{z.nombreAp || z.comunidad}</h4>
                    </div>
                ))}
            </div>

            <MapContainer center={centroDefecto} zoom={11} style={{ height: '100%', width: '100%', zIndex: 0 }} zoomControl={false}>
                <ChangeView center={centroDinamico} zoom={zonaFocuseada ? 14 : 11} />
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

                {zonas.map(zona => {
                    const lat = parseFloat(zona.lat);
                    const lng = parseFloat(zona.lng);
                    if (isNaN(lat) || isNaN(lng)) return null;

                    // Extracción de datos Geo Espaciales
                    const geo = zona.coberturaGeo || {};

                    return (
                        <div key={zona.id}>
                            {/* PINES CENTRALES */}
                            <Marker position={[lat, lng]} icon={zona.tipo === 'ANTENA' ? AntenaIcon : OltIcon}>
                                <Popup className="rounded-xl border-none shadow-xl">
                                    <div className="text-center p-1 min-w-[120px]">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{zona.tipo === 'ANTENA' ? 'Torre de Transmisión' : 'Central OLT Fibra'}</p>
                                        <h3 className="font-black text-gray-800 text-sm mt-0.5">{zona.nombreAp || zona.comunidad}</h3>
                                        <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${zona.estatus === 'ACTIVA' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{zona.estatus.replace('_', ' ')}</span>
                                    </div>
                                </Popup>
                            </Marker>

                            {/* DIBUJO ANTENA: CONO SECTORIAL O CÍRCULO */}
                            {zona.tipo === 'ANTENA' && geo.radio && (
                                <Polygon 
                                    positions={calcularPoligonoSector(lat, lng, geo.radio, geo.anguloInicio || 0, geo.amplitud || 360)} 
                                    pathOptions={{ color: '#ea580c', fillColor: '#ea580c', fillOpacity: 0.15, weight: 2 }} 
                                />
                            )}

                            {/* DIBUJO FIBRA: POLÍGONO IRREGULAR */}
                            {zona.tipo === 'FIBRA' && geo.poligono?.length > 0 && (
                                <Polygon positions={geo.poligono} pathOptions={{ color: '#8b5cf6', fillColor: '#8b5cf6', fillOpacity: 0.15, weight: 2, dashArray: '5, 5' }} />
                            )}

                            {/* PINES DE CAJAS NAP */}
                            {zona.tipo === 'FIBRA' && zona.cajas?.map(caja => {
                                const cLat = parseFloat(caja.lat);
                                const cLng = parseFloat(caja.lng);
                                if (isNaN(cLat) || isNaN(cLng)) return null;

                                return (
                                    <Marker key={caja.id} position={[cLat, cLng]} icon={CajaIcon}>
                                        <Popup>
                                            <div className="text-center p-1 min-w-[100px]">
                                                <p className="text-[9px] font-black text-green-500 uppercase tracking-widest">Caja NAP</p>
                                                <h4 className="font-black text-gray-800 text-xs mt-0.5">{caja.nombre}</h4>
                                                <div className="mt-2 bg-green-50 border border-green-100 rounded-lg p-1.5"><p className="text-[10px] font-black text-green-700">{caja.puertosLibres} de {caja.puertosTotales} Libres</p></div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )
                            })}
                        </div>
                    );
                })}
            </MapContainer>
        </div>
    );
}