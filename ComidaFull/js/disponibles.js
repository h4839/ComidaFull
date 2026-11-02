// js/disponibles.js

document.addEventListener('DOMContentLoaded', async () => {
    const contenedor = document.getElementById('contenedor-excedentes');
    const mensajeEstado = document.getElementById('mensaje-estado');
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');

    // 1. Verificar sesión activa
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
        alert("Debes iniciar sesión para ver los excedentes disponibles.");
        window.location.href = 'login.html';
        return;
    }

    // 2. Función para obtener y renderizar las publicaciones activas
    async function cargarExcedentes() {
        try {
            const { data: excedentes, error } = await window.supabaseClient
                .from('excedentes')
                .select(`
                    id,
                    tipo_alimento,
                    cantidad,
                    unidad,
                    fecha_caducidad,
                    hora_limite,
                    foto_url,
                    estado,
                    created_at,
                    perfiles:donante_id (
                        nombre_organizacion,
                        direccion,
                        telefono
                    )
                `)
                .eq('estado', 'publicado')
                .order('created_at', { ascending: false });

            if (error) throw error;

            contenedor.innerHTML = '';

            if (!excedentes || excedentes.length === 0) {
                mensajeEstado.textContent = 'No hay alimentos disponibles publicados en este momento.';
                return;
            }

            mensajeEstado.textContent = `Se encontraron ${excedentes.length} alimento(s) disponible(s).`;

            excedentes.forEach(item => {
                const card = document.createElement('div');
                card.className = 'card-excedente';

                const fotoHtml = item.foto_url 
                    ? `<img src="${item.foto_url}" alt="${item.tipo_alimento}">` 
                    : `<div style="height:120px; background:#eee; display:flex; align-items:center; justify-content:center; color:#777;">Sin imagen</div>`;

                const donanteNombre = item.perfiles ? item.perfiles.nombre_organizacion : 'Donante Anónimo';
                const donanteDireccion = item.perfiles ? item.perfiles.direccion : 'No especificada';

                card.innerHTML = `
                    <span class="tag-estado">Disponible</span>
                    ${fotoHtml}
                    <h3>${item.tipo_alimento}</h3>
                    <p><strong>Cantidad:</strong> ${item.cantidad} ${item.unidad}</p>
                    <p><strong>Donante:</strong> ${donanteNombre}</p>
                    <p><strong>Ubicación:</strong> ${donanteDireccion}</p>
                    <p><strong>Fecha caducidad:</strong> ${item.fecha_caducidad}</p>
                    <p><strong>Hora límite recolección:</strong> ${item.hora_limite}</p>
                    <button class="btn-solicitar" onclick="solicitarAlimento('${item.id}')">Solicitar Recolección</button>
                `;

                contenedor.appendChild(card);
            });

        } catch (err) {
            console.error("Error al cargar excedentes:", err.message);
            mensajeEstado.style.color = 'red';
            mensajeEstado.textContent = 'Error al cargar datos: ' + err.message;
        }
    }

    // Cargar lista inicial
    await cargarExcedentes();

    // 3. Suscripción en Tiempo Real (Supabase Realtime)
    window.supabaseClient
        .channel('cambios-excedentes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'excedentes' }, 
            (payload) => {
                console.log('Cambio detectado en tiempo real:', payload);
                cargarExcedentes(); // Recargar la lista automáticamente
            }
        )
        .subscribe();

    // 4. Manejo de cierre de sesión
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', async (e) => {
            e.preventDefault();
            await window.supabaseClient.auth.signOut();
            localStorage.removeItem('usuario_actual');
            window.location.href = 'login.html';
        });
    }
});

// Función global simulada para solicitar el alimento
function solicitarAlimento(idExcedente) {
    alert(`Solicitud enviada para el alimento con ID: ${idExcedente}. El donante será notificado.`);
}