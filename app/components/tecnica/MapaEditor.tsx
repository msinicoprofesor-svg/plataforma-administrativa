/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/components/tecnica/MapaEditor.tsx (EDITOR GIS AVANZADO)       */
/* -------------------------------------------------------------------------- */
'use client';
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

// Iconos usando emojis/texto por compatibilidad directa sin importar librerías extra
const AntenaIcon = crearIcono('#f97316', '📡', 34); // Naranja
const OltIcon = crearIcono('#8b5cf6', '🏢', 34); // Morado
const CajaIcon = crearIcono('#22c55e', '🔌', 24); // Verde (Más chiquito)

// ---------------------------------------------------------------------------
// MOTOR MATEMÁTICO: CÁLCULO DE CONO (SECTOR) PARA ANTENAS
// ---------------------------------------------------------------------------
const calcularPoligonoSector = (lat, lng, radioMetros, anguloInicio, amplitud) => {
    if (!lat || !lng || !radioMetros || !amplitud) return [];
    const puntos = [[lat, lng]]; // Empieza en el centro
    const R_TIERRA = 6378137; // Radio de la tierra en metros
    const latRad = (lat * Math.PI) / 180;
    const lngRad = (lng * Math.PI) / 180;
    const dRad = radioMetros / R_TIERRA;

    // Calcular puntos de la curva cada 2 grados para suavidad
    for (let i = anguloInicio; i <= anguloInicio + amplitud; i += 2) {
        const brng = (i * Math.PI) / 180;
        const pLatRad = Math.asin(Math.sin(latRad)*Math.cos(dRad) + Math.cos(latRad)*Math.sin(dRad)*Math.cos(brng));
        const pLngRad = lngRad + Math.atan2(Math.sin(brng)*Math.sin(dRad)*Math.cos(latRad), Math.cos(dRad)-Math.sin(latRad)*Math.sin(pLatRad));
        puntos.push([(pLatRad * 180) / Math.PI, (pLngRad * 180) / Math.PI]);
    }
    puntos.push([lat, lng]); // Cierra el polígono volviendo al centro
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
    coberturaGeo = null, // Estado externo para guardar polígonos/conos
    setCoberturaGeo = () => {}
}) {
    const center = posicionCentro?.lat ? [posicionCentro.lat, posicionCentro.lng] : [21.4646, -100.8767];

    // MANEJADOR DE CLICS (Decide qué hacer según la herramienta seleccionada)
    const handleClic = (latlng) => {
        if (tipoPunto === 'POLIGONO_FIBRA') {
            // Agrega un punto (esquina) al polígono de fibra
            const nuevosPuntos = [...(coberturaGeo?.poligono || []), [latlng.lat, latlng.lng]];
            setCoberturaGeo({ ...coberturaGeo, poligono: nuevosPuntos });
        } else {
            // Mueve el centro de la Antena, OLT o Caja
            setPosicion(latlng);
        }
    };

    // Calcular los puntos del cono de la antena en vivo
    const puntosConoAntena = useMemo(() => {
        if (tipoPunto === 'ANTENA' && posicionCentro?.lat && coberturaGeo?.radio) {
            return calcularPoligonoSector(
                parseFloat(posicionCentro.lat), 
                parseFloat(posicionCentro.lng), 
                coberturaGeo.radio, 
                coberturaGeo.anguloInicio || 0, 
                coberturaGeo.amplitud || 360
            );
        }
        return [];
    }, [posicionCentro, coberturaGeo, tipoPunto]);

    return (
        <div className="w-full h-72 rounded-2xl overflow-hidden border border-gray-200 shadow-inner relative z-0">
            <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                {/* MAPA BASE LIMPIO */}
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                
                {/* DETECTOR DE CLICS */}
                <MapClickHandler onMapClick={handleClic} />
                
                {/* MARCADOR PRINCIPAL (Antena u OLT central) */}
                {posicionCentro?.lat && (tipoPunto === 'ANTENA' || tipoPunto === 'FIBRA') && (
                    <Marker position={[posicionCentro.lat, posicionCentro.lng]} icon={tipoPunto === 'ANTENA' ? AntenaIcon : OltIcon} />
                )}

                {/* MARCADOR DE CAJA (Cuando estás ubicando una caja nueva) */}
                {posicionCentro?.lat && tipoPunto === 'CAJA' && (
                    <Marker position={[posicionCentro.lat, posicionCentro.lng]} icon={CajaIcon} />
                )}

                {/* LISTA DE CAJAS NAP GUARDADAS */}
                {marcadoresExtra.map((m, i) => (
                    m.lat && m.lng && <Marker key={i} position={[m.lat, m.lng]} icon={CajaIcon} />
                ))}

                {/* DIBUJO: CONO DE ANTENA */}
                {puntosConoAntena.length > 0 && (
                    <Polygon positions={puntosConoAntena} pathOptions={{ color: '#ea580c', fillColor: '#ea580c', fillOpacity: 0.2, weight: 2 }} />
                )}

                {/* DIBUJO: POLÍGONO IRREGULAR DE FIBRA */}
                {coberturaGeo?.poligono?.length > 0 && (
                    <Polygon positions={coberturaGeo.poligono} pathOptions={{ color: '#8b5cf6', fillColor: '#8b5cf6', fillOpacity: 0.2, weight: 2, dashArray: '5, 5' }} />
                )}
            </MapContainer>
            
            {/* INSTRUCCIÓN FLOTANTE DINÁMICA */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] font-bold py-2 px-5 rounded-full z-[400] text-center backdrop-blur-md pointer-events-none shadow-xl whitespace-nowrap border border-white/10">
                {tipoPunto === 'CAJA' && '📍 Haz clic para ubicar la Caja NAP'}
                {tipoPunto === 'ANTENA' && '📡 Haz clic para mover la Torre'}
                {tipoPunto === 'FIBRA' && '🏢 Haz clic para mover la Central OLT'}
                {tipoPunto === 'POLIGONO_FIBRA' && '🗺️ Haz clic en las calles para dibujar el borde de cobertura'}
            </div>
        </div>
    );
}