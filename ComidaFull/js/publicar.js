// js/publicar.js

document.addEventListener('DOMContentLoaded', async () => {
    const formExcedente = document.getElementById('form-excedente');
    const mensajeExcedente = document.getElementById('mensaje-excedente');
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');

    // 1. Obtener la sesión activa en el navegador
    const { data: { session } } = await window.supabaseClient.auth.getSession();

    if (!session) {
        alert("Debes iniciar sesión para publicar excedentes.");
        window.location.href = 'login.html';
        return;
    }

    const userId = session.user.id;

    // 2. Procesar el envío del formulario de alimentos
    if (formExcedente) {
        formExcedente.addEventListener('submit', async (e) => {
            e.preventDefault();
            mensajeExcedente.style.color = 'black';
            mensajeExcedente.textContent = 'Guardando publicación...';

            const tipoAlimento = document.getElementById('tipo_alimento').value;
            const cantidad = parseFloat(document.getElementById('cantidad').value);
            const unidad = document.getElementById('unidad').value;
            const fechaCaducidad = document.getElementById('fecha_caducidad').value;
            const horaLimite = document.getElementById('hora_limite').value;
            const fotoUrl = document.getElementById('foto_url').value || null;

            try {
                // Insertar en la tabla 'excedentes'
                const { data, error } = await window.supabaseClient
                    .from('excedentes')
                    .insert([
                        {
                            donante_id: userId,
                            tipo_alimento: tipoAlimento,
                            cantidad: cantidad,
                            unidad: unidad,
                            fecha_caducidad: fechaCaducidad,
                            hora_limite: horaLimite,
                            foto_url: fotoUrl,
                            estado: 'publicado'
                        }
                    ]);

                if (error) throw error;

                mensajeExcedente.style.color = 'green';
                mensajeExcedente.textContent = '¡Excedente publicado con éxito!';
                formExcedente.reset();

            } catch (error) {
                console.error("Error al publicar:", error.message);
                mensajeExcedente.style.color = 'red';
                mensajeExcedente.textContent = 'Error al publicar: ' + error.message;
            }
        });
    }

    // 3. Manejo de cierre de sesión
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', async (e) => {
            e.preventDefault();
            await window.supabaseClient.auth.signOut();
            localStorage.removeItem('usuario_actual');
            window.location.href = 'login.html';
        });
    }
});