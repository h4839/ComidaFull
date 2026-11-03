// js/app.js · Comida Full
// Aplicación de una sola página (hash router) conectada a Supabase.
// Secciones: utilidades · datos · vistas públicas · donante · comedor · admin · router.
(() => {
'use strict';

const sb = window.supabaseClient;
const app = document.getElementById('app');

/* =====================================================================
   Estado global
   ===================================================================== */
const S = { session: null, perfil: null, avisos: 0, refresh: null, timers: [], channel: null };

/* =====================================================================
   Utilidades
   ===================================================================== */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (sel, root = app) => root.querySelector(sel);
const $$ = (sel, root = app) => [...root.querySelectorAll(sel)];

const ICONS = {
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    chev: '<path d="m9 18 6-6-6-6"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
    utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 22 16.92z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    user2: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'
};
const ico = (n, size) => `<svg class="ico" ${size ? `style="width:${size}px;height:${size}px"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

const ESTADOS = {
    publicado: ['Disponible', 'pill-ok'],
    aceptado: ['Aceptado', 'pill-info'],
    confirmado: ['Entregado', 'pill-done'],
    rechazado: ['Rechazado', 'pill-bad'],
    cancelado: ['Cancelado', 'pill-muted'],
    vencido: ['Vencido', 'pill-bad']
};
const pill = (estado) => { const [t, c] = ESTADOS[estado] || [estado, '']; return `<span class="pill ${c}">${esc(t)}</span>`; };

const hoyISO = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
const fmtFecha = (iso) => {
    if (!iso) return '';
    const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '') + '.';
};
const fmtFechaHora = (ts) => new Date(ts).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const fmtHora = (t) => String(t || '').slice(0, 5);
const fmtNum = (n) => Number(n || 0).toLocaleString('es-MX');
const fmtCant = (c, u) => `${Number(c).toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${u === 'porciones' ? 'porc.' : u === 'piezas' ? 'pzas' : u}`;
const inicial = (s) => (String(s || '?').trim()[0] || '?').toUpperCase();
const diasPara = (iso) => { const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number); const h = hoyISO().split('-').map(Number); return Math.round((new Date(y, m - 1, d) - new Date(h[0], h[1] - 1, h[2])) / 864e5); };
const cuando = (iso) => { const n = diasPara(iso); return n === 0 ? 'Caduca hoy' : n === 1 ? 'Caduca mañana' : `Caduca ${fmtFecha(iso)}`; };

