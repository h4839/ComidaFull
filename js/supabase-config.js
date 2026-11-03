// js/supabase-config.js
// Cliente de Supabase. La clave "publishable" es pública por diseño:
// la seguridad real la dan las políticas RLS de supabase/schema.sql.
(function () {
    const SUPABASE_URL = 'https://jevxmmcmajxhafuoukym.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_Ik9sLjyDt8UgjukvZBibXQ_hfbSJ2vk';

    // "Recordarme": si está desmarcado la sesión vive solo en esta pestaña.
    const storage = {
        getItem: (k) => sessionStorage.getItem(k) ?? localStorage.getItem(k),
        setItem: (k, v) => {
            const recordar = localStorage.getItem('cf_recordar') !== '0';
            (recordar ? localStorage : sessionStorage).setItem(k, v);
        },
        removeItem: (k) => { sessionStorage.removeItem(k); localStorage.removeItem(k); }
    };

    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { storage, persistSession: true, autoRefreshToken: true }
    });
})();
