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

    const agregarVehiculo = async (nuevoVehiculo, imagenFile) => {
        let imagen_url = null;

        if (imagenFile) {
            const fileExt = imagenFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `vehiculos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('vehiculos-fotos')
                .upload(filePath, imagenFile);

            if (uploadError) {
                console.error("Error subiendo foto:", uploadError);
                alert(`Error al subir foto: ${uploadError.message}`);
                return { success: false, error: uploadError };
            }

            const { data: publicUrlData } = supabase.storage
                .from('vehiculos-fotos')
                .getPublicUrl(filePath);

            imagen_url = publicUrlData.publicUrl;
        }

        const payload = { ...nuevoVehiculo };
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

    // NUEVO: Función para que el administrador asigne o libere un vehículo
    const asignarVehiculo = async (vehiculoId, responsableId) => {
        // responsableId puede ser el ID del técnico, o "null" para liberarlo
        const { error } = await supabase
            .from('vehiculos')
            .update({ responsable_id: responsableId })
            .eq('id', vehiculoId);

        if (!error) {
            await fetchVehiculos();
            return { success: true };
        } else {
            console.error("Error al asignar vehículo:", error);
            alert(`Error al asignar: ${error.message}`);
            return { success: false, error };
        }
    };

    useEffect(() => {
        fetchVehiculos();
    }, []);

    return { vehiculos, loading, agregarVehiculo, asignarVehiculo, refetch: fetchVehiculos };
}