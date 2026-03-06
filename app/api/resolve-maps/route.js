/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/api/resolve-maps/route.js                                     */
/* -------------------------------------------------------------------------- */
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { url } = await request.json();

        // El servidor visita el enlace corto y Google lo redirige al enlace largo
        const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
        const finalUrl = response.url; // Aquí ya tenemos el enlace largo con coordenadas

        // Extraemos las coordenadas del enlace largo
        const regexCoordenadas = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
        const match = finalUrl.match(regexCoordenadas);

        if (match) {
            return NextResponse.json({
                latitud: parseFloat(match[1]),
                longitud: parseFloat(match[2])
            });
        } else {
            return NextResponse.json({ error: "No se encontraron coordenadas en el enlace destino." }, { status: 400 });
        }
    } catch (error) {
        console.error("Error resolviendo el mapa:", error);
        return NextResponse.json({ error: "Error de servidor al resolver el enlace." }, { status: 500 });
    }
}