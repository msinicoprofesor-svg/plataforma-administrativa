/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/hooks/useInventarioOperativo.js (MIGRADO A SUPABASE)          */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // <-- CONEXIÓN OFICIAL

export function useInventarioOperativo() {
  const [inventario, setInventario] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // --- MAPERS: Traductores Frontend <-> Base de Datos ---
  const mapInvFromDB = (db) => ({
    id: db.id, nombre: db.nombre, almacen: db.almacen, 
    categoria: db.categoria, stock: db.stock, minimo: db.minimo, unidad: db.unidad
  });

  const mapInvToDB = (inv) => ({
    id: inv.id, nombre: inv.nombre, almacen: inv.almacen, 
    categoria: inv.categoria, stock: inv.stock, minimo: inv.minimo, unidad: inv.unidad
  });

  const mapMovFromDB = (db) => ({
    id: db.id, fecha: db.fecha, productoId: db.producto_id, 
    cantidad: db.cantidad, tipo: db.tipo, motivo: db.motivo, usuario: db.usuario
  });

  const mapMovToDB = (mov) => ({
    id: mov.id.toString(), fecha: mov.fecha, producto_id: mov.productoId, 
    cantidad: mov.cantidad, tipo: mov.tipo, motivo: mov.motivo, usuario: mov.usuario
  });

  // --- 1. CARGA INICIAL DESDE SUPABASE ---
  useEffect(() => {
    const cargarDatos = async () => {
        setCargando(true);
        try {
            // Cargar Inventario
            const { data: dInv, error: eInv } = await supabase.from('inventario_operativo').select('*');
            if (eInv) throw eInv;
            if (dInv) setInventario(dInv.map(mapInvFromDB));

            // Cargar Movimientos (Kardex)
            const { data: dMov, error: eMov } = await supabase
                .from('inventario_movimientos')
                .select('*')
                .order('created_at', { ascending: false });
            if (eMov) throw eMov;
            if (dMov) setMovimientos(dMov.map(mapMovFromDB));

        } catch (error) {
            console.error("Error cargando Inventario Operativo:", error);
        } finally {
            setCargando(false);
        }
    };
    cargarDatos();
  }, []);

  // --- 2. REGISTRAR MOVIMIENTO (Entradas / Salidas) ---
  const registrarMovimiento = async (productoId, cantidad, tipo, motivo, usuario) => {
    const productoActual = inventario.find(p => p.id === productoId);
    if (!productoActual) return;

    const cantNum = parseInt(cantidad, 10);
    const nuevoStock = tipo === 'ENTRADA' ? productoActual.stock + cantNum : productoActual.stock - cantNum;

    // 1. Actualización Inmediata UI (Optimista)
    setInventario(prev => prev.map(p => p.id === productoId ? { ...p, stock: nuevoStock } : p));

    const nuevoMovimiento = {
        id: `MOV-${Date.now()}`,
        fecha: new Date().toISOString(), // Formato ISO para BD
        productoId,
        cantidad: cantNum,
        tipo,
        motivo,
        usuario
    };
    
    setMovimientos(prev => [nuevoMovimiento, ...prev]);

    // 2. Actualizar en Internet (Supabase)
    try {
        // Ejecutar en paralelo: Actualizar stock e insertar en Kardex
        await Promise.all([
            supabase.from('inventario_operativo').update({ stock: nuevoStock }).eq('id', productoId),
            supabase.from('inventario_movimientos').insert([mapMovToDB(nuevoMovimiento)])
        ]);
    } catch (error) {
        console.error("Error al registrar movimiento en BD:", error);
    }
  };

  // --- 3. AGREGAR NUEVO PRODUCTO AL CATÁLOGO ---
  const agregarProducto = async (nuevoProd) => {
      const prod = { ...nuevoProd, id: `INV-${Date.now()}`, stock: 0 };
      setInventario(prev => [...prev, prod]);
      await supabase.from('inventario_operativo').insert([mapInvToDB(prod)]);
  };

  return { inventario, movimientos, cargando, registrarMovimiento, agregarProducto };
}