/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/tecnica/MapaEditor.tsx                             */
/* -------------------------------------------------------------------------- */
'use client';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// CORRECCIÓN NATIVA DE LEAFLET
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
    iconSize: [25, 41], iconAnchor: [12, 41]
});

const OltIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41]
});

const CajaIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [15, 25], iconAnchor: [7, 25]
});

// DETECTOR DE CLICS EN EL MAPA
function MapClickHandler({ onMapClick }) {
    useMapEvents({
        click(e) {
            onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
    });
    return null;
}

export default function MapaEditor({ posicionCentro, setPosicion, tipoPunto = 'ANTENA', marcadoresExtra = [] }) {
    // Centro por defecto (San Diego de la Unión aprox)
    const center = posicionCentro?.lat ? [posicionCentro.lat, posicionCentro.lng] : [21.4646, -100.8767];

    const iconMap = { 'ANTENA': AntenaIcon, 'FIBRA': OltIcon, 'CAJA': CajaIcon };

    return (
        <div className="w-full h-64 rounded-2xl overflow-hidden border border-gray-200 shadow-inner relative z-0">
            <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                
                {/* ACTIVA EL DETECTOR DE CLICS */}
                <MapClickHandler onMapClick={setPosicion} />
                
                {/* MARCADOR PRINCIPAL (El que se está moviendo) */}
                {posicionCentro?.lat && (
                    <Marker position={[posicionCentro.lat, posicionCentro.lng]} icon={iconMap[tipoPunto]} />
                )}

                {/* MARCADORES EXTRAS (Ej. Cajas NAP que ya se guardaron en la lista) */}
                {marcadoresExtra.map((m, i) => (
                    m.lat && m.lng && <Marker key={i} position={[m.lat, m.lng]} icon={CajaIcon} />
                ))}
            </MapContainer>
            
            {/* INSTRUCCIÓN FLOTANTE */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] font-bold py-1.5 px-4 rounded-xl z-[400] text-center backdrop-blur-sm pointer-events-none shadow-lg whitespace-nowrap">
                Haz clic en el mapa para colocar el pin de {tipoPunto === 'CAJA' ? 'la Caja NAP' : 'la Central/Torre'}
            </div>
        </div>
    );
}