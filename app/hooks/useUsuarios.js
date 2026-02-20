/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/hooks/useUsuarios.js (MIGRADO A SUPABASE)                     */
/* -------------------------------------------------------------------------- */
'use client';
import { useState, useEffect } from 'react';
import { normalizarRol } from '../config/permisos';
import { supabase } from '../lib/supabase'; // <--- NUEVA CONEXIÓN A SUPABASE

// USUARIOS DE SISTEMA (Accesos de emergencia/backend)
const USUARIOS_SISTEMA = [
  { id: 'SYS-ADM', email: 'admin', pass: '123', nombre: 'Soporte Sistema', rol: 'ADMINISTRADOR' },
  { id: 'DIR-001', email: 'director', pass: 'admin', nombre: 'Director General', rol: 'DIRECTOR' }
];

export function useUsuarios() {
  const [usuarioActivo, setUsuarioActivo] = useState(null);

  // Recuperar sesión al cargar la página (Mantenemos persistencia local para no desloguear al recargar)
  useEffect(() => {
    try {
      const sesion = localStorage.getItem('likeStore_session');
      if (sesion) {
        setUsuarioActivo(JSON.parse(sesion));
      }
    } catch (e) {
      console.error("Error recuperando sesión:", e);
    }
  }, []);

  // AHORA ES ASYNC (Debe esperar respuesta de Supabase)
  const login = async (emailInput, passInput) => {
    const email = String(emailInput || '').trim().toLowerCase();
    const pass = String(passInput || '').trim();

    if (!email || !pass) return false;

    // 1. BUSCAR EN USUARIOS DE SISTEMA (Prioridad 1)
    const sysUser = USUARIOS_SISTEMA.find(u => u.email === email && u.pass === pass);
    if (sysUser) {
        console.log(`✅ Login de Sistema: "${sysUser.nombre}"`);
        establecerSesion(sysUser);
        return true;
    }

    // 2. BUSCAR EN SUPABASE (Reemplaza al LocalStorage)
    try {
        const { data: colaborador, error } = await supabase
            .from('colaboradores')
            .select('*')
            .ilike('email', email) // ilike hace que no importe si escriben en mayúsculas
            .single();

        if (error || !colaborador) {
            console.warn("❌ Usuario no encontrado en Supabase.");
            return false;
        }

        // Validar contraseña (Mantenemos tu lógica temporal de '123' si no hay password definido)
        const passwordReal = colaborador.password || '123';

        if (pass === passwordReal) {
            const rolAsignado = normalizarRol(colaborador.puesto);
            
            console.log(`✅ Login Exitoso Supabase: "${colaborador.nombre}"`);

            const usuarioSesion = {
                id: colaborador.id,
                nombre: colaborador.nombre,
                email: colaborador.email,
                foto: colaborador.foto,
                rol: rolAsignado,
                area: colaborador.departamento,
                puesto: colaborador.puesto
            };

            establecerSesion(usuarioSesion);
            return true;
        }
    } catch (err) {
        console.error("Error de conexión con Supabase:", err);
        return false;
    }

    console.warn("❌ Credenciales incorrectas.");
    return false;
  };

  const logout = () => {
    console.log("👋 Cerrando sesión...");
    setUsuarioActivo(null);
    localStorage.removeItem('likeStore_session');
  };

  const establecerSesion = (usuario) => {
      setUsuarioActivo(usuario);
      localStorage.setItem('likeStore_session', JSON.stringify(usuario));
  };

  return {
    usuarioActivo,
    login,
    logout
  };
}