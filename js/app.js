document.addEventListener('DOMContentLoaded', () => {
    const rolSelect = document.getElementById('rol');
    const horarioInput = document.getElementById('horario');
    const formRegistro = document.getElementById('form-registro');
    const mensaje = document.getElementById('mensaje');

    // Ocultar o mostrar horario si es comedor o donante
    horarioInput.style.display = 'none';
    rolSelect.addEventListener('change', () => {
        if (rolSelect.value === 'comedor') {
            horarioInput.style.display = 'block';
        } else {
            horarioInput.style.display = 'none';
        }
    });

    // Enviar datos al formulario
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();
        mensaje.style.color = 'black';
        mensaje.textContent = 'Procesando registro...';

        const correo = document.getElementById('correo').value;
        const contrasena = document.getElementById('contrasena').value;

        try {
            // 1. Registrar usuario en Autenticación de Supabase
            const { data, error } = await supabaseClient.auth.signUp({
                email: correo,
                password: contrasena
            });

            if (error) throw error;

            mensaje.style.color = 'green';
            mensaje.textContent = '¡Registro exitoso! Revisa tu correo o panel de Supabase.';
            formRegistro.reset();
        } catch (err) {
            mensaje.style.color = 'red';
            mensaje.textContent = 'Error: ' + err.message;
        }
    });
});