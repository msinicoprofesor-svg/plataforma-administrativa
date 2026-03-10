/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/hooks/useVehiculos.js                                         */
/* -------------------------------------------------------------------------- */
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useVehiculos() {
    const [vehiculos, setVehiculos] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchVehiculos = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('vehiculos')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (!error && data) {
            setVehiculos(data);
        } else if (error) {
            console.error("Error al cargar vehículos:", error);
        }
        setLoading(false);
    };

    // MODIFICADO: Ahora recibe los renders interactivos como tercer parámetro
    const agregarVehiculo = async (nuevoVehiculo, imagenFile, archivosRenders = {}) => {
        let imagen_url = null;

        // 1. Subir la miniatura principal
        if (imagenFile) {
            const fileExt = imagenFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `vehiculos/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('vehiculos-fotos').upload(filePath, imagenFile);
            if (!uploadError) {
                const { data } = supabase.storage.from('vehiculos-fotos').getPublicUrl(filePath);
                imagen_url = data.publicUrl;
            } else {
                console.error("Error subiendo foto principal:", uploadError);
            }
        }

        // 2. Subir los renders interactivos (si existen)
        const urlsRenders = {};
        for (const [key, file] of Object.entries(archivosRenders)) {
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `render-${key}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `vehiculos/${fileName}`;

                const { error: uploadError } = await supabase.storage.from('vehiculos-fotos').upload(filePath, file);
                if (!uploadError) {
                    const { data } = supabase.storage.from('vehiculos-fotos').getPublicUrl(filePath);
                    urlsRenders[key] = data.publicUrl;
                } else {
                    console.error(`Error subiendo render ${key}:`, uploadError);
                }
            }
        }

        // 3. Empaquetar todo
        const payload = { ...nuevoVehiculo, ...urlsRenders };
        if (imagen_url) payload.imagen_url = imagen_url;

        const { error } = await supabase.from('vehiculos').insert([payload]);
        
        if (!error) {
            await fetchVehiculos();
            return { success: true };
        } else {
            console.error("Error al agregar vehículo:", error);
            alert(`Error al registrar: ${error.message}`);
            return { success: false, error };
        }
    };

    const asignarVehiculo = async (vehiculoId, responsableId) => {
        const { error } = await supabase.from('vehiculos').update({ responsable_id: responsableId }).eq('id', vehiculoId);
        if (!error) {
            await fetchVehiculos();
            return { success: true };
        } else {
            console.error("Error al asignar vehículo:", error);
            alert(`Error al asignar: ${error.message}`);
            return { success: false, error };
        }
    };

    useEffect(() => { fetchVehiculos(); }, []);

    return { vehiculos, loading, agregarVehiculo, asignarVehiculo, refetch: fetchVehiculos };
}