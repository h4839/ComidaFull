// js/login.js
document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');
    const mensajeLogin = document.getElementById('mensaje-login');

    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();

            const correo = document.getElementById('correo').value;
            const contrasena = document.getElementById('contrasena').value;

            try {
                // 1. Iniciar sesión en Supabase Auth
                const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
                    email: correo,
                    password: contrasena,
                });

                if (authError) throw authError;

                const userId = authData.user.id;

                // 2. Obtener el perfil del usuario
                const { data: perfil, error: perfilError } = await supabaseClient
                    .from('perfiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (perfilError || !perfil) {
                    throw new Error("No se encontró un perfil asociado a esta cuenta.");
                }

                // 3. Redirección según rol
                if (perfil.rol === 'comedor' || perfil.rol === 'donante') {
                    window.location.href = 'disponibles.html';
                } else {
                    window.location.href = 'disponibles.html';
                }

            } catch (error) {
                console.error("Error al iniciar sesión:", error.message);
                if (mensajeLogin) {
                    mensajeLogin.style.color = "red";
                    mensajeLogin.textContent = "Error: " + error.message;
                }
            }
        });
    }
});