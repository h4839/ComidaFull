// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    const formRegistro = document.getElementById('form-registro');
    const mensajeRegistro = document.getElementById('mensaje-registro');

    if (formRegistro) {
        formRegistro.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (mensajeRegistro) {
                mensajeRegistro.style.color = "#2e7d32";
                mensajeRegistro.textContent = "Procesando registro...";
            }

            const rol = document.getElementById('rol') ? document.getElementById('rol').value : 'comedor';
            const nombre_org = document.getElementById('nombre_org') ? document.getElementById('nombre_org').value : '';
            const responsable = document.getElementById('responsable') ? document.getElementById('responsable').value : '';
            const correo = document.getElementById('correo') ? document.getElementById('correo').value : '';
            const telefono = document.getElementById('telefono') ? document.getElementById('telefono').value : '';
            const direccion = document.getElementById('direccion') ? document.getElementById('direccion').value : '';
            const horario = document.getElementById('horario') ? document.getElementById('horario').value : null;
            const contrasena = document.getElementById('contrasena') ? document.getElementById('contrasena').value : '';

            try {
                // 1. Crear usuario en Auth de Supabase
                const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                    email: correo,
                    password: contrasena,
                });

                if (authError) throw authError;

                const userId = authData.user.id;

                // 2. Insertar perfil con aprobado: true (Acceso directo inmediato)
                const { error: profileError } = await supabaseClient
                    .from('perfiles')
                    .insert([
                        {
                            id: userId,
                            rol: rol,
                            nombre_organizacion: nombre_org,
                            responsable: responsable,
                            telefono: telefono,
                            direccion: direccion,
                            horario_atencion: rol === 'comedor' ? horario : null,
                            aprobado: true // Sin esperas ni bloqueos
                        }
                    ]);

                if (profileError) throw profileError;

                if (mensajeRegistro) {
                    mensajeRegistro.style.color = "green";
                    mensajeRegistro.textContent = "¡Registro exitoso! Redirigiendo a Iniciar Sesión...";
                }

                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1200);

            } catch (error) {
                console.error("Error en el registro:", error.message);
                if (mensajeRegistro) {
                    mensajeRegistro.style.color = "red";
                    mensajeRegistro.textContent = "Error: " + error.message;
                }
            }
        });
    }
});