/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/tecnica/MapaGlobal.tsx                             */
/* -------------------------------------------------------------------------- */
'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// CORRECCIÓN NATIVA DE LEAFLET EN REACT PARA LOS ICONOS POR DEFECTO
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// PINES PERSONALIZADOS
const AntenaIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const OltIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const CajaIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [15, 25], iconAnchor: [7, 25], popupAnchor: [1, -20], shadowSize: [25, 25] // Más pequeño para las Cajas NAP
});

export default function MapaGlobal({ zonas = [] }) {
    // Centro por defecto: Aproximación San Diego de la Unión / Guanajuato
    const centroDefecto = [21.4646, -100.8767];

    return (
        <div className="w-full h-full rounded-[2rem] overflow-hidden relative z-0 border border-gray-100 shadow-inner bg-gray-50">
            <MapContainer 
                center={centroDefecto} 
                zoom={10} 
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                zoomControl={false} // Quitamos el control default para que sea más limpio
            >
                {/* MAPA BASE: CARTO VOYAGER (Súper limpio y moderno) */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />

                {zonas.map(zona => {
                    const lat = parseFloat(zona.lat);
                    const lng = parseFloat(zona.lng);
                    const tieneCoordenadas = !isNaN(lat) && !isNaN(lng);

                    return (
                        <div key={zona.id}>
                            {/* NODO PRINCIPAL: TORRE ANTENA u OLT FIBRA */}
                            {tieneCoordenadas && (
                                <>
                                    <Marker position={[lat, lng]} icon={zona.tipo === 'ANTENA' ? AntenaIcon : OltIcon}>
                                        <Popup className="rounded-xl border-none shadow-xl">
                                            <div className="text-center p-1 min-w-[120px]">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{zona.tipo === 'ANTENA' ? 'Torre de Transmisión' : 'Central OLT Fibra'}</p>
                                                <h3 className="font-black text-gray-800 text-sm mt-0.5">{zona.nombreAp || zona.comunidad}</h3>
                                                <p className="text-[10px] font-bold text-gray-500 mt-1">{zona.marca} • {zona.sede}</p>
                                                <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${zona.estatus === 'ACTIVA' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {zona.estatus.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </Popup>
                                    </Marker>

                                    {/* RADIO DE COBERTURA (SÓLO PARA ANTENAS: Aprox 5KM de Radio) */}
                                    {zona.tipo === 'ANTENA' && (
                                        <Circle 
                                            center={[lat, lng]} 
                                            radius={5000} // 5000 metros = 5km
                                            pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.1, weight: 1.5, dashArray: '4' }} 
                                        />
                                    )}
                                </>
                            )}

                            {/* CAJAS NAP (SÓLO PARA FIBRA ÓPTICA) */}
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
                                                <p className="text-[10px] font-bold text-gray-500 mt-1">{caja.calles}</p>
                                                <div className="mt-2 bg-green-50 border border-green-100 rounded-lg p-1.5">
                                                    <p className="text-[10px] font-black text-green-700">{caja.puertosLibres} de {caja.puertosTotales} Libres</p>
                                                </div>
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