function msgErr(e) {
    const m = String((e && e.message) || e || '');
    if (/Invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos.';
    if (/User already registered|already been registered/i.test(m)) return 'Ya existe una cuenta con ese correo. Prueba iniciar sesión.';
    if (/Email not confirmed/i.test(m)) return 'Confirma tu correo antes de entrar (revisa tu bandeja).';
    if (/Password should be at least/i.test(m)) return 'La contraseña debe tener al menos 6 caracteres.';
    if (/rate limit|too many/i.test(m)) return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'No hay conexión con el servidor. Revisa tu internet.';
    if (/row-level security/i.test(m)) return 'No tienes permiso para hacer esto. ¿Tu cuenta ya fue aprobada?';
    if (/Bucket not found/i.test(m)) return 'Falta el almacén de fotos en Supabase. Ejecuta supabase/schema.sql.';
    return m || 'Ocurrió un error inesperado.';
}

function toast(msg, tipo = '') {
    const t = document.createElement('div');
    t.className = `toast ${tipo}`;
    t.textContent = msg;
    $('#toasts', document).appendChild(t);
    setTimeout(() => t.remove(), 4200);
}

function modal({ titulo, cuerpo = '', texto = '', confirmar = 'Confirmar', peligro = false, onConfirm }) {
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(titulo)}">
            <h3>${esc(titulo)}</h3>
            ${texto ? `<p>${esc(texto)}</p>` : ''}
            ${cuerpo}
            <p class="form-error" data-err></p>
            <div class="btn-row">
                <button class="btn btn-outline" data-cancel>Cancelar</button>
                <button class="btn ${peligro ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(confirmar)}</button>
            </div>
        </div>`;
    document.body.appendChild(back);
    const close = () => back.remove();
    back.addEventListener('click', (e) => { if (e.target === back) close(); });
    $('[data-cancel]', back).onclick = close;
    const ok = $('[data-ok]', back);
    ok.onclick = async () => {
        ok.disabled = true;
        $('[data-err]', back).textContent = '';
        try { await onConfirm(back); close(); }
        catch (e) { $('[data-err]', back).textContent = msgErr(e); ok.disabled = false; }
    };
    const first = $('input, textarea', back); if (first) first.focus();
    return back;
}

const loader = () => `<div class="loader"><div class="spin" aria-label="Cargando"></div></div>`;
const go = (path) => { if (location.hash === '#' + path) route(); else location.hash = '#' + path; };

/* =====================================================================
   Acceso a datos (Supabase)
   ===================================================================== */
const API = {
    async cargarPerfil() {
        if (!S.session) { S.perfil = null; return null; }
        const { data, error } = await sb.from('perfiles').select('*').eq('id', S.session.user.id).maybeSingle();
        if (error) throw error;
        S.perfil = data;
        return data;
    },
    async estadisticas() {
        const { data, error } = await sb.rpc('estadisticas_publicas');
        if (error) throw error;
        return data || {};
    },
    async aliados() {
        const { data, error } = await sb.rpc('aliados_publicos');
        if (error) throw error;
        return data || [];
    },
    async contarAvisos() {
        if (!S.session) return 0;
        const { count } = await sb.from('notificaciones').select('id', { count: 'exact', head: true }).eq('usuario_id', S.session.user.id).eq('leida', false);
        S.avisos = count || 0;
        return S.avisos;
    }
};

const aprobado = (p) => !!(p && p.aprobado && p.activo !== false);
const panelDe = (p) => (p && p.rol === 'admin' ? '/admin' : p && p.rol === 'comedor' ? '/disponibles' : '/mis-publicaciones');

/* =====================================================================
   Piezas de interfaz comunes
   ===================================================================== */
const marca = () => `<a class="brand" href="#/"><span class="brand-mark">${ico('leaf')}</span>comida full</a>`;

const topbar = (der = '') => `<header class="topbar">${marca()}<div>${der}</div></header>`;
const topbarBack = (to = '/') => `<header class="topbar"><button class="back" data-go="${to}">${ico('back')} Volver</button>${marca()}</header>`;

function navInferior(activa) {
    const r = S.perfil && S.perfil.rol;
    const items = r === 'donante'
        ? [['/mis-publicaciones', 'list', 'Publicaciones'], ['/publicar', 'plus', 'Publicar'], ['/avisos', 'bell', 'Avisos'], ['/perfil', 'user', 'Perfil']]
        : r === 'comedor'
            ? [['/disponibles', 'utensils', 'Disponibles'], ['/recogidas', 'check', 'Recogidas'], ['/avisos', 'bell', 'Avisos'], ['/perfil', 'user', 'Perfil']]
            : [['/admin', 'shield', 'Registros'], ['/perfil', 'user', 'Perfil']];
    return `<nav class="bottomnav" aria-label="Navegación principal">${items.map(([ruta, i, t]) =>
        `<button class="navitem ${activa === ruta ? 'on' : ''}" data-go="${ruta}" ${activa === ruta ? 'aria-current="page"' : ''}>
            ${ico(i)}<span>${t}</span>${ruta === '/avisos' && S.avisos > 0 ? `<em class="badge" id="badge-avisos">${S.avisos > 9 ? '9+' : S.avisos}</em>` : ''}
        </button>`).join('')}</nav>`;
}

function pintarBadge() {
    const nav = $('.bottomnav');
    const btn = nav && $('[data-go="/avisos"]', nav);
    if (!btn) return;
    let b = $('.badge', btn);
    if (S.avisos > 0) {
        if (!b) { b = document.createElement('em'); b.className = 'badge'; btn.appendChild(b); }
        b.textContent = S.avisos > 9 ? '9+' : S.avisos;
    } else if (b) b.remove();
}

/* =====================================================================
   VISTAS PÚBLICAS
   ===================================================================== */
function vHome() {
    const sesion = S.session && aprobado(S.perfil);
    app.innerHTML = `
        ${topbar(S.session ? `<a href="#${panelDe(S.perfil)}" class="small">Mi panel</a>` : `<a href="#/login" class="small">Iniciar sesión</a>`)}
        <main class="screen">
            <section class="hero">
                <span class="eyebrow">${ico('leaf', 13)} ODS 2 · Hambre cero · ODS 12</span>
                <h1 class="h1 mt12">Lo que sobra,<br>puede hacer<br><span class="accent">mucha falta.</span></h1>
                <p class="lead">Conectamos empresas con comedores comunitarios para que la comida en buen estado llegue a quien la necesita, en lugar de terminar en la basura.</p>
                <div class="hero-art">
                    <div class="emoji" aria-hidden="true">🥬🍞🍅🥕</div>
                    <img src="img/hero.jpg" alt="Canasta con verduras y pan rescatados" onerror="this.remove()">
                </div>
                <div class="stats">
                    <div class="stat"><b id="st-porciones">–</b><span>porciones rescatadas</span></div>
                    <div class="stat"><b id="st-entregas">–</b><span>entregas confirmadas</span></div>
                </div>
                ${sesion
                    ? `<div class="stack mt24"><button class="btn btn-primary btn-block" data-go="${panelDe(S.perfil)}">Ir a mi panel</button></div>`
                    : `<div class="btn-row mt24">
                        <button class="btn btn-primary" data-go="/registro/empresa">Soy empresa</button>
                        <button class="btn btn-outline" data-go="/registro/comedor">Soy comedor</button>
                       </div>
                       <p class="footnote">¿Ya tienes cuenta? <a href="#/login">Inicia sesión</a></p>`}
            </section>

            <h2 class="section-title">Cómo funciona</h2>
            <div class="steps">
                <div class="step"><span class="n">1</span><div><b>La empresa publica</b><span>Foto, cantidad y fecha de caducidad en alrededor de un minuto.</span></div></div>
                <div class="step"><span class="n">2</span><div><b>Un comedor lo acepta</b><span>El primero que lo pide lo reserva y recoge en el local.</span></div></div>
                <div class="step"><span class="n">3</span><div><b>Se confirma y se suma</b><span>Con cada recepción sube el contador público de porciones.</span></div></div>
            </div>

            <h2 class="section-title">Empresas aliadas</h2>
            <div class="chips" id="lista-empresas"><span class="muted small">Cargando…</span></div>

            <h2 class="section-title">Comedores participantes</h2>
            <div class="stack mt12" id="lista-comedores"><span class="muted small">Cargando…</span></div>

            <h2 class="section-title">Agenda 2030</h2>
            <div class="ods">
                <div style="background:#bf8b2e"><b>ODS 2</b>Hambre cero</div>
                <div style="background:#c4572f"><b>ODS 12</b>Producción y consumo responsables</div>
            </div>
            <p class="footnote">Comida Full respeta la dignidad de quienes reciben ayuda: nunca mostramos rostros ni datos personales de beneficiarios.</p>
        </main>`;

    const cargar = async () => {
        try {
            const st = await API.estadisticas();
            const a = $('#st-porciones'), b = $('#st-entregas');
            if (a) a.textContent = fmtNum(st.porciones);
            if (b) b.textContent = fmtNum(st.entregas);
        } catch (e) { console.warn('Estadísticas:', e.message); }
    };
    cargar();
    S.timers.push(setInterval(cargar, 20000));

    API.aliados().then((lista) => {
        const emp = lista.filter((x) => x.rol === 'donante');
        const com = lista.filter((x) => x.rol === 'comedor');
        const le = $('#lista-empresas'), lc = $('#lista-comedores');
        if (le) le.innerHTML = emp.length
            ? emp.map((x) => `<span class="chip"><span class="logo">${x.logo_url ? `<img src="${esc(x.logo_url)}" alt="">` : esc(inicial(x.nombre))}</span>${esc(x.nombre)}</span>`).join('')
            : '<span class="muted small">Pronto verás aquí a las empresas que participan.</span>';
        if (lc) lc.innerHTML = com.length
            ? com.map((x) => `<div class="place">${ico('pin')}<div><b>${esc(x.nombre)}</b><span>${esc(x.direccion || 'Dirección no disponible')}</span></div></div>`).join('')
            : '<span class="muted small">Pronto verás aquí a los comedores que participan.</span>';
    }).catch((e) => {
        console.warn('Aliados:', e.message);
        const le = $('#lista-empresas'), lc = $('#lista-comedores');
        if (le) le.innerHTML = '<span class="muted small">No se pudo cargar la lista.</span>';
        if (lc) lc.innerHTML = '';
    });
}

function vLogin() {
    app.innerHTML = `
        ${topbarBack('/')}
        <main class="screen">
            <h1 class="h2">Qué bueno verte de nuevo.</h1>
            <p class="lead">Entra y sigue haciendo que los alimentos encuentren su lugar.</p>
            <form class="form" id="f-login" novalidate>
                <div class="field"><label for="correo">Correo electrónico</label>
                    <input class="input" id="correo" type="email" autocomplete="email" inputmode="email" placeholder="correo@empresa.com" required></div>
                <div class="field"><label for="clave">Contraseña</label>
                    <div class="input-wrap"><input class="input" id="clave" type="password" autocomplete="current-password" placeholder="••••••••" required>
                    <button type="button" class="eye" data-eye aria-label="Mostrar contraseña">${ico('eye')}</button></div></div>
                <div class="between">
                    <label class="check"><input type="checkbox" id="recordar" checked> Recordarme</label>
                </div>
                <p class="form-error" id="err"></p>
                <button class="btn btn-primary btn-block" type="submit">Iniciar sesión</button>
            </form>
            <div class="notice mt16">${ico('shield')}<div><b>Un acceso, tu rol de siempre</b><span>Empresas y comedores entran con su correo. Cada cuenta ve solo lo que le corresponde.</span></div></div>
            <p class="footnote">¿Todavía no formas parte?</p>
            <button class="btn btn-outline btn-block mt8" data-go="/rol">Crear una cuenta</button>
        </main>`;
    activarOjo();
    $('#f-login').addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = $('#err'), btn = $('button[type=submit]');
        err.textContent = '';
        const correo = $('#correo').value.trim(), clave = $('#clave').value;
        if (!correo || !clave) { err.textContent = 'Escribe tu correo y tu contraseña.'; return; }
        btn.disabled = true; btn.textContent = 'Entrando…';
        try {
            localStorage.setItem('cf_recordar', $('#recordar').checked ? '1' : '0');
            const { error } = await sb.auth.signInWithPassword({ email: correo, password: clave });
            if (error) throw error;
            // onAuthStateChange se encarga de cargar la sesión y redirigir
        } catch (ex) {
            err.textContent = msgErr(ex);
            btn.disabled = false; btn.textContent = 'Iniciar sesión';
        }
    });
}

function activarOjo() {
    $$('[data-eye]').forEach((b) => b.addEventListener('click', () => {
        const inp = b.parentElement.querySelector('input');
        const ver = inp.type === 'password';
        inp.type = ver ? 'text' : 'password';
        b.innerHTML = ico(ver ? 'eyeoff' : 'eye');
        b.setAttribute('aria-label', ver ? 'Ocultar contraseña' : 'Mostrar contraseña');
    }));
}

function vRol() {
    let rol = sessionStorage.getItem('cf_rol_sel') || 'empresa';
    app.innerHTML = `
        ${topbarBack('/login')}
        <main class="screen">
            <h1 class="h2">Cada rol suma.</h1>
            <p class="lead">¿Cómo quieres formar parte de Comida Full?</p>
            <div class="stack mt16" role="radiogroup" aria-label="Rol">
                <button class="role" data-rol="empresa" role="radio">
                    <span class="r-ico">${ico('building')}</span><b>Soy empresa</b>
                    <span>Publica alimentos en buen estado y coordina su recogida con un comedor.</span>
                    <i class="radio">${ico('check')}</i>
                </button>
                <button class="role" data-rol="comedor" role="radio">
                    <span class="r-ico">${ico('utensils')}</span><b>Soy comedor</b>
                    <span>Encuentra excedentes cercanos, reserva y confirma los alimentos recibidos.</span>
                    <i class="radio">${ico('check')}</i>
                </button>
            </div>
            <div class="notice mt16">${ico('shield')}<div><b>Una comunidad de confianza</b><span>Revisamos cada registro antes de habilitar el acceso a la plataforma.</span></div></div>
            <button class="btn btn-primary btn-block mt16" id="seguir"></button>
            <p class="footnote">¿Ya tienes cuenta? <a href="#/login">Inicia sesión</a></p>
        </main>`;
    const pintar = () => {
        $$('.role').forEach((r) => { const on = r.dataset.rol === rol; r.classList.toggle('sel', on); r.setAttribute('aria-checked', on); });
        $('#seguir').textContent = rol === 'empresa' ? 'Continuar como empresa' : 'Continuar como comedor';
    };
    $$('.role').forEach((r) => r.addEventListener('click', () => { rol = r.dataset.rol; sessionStorage.setItem('cf_rol_sel', rol); pintar(); }));
    $('#seguir').addEventListener('click', () => go('/registro/' + rol));
    pintar();
}

function vRegistro(tipo) {
    const empresa = tipo !== 'comedor';
    app.innerHTML = `
        ${topbarBack('/rol')}
        <main class="screen">
            <h1 class="h2">${empresa ? 'Registra tu empresa' : 'Registra tu comedor'}</h1>
            <p class="lead">Todos los campos son obligatorios.</p>
            <form class="form" id="f-reg" novalidate>
                <div class="field"><label for="nombre">${empresa ? 'Nombre de la empresa' : 'Nombre del comedor'} *</label>
                    <input class="input" id="nombre" autocomplete="organization" placeholder="${empresa ? 'Ej. Panificadora La Espiga' : 'Ej. Comedor La Esperanza'}" required></div>
                <div class="field"><label for="responsable">Persona responsable *</label>
                    <input class="input" id="responsable" autocomplete="name" placeholder="Nombre y apellido" required></div>
                <div class="field"><label for="correo">Correo electrónico *</label>
                    <input class="input" id="correo" type="email" autocomplete="email" inputmode="email" placeholder="correo@ejemplo.com" required></div>
                <div class="field"><label for="telefono">Teléfono *</label>
                    <input class="input" id="telefono" type="tel" autocomplete="tel" inputmode="tel" placeholder="10 dígitos" required></div>
                <div class="field"><label for="direccion">${empresa ? 'Dirección de la sucursal' : 'Dirección'} *</label>
                    <input class="input" id="direccion" autocomplete="street-address" placeholder="Calle, número, colonia, ciudad" required></div>
                ${empresa ? '' : `<div class="field"><label for="horario">Horario de atención *</label>
                    <input class="input" id="horario" placeholder="Ej. Lunes a sábado, 10:00 a 19:00" required></div>`}
                <div class="field"><label for="clave">Contraseña *</label>
                    <div class="input-wrap"><input class="input" id="clave" type="password" autocomplete="new-password" minlength="6" placeholder="Mínimo 6 caracteres" required>
                    <button type="button" class="eye" data-eye aria-label="Mostrar contraseña">${ico('eye')}</button></div>
                    <span class="hint">Al registrarte aceptas que tus datos se traten con cuidado y conforme a la ley de protección de datos personales.</span></div>
                <p class="form-error" id="err"></p>
                <button class="btn btn-primary btn-block" type="submit">Enviar solicitud</button>
            </form>
            <div class="notice notice-warn mt16">${ico('alert')}<div><b>Tu registro estará en revisión</b><span>Un administrador lo aprobará antes de que puedas ${empresa ? 'publicar' : 'aceptar'} excedentes.</span></div></div>
        </main>`;
    activarOjo();
    $('#f-reg').addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = $('#err'), btn = $('button[type=submit]');
        err.textContent = '';
        const v = (id) => ($('#' + id) ? $('#' + id).value.trim() : '');
        const datos = { nombre: v('nombre'), responsable: v('responsable'), correo: v('correo'), telefono: v('telefono'), direccion: v('direccion'), horario: v('horario'), clave: $('#clave').value };
        if (!datos.nombre || !datos.responsable || !datos.correo || !datos.telefono || !datos.direccion || (!empresa && !datos.horario) || !datos.clave) { err.textContent = 'Completa todos los campos.'; return; }
        if (!/^\S+@\S+\.\S+$/.test(datos.correo)) { err.textContent = 'Escribe un correo válido.'; return; }
        if (datos.telefono.replace(/\D/g, '').length < 10) { err.textContent = 'El teléfono debe tener al menos 10 dígitos.'; return; }
        if (datos.clave.length < 6) { err.textContent = 'La contraseña debe tener al menos 6 caracteres.'; return; }
        btn.disabled = true; btn.textContent = 'Enviando…';
        try {
            localStorage.setItem('cf_recordar', '1');
            const { data, error } = await sb.auth.signUp({
                email: datos.correo,
                password: datos.clave,
                options: { data: { rol: empresa ? 'donante' : 'comedor', nombre_organizacion: datos.nombre, responsable: datos.responsable, telefono: datos.telefono, direccion: datos.direccion, horario_atencion: empresa ? null : datos.horario } }
            });
            if (error) throw error;
            // Supabase devuelve un usuario "falso" sin identidades si el correo ya existe
            if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) throw new Error('User already registered');
            if (data.session) { sessionStorage.removeItem('cf_rol_sel'); /* onAuthStateChange redirige a /pendiente */ }
            else { sessionStorage.setItem('cf_enviado', datos.correo); go('/enviado'); }
        } catch (ex) {
            err.textContent = msgErr(ex);
            btn.disabled = false; btn.textContent = 'Enviar solicitud';
        }
    });
}

function vEnviado() {
    const correo = sessionStorage.getItem('cf_enviado') || 'tu correo';
    app.innerHTML = `
        ${topbar()}
        <main class="screen center">
            <div class="mt32" style="font-size:54px">📬</div>
            <h1 class="h2 mt12">Solicitud enviada</h1>
            <p class="lead">Revisa ${esc(correo)} para confirmar tu cuenta. Después, un administrador aprobará tu registro y podrás entrar.</p>
            <button class="btn btn-primary btn-block mt24" data-go="/login">Ir a iniciar sesión</button>
        </main>`;
}

function vPendiente() {
    const p = S.perfil;
    const desact = p && p.aprobado && p.activo === false;
    const rechazada = p && !p.aprobado && p.activo === false;
    app.innerHTML = `
        ${topbar()}
        <main class="screen center">
            <div class="mt32" style="font-size:54px">${desact || rechazada ? '🚫' : '⏳'}</div>
            <h1 class="h2 mt12">${desact ? 'Tu cuenta está desactivada' : rechazada ? 'Tu registro no fue aprobado' : 'Tu registro está en revisión'}</h1>
            <p class="lead">${desact || rechazada
                ? 'Si crees que es un error, comunícate con el equipo de Comida Full.'
                : `Un administrador revisará tus datos. No podrás ${p && p.rol === 'comedor' ? 'aceptar' : 'publicar'} excedentes hasta que sea aprobado.`}</p>
            ${p ? `<div class="card mt16" style="text-align:left"><b>${esc(p.nombre_organizacion)}</b><div class="muted small">${esc(p.rol === 'donante' ? 'Empresa' : 'Comedor')} · ${esc(p.correo || S.session.user.email)}</div></div>`
                : `<div class="notice notice-err mt16">${ico('alert')}<div><b>No encontramos tu perfil</b><span>Ejecuta supabase/schema.sql o contacta al administrador.</span></div></div>`}
            <div class="stack mt24">
                <button class="btn btn-primary btn-block" id="act">Actualizar estado</button>
                <button class="btn btn-outline btn-block" id="salir">${ico('logout')} Cerrar sesión</button>
            </div>
        </main>`;
    $('#act').onclick = async () => {
        try { await API.cargarPerfil(); } catch (e) { toast(msgErr(e), 'err'); return; }
        if (aprobado(S.perfil)) { toast('¡Tu cuenta fue aprobada!', 'ok'); go(panelDe(S.perfil)); } else { toast('Todavía en revisión.'); vPendiente(); }
    };
    $('#salir').onclick = cerrarSesion;
}

/* =====================================================================
   DONANTE (empresa)
   ===================================================================== */
async function vMisPublicaciones() {
    let filtro = 'todas', datos = [];
    app.innerHTML = `${topbar()}<main class="screen with-nav">${loader()}</main>${navInferior('/mis-publicaciones')}`;

    const pintar = () => {
        const activas = datos.filter((x) => x.estado === 'publicado' || x.estado === 'aceptado');
        const lista = filtro === 'activas' ? activas : datos;
        $('main').innerHTML = `
            <h1 class="h2">Mis publicaciones</h1>
            <p class="lead">${esc(S.perfil.nombre_organizacion)} · Cada alimento cuenta.</p>
            <div class="tabs" role="tablist">
                <button class="tab ${filtro === 'todas' ? 'on' : ''}" data-f="todas" role="tab">Todas · ${datos.length}</button>
                <button class="tab ${filtro === 'activas' ? 'on' : ''}" data-f="activas" role="tab">Activas · ${activas.length}</button>
            </div>
            ${lista.length ? `<div class="list">${lista.map(itemPublicacion).join('')}</div>`
                : `<div class="empty"><div class="big">🍞</div><b>Aún no hay publicaciones</b><p class="small mt8">Publica tu primer excedente en menos de un minuto.</p></div>`}
            <p class="footnote">Solo puedes cancelar publicaciones disponibles.</p>
            <a class="fab" href="#/publicar">${ico('plus')} Publicar</a>`;
        $$('.tab').forEach((t) => t.onclick = () => { filtro = t.dataset.f; pintar(); });
    };

    const cargar = async () => {
        const { data, error } = await sb.from('excedentes')
            .select('*, comedor:perfiles!comedor_id(nombre_organizacion)')
            .eq('donante_id', S.session.user.id)
            .order('created_at', { ascending: false });
        if (error) { $('main').innerHTML = `<div class="notice notice-err">${ico('alert')}<div><b>No se pudieron cargar tus publicaciones</b><span>${esc(msgErr(error))}</span></div></div>`; return; }
        datos = data || [];
        pintar();
    };
    S.refresh = cargar;
    await cargar();
}

function itemPublicacion(x) {
    let sub = '';
    if (x.estado === 'publicado') sub = `<div class="item-sub warn">Hasta las ${fmtHora(x.hora_limite)} · Cancelar publicación</div>`;
    else if (x.estado === 'aceptado') sub = `<div class="item-sub">${esc((x.comedor && x.comedor.nombre_organizacion) || 'Un comedor')}</div>`;
    else if (x.estado === 'vencido') sub = `<div class="item-sub">Caducó el ${fmtFecha(x.fecha_caducidad)}</div>`;
    else sub = `<div class="item-sub">${fmtFecha(x.fecha_caducidad)}</div>`;
    return `<button class="item" data-go="/publicacion/${esc(x.id)}">
        <span class="thumb">${x.foto_url ? `<img src="${esc(x.foto_url)}" alt="" loading="lazy">` : '🍽️'}</span>
        <span class="item-body"><span class="item-title">${esc(x.tipo_alimento)}</span>
            <span class="item-meta">${pill(x.estado)}<span>${esc(fmtCant(x.cantidad, x.unidad))}</span></span>${sub}</span>
        <span class="chev">${ico('chev')}</span></button>`;
}

function vPublicar() {
    app.innerHTML = `
        ${topbar()}
        <main class="screen with-nav">
            <h1 class="h2">Comparte tu excedente</h1>
            <p class="lead">Completa los datos del alimento que quieres donar. Toma un minuto.</p>
            <form class="form" id="f-pub" novalidate>
                <div class="field"><span class="label">Foto del alimento *</span>
                    <label class="photo" id="drop"><input type="file" accept="image/*" capture="environment" id="foto">
                        <span class="ph">${ico('camera', 26)}<br>Toma o sube una foto</span></label></div>
                <div class="field"><label for="tipo">Tipo de alimento *</label>
                    <input class="input" id="tipo" maxlength="80" placeholder="Ej. Pan del día, verduras frescas" required></div>
                <div class="row2">
                    <div class="field"><label for="cantidad">Cantidad *</label>
                        <input class="input" id="cantidad" type="number" inputmode="decimal" min="0.1" step="any" placeholder="Ej. 12" required></div>
                    <div class="field"><label for="unidad">Unidad *</label>
                        <select class="input" id="unidad"><option value="porciones">Porciones</option><option value="piezas">Piezas</option><option value="kg">Kilogramos</option><option value="litros">Litros</option></select></div>
                </div>
                <div class="field" id="w-porc" hidden><label for="porciones">Porciones aproximadas</label>
                    <input class="input" id="porciones" type="number" inputmode="numeric" min="1" step="1">
                    <span class="hint">Sirve para el contador público. Sugerido: 4 porciones por kg o litro.</span></div>
                <div class="row2">
                    <div class="field"><label for="fecha">Fecha de caducidad *</label>
                        <input class="input" id="fecha" type="date" min="${hoyISO()}" required></div>
                    <div class="field"><label for="hora">Recoger hasta *</label>
                        <input class="input" id="hora" type="time" value="18:00" required></div>
                </div>
                <label class="check"><input type="checkbox" id="ok-estado"> Confirmo que la comida está en buen estado, bien conservada y no ha sido servida.</label>
                <p class="form-error" id="err"></p>
                <button class="btn btn-primary btn-block" type="submit">Publicar excedente</button>
            </form>
        </main>
        ${navInferior('/publicar')}`;

    let archivo = null;
    $('#foto').addEventListener('change', (e) => {
        archivo = e.target.files[0] || null;
        const drop = $('#drop');
        $$('.prev', drop).forEach((n) => n.remove());
        if (archivo) { const im = document.createElement('img'); im.className = 'prev'; im.alt = 'Vista previa'; im.src = URL.createObjectURL(archivo); drop.appendChild(im); }
    });
    const sugerirPorciones = () => {
        const u = $('#unidad').value, c = parseFloat($('#cantidad').value);
        const necesita = u === 'kg' || u === 'litros';
        $('#w-porc').hidden = !necesita;
        if (necesita && c > 0) $('#porciones').value = Math.round(c * 4);
    };
    $('#unidad').addEventListener('change', sugerirPorciones);
    $('#cantidad').addEventListener('input', sugerirPorciones);

    $('#f-pub').addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = $('#err'), btn = $('button[type=submit]');
        err.textContent = '';
        const tipo = $('#tipo').value.trim(), cantidad = parseFloat($('#cantidad').value), unidad = $('#unidad').value;
        const fecha = $('#fecha').value, hora = $('#hora').value;
        if (!archivo) { err.textContent = 'Adjunta al menos una foto del alimento.'; return; }
        if (!tipo) { err.textContent = 'Indica qué alimento es.'; return; }
        if (!(cantidad > 0)) { err.textContent = 'Indica una cantidad mayor a cero.'; return; }
        if (!fecha) { err.textContent = 'Indica la fecha de caducidad.'; return; }
        if (fecha < hoyISO()) { err.textContent = 'No puedes publicar un alimento ya caducado.'; return; }
        if (!hora) { err.textContent = 'Indica la hora límite para recogerlo.'; return; }
        if (!$('#ok-estado').checked) { err.textContent = 'Debes confirmar que la comida está en buen estado.'; return; }
        const porc = (unidad === 'kg' || unidad === 'litros') ? parseInt($('#porciones').value, 10) || Math.round(cantidad * 4) : Math.round(cantidad);

        btn.disabled = true; btn.textContent = 'Publicando…';
        try {
            const blob = await comprimirImagen(archivo);
            const ruta = `${S.session.user.id}/${Date.now()}.jpg`;
            const { error: eUp } = await sb.storage.from('fotos').upload(ruta, blob, { contentType: 'image/jpeg', upsert: false });
            if (eUp) throw eUp;
            const { data: pub } = sb.storage.from('fotos').getPublicUrl(ruta);
            const { error } = await sb.from('excedentes').insert([{
                donante_id: S.session.user.id, tipo_alimento: tipo, cantidad, unidad, porciones: porc,
                fecha_caducidad: fecha, hora_limite: hora, foto_url: pub.publicUrl, buen_estado_confirmado: true, estado: 'publicado'
            }]);
            if (error) throw error;
            toast('¡Excedente publicado! Los comedores ya pueden verlo.', 'ok');
            go('/mis-publicaciones');
        } catch (ex) {
            err.textContent = msgErr(ex);
            btn.disabled = false; btn.textContent = 'Publicar excedente';
        }
    });
}

function comprimirImagen(file, max = 1280, calidad = 0.82) {
    return new Promise((res, rej) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const r = Math.min(1, max / Math.max(img.width, img.height));
            const c = document.createElement('canvas');
            c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            URL.revokeObjectURL(url);
            c.toBlob((b) => (b ? res(b) : rej(new Error('No se pudo procesar la foto.'))), 'image/jpeg', calidad);
        };
        img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('No se pudo leer la imagen. Prueba con otra foto.')); };
        img.src = url;
    });
}

async function vPubDetalle(id) {
    app.innerHTML = `${topbarBack('/mis-publicaciones')}<main class="screen with-nav">${loader()}</main>${navInferior('/mis-publicaciones')}`;
    const cargar = async () => {
        const [ex, hist, rec] = await Promise.all([
            sb.from('excedentes').select('*, comedor:perfiles!comedor_id(nombre_organizacion,responsable,telefono,direccion,horario_atencion)').eq('id', id).eq('donante_id', S.session.user.id).maybeSingle(),
            sb.from('historial_excedente').select('*').eq('excedente_id', id).order('fecha', { ascending: true }),
            sb.from('recepciones').select('*').eq('excedente_id', id).maybeSingle()
        ]);
        if (ex.error) throw ex.error;
        const x = ex.data;
        const main = $('main');
        if (!x) { main.innerHTML = `<div class="empty"><div class="big">🔍</div><b>No encontramos esta publicación</b></div>`; return; }
        const c = x.comedor, r = rec.data;
        main.innerHTML = `
            <div class="food">
                <div class="food-photo">${x.foto_url ? `<img src="${esc(x.foto_url)}" alt="${esc(x.tipo_alimento)}">` : '🍽️'}</div>
                <div class="food-body">
                    <div class="between"><span class="food-title">${esc(x.tipo_alimento)}</span>${pill(x.estado)}</div>
                    <div class="kv">
                        <div>${ico('list')}<span><b>${esc(fmtCant(x.cantidad, x.unidad))}</b>${x.porciones ? ` · ≈ ${fmtNum(x.porciones)} porciones` : ''}</span></div>
                        <div>${ico('calendar')}<span>Caduca <b>${fmtFecha(x.fecha_caducidad)}</b></span></div>
                        <div>${ico('clock')}<span>Recoger hasta las <b>${fmtHora(x.hora_limite)}</b></span></div>
                    </div>
                </div>
            </div>
            ${c ? `<h2 class="section-title">Comedor que lo recogerá</h2>
                <div class="card mt8"><b>${esc(c.nombre_organizacion)}</b>
                    <div class="kv">
                        <div>${ico('user2')}<span>${esc(c.responsable || '—')}</span></div>
                        <div>${ico('phone')}<span>${c.telefono ? `<a href="tel:${esc(c.telefono)}">${esc(c.telefono)}</a>` : '—'}</span></div>
                        <div>${ico('pin')}<span>${esc(c.direccion || '—')}</span></div>
                        <div>${ico('clock')}<span>${esc(c.horario_atencion || '—')}</span></div>
                    </div></div>` : ''}
            ${r ? `<h2 class="section-title">Recepción</h2>
                <div class="notice ${r.resultado === 'confirmada' ? '' : 'notice-err'} mt8">${ico(r.resultado === 'confirmada' ? 'check' : 'alert')}<div>
                    <b>${r.resultado === 'confirmada' ? `Recibieron ${esc(fmtCant(r.cantidad_recibida, x.unidad))}` : 'El comedor rechazó el lote'}</b>
                    <span>${r.resultado === 'confirmada' ? `${fmtNum(r.porciones_rescatadas)} porciones sumadas al contador público.` : `Motivo: ${esc(r.motivo || '—')}`}</span></div></div>` : ''}
            <h2 class="section-title">Historial del lote</h2>
            <ul class="timeline">${(hist.data || []).map((h) => `<li><b>${esc((ESTADOS[h.estado] || [h.estado])[0])}</b><span>${esc(h.detalle || '')}${h.detalle ? ' · ' : ''}${fmtFechaHora(h.fecha)}</span></li>`).join('')}</ul>
            ${x.estado === 'publicado' ? `<button class="btn btn-danger btn-block mt16" id="cancelar">Cancelar publicación</button>` : ''}`;
        const bc = $('#cancelar');
        if (bc) bc.onclick = () => modal({
            titulo: '¿Cancelar esta publicación?', texto: 'Dejará de estar visible para los comedores. Esta acción no se puede deshacer.',
            confirmar: 'Sí, cancelar', peligro: true,
            onConfirm: async () => { const { error } = await sb.rpc('cancelar_excedente', { p_id: id }); if (error) throw error; toast('Publicación cancelada.'); cargar(); }
        });
    };
    S.refresh = cargar;
    try { await cargar(); } catch (e) { $('main').innerHTML = `<div class="notice notice-err">${ico('alert')}<div><b>Error</b><span>${esc(msgErr(e))}</span></div></div>`; }
}

/* =====================================================================
   COMEDOR
   ===================================================================== */
async function vDisponibles() {
    app.innerHTML = `${topbar()}<main class="screen with-nav">${loader()}</main>${navInferior('/disponibles')}`;
    const cargar = async () => {
        const { data, error } = await sb.from('excedentes')
            .select('*, donante:perfiles!donante_id(nombre_organizacion,direccion,logo_url)')
            .eq('estado', 'publicado').gte('fecha_caducidad', hoyISO())
            .order('fecha_caducidad', { ascending: true }).order('hora_limite', { ascending: true });
        const main = $('main');
        if (!main) return;
        if (error) { main.innerHTML = `<div class="notice notice-err">${ico('alert')}<div><b>No se pudo cargar la lista</b><span>${esc(msgErr(error))}</span></div></div>`; return; }
        main.innerHTML = `
            <h1 class="h2">Excedentes disponibles</h1>
            <p class="lead">${esc(S.perfil.nombre_organizacion)} · Ordenados de los que caducan antes a los que caducan después.</p>
            ${data.length ? `<div class="grid-list">${data.map(tarjetaDisponible).join('')}</div>`
                : `<div class="empty"><div class="big">🌿</div><b>No hay alimentos disponibles ahora</b><p class="small mt8">Esta lista se actualiza sola cuando una empresa publica algo nuevo.</p></div>`}
            <p class="footnote">El primer comedor que acepta un excedente lo reserva. La recogida es en el local de la empresa.</p>`;
        $$('[data-aceptar]').forEach((b) => b.onclick = () => aceptar(b.dataset.aceptar, b.dataset.nombre));
    };
    S.refresh = cargar;
    await cargar();
}

function tarjetaDisponible(x) {
    const d = x.donante || {};
    const urgente = diasPara(x.fecha_caducidad) <= 1;
    return `<article class="food">
        <div class="food-photo">${x.foto_url ? `<img src="${esc(x.foto_url)}" alt="${esc(x.tipo_alimento)}" loading="lazy">` : '🍽️'}</div>
        <div class="food-body">
            <div class="between"><span class="food-title">${esc(x.tipo_alimento)}</span>${pill('publicado')}</div>
            <div class="kv">
                <div>${ico('building')}<span><b>${esc(d.nombre_organizacion || 'Empresa')}</b></span></div>
                <div>${ico('list')}<span><b>${esc(fmtCant(x.cantidad, x.unidad))}</b>${x.porciones ? ` · ≈ ${fmtNum(x.porciones)} porciones` : ''}</span></div>
                <div class="${urgente ? 'urgent' : ''}">${ico('calendar')}<span><b>${esc(cuando(x.fecha_caducidad))}</b></span></div>
                <div>${ico('clock')}<span>Recoger hasta las <b>${fmtHora(x.hora_limite)}</b></span></div>
                <div>${ico('pin')}<span>${esc(d.direccion || 'Dirección no especificada')}</span></div>
            </div>
            <button class="btn btn-primary btn-block mt16" data-aceptar="${esc(x.id)}" data-nombre="${esc(x.tipo_alimento)}">Aceptar excedente</button>
        </div></article>`;
}

function aceptar(id, nombre) {
    modal({
        titulo: '¿Aceptar este excedente?', texto: `“${nombre}” quedará reservado para ti y desaparecerá para los demás comedores. Tú pasas a recogerlo al local de la empresa.`,
        confirmar: 'Sí, aceptar',
        onConfirm: async () => {
            const { error } = await sb.rpc('aceptar_excedente', { p_id: id });
            if (error) { if (S.refresh) S.refresh(); throw error; }
            toast('¡Reservado! Pasa a recogerlo y luego confirma la recepción.', 'ok');
            go('/recogidas');
        }
    });
}

async function vRecogidas() {
    app.innerHTML = `${topbar()}<main class="screen with-nav">${loader()}</main>${navInferior('/recogidas')}`;
    const cargar = async () => {
        const { data, error } = await sb.from('excedentes')
            .select('*, donante:perfiles!donante_id(nombre_organizacion,responsable,telefono,direccion)')
            .eq('comedor_id', S.session.user.id).order('aceptado_at', { ascending: false });
        const main = $('main');
        if (!main) return;
        if (error) { main.innerHTML = `<div class="notice notice-err">${ico('alert')}<div><b>No se pudo cargar</b><span>${esc(msgErr(error))}</span></div></div>`; return; }
        const porRecoger = data.filter((x) => x.estado === 'aceptado');
        const historial = data.filter((x) => x.estado !== 'aceptado');
        main.innerHTML = `
            <h1 class="h2">Mis recogidas</h1>
            <p class="lead">Recoge en el local y confirma cuánto recibiste.</p>
            <h2 class="section-title">Por recoger · ${porRecoger.length}</h2>
            ${porRecoger.length ? `<div class="grid-list">${porRecoger.map(tarjetaRecoger).join('')}</div>`
                : `<div class="empty"><div class="big">🧺</div><b>No tienes recogidas pendientes</b><p class="small mt8">Acepta un excedente desde “Disponibles”.</p><button class="btn btn-outline btn-sm mt12" data-go="/disponibles">Ver disponibles</button></div>`}
            ${historial.length ? `<h2 class="section-title">Historial</h2><div class="list">${historial.map((x) => `
                <div class="item"><span class="thumb">${x.foto_url ? `<img src="${esc(x.foto_url)}" alt="" loading="lazy">` : '🍽️'}</span>
                <span class="item-body"><span class="item-title">${esc(x.tipo_alimento)}</span>
                <span class="item-meta">${pill(x.estado)}<span>${esc(fmtCant(x.cantidad, x.unidad))}</span></span>
                <span class="item-sub">${esc((x.donante || {}).nombre_organizacion || '')}</span></span></div>`).join('')}</div>` : ''}`;
        $$('[data-confirmar]').forEach((b) => b.onclick = () => confirmarRecepcion(b.dataset.confirmar, b.dataset.cant, b.dataset.unidad, b.dataset.nombre));
        $$('[data-rechazar]').forEach((b) => b.onclick = () => rechazarLote(b.dataset.rechazar, b.dataset.nombre));
    };
    S.refresh = cargar;
    await cargar();
}

function tarjetaRecoger(x) {
    const d = x.donante || {};
    return `<article class="food">
        <div class="food-body">
            <div class="between"><span class="food-title">${esc(x.tipo_alimento)}</span>${pill('aceptado')}</div>
            <div class="kv">
                <div>${ico('list')}<span><b>${esc(fmtCant(x.cantidad, x.unidad))}</b> publicados</span></div>
                <div>${ico('clock')}<span>Recoger hasta las <b>${fmtHora(x.hora_limite)}</b> · caduca ${fmtFecha(x.fecha_caducidad)}</span></div>
                <div>${ico('building')}<span><b>${esc(d.nombre_organizacion || 'Empresa')}</b></span></div>
                <div>${ico('pin')}<span>${esc(d.direccion || '—')}</span></div>
                <div>${ico('phone')}<span>${d.telefono ? `<a href="tel:${esc(d.telefono)}">${esc(d.telefono)}</a>` : '—'}${d.responsable ? ` · ${esc(d.responsable)}` : ''}</span></div>
            </div>
            <div class="btn-row mt16">
                <button class="btn btn-danger" data-rechazar="${esc(x.id)}" data-nombre="${esc(x.tipo_alimento)}">Rechazar lote</button>
                <button class="btn btn-primary" data-confirmar="${esc(x.id)}" data-cant="${esc(x.cantidad)}" data-unidad="${esc(x.unidad)}" data-nombre="${esc(x.tipo_alimento)}">Confirmar recepción</button>
            </div>
        </div></article>`;
}

function confirmarRecepcion(id, cant, unidad, nombre) {
    modal({
        titulo: 'Confirmar recepción', texto: `¿Cuánto recibiste realmente de “${nombre}”?`, confirmar: 'Confirmar',
        cuerpo: `<div class="field mt12"><label for="m-cant">Cantidad recibida (${esc(unidad)})</label>
                 <input class="input" id="m-cant" type="number" inputmode="decimal" min="0.1" step="any" value="${esc(cant)}"></div>`,
        onConfirm: async (m) => {
            const q = parseFloat($('#m-cant', m).value);
            if (!(q > 0)) throw new Error('Indica la cantidad realmente recibida.');
            const { error } = await sb.rpc('confirmar_recepcion', { p_id: id, p_cantidad: q });
            if (error) throw error;
            toast('¡Recepción confirmada! El contador público ya subió.', 'ok');
            if (S.refresh) S.refresh();
        }
    });
}

function rechazarLote(id, nombre) {
    modal({
        titulo: 'Rechazar el lote', texto: `Cuéntanos por qué “${nombre}” no se puede aceptar. Se avisará a la empresa.`, confirmar: 'Rechazar lote', peligro: true,
        cuerpo: `<div class="field mt12"><label for="m-motivo">Motivo</label>
                 <textarea class="input" id="m-motivo" maxlength="240" placeholder="Ej. Llegó sin refrigeración"></textarea></div>`,
        onConfirm: async (m) => {
            const motivo = $('#m-motivo', m).value.trim();
            if (motivo.length < 3) throw new Error('Indica el motivo del rechazo.');
            const { error } = await sb.rpc('rechazar_recepcion', { p_id: id, p_motivo: motivo });
            if (error) throw error;
            toast('Lote rechazado y registrado en el historial.');
            if (S.refresh) S.refresh();
        }
    });
}

/* =====================================================================
   AVISOS y PERFIL (donante y comedor)
   ===================================================================== */
async function vAvisos() {
    app.innerHTML = `${topbar()}<main class="screen with-nav">${loader()}</main>${navInferior('/avisos')}`;
    const cargar = async () => {
        const { data, error } = await sb.from('notificaciones').select('*').eq('usuario_id', S.session.user.id).order('created_at', { ascending: false }).limit(50);
        const main = $('main');
        if (!main) return;
        if (error) { main.innerHTML = `<div class="notice notice-err">${ico('alert')}<div><b>No se pudieron cargar los avisos</b><span>${esc(msgErr(error))}</span></div></div>`; return; }
        const donante = S.perfil.rol === 'donante';
        main.innerHTML = `
            <h1 class="h2">Avisos</h1>
            <p class="lead">Novedades sobre tus excedentes.</p>
            ${data.length ? `<div class="list">${data.map((n) => `
                <${donante && n.excedente_id ? `button data-go="/publicacion/${esc(n.excedente_id)}"` : 'div'} class="item" style="${n.leida ? '' : 'border-color:#9ad5ae;background:#f6fcf8'}">
                    <span class="thumb">${ico('bell', 22)}</span>
                    <span class="item-body"><span style="font-size:14px;font-weight:${n.leida ? 500 : 700};display:block">${esc(n.mensaje)}</span><span class="item-sub">${fmtFechaHora(n.created_at)}</span></span>
                </${donante && n.excedente_id ? 'button' : 'div'}>`).join('')}</div>`
                : `<div class="empty"><div class="big">🔔</div><b>Sin avisos por ahora</b></div>`}`;
        if (data.some((n) => !n.leida)) {
            await sb.from('notificaciones').update({ leida: true }).eq('usuario_id', S.session.user.id).eq('leida', false);
            S.avisos = 0; pintarBadge();
        }
    };
    S.refresh = cargar;
    await cargar();
}

function vPerfil() {
    const p = S.perfil;
    const rolTxt = p.rol === 'donante' ? 'Empresa' : p.rol === 'comedor' ? 'Comedor' : 'Administrador';
    app.innerHTML = `
        ${topbar()}
        <main class="screen with-nav">
            <h1 class="h2">Mi perfil</h1>
            <div class="card mt16">
                <div class="between"><b style="font-size:17px">${esc(p.nombre_organizacion || 'Sin nombre')}</b><span class="pill pill-ok">${rolTxt}</span></div>
                <div class="kv">
                    <div>${ico('user2')}<span>${esc(p.responsable || '—')}</span></div>
                    <div>${ico('mail')}<span>${esc(p.correo || S.session.user.email)}</span></div>
                    <div>${ico('phone')}<span>${esc(p.telefono || '—')}</span></div>
                    <div>${ico('pin')}<span>${esc(p.direccion || '—')}</span></div>
                    ${p.rol === 'comedor' ? `<div>${ico('clock')}<span>${esc(p.horario_atencion || '—')}</span></div>` : ''}
                </div>
            </div>
            <div class="stack mt16">
                <button class="btn btn-outline btn-block" data-go="/">Ver sitio público</button>
                <button class="btn btn-danger btn-block" id="salir">${ico('logout')} Cerrar sesión</button>
            </div>
        </main>
        ${navInferior('/perfil')}`;
    $('#salir').onclick = cerrarSesion;
}

/* =====================================================================
   ADMINISTRADOR
   ===================================================================== */
async function vAdmin() {
    let tab = 'pendientes', cuentas = [];
    app.innerHTML = `${topbar()}<main class="screen with-nav">${loader()}</main>${navInferior('/admin')}`;

    const pintar = () => {
        const pend = cuentas.filter((c) => !c.aprobado && c.activo !== false);
        const resto = cuentas.filter((c) => !(!c.aprobado && c.activo !== false));
        $('main').innerHTML = `
            <h1 class="h2">Registros</h1>
            <p class="lead">Aprueba o rechaza las solicitudes nuevas y administra las cuentas.</p>
            <div class="tabs">
                <button class="tab ${tab === 'pendientes' ? 'on' : ''}" data-t="pendientes">Pendientes · ${pend.length}</button>
                <button class="tab ${tab === 'cuentas' ? 'on' : ''}" data-t="cuentas">Cuentas · ${resto.length}</button>
            </div>
            <div class="grid-list">${(tab === 'pendientes' ? pend : resto).map((c) => tarjetaCuenta(c, tab === 'pendientes')).join('')
                || `<div class="empty"><div class="big">${tab === 'pendientes' ? '✅' : '📂'}</div><b>${tab === 'pendientes' ? 'No hay registros pendientes' : 'Aún no hay cuentas'}</b></div>`}</div>`;
        $$('.tab').forEach((t) => t.onclick = () => { tab = t.dataset.t; pintar(); });
        $$('[data-ap]').forEach((b) => b.onclick = () => accionCuenta('aprobar_registro', { p_id: b.dataset.ap, p_aprobar: b.dataset.v === '1' }, b.dataset.v === '1' ? 'Cuenta aprobada.' : 'Registro rechazado.', cargar));
        $$('[data-ac]').forEach((b) => b.onclick = () => accionCuenta('set_cuenta_activa', { p_id: b.dataset.ac, p_activo: b.dataset.v === '1' }, b.dataset.v === '1' ? 'Cuenta reactivada.' : 'Cuenta desactivada.', cargar));
    };
    const cargar = async () => {
        const { data, error } = await sb.from('perfiles').select('*').neq('rol', 'admin').order('created_at', { ascending: false });
        if (error) { $('main').innerHTML = `<div class="notice notice-err">${ico('alert')}<div><b>No se pudieron cargar los registros</b><span>${esc(msgErr(error))}</span></div></div>`; return; }
        cuentas = data || [];
        pintar();
    };
    S.refresh = cargar;
    await cargar();
}

function tarjetaCuenta(c, pendiente) {
    const estado = c.aprobado && c.activo !== false ? '<span class="pill pill-ok">Activa</span>'
        : c.aprobado ? '<span class="pill pill-muted">Desactivada</span>'
        : c.activo === false ? '<span class="pill pill-bad">Rechazada</span>' : '<span class="pill pill-info">Pendiente</span>';
    return `<article class="card">
        <div class="between"><b style="font-size:16px">${esc(c.nombre_organizacion || 'Sin nombre')}</b>${estado}</div>
        <div class="muted small">${c.rol === 'donante' ? 'Empresa' : 'Comedor'} · registrada ${fmtFecha((c.created_at || '').slice(0, 10))}</div>
        <div class="kv">
            <div>${ico('user2')}<span>${esc(c.responsable || '—')}</span></div>
            <div>${ico('mail')}<span>${esc(c.correo || '—')}</span></div>
            <div>${ico('phone')}<span>${esc(c.telefono || '—')}</span></div>
            <div>${ico('pin')}<span>${esc(c.direccion || '—')}</span></div>
            ${c.rol === 'comedor' ? `<div>${ico('clock')}<span>${esc(c.horario_atencion || '—')}</span></div>` : ''}
        </div>
        <div class="btn-row mt12">
            ${pendiente
                ? `<button class="btn btn-danger btn-sm" data-ap="${esc(c.id)}" data-v="0">Rechazar</button><button class="btn btn-primary btn-sm" data-ap="${esc(c.id)}" data-v="1">Aprobar</button>`
                : c.aprobado && c.activo !== false
                    ? `<button class="btn btn-danger btn-sm" data-ac="${esc(c.id)}" data-v="0">Desactivar cuenta</button>`
                    : c.aprobado ? `<button class="btn btn-outline btn-sm" data-ac="${esc(c.id)}" data-v="1">Reactivar cuenta</button>`
                    : `<button class="btn btn-primary btn-sm" data-ap="${esc(c.id)}" data-v="1">Aprobar</button>`}
        </div></article>`;
}

async function accionCuenta(fn, args, okMsg, recargar) {
    const { error } = await sb.rpc(fn, args);
    if (error) { toast(msgErr(error), 'err'); return; }
    toast(okMsg, 'ok');
    recargar();
}

/* =====================================================================
   Sesión y navegación
   ===================================================================== */
async function cerrarSesion() {
    await sb.auth.signOut();
    S.session = null; S.perfil = null; S.avisos = 0;
    go('/');
}

function teardown() {
    S.timers.forEach(clearInterval); S.timers = [];
    S.refresh = null;
}

function suscribirTiempoReal() {
    if (S.channel) { sb.removeChannel(S.channel); S.channel = null; }
    if (!S.session || !aprobado(S.perfil) || S.perfil.rol === 'admin') return;
    const uid = S.session.user.id;
    S.channel = sb.channel('cf-' + uid)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'excedentes' }, () => { if (S.refresh) S.refresh(); })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `usuario_id=eq.${uid}` }, (p) => {
            toast(p.new.mensaje, 'ok'); S.avisos += 1; pintarBadge();
            if (S.refresh && location.hash.startsWith('#/avisos')) S.refresh();
        })
        .subscribe();
}

const SOLO_PUBLICAS = ['login', 'rol', 'registro', 'enviado'];
const ROLES = { 'mis-publicaciones': 'donante', publicar: 'donante', publicacion: 'donante', disponibles: 'comedor', recogidas: 'comedor', admin: 'admin' };

async function route() {
    teardown();
    window.scrollTo(0, 0);
    const [a = '', b = ''] = (location.hash.replace(/^#\/?/, '').split('?')[0]).split('/');

    try {
        if (!S.session) {
            if (!['', ...SOLO_PUBLICAS].includes(a)) return go('/login');
        } else {
            if (!S.perfil) await API.cargarPerfil();
            if (SOLO_PUBLICAS.includes(a)) return go(aprobado(S.perfil) ? panelDe(S.perfil) : '/pendiente');
            if (a !== '') {
                if (!aprobado(S.perfil)) { if (a !== 'pendiente') return go('/pendiente'); }
                else {
                    if (a === 'pendiente') return go(panelDe(S.perfil));
                    const r = ROLES[a];
                    if (r && S.perfil.rol !== r) return go(panelDe(S.perfil));
                    if (a === 'avisos' && S.perfil.rol === 'admin') return go('/admin');
                }
            }
            if (aprobado(S.perfil) && a !== '') await API.contarAvisos();
        }
    } catch (e) {
        app.innerHTML = `${topbar()}<main class="screen"><div class="notice notice-err">${ico('alert')}<div><b>No se pudo conectar con la base de datos</b><span>${esc(msgErr(e))}</span></div></div>
            <button class="btn btn-outline btn-block mt16" onclick="location.reload()">Reintentar</button></main>`;
        return;
    }

    switch (a) {
        case '': return vHome();
        case 'login': return vLogin();
        case 'rol': return vRol();
        case 'registro': return vRegistro(b);
        case 'enviado': return vEnviado();
        case 'pendiente': return vPendiente();
        case 'mis-publicaciones': return vMisPublicaciones();
        case 'publicar': return vPublicar();
        case 'publicacion': return vPubDetalle(b);
        case 'disponibles': return vDisponibles();
        case 'recogidas': return vRecogidas();
        case 'avisos': return vAvisos();
        case 'perfil': return vPerfil();
        case 'admin': return vAdmin();
        default: return go('/');
    }
}

// Navegación por data-go en cualquier parte de la app
document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-go]');
    if (el) { e.preventDefault(); go(el.dataset.go); }
});
window.addEventListener('hashchange', route);

/* =====================================================================
   Arranque
   ===================================================================== */
(async function init() {
    try {
        const { data } = await sb.auth.getSession();
        S.session = data.session;
        if (S.session) {
            await API.cargarPerfil().catch(() => {});
            sb.rpc('marcar_vencidos').then(() => {}, () => {});
        }
    } catch (e) { console.warn('Sesión:', e.message); }

    sb.auth.onAuthStateChange((evento, session) => {
        if (evento === 'INITIAL_SESSION' || evento === 'TOKEN_REFRESHED') return;
        const antes = S.session && S.session.user.id;
        S.session = session;
        if (!session) { S.perfil = null; suscribirTiempoReal(); return; }
        if (evento === 'SIGNED_IN' && antes === session.user.id && S.perfil) return;
        // Se difiere para no esperar llamadas de Supabase dentro del callback (puede bloquear el cliente)
        setTimeout(async () => {
            try { await API.cargarPerfil(); } catch (e) { S.perfil = null; }
            suscribirTiempoReal();
            sb.rpc('marcar_vencidos').then(() => {}, () => {});
            const h = location.hash.replace(/^#\/?/, '').split('/')[0];
            if (SOLO_PUBLICAS.includes(h)) go(aprobado(S.perfil) ? panelDe(S.perfil) : '/pendiente'); else route();
        }, 0);
    });

    suscribirTiempoReal();
    await route();
})();

})();
