// js/login.js

document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');
    const mensajeLogin = document.getElementById('mensaje-login');

    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            mensajeLogin.style.color = 'black';
            mensajeLogin.textContent = 'Iniciando sesión...';

            const correo = document.getElementById('correo').value;
            const contrasena = document.getElementById('contrasena').value;

            try {
                // 1. Iniciar sesión en Supabase Auth
                const { data: authData, error: authError } = await window.supabaseClient.auth.signInWithPassword({
                    email: correo,
                    password: contrasena
                });

                if (authError) throw authError;

                const userId = authData.user.id;

                // 2. Consultar la tabla 'perfiles' con .maybeSingle()
                const { data: perfil, error: perfilError } = await window.supabaseClient
                    .from('perfiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle(); // Retorna null en lugar de explotar con excepción si no existe

                if (perfilError) throw perfilError;

                // Validar si el usuario no tiene fila en la tabla perfiles
                if (!perfil) {
                    mensajeLogin.style.color = 'red';
                    mensajeLogin.textContent = 'El usuario existe en Auth pero no tiene perfil asociado en la base de datos.';
                    return;
                }

                // 3. Validar si la cuenta está aprobada (RF-03)
                if (!perfil.aprobado) {
                    mensajeLogin.style.color = 'orange';
                    mensajeLogin.textContent = 'Tu cuenta aún está pendiente de aprobación por el administrador.';
                    await window.supabaseClient.auth.signOut();
                    return;
                }

                // 4. Inicio de sesión exitoso
                mensajeLogin.style.color = 'green';
                mensajeLogin.textContent = `¡Bienvenido ${perfil.nombre_organizacion}! Accediendo como ${perfil.rol}...`;
                localStorage.setItem('usuario_actual', JSON.stringify(perfil));

            } catch (error) {
                console.error("Error en Login:", error.message);
                mensajeLogin.style.color = 'red';
                mensajeLogin.textContent = 'Error al iniciar sesión: ' + error.message;
            }
        });
    }
});