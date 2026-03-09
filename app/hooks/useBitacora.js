/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/hooks/useBitacora.js                                          */
/* -------------------------------------------------------------------------- */
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function useBitacora() {
    const [loading, setLoading] = useState(false);

    const guardarBitacora = async (datosBitacora, evidenciaFile = null) => {
        setLoading(true);
        let evidencia_url = null;

        try {
            // 1. Si hay foto de evidencia (ej. un golpe o llanta baja), la subimos
            if (evidenciaFile) {
                const fileExt = evidenciaFile.name.split('.').pop();
                const fileName = `evidencia-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `incidencias/${fileName}`; // Lo guardamos ordenado en una subcarpeta

                const { error: uploadError } = await supabase.storage
                    .from('vehiculos-fotos')
                    .upload(filePath, evidenciaFile);

                if (uploadError) throw uploadError;

                // Obtenemos el link público de la evidencia
                const { data: publicUrlData } = supabase.storage
                    .from('vehiculos-fotos')
                    .getPublicUrl(filePath);

                evidencia_url = publicUrlData.publicUrl;
            }

            // 2. Preparamos el paquete de datos y lo enviamos a la BD
            const payload = { ...datosBitacora };
            if (evidencia_url) payload.evidencia_url = evidencia_url;

            const { error } = await supabase.from('vehiculos_bitacora').insert([payload]);
            if (error) throw error;

            setLoading(false);
            return { success: true };

        } catch (error) {
            console.error("Error al guardar bitácora:", error);
            setLoading(false);
            alert(`Error al guardar: ${error.message}`);
            return { success: false, error };
        }
    };

    return { guardarBitacora, loading };
}