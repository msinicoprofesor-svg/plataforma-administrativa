/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/hooks/useClientes.js                                          */
/* -------------------------------------------------------------------------- */
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useClientes() {
    const [clientes, setClientes] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [regiones, setRegiones] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCatalogos();
        fetchClientes();
    }, []);

    const fetchCatalogos = async () => {
        const [resMarcas, resRegiones] = await Promise.all([
            supabase.from('marcas').select('*'),
            supabase.from('regiones').select('*')
        ]);
        if (!resMarcas.error) setMarcas(resMarcas.data);
        if (!resRegiones.error) setRegiones(resRegiones.data);
    };

    const fetchClientes = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('clientes')
            .select(`
                *,
                marcas (nombre),
                regiones (nombre)
            `)
            .order('created_at', { ascending: false });
        
        if (!error && data) {
            const clientesFormateados = data.map(c => ({
                id: c.id,
                nombre: c.nombre_completo,
                contrato: c.numero_contrato || 'Sin contrato',
                marca: c.marcas?.nombre || 'N/A',
                region: c.regiones?.nombre || 'N/A',
                estado: c.estado_servicio,
                telefono: c.telefono || 'N/A',
                direccion: c.direccion || '',
                marca_id: c.marca_id,
                region_id: c.region_id,
                // NUEVO: Extraemos coordenadas de la base de datos
                latitud: c.latitud,
                longitud: c.longitud
            }));
            setClientes(clientesFormateados);
        }
        setLoading(false);
    };

    const agregarCliente = async (datosNuevoCliente) => {
        const { data, error } = await supabase.from('clientes').insert([datosNuevoCliente]).select();
        if (!error) fetchClientes(); 
        return { data, error };
    };

    const actualizarCliente = async (id, datos) => {
        const { error } = await supabase.from('clientes').update(datos).eq('id', id);
        if (!error) fetchClientes();
        return { error };
    };

    return { 
        clientes, marcas, regiones, loading, 
        agregarCliente, actualizarCliente, refetch: fetchClientes 
    };
}