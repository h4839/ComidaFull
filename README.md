# Comida Full

Plataforma web que conecta empresas con comedores comunitarios para que la comida en buen estado llegue a quien la necesita (ODS 2 y 12). Sitio estático (HTML + CSS + JS) con Supabase como backend.

## Puesta en marcha

1. **Base de datos:** en Supabase → SQL Editor, pega y ejecuta `supabase/schema.sql` (se puede ejecutar varias veces).
2. **Correo:** Authentication → Providers → Email → desactiva *Confirm email* (para la demo).
3. **Administrador:** regístrate en la página y ejecuta en el SQL Editor:
   ```sql
   update public.perfiles set rol = 'admin', aprobado = true, activo = true
    where correo = 'tu-correo@ejemplo.com';
   ```
4. **Abrir:** sube el repo a GitHub Pages (Settings → Pages → rama `main`, carpeta `/root`) o sirve la carpeta con cualquier servidor estático.

La URL y la clave pública de Supabase están en `js/supabase-config.js`.

## Flujo (SRS)

Registro → aprobación del administrador (RF-03) → la empresa publica con foto y caducidad (RF-05 a 08) → el comedor ve la lista por caducidad (RF-10) y acepta; el primero la reserva (RF-11) → aviso al donante con contacto (RF-12) → el comedor confirma la cantidad recibida o rechaza con motivo (RF-13) → historial (RF-14) y contador público (RF-15).

## Pantallas (Figma M01–M13)

Todas llevan barra inferior. Públicas: Inicio / Ingresar / Registrarme. Empresa: Publicaciones / Publicar / Perfil. Comedor: Explorar / Mis reservas / Perfil. Administrador: Registros / Perfil. La campana de avisos está arriba a la derecha.

Foto de portada: exporta la imagen de Figma como `img/hero.jpg`. Datos de contacto de "Ayuda": constante `CONTACTO` al inicio de `js/app.js`.

## Estructura

```
index.html            Shell de la app (SPA con rutas #/...)
css/styles.css        Estilos (verde Comida Full, móvil primero)
js/supabase-config.js Cliente de Supabase
js/app.js             Rutas, vistas por rol y acceso a datos
supabase/schema.sql   Tablas, RLS, funciones, storage y realtime
img/hero.jpg          (opcional) foto de portada exportada de Figma
```
