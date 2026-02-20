/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/hooks/useLikeStore.js (MIGRADO A SUPABASE)                    */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // <-- CONEXIÓN OFICIAL

export function useLikeStore() {
  const [productos, setProductos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [cupones, setCupones] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estado para Notificaciones (Local por sesión)
  const [alertas, setAlertas] = useState([]);
  const [alertasLeidas, setAlertasLeidas] = useState([]); 

  // --- MAPERS: Traductores Frontend <-> Base de Datos ---
  const mapProdToDB = (p) => ({
      id: p.id, nombre: p.nombre, categoria: p.categoria, 
      puntos: p.puntos, stock: p.stock, caducidad: p.caducidad || null, imagen: p.imagen
  });

  const mapHistFromDB = (db) => ({
      id: db.id, fecha: db.fecha, tipo: db.tipo, colaborador: db.colaborador, 
      detalle: db.detalle, totalPuntos: db.total_puntos, nota: db.nota
  });

  const mapHistToDB = (h) => ({
      id: h.id, fecha: h.fecha, tipo: h.tipo, colaborador: h.colaborador, 
      detalle: h.detalle, total_puntos: h.totalPuntos, nota: h.nota
  });

  // --- 1. CARGA INICIAL DESDE SUPABASE ---
  useEffect(() => {
    const cargarDatos = async () => {
        setCargando(true);
        try {
            // Cargar Productos
            const { data: dProd } = await supabase.from('likestore_productos').select('*');
            if (dProd) setProductos(dProd);

            // Cargar Historial
            const { data: dHist } = await supabase.from('likestore_historial').select('*').order('created_at', { ascending: false });
            if (dHist) setHistorial(dHist.map(mapHistFromDB));

            // Cargar Cupones
            const { data: dCup } = await supabase.from('likestore_cupones').select('*');
            if (dCup) setCupones(dCup);
        } catch (error) {
            console.error("Error cargando LikeStore:", error);
        } finally {
            setCargando(false);
        }
    };
    cargarDatos();
  }, []);

  // --- 2. SISTEMA DE NOTIFICACIONES (Mantiene tu lógica original) ---
  useEffect(() => {
    const nuevasAlertas = [];
    const hoy = new Date();

    productos.forEach(prod => {
        if (prod.stock <= 5 && prod.categoria !== 'BENEFICIOS') {
            nuevasAlertas.push({
                id: `STOCK-${prod.id}`, productoId: prod.id, titulo: 'Stock Bajo',
                mensaje: `Quedan ${prod.stock} piezas de ${prod.nombre}`, tipo: 'STOCK', severidad: 'orange'
            });
        }
        if (prod.caducidad) {
            const fechaCad = new Date(prod.caducidad);
            const diffDias = Math.ceil((fechaCad - hoy) / (1000 * 60 * 60 * 24));
            
            if (diffDias < 0) {
                nuevasAlertas.push({ 
                    id: `CAD-${prod.id}`, productoId: prod.id, titulo: 'Producto Caducado',
                    mensaje: `¡${prod.nombre} venció hace ${Math.abs(diffDias)} días!`, tipo: 'CADUCIDAD', severidad: 'red' 
                });
            } else if (diffDias <= 15) {
                nuevasAlertas.push({ 
                    id: `WARN-${prod.id}`, productoId: prod.id, titulo: 'Próximo a Vencer',
                    mensaje: `${prod.nombre} caduca en ${diffDias} días`, tipo: 'CADUCIDAD', severidad: 'yellow' 
                });
            }
        }
    });
    setAlertas(nuevasAlertas);
  }, [productos]);

  // --- 3. FUNCIONES DE GESTIÓN DE PRODUCTOS ---
  const guardarProducto = async (producto) => {
    const id = producto.id || `LS-${Date.now()}`;
    const prodFinal = { ...producto, id };

    // Actualización Inmediata UI
    setProductos(prev => prev.find(p => p.id === id) ? prev.map(p => p.id === id ? prodFinal : p) : [...prev, prodFinal]);
    setAlertasLeidas(prev => prev.filter(aid => !aid.includes(id)));

    // Base de datos
    await supabase.from('likestore_productos').upsert([mapProdToDB(prodFinal)]);
  };

  const eliminarProducto = async (id) => {
    setProductos(prev => prev.filter(p => p.id !== id));
    await supabase.from('likestore_productos').delete().eq('id', id);
  };

  const ajustarStockRapido = async (idProducto, cantidad, motivo, nuevaCaducidad = null) => {
    const producto = productos.find(p => p.id === idProducto);
    if (!producto || producto.stock + cantidad < 0) return;

    let productoActualizado = null;

    const nuevosProductos = productos.map(p => {
        if (p.id === idProducto) {
            productoActualizado = { ...p, stock: p.stock + cantidad, caducidad: nuevaCaducidad || p.caducidad };
            return productoActualizado;
        }
        return p;
    });

    setProductos(nuevosProductos);
    if (nuevaCaducidad) setAlertasLeidas(prev => prev.filter(id => !id.includes(idProducto)));

    const registro = {
        id: `AJ-${Date.now()}`, fecha: new Date().toLocaleString(),
        tipo: cantidad > 0 ? 'ENTRADA' : 'SALIDA',
        colaborador: 'Administrador (Ajuste)', detalle: `${Math.abs(cantidad)}x ${producto.nombre}`,
        totalPuntos: 0, nota: motivo
    };

    setHistorial(prev => [registro, ...prev]);

    // Actualizar BD
    await supabase.from('likestore_productos').update(mapProdToDB(productoActualizado)).eq('id', idProducto);
    await supabase.from('likestore_historial').insert([mapHistToDB(registro)]);
  };

  const registrarTransaccion = async (items, tipo, colaborador, nota = '') => {
    const productosAActualizar = [];

    const nuevosProductos = productos.map(prod => {
        const itemEnCarrito = items.find(i => i.id === prod.id);
        if (itemEnCarrito) {
            const nuevoStock = tipo === 'ENTRADA' 
                ? parseInt(prod.stock) + parseInt(itemEnCarrito.cantidad)
                : parseInt(prod.stock) - parseInt(itemEnCarrito.cantidad);
            const pActualizado = { ...prod, stock: nuevoStock };
            productosAActualizar.push(pActualizado);
            return pActualizado;
        }
        return prod;
    });

    setProductos(nuevosProductos);

    const registro = {
        id: `TR-${Date.now()}`, fecha: new Date().toLocaleString(), tipo, 
        colaborador: colaborador?.nombre || 'Administrador',
        detalle: items.map(i => `${i.cantidad}x ${i.nombre}`).join(', '),
        totalPuntos: items.reduce((sum, i) => sum + (i.puntos * i.cantidad), 0), nota
    };
    
    setHistorial(prev => [registro, ...prev]);

    if (tipo === 'ENTRADA') {
        const idsAfectados = items.map(i => i.id);
        setAlertasLeidas(prev => prev.filter(alertaId => !idsAfectados.some(idProd => alertaId.includes(idProd))));
    }

    // Actualizar BD (Upsert masivo de productos + Insert de historial)
    if (productosAActualizar.length > 0) {
        await supabase.from('likestore_productos').upsert(productosAActualizar.map(mapProdToDB));
    }
    await supabase.from('likestore_historial').insert([mapHistToDB(registro)]);
  };

  // --- 4. GESTIÓN DE CUPONES ---
  const agregarCupon = async (codigo, descuento, fechaCaducidad, limiteUso) => {
    const nuevo = { 
        id: `CUP-${Date.now()}`, codigo, descuento, caducidad: fechaCaducidad || null,
        limite: limiteUso ? parseInt(limiteUso) : null, usos: 0, activo: true 
    };
    setCupones(prev => [...prev, nuevo]);
    await supabase.from('likestore_cupones').insert([nuevo]);
  };

  const registrarUsoCupon = async (idCupon) => {
      let cuponActualizado = null;
      setCupones(prev => prev.map(c => {
          if (c.id === idCupon) {
              cuponActualizado = { ...c, usos: (c.usos || 0) + 1 };
              return cuponActualizado;
          }
          return c;
      }));

      if (cuponActualizado) {
          await supabase.from('likestore_cupones').update({ usos: cuponActualizado.usos }).eq('id', idCupon);
      }
  };

  const borrarCupon = async (id) => {
    setCupones(prev => prev.filter(c => c.id !== id));
    await supabase.from('likestore_cupones').delete().eq('id', id);
  };

  const marcarLeida = (idAlerta) => {
    if (!alertasLeidas.includes(idAlerta)) setAlertasLeidas([...alertasLeidas, idAlerta]);
  };

  return {
    productos, historial, cupones, alertas, alertasLeidas, cargando,
    guardarProducto, eliminarProducto, ajustarStockRapido, registrarTransaccion,
    agregarCupon, registrarUsoCupon, borrarCupon, marcarLeida
  };
}