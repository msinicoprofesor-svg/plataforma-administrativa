/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/tecnica/MapaEditor.tsx                             */
/* -------------------------------------------------------------------------- */
'use client';
import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ---------------------------------------------------------------------------
// ICONOS MINIMALISTAS SVG PERSONALIZADOS
// ---------------------------------------------------------------------------
const crearIcono = (color, iconoSVG, size = 32) => L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
            <span style="color: white; font-size: ${size * 0.5}px;">${iconoSVG}</span>
           </div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size]
});

const AntenaIcon = crearIcono('#ea580c', '📡', 34); 
const OltIcon = crearIcono('#8b5cf6', '🏢', 34); 
const CajaIcon = crearIcono('#22c55e', '🔌', 24); 

// ---------------------------------------------------------------------------
// MOTOR MATEMÁTICO: CÁLCULO DE CONO (SECTOR)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// DETECTOR DE CLICS INTELIGENTE
// ---------------------------------------------------------------------------
function MapClickHandler({ onMapClick }) {
    useMapEvents({
        click(e) { onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng }); }
    });
    return null;
}

export default function MapaEditor({ 
    posicionCentro, 
    setPosicion, 
    tipoPunto = 'ANTENA', 
    marcadoresExtra = [],
    coberturaGeo = null, 
    setCoberturaGeo = () => {}
}) {
    // VALIDACIÓN NUMÉRICA ESTRICTA
    const cLat = parseFloat(posicionCentro?.lat);
    const cLng = parseFloat(posicionCentro?.lng);
    const hasCenter = !isNaN(cLat) && !isNaN(cLng);
    const center = hasCenter ? [cLat, cLng] : [21.4646, -100.8767];

    const handleClic = (latlng) => {
        if (tipoPunto === 'POLIGONO_FIBRA') {
            const nuevosPuntos = [...(coberturaGeo?.poligono || []), [latlng.lat, latlng.lng]];
            setCoberturaGeo({ ...coberturaGeo, poligono: nuevosPuntos });
        } else {
            setPosicion(latlng);
        }
    };

    const puntosConoAntena = useMemo(() => {
        if (tipoPunto === 'ANTENA' && hasCenter && coberturaGeo?.radio) {
            return calcularPoligonoSector(
                cLat, cLng, coberturaGeo.radio, coberturaGeo.anguloInicio || 0, coberturaGeo.amplitud || 360
            );
        }
        return [];
    }, [cLat, cLng, coberturaGeo, tipoPunto, hasCenter]);

    return (
        // FIX: h-full y flex-1 para que rellene todo el espacio disponible
        <div className="w-full h-full min-h-[300px] flex-1 rounded-[2rem] overflow-hidden border border-gray-200 shadow-inner relative z-0">
            <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                
                <MapClickHandler onMapClick={handleClic} />
                
                {/* FIX: DIBUJAR MARCADOR PRINCIPAL SEGÚN TECNOLOGÍA */}
                {hasCenter && (tipoPunto === 'ANTENA' || tipoPunto === 'FIBRA') && (
                    <Marker position={[cLat, cLng]} icon={tipoPunto === 'ANTENA' ? AntenaIcon : OltIcon} />
                )}

                {hasCenter && tipoPunto === 'CAJA' && (
                    <Marker position={[cLat, cLng]} icon={CajaIcon} />
                )}

                {marcadoresExtra.map((m, i) => {
                    const mLat = parseFloat(m.lat);
                    const mLng = parseFloat(m.lng);
                    if (isNaN(mLat) || isNaN(mLng)) return null;
                    return <Marker key={i} position={[mLat, mLng]} icon={CajaIcon} />;
                })}

                {puntosConoAntena.length > 0 && (
                    <Polygon positions={puntosConoAntena} pathOptions={{ color: '#ea580c', fillColor: '#ea580c', fillOpacity: 0.2, weight: 2 }} />
                )}

                {coberturaGeo?.poligono?.length > 0 && (
                    <Polygon positions={coberturaGeo.poligono} pathOptions={{ color: '#8b5cf6', fillColor: '#8b5cf6', fillOpacity: 0.2, weight: 2, dashArray: '5, 5' }} />
                )}
            </MapContainer>
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] font-bold py-2 px-5 rounded-full z-[400] text-center backdrop-blur-md pointer-events-none shadow-xl whitespace-nowrap border border-white/10">
                {tipoPunto === 'CAJA' && '📍 Haz clic para ubicar la Caja NAP'}
                {tipoPunto === 'ANTENA' && '📡 Haz clic para mover la Torre'}
                {tipoPunto === 'FIBRA' && '🏢 Haz clic para mover la Central OLT'}
                {tipoPunto === 'POLIGONO_FIBRA' && '🗺️ Haz clic en las calles para dibujar el perímetro'}
            </div>
        </div>
    );
}