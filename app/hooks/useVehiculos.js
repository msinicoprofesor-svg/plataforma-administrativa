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

    useEffect(() => {
        fetchVehiculos();
    }, []);

    return { vehiculos, loading, refetch: fetchVehiculos };
}