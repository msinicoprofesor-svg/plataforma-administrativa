/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/hooks/useBitacora.js                                          */
/* -------------------------------------------------------------------------- */
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function useBitacora() {
    const [loading, setLoading] = useState(false);

    // MODIFICADO: Ahora recibe odometroFile como tercer parámetro
    const guardarBitacora = async (datosBitacora, evidenciaFile = null, odometroFile = null) => {
        setLoading(true);
        let evidencia_url = null;
        let odometro_url = null; // NUEVA VARIABLE

        try {
            // 1. Subir foto de evidencia de daños (si existe)
            if (evidenciaFile) {
                const fileExt = evidenciaFile.name.split('.').pop();
                const fileName = `evidencia-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `incidencias/${fileName}`;

                const { error: uploadError } = await supabase.storage.from('vehiculos-fotos').upload(filePath, evidenciaFile);
                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage.from('vehiculos-fotos').getPublicUrl(filePath);
                evidencia_url = publicUrlData.publicUrl;
            }

            // 2. Subir foto del odómetro (NUEVO)
            if (odometroFile) {
                const fileExt = odometroFile.name.split('.').pop();
                const fileName = `odometro-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `odometros/${fileName}`; // Subcarpeta ordenada para odómetros

                const { error: uploadError } = await supabase.storage.from('vehiculos-fotos').upload(filePath, odometroFile);
                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage.from('vehiculos-fotos').getPublicUrl(filePath);
                odometro_url = publicUrlData.publicUrl;
            }

            // 3. Preparamos el paquete de datos y lo enviamos a la BD
            const payload = { ...datosBitacora };
            if (evidencia_url) payload.evidencia_url = evidencia_url;
            if (odometro_url) payload.odometro_url = odometro_url; // Inyectamos la URL del odómetro

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