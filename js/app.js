// js/app.js · Comida Full
// Aplicación de una sola página (hash router) conectada a Supabase.
// Pantallas según el prototipo de Figma M01–M13, con barra de pestañas inferior en todas.
(() => {
'use strict';

const sb = window.supabaseClient;
const app = document.getElementById('app');

// Datos de contacto que se muestran en "Ayuda y contacto" (déjalos vacíos si no quieres mostrarlos).
const CONTACTO = { correo: '', telefono: '' };

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
    userplus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
    user2: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkc: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    xc: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    chev: '<path d="m9 18 6-6-6-6"/>',
    arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
    store: '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4M2 7h20"/>',
    utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 22 16.92z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    plusc: '<circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/>',
    compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/>',
    box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>'
};
const ico = (n, size) => `<svg class="ico" ${size ? `style="width:${size}px;height:${size}px"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

const ESTADOS = {
    publicado: ['disponible', 'pill-ok'],
    aceptado: ['aceptado', 'pill-info'],
    confirmado: ['entregado', 'pill-done'],
    rechazado: ['rechazado', 'pill-bad'],
    cancelado: ['cancelado', 'pill-muted'],
    vencido: ['vencido', 'pill-bad']
};
const pill = (estado) => { const [t, c] = ESTADOS[estado] || [estado, '']; return `<span class="pill ${c}">${esc(t)}</span>`; };

const hoyISO = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
const ymd = (iso) => String(iso).slice(0, 10).split('-').map(Number);
const fmtFecha = (iso) => {
    if (!iso) return '';
    const [y, m, d] = ymd(iso);
    return new Date(y, m - 1, d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '');
};
const fmtDMA = (iso) => { if (!iso) return ''; const [y, m, d] = ymd(iso); return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`; };
const fmtFechaHora = (ts) => new Date(ts).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const fmtHora = (t) => String(t || '').slice(0, 5);
const fmtNum = (n) => Number(n || 0).toLocaleString('es-MX');
const unidadTxt = (u) => (u === 'porciones' ? 'porc.' : u === 'piezas' ? 'pzas' : u);
const fmtCant = (c, u) => `${Number(c).toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${unidadTxt(u)}`;
const inicial = (s) => (String(s || '?').trim()[0] || '?').toUpperCase();
const primerNombre = (s) => String(s || '').trim().split(/\s+/)[0] || '';
const diasPara = (iso) => { const [y, m, d] = ymd(iso); const h = hoyISO().split('-').map(Number); return Math.round((new Date(y, m - 1, d) - new Date(h[0], h[1] - 1, h[2])) / 864e5); };
const cuando = (iso) => { const n = diasPara(iso); return n === 0 ? 'Caduca hoy' : n === 1 ? 'Caduca mañana' : `Caduca ${fmtFecha(iso)}`; };

function msgErr(e) {
    const m = String((e && e.message) || e || '');
    if (/Invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos.';
    if (/User already registered|already been registered/i.test(m)) return 'Ya existe una cuenta con ese correo. Prueba iniciar sesión.';
    if (/Email not confirmed/i.test(m)) return 'Confirma tu correo antes de entrar (revisa tu bandeja).';
    if (/Password should be at least/i.test(m)) return 'La contraseña es demasiado corta.';
    if (/same password|different from the old/i.test(m)) return 'La nueva contraseña debe ser distinta a la anterior.';
    if (/rate limit|too many|security purposes/i.test(m)) return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'No hay conexión con el servidor. Revisa tu internet.';
    if (/row-level security/i.test(m)) return 'No tienes permiso para hacer esto. ¿Tu cuenta ya fue aprobada?';
    if (/Bucket not found/i.test(m)) return 'Falta el almacén de fotos en Supabase. Ejecuta supabase/schema.sql.';
    if (/Could not find the function|schema cache/i.test(m)) return 'Falta actualizar la base de datos. Vuelve a ejecutar supabase/schema.sql.';
    return m || 'Ocurrió un error inesperado.';
}

function toast(msg, tipo = '') {
    const t = document.createElement('div');
    t.className = `toast ${tipo}`;
    t.textContent = msg;
    $('#toasts', document).appendChild(t);
    setTimeout(() => t.remove(), 4200);
}

function modal({ titulo, cuerpo = '', texto = '', confirmar = 'Confirmar', cerrar = 'Cerrar', peligro = false, onConfirm }) {
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(titulo)}">
            <h3>${esc(titulo)}</h3>
            ${texto ? `<p>${esc(texto)}</p>` : ''}
            ${cuerpo}
            <p class="form-error" data-err></p>
            <div class="btn-row">
                <button class="btn btn-outline" data-cancel>${onConfirm ? 'Cancelar' : esc(cerrar)}</button>
                ${onConfirm ? `<button class="btn ${peligro ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(confirmar)}</button>` : ''}
            </div>
        </div>`;
    document.body.appendChild(back);
    const close = () => back.remove();
    back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-go]')) close(); });
    $('[data-cancel]', back).onclick = close;
    const ok = $('[data-ok]', back);
    if (ok) ok.onclick = async () => {
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
const panelDe = (p) => (p && p.rol === 'admin' ? '/admin' : p && p.rol === 'comedor' ? '/explorar' : '/mis-publicaciones');

/* =====================================================================
   Piezas de interfaz comunes
   ===================================================================== */
const marca = () => `<a class="brand" href="#/"><span class="brand-mark">${ico('leaf')}</span>comida full</a>`;

const campana = () => `<button class="icon-btn" data-go="/avisos" aria-label="Avisos">${ico('bell', 22)}${S.avisos > 0 ? `<i class="dot">${S.avisos > 9 ? '9+' : S.avisos}</i>` : ''}</button>`;
const topLogo = (der = '') => `<header class="topbar">${marca()}<div>${der}</div></header>`;
const topBack = (to = '/', der = '') => `<header class="topbar"><button class="back" data-go="${to}">${ico('back')} Volver</button><div style="display:flex;align-items:center;gap:6px">${der}${marca()}</div></header>`;
const topRol = () => topLogo(S.perfil && S.perfil.rol !== 'admin' ? campana() : '');

/* Barra inferior: depende de si hay sesión y del rol. Siempre visible. */
function navInferior(activa) {
    const logueado = !!S.session;
    const ok = logueado && aprobado(S.perfil);
    const r = ok ? S.perfil.rol : null;
    let items;
    if (r === 'donante') items = [['/mis-publicaciones', 'grid', 'Publicaciones'], ['/publicar', 'plusc', 'Publicar'], ['/perfil', 'user', 'Perfil']];
    else if (r === 'comedor') items = [['/explorar', 'compass', 'Explorar'], ['/reservas', 'box', 'Mis reservas'], ['/perfil', 'user', 'Perfil']];
    else if (r === 'admin') items = [['/admin', 'shield', 'Registros'], ['/perfil', 'user', 'Perfil']];
    else if (logueado) items = [['/pendiente', 'clock', 'Mi estado'], ['/', 'home', 'Inicio']];
    else items = [['/', 'home', 'Inicio'], ['/login', 'login', 'Ingresar'], ['/rol', 'userplus', 'Registrarme']];
    return `<nav class="bottomnav" aria-label="Navegación principal">${items.map(([ruta, i, t]) =>
        `<button class="navitem ${activa === ruta ? 'on' : ''}" data-go="${ruta}" ${activa === ruta ? 'aria-current="page"' : ''}>${ico(i)}<span>${t}</span></button>`).join('')}</nav>`;
}

function pintarBadge() {
    const b = $('.topbar [data-go="/avisos"]');
    if (!b) return;
    const d = $('.dot', b);
    if (S.avisos > 0) {
        if (d) d.textContent = S.avisos > 9 ? '9+' : S.avisos;
        else b.insertAdjacentHTML('beforeend', `<i class="dot">${S.avisos > 9 ? '9+' : S.avisos}</i>`);
    } else if (d) d.remove();
}

/* Documentos cortos que se muestran en ventanas */
function verAyuda() {
    const extra = [CONTACTO.correo && `<p><b>Correo:</b> <a href="mailto:${esc(CONTACTO.correo)}">${esc(CONTACTO.correo)}</a></p>`, CONTACTO.telefono && `<p><b>Teléfono:</b> ${esc(CONTACTO.telefono)}</p>`].filter(Boolean).join('');
    modal({
        titulo: 'Ayuda y contacto',
        cuerpo: `<div class="doc">
            <p>¿Tienes dudas sobre una publicación, una recogida o tu cuenta? Escribe a la administración de Comida Full desde el correo con el que te registraste y cuéntanos qué pasó.</p>
            <p><b>Tip:</b> si una recogida se complica, avisa al contacto que aparece en la reserva y registra el motivo en la plataforma.</p>
            ${extra}</div>`
    });
}
function verPrivacidad() {
    modal({
        titulo: 'Privacidad y términos',
        cuerpo: `<div class="doc">
            <p><b>Datos.</b> Guardamos los datos de contacto de empresas y comedores solo para coordinar la entrega de alimentos. No mostramos públicamente rostros ni datos personales de beneficiarios.</p>
            <p><b>Alimentos.</b> Las empresas declaran que los alimentos están en buen estado, aptos para el consumo y bien conservados. El comedor puede rechazar un lote indicando el motivo.</p>
            <p><b>Cuentas.</b> Cada registro es revisado por la administración antes de habilitar el acceso. Una cuenta puede desactivarse si se incumplen estas reglas.</p>
            <p class="muted small">Resumen informativo del proyecto Comida Full.</p></div>`
    });
}
function verMenu() {
    const sesion = !!S.session;
    const b = modal({
        titulo: 'Menú',
        cuerpo: `<div style="margin-top:8px">
            <a class="menu-row" href="#/">${ico('home')} Inicio</a>
            ${sesion ? `<a class="menu-row" href="#${panelDe(S.perfil)}">${ico('grid')} Mi panel</a>`
                : `<a class="menu-row" href="#/login">${ico('login')} Iniciar sesión</a><a class="menu-row" href="#/rol">${ico('userplus')} Crear una cuenta</a>`}
            <button class="menu-row" id="m-ayuda">${ico('help')} Ayuda y contacto</button>
            <button class="menu-row" id="m-priv">${ico('shield')} Privacidad y términos</button>
            ${sesion ? `<button class="menu-row" id="m-salir">${ico('logout')} Cerrar sesión</button>` : ''}</div>`
    });
    const q = (id) => $(id, b);
    q('#m-ayuda').onclick = () => { b.remove(); verAyuda(); };
    q('#m-priv').onclick = () => { b.remove(); verPrivacidad(); };
    if (q('#m-salir')) q('#m-salir').onclick = () => { b.remove(); cerrarSesion(); };
    $$('a.menu-row', b).forEach((a) => a.addEventListener('click', () => b.remove()));
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
const ojo = () => `<button type="button" class="i-right" data-eye aria-label="Mostrar contraseña">${ico('eye')}</button>`;

/* =====================================================================
   VISTAS PÚBLICAS (M01–M05)
   ===================================================================== */
function vHome() {
    const sesion = S.session && aprobado(S.perfil);
    app.innerHTML = `
        ${topLogo(`<button class="icon-btn" id="btn-menu" aria-label="Menú">${ico('menu', 22)}</button>`)}
        <main class="screen with-nav">
            <section class="hero">
                <span class="tagline">${ico('heart', 13)} Menos desperdicio, más comunidad</span>
                <h1 class="h1">Lo que sobra,<br>puede hacer<br><span class="accent">mucha falta.</span></h1>
                <p class="lead">Conectamos empresas con comedores para que los alimentos lleguen a quienes los necesitan.</p>
                <div class="hero-photo">
                    <div class="emoji" aria-hidden="true">🥬🍞🍅🥕</div>
                    <img src="img/hero.jpg" alt="Canasta con verduras y pan rescatados" onerror="this.remove()">
                </div>
                <div class="numbers">
                    <div><b id="st-porciones">–</b><span>porciones rescatadas</span></div>
                    <div><b id="st-entregas">–</b><span>entregas confirmadas</span></div>
                </div>
                ${sesion
                    ? `<div class="stack mt20"><button class="btn btn-primary btn-block" data-go="${panelDe(S.perfil)}">Ir a mi panel</button></div>`
                    : `<div class="btn-row mt20">
                        <button class="btn btn-primary" data-go="/registro/empresa">Soy empresa</button>
                        <button class="btn btn-outline" data-go="/registro/comedor">Soy comedor</button>
                       </div>
                       <p class="linkline">¿Ya tienes cuenta? <a href="#/login">Inicia sesión</a></p>`}
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
        </main>
        ${navInferior(S.session ? null : '/')}`;
    $('#btn-menu').onclick = verMenu;

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
        <main class="screen with-nav" style="padding-top:18px">
            <div class="big-icon">${ico('leaf')}</div>
            <h1 class="h2">Qué bueno verte de nuevo.</h1>
            <p class="lead">Entra y sigue haciendo que los alimentos encuentren su lugar.</p>
            <form class="form" id="f-login" novalidate>
                <div class="field"><label for="correo">Correo electrónico</label>
                    <div class="input-wrap"><input class="input" id="correo" type="email" autocomplete="email" inputmode="email" placeholder="correo@empresa.com" required><span class="i-right">${ico('mail', 18)}</span></div></div>
                <div class="field"><label for="clave">Contraseña</label>
                    <div class="input-wrap"><input class="input" id="clave" type="password" autocomplete="current-password" placeholder="••••••••" required>${ojo()}</div></div>
                <div class="between">
                    <label class="check"><input type="checkbox" id="recordar" checked> Recordarme</label>
                    <button type="button" class="btn-ghost link-sm" id="olvide" style="border:0;background:none;color:var(--v700);font-weight:600;font-size:13px;cursor:pointer">Olvidé mi contraseña</button>
                </div>
                <p class="form-error" id="err"></p>
                <button class="btn btn-primary btn-block" type="submit">${ico('arrow')} Iniciar sesión</button>
            </form>
            <div class="notice mt16">${ico('info')}<div><b>Un acceso, tu rol de siempre</b><span>Empresas y comedores acceden con su correo. Las cuentas deben estar aprobadas.</span></div></div>
            <p class="linkline mt20">¿Todavía no formas parte?</p>
            <button class="btn btn-outline btn-block mt8" data-go="/rol">Crear una cuenta</button>
            <div class="foot-row"><button class="back" data-go="/">${ico('back')} Volver</button>${marca()}</div>
        </main>
        ${navInferior('/login')}`;
    activarOjo();
    $('#olvide').onclick = () => {
        modal({
            titulo: 'Recuperar contraseña', texto: 'Escribe tu correo y te enviaremos un enlace para crear una contraseña nueva.', confirmar: 'Enviar enlace',
            cuerpo: `<div class="field mt12"><label for="m-correo">Correo electrónico</label><input class="input" id="m-correo" type="email" inputmode="email" value="${esc($('#correo').value)}" placeholder="correo@empresa.com"></div>`,
            onConfirm: async (m) => {
                const c = $('#m-correo', m).value.trim();
                if (!/^\S+@\S+\.\S+$/.test(c)) throw new Error('Escribe un correo válido.');
                const { error } = await sb.auth.resetPasswordForEmail(c, { redirectTo: location.origin + location.pathname });
                if (error) throw error;
                toast('Si el correo existe, recibirás un enlace en unos minutos.', 'ok');
            }
        });
    };
    $('#f-login').addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = $('#err'), btn = $('button[type=submit]');
        err.textContent = '';
        const correo = $('#correo').value.trim(), clave = $('#clave').value;
        if (!correo || !clave) { err.textContent = 'Escribe tu correo y tu contraseña.'; return; }
        btn.disabled = true; btn.lastChild.textContent = ' Entrando…';
        try {
            localStorage.setItem('cf_recordar', $('#recordar').checked ? '1' : '0');
            const { error } = await sb.auth.signInWithPassword({ email: correo, password: clave });
            if (error) throw error;
            // onAuthStateChange carga la sesión y redirige
        } catch (ex) {
            err.textContent = msgErr(ex);
            btn.disabled = false; btn.lastChild.textContent = ' Iniciar sesión';
        }
    });
}

function vRol() {
    let rol = sessionStorage.getItem('cf_rol_sel') || 'empresa';
    app.innerHTML = `
        ${topBack('/login')}
        <main class="screen with-nav">
            <h1 class="h2 mt8">Cada rol suma.</h1>
            <p class="lead">¿Cómo quieres formar parte de Comida Full?</p>
            <div class="stack mt16" role="radiogroup" aria-label="Rol">
                <button class="role" data-rol="empresa" role="radio">
                    <span class="r-ico">${ico('store')}</span><b>Soy empresa</b>
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
            <p class="linkline">¿Ya tienes cuenta? <a href="#/login">Inicia sesión</a></p>
        </main>
        ${navInferior('/rol')}`;
    const pintar = () => {
        $$('.role').forEach((r) => { const on = r.dataset.rol === rol; r.classList.toggle('sel', on); r.setAttribute('aria-checked', on); });
        $('#seguir').innerHTML = `${ico('arrow')} ${rol === 'empresa' ? 'Continuar como empresa' : 'Continuar como comedor'}`;
    };
    $$('.role').forEach((r) => r.addEventListener('click', () => { rol = r.dataset.rol; sessionStorage.setItem('cf_rol_sel', rol); pintar(); }));
    $('#seguir').addEventListener('click', () => go('/registro/' + rol));
    pintar();
}

function vRegistro(tipo) {
    const empresa = tipo !== 'comedor';
    app.innerHTML = `
        ${topBack('/rol')}
        <main class="screen with-nav">
            <h1 class="h2 mt8">${empresa ? 'Registra tu empresa' : 'Registra tu comedor'}</h1>
            <p class="lead">Todos los campos son obligatorios.</p>
            <form class="form" id="f-reg" novalidate>
                <div class="field"><label for="nombre">${empresa ? 'Nombre de la empresa' : 'Nombre del comedor'} *</label>
                    <input class="input" id="nombre" autocomplete="organization" placeholder="${empresa ? 'Ej. Huerta del Sol' : 'Ej. Comedor La Esperanza'}" required></div>
                <div class="field"><label for="responsable">Persona responsable *</label>
                    <input class="input" id="responsable" autocomplete="name" placeholder="Nombre y apellido" required></div>
                <div class="field"><label for="correo">Correo electrónico *</label>
                    <input class="input" id="correo" type="email" autocomplete="email" inputmode="email" placeholder="correo@ejemplo.com" required></div>
                <div class="field"><label for="telefono">Teléfono *</label>
                    <input class="input" id="telefono" type="tel" autocomplete="tel" inputmode="tel" placeholder="10 dígitos" required></div>
                <div class="field"><label for="direccion">${empresa ? 'Dirección de recogida' : 'Dirección'} *</label>
                    <input class="input" id="direccion" autocomplete="street-address" placeholder="Calle, número, colonia, ciudad" required></div>
                ${empresa ? '' : `<div class="field"><label for="horario">Horario de atención *</label>
                    <input class="input" id="horario" placeholder="Ej. Lunes a sábado, 10:00 a 19:00" required></div>`}
                <div class="field"><label for="clave">Contraseña *</label>
                    <div class="input-wrap"><input class="input" id="clave" type="password" autocomplete="new-password" minlength="8" placeholder="Mínimo 8 caracteres" required>${ojo()}</div>
                    <span class="hint">Mínimo 8 caracteres. Al enviar aceptas los <a href="#" id="ver-terminos">términos y la política de privacidad</a>.</span></div>
                <p class="form-error" id="err"></p>
                <button class="btn btn-primary btn-block" type="submit">${ico('arrow')} Enviar solicitud</button>
            </form>
            <p class="label-cap">Después de enviar la solicitud</p>
            <div class="notice notice-err mt8">${ico('alert')}<div><b>Tu registro está en revisión</b><span>Te avisaremos por correo. No podrás ${empresa ? 'publicar' : 'aceptar excedentes'} hasta que administración apruebe tu cuenta.</span></div></div>
        </main>
        ${navInferior('/rol')}`;
    activarOjo();
    $('#ver-terminos').onclick = (e) => { e.preventDefault(); verPrivacidad(); };
    $('#f-reg').addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = $('#err'), btn = $('button[type=submit]');
        err.textContent = '';
        const v = (id) => ($('#' + id) ? $('#' + id).value.trim() : '');
        const d = { nombre: v('nombre'), responsable: v('responsable'), correo: v('correo'), telefono: v('telefono'), direccion: v('direccion'), horario: v('horario'), clave: $('#clave').value };
        if (!d.nombre || !d.responsable || !d.correo || !d.telefono || !d.direccion || (!empresa && !d.horario) || !d.clave) { err.textContent = 'Completa todos los campos.'; return; }
        if (!/^\S+@\S+\.\S+$/.test(d.correo)) { err.textContent = 'Escribe un correo válido.'; return; }
        if (d.telefono.replace(/\D/g, '').length < 10) { err.textContent = 'El teléfono debe tener al menos 10 dígitos.'; return; }
        if (d.clave.length < 8) { err.textContent = 'La contraseña debe tener al menos 8 caracteres.'; return; }
        btn.disabled = true; btn.lastChild.textContent = ' Enviando…';
        try {
            localStorage.setItem('cf_recordar', '1');
            const { data, error } = await sb.auth.signUp({
                email: d.correo, password: d.clave,
                options: { data: { rol: empresa ? 'donante' : 'comedor', nombre_organizacion: d.nombre, responsable: d.responsable, telefono: d.telefono, direccion: d.direccion, horario_atencion: empresa ? null : d.horario } }
            });
            if (error) throw error;
            if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) throw new Error('User already registered');
            if (data.session) sessionStorage.removeItem('cf_rol_sel'); // onAuthStateChange redirige a /pendiente
            else { sessionStorage.setItem('cf_enviado', d.correo); go('/enviado'); }
        } catch (ex) {
            err.textContent = msgErr(ex);
            btn.disabled = false; btn.lastChild.textContent = ' Enviar solicitud';
        }
    });
}

function vEnviado() {
    const correo = sessionStorage.getItem('cf_enviado') || 'tu correo';
    app.innerHTML = `
        ${topLogo()}
        <main class="screen with-nav center">
            <div class="mt32" style="font-size:54px">📬</div>
            <h1 class="h2 mt12">Solicitud enviada</h1>
            <p class="lead">Revisa ${esc(correo)} para confirmar tu cuenta. Después, un administrador aprobará tu registro y podrás entrar.</p>
            <button class="btn btn-primary btn-block mt24" data-go="/login">Ir a iniciar sesión</button>
        </main>
        ${navInferior(null)}`;
}

function vPendiente() {
    const p = S.perfil;
    const desact = p && p.aprobado && p.activo === false;
    const rechazada = p && !p.aprobado && p.activo === false;
    app.innerHTML = `
        ${topLogo()}
        <main class="screen with-nav center">
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
        </main>
        ${navInferior('/pendiente')}`;
    $('#act').onclick = async () => {
        try { await API.cargarPerfil(); } catch (e) { toast(msgErr(e), 'err'); return; }
        if (aprobado(S.perfil)) { toast('¡Tu cuenta fue aprobada!', 'ok'); go(panelDe(S.perfil)); } else { toast('Todavía en revisión.'); vPendiente(); }
    };
    $('#salir').onclick = cerrarSesion;
}

/* =====================================================================
   DONANTE (M06–M09)
   ===================================================================== */
async function vMisPublicaciones() {
    let filtro = 'todas', datos = [];
    app.innerHTML = `${topRol()}<main class="screen with-nav">${loader()}</main>${navInferior('/mis-publicaciones')}`;

    const pintar = () => {
        const activas = datos.filter((x) => x.estado === 'publicado' || x.estado === 'aceptado');
        const lista = filtro === 'activas' ? activas : datos;
        $('main').innerHTML = `
            <h1 class="h2 mt8">Mis publicaciones</h1>
            <p class="lead">${esc(S.perfil.nombre_organizacion)} · Cada alimento cuenta.</p>
            <div class="tabs" role="tablist">
                <button class="tab ${filtro === 'todas' ? 'on' : ''}" data-f="todas" role="tab">Todas · ${datos.length}</button>
                <button class="tab ${filtro === 'activas' ? 'on' : ''}" data-f="activas" role="tab">Activas · ${activas.length}</button>
            </div>
            ${lista.length ? `<div class="list">${lista.map(itemPublicacion).join('')}</div>`
                : `<div class="empty"><div class="big">🍞</div><b>Aún no hay publicaciones</b><p class="small mt8">Publica tu primer excedente en menos de un minuto.</p><button class="btn btn-primary btn-sm mt12" data-go="/publicar">Publicar excedente</button></div>`}
            <p class="footnote">Solo puedes cancelar publicaciones disponibles.</p>`;
        $$('.tab').forEach((t) => t.onclick = () => { filtro = t.dataset.f; pintar(); });
    };

    const cargar = async () => {
        const { data, error } = await sb.from('excedentes')
            .select('*, comedor:perfiles!comedor_id(nombre_organizacion)')
            .eq('donante_id', S.session.user.id)
            .order('created_at', { ascending: false });
        if (!$('main')) return;
        if (error) { $('main').innerHTML = `<div class="notice notice-err">${ico('alert')}<div><b>No se pudieron cargar tus publicaciones</b><span>${esc(msgErr(error))}</span></div></div>`; return; }
        datos = data || [];
        pintar();
    };
    S.refresh = cargar;
    await cargar();
}

function itemPublicacion(x) {
    let sub = '';
    if (x.estado === 'publicado') sub = `<span class="item-sub warn">Hasta las ${fmtHora(x.hora_limite)} · Cancelar publicación</span>`;
    else if (x.estado === 'aceptado') sub = `<span class="item-sub">${esc((x.comedor && x.comedor.nombre_organizacion) || 'Un comedor')}</span>`;
    else if (x.estado === 'vencido') sub = `<span class="item-sub">Caducó el ${fmtFecha(x.fecha_caducidad)}</span>`;
    else sub = `<span class="item-sub">${fmtFecha(x.fecha_caducidad)}</span>`;
    return `<button class="item" data-go="/publicacion/${esc(x.id)}">
        <span class="thumb">${x.foto_url ? `<img src="${esc(x.foto_url)}" alt="" loading="lazy">` : '🍽️'}</span>
        <span class="item-body"><span class="item-title">${esc(x.tipo_alimento)}</span>
            <span class="item-meta">${pill(x.estado)}<span>${esc(fmtCant(x.cantidad, x.unidad))}</span></span>${sub}</span>
        <span class="chev">${ico('chev')}</span></button>`;
}

function vPublicar() {
    const p = S.perfil;
    app.innerHTML = `
        ${topBack('/mis-publicaciones')}
        <main class="screen with-nav">
            <h1 class="h2 mt8">Comparte tu excedente</h1>
            <p class="lead">Los alimentos deben estar aptos para el consumo.</p>
            <form class="form" id="f-pub" novalidate>
                <div class="field"><label for="tipo">Alimento *</label>
                    <input class="input" id="tipo" maxlength="80" placeholder="Ej. Verduras frescas" required></div>
                <div class="row2">
                    <div class="field"><label for="cantidad">Cantidad *</label>
                        <input class="input" id="cantidad" type="number" inputmode="decimal" min="0.1" step="any" placeholder="Ej. 12" required></div>
                    <div class="field"><label for="unidad">Unidad *</label>
                        <select class="input" id="unidad"><option value="kg">kg</option><option value="porciones">porciones</option><option value="piezas">piezas</option><option value="litros">litros</option></select></div>
                </div>
                <div class="field" id="w-porc"><label for="porciones">Porciones aproximadas</label>
                    <input class="input" id="porciones" type="number" inputmode="numeric" min="1" step="1">
                    <span class="hint">Sirve para el contador público. Sugerido: 4 porciones por kg o litro.</span></div>
                <div class="row2">
                    <div class="field"><label for="fecha">Caducidad *</label>
                        <input class="input" id="fecha" type="date" min="${hoyISO()}" required></div>
                    <div class="field"><label for="hora">Hora límite *</label>
                        <input class="input" id="hora" type="time" value="18:00" required></div>
                </div>
                <div class="field"><span class="label">Fotografía *</span>
                    <label class="photo" id="drop"><input type="file" accept="image/*" id="foto">
                        <span class="ph">${ico('camera', 26)}<br>Toma o sube una foto</span></label></div>
                <div class="locbox">${ico('pin')}<div><b>${esc(p.nombre_organizacion)}</b><span>${esc(p.direccion || 'Sin dirección registrada')}</span></div></div>
                <label class="check"><input type="checkbox" id="ok-estado"> Declaro que los alimentos están en buen estado, son aptos para el consumo y se conservaron correctamente.</label>
                <span class="hint" style="margin-top:-6px">Obligatorio para poder publicar. Los comedores verán tu dirección de recogida.</span>
                <p class="form-error" id="err"></p>
                <button class="btn btn-primary btn-block" type="submit">${ico('plus')} Publicar excedente</button>
            </form>
        </main>
        ${navInferior('/publicar')}`;

    let archivo = null;
    $('#foto').addEventListener('change', (e) => {
        archivo = e.target.files[0] || null;
        const drop = $('#drop'), ph = $('.ph', drop);
        if (!archivo) { drop.classList.remove('has'); ph.innerHTML = `${ico('camera', 26)}<br>Toma o sube una foto`; return; }
        drop.classList.add('has');
        ph.innerHTML = `<img class="mini" alt="Vista previa" src="${URL.createObjectURL(archivo)}"><span><b>${esc(archivo.name)}</b><small>${(archivo.size / 1024).toFixed(0)} KB</small><u>Cambiar fotografía</u></span>`;
    });
    const sugerirPorciones = () => {
        const u = $('#unidad').value, c = parseFloat($('#cantidad').value);
        const necesita = u === 'kg' || u === 'litros';
        $('#w-porc').hidden = !necesita;
        if (necesita && c > 0) $('#porciones').value = Math.round(c * 4);
    };
    $('#unidad').addEventListener('change', sugerirPorciones);
    $('#cantidad').addEventListener('input', sugerirPorciones);
    sugerirPorciones();

    $('#f-pub').addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = $('#err'), btn = $('button[type=submit]');
        err.textContent = '';
        const tipo = $('#tipo').value.trim(), cantidad = parseFloat($('#cantidad').value), unidad = $('#unidad').value;
        const fecha = $('#fecha').value, hora = $('#hora').value;
        if (!tipo) { err.textContent = 'Indica qué alimento es.'; return; }
        if (!(cantidad > 0)) { err.textContent = 'Indica una cantidad mayor a cero.'; return; }
        if (!fecha) { err.textContent = 'Indica la fecha de caducidad.'; return; }
        if (fecha < hoyISO()) { err.textContent = 'No puedes publicar un alimento ya caducado.'; return; }
        if (!hora) { err.textContent = 'Indica la hora límite para recogerlo.'; return; }
        if (!archivo) { err.textContent = 'Adjunta al menos una foto del alimento.'; return; }
        if (!$('#ok-estado').checked) { err.textContent = 'Debes confirmar que la comida está en buen estado.'; return; }
        const porc = (unidad === 'kg' || unidad === 'litros') ? parseInt($('#porciones').value, 10) || Math.round(cantidad * 4) : Math.round(cantidad);

        btn.disabled = true; btn.lastChild.textContent = ' Publicando…';
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
            btn.disabled = false; btn.lastChild.textContent = ' Publicar excedente';
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

const TITULOS_DETALLE = {
    publicado: ['Esperando destino.', 'Tu excedente está visible para los comedores.'],
    aceptado: ['Ya tiene destino.', 'Tu excedente fue reservado por un comedor.'],
    confirmado: ['Entregado con éxito.', 'Gracias por no dejar que se desperdicie.'],
    rechazado: ['El comedor lo rechazó.', 'Revisa el motivo y publica de nuevo si aplica.'],
    cancelado: ['Publicación cancelada.', 'Ya no es visible para los comedores.'],
    vencido: ['Se pasó de fecha.', 'Nadie lo reservó antes de su caducidad.']
};

async function vPubDetalle(id) {
    app.innerHTML = `${topBack('/mis-publicaciones')}<main class="screen with-nav">${loader()}</main>${navInferior('/mis-publicaciones')}`;
    const cargar = async () => {
        const [ex, hist, rec] = await Promise.all([
            sb.from('excedentes').select('*, comedor:perfiles!comedor_id(nombre_organizacion,responsable,telefono,direccion,horario_atencion)').eq('id', id).eq('donante_id', S.session.user.id).maybeSingle(),
            sb.from('historial_excedente').select('*').eq('excedente_id', id).order('fecha', { ascending: true }),
            sb.from('recepciones').select('*').eq('excedente_id', id).maybeSingle()
        ]);
        if (ex.error) throw ex.error;
        const x = ex.data;
        const main = $('main');
        if (!main) return;
        if (!x) { main.innerHTML = `<div class="empty"><div class="big">🔍</div><b>No encontramos esta publicación</b></div>`; return; }
        const c = x.comedor, r = rec.data;
        const [tt, ss] = TITULOS_DETALLE[x.estado] || ['Tu publicación', ''];
        main.innerHTML = `
            <h1 class="h2 mt8">${esc(tt)}</h1>
            <p class="lead">${esc(ss)}</p>
            <div class="photo-big">${x.foto_url ? `<img src="${esc(x.foto_url)}" alt="${esc(x.tipo_alimento)}">` : '🍽️'}</div>
            <div class="title-row"><h2>${esc(x.tipo_alimento)}</h2>${pill(x.estado)}</div>
            <div class="info2">
                <div class="cell">${ico('box')}<div><small>Cantidad</small><b>${esc(fmtCant(x.cantidad, x.unidad))}${x.porciones ? `, aprox. ${fmtNum(x.porciones)} porciones` : ''}</b></div></div>
                <div class="cell">${ico('clock')}<div><small>Recogida</small><b>Antes de las ${fmtHora(x.hora_limite)}</b></div></div>
            </div>
            <p class="muted small mt12">Caducidad ${fmtDMA(x.fecha_caducidad)}</p>
            ${c ? `<div class="card mt16">
                    <div class="between"><b>${esc(c.nombre_organizacion)}</b>${pill('aceptado')}</div>
                    <div class="kv">
                        <div>${ico('user2')}<span>Responsable de recogida <b>${esc(c.responsable || '—')}</b></span></div>
                        <div>${ico('phone')}<span>Teléfono de contacto <b>${esc(c.telefono || '—')}</b></span></div>
                    </div>
                    ${c.telefono && x.estado === 'aceptado' ? `<a class="btn btn-primary btn-block mt12" href="tel:${esc(c.telefono)}">${ico('phone')} Contactar al comedor</a>` : ''}
                </div>` : ''}
            ${x.estado === 'aceptado' ? `<div class="notice mt12">${ico('checkc')}<div><b>Recogida coordinada</b><span>${esc(S.perfil.direccion || 'Tu dirección de recogida')}. La entrega se realiza en tu local, en el horario indicado.</span></div></div>` : ''}
            ${r ? `<div class="notice ${r.resultado === 'confirmada' ? '' : 'notice-err'} mt12">${ico(r.resultado === 'confirmada' ? 'checkc' : 'alert')}<div>
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
   COMEDOR (M10–M13)
   ===================================================================== */
async function vExplorar() {
    let datos = [], q = '';
    app.innerHTML = `${topRol()}<main class="screen with-nav">
        <h1 class="h2 mt8">Alimentos con futuro</h1>
        <p class="lead">Hola, ${esc(primerNombre(S.perfil.responsable) || S.perfil.nombre_organizacion)}. Encuentra lo que otros pueden rescatar hoy.</p>
        <div class="search">${ico('search')}<input class="input" id="buscar" type="search" placeholder="Buscar alimento o empresa" aria-label="Buscar alimento o empresa"></div>
        <div class="count-row"><b id="conteo">Cargando…</b><span>Caducan primero</span></div>
        <div id="lista" class="grid-list">${loader()}</div>
        <div class="notice mt16">${ico('shield')}<div><b>Solo tú puedes reservar</b><span>Al aceptar un excedente te comprometes a recogerlo en el horario indicado.</span></div></div>
    </main>${navInferior('/explorar')}`;

    const pintar = () => {
        const t = q.trim().toLowerCase();
        const lista = t ? datos.filter((x) => `${x.tipo_alimento} ${(x.donante || {}).nombre_organizacion || ''}`.toLowerCase().includes(t)) : datos;
        $('#conteo').textContent = `${lista.length} disponible${lista.length === 1 ? '' : 's'}`;
        $('#lista').innerHTML = lista.length ? lista.map(tarjetaDisponible).join('')
            : `<div class="empty"><div class="big">🌿</div><b>${t ? 'Sin resultados' : 'No hay alimentos disponibles ahora'}</b><p class="small mt8">${t ? 'Prueba con otra palabra.' : 'Esta lista se actualiza sola cuando una empresa publica algo nuevo.'}</p></div>`;
    };
    $('#buscar').addEventListener('input', (e) => { q = e.target.value; pintar(); });

    const cargar = async () => {
        const { data, error } = await sb.from('excedentes')
            .select('*, donante:perfiles!donante_id(nombre_organizacion,direccion,logo_url,responsable)')
            .eq('estado', 'publicado').gte('fecha_caducidad', hoyISO())
            .order('fecha_caducidad', { ascending: true }).order('hora_limite', { ascending: true });
        if (!$('#lista')) return;
        if (error) { $('#lista').innerHTML = `<div class="notice notice-err">${ico('alert')}<div><b>No se pudo cargar la lista</b><span>${esc(msgErr(error))}</span></div></div>`; $('#conteo').textContent = ''; return; }
        datos = data || [];
        pintar();
    };
    S.refresh = cargar;
    await cargar();
}

function tarjetaDisponible(x) {
    const d = x.donante || {};
    const urgente = diasPara(x.fecha_caducidad) <= 1;
    return `<article class="fcard">
        <button class="fcard-top" data-go="/excedente/${esc(x.id)}" aria-label="Ver detalle de ${esc(x.tipo_alimento)}">
            <span class="thumb">${x.foto_url ? `<img src="${esc(x.foto_url)}" alt="" loading="lazy">` : '🍽️'}</span>
            <span style="flex:1;min-width:0">
                <span class="fcard-title" style="display:block">${esc(x.tipo_alimento)}</span>
                <span class="fcard-sub" style="display:block">${esc(d.nombre_organizacion || 'Empresa')} · ${esc(fmtCant(x.cantidad, x.unidad))}</span>
                <span class="fcard-line" style="display:block">${esc(d.direccion || 'Dirección no especificada')}</span>
                <span class="fcard-line ${urgente ? 'urgent' : ''}" style="display:block">${esc(cuando(x.fecha_caducidad))} · Retirar hasta las ${fmtHora(x.hora_limite)}</span>
            </span>
        </button>
        <button class="btn btn-primary btn-block" data-go="/excedente/${esc(x.id)}">${ico('plus')} Aceptar excedente</button></article>`;
}

async function vExcedente(id) {
    app.innerHTML = `${topBack('/explorar')}<main class="screen with-nav">${loader()}</main>${navInferior('/explorar')}`;
    const cargar = async () => {
        const { data: x, error } = await sb.from('excedentes')
            .select('*, donante:perfiles!donante_id(nombre_organizacion,direccion,responsable)').eq('id', id).maybeSingle();
        const main = $('main');
        if (!main) return;
        if (error) throw error;
        if (!x || x.estado !== 'publicado') {
            main.innerHTML = `<div class="empty"><div class="big">🕊️</div><b>Este excedente ya no está disponible</b><p class="small mt8">Otro comedor lo reservó, o la empresa lo retiró.</p><button class="btn btn-primary btn-sm mt12" data-go="/explorar">Ver otros alimentos</button></div>`;
            return;
        }
        const d = x.donante || {};
        main.innerHTML = `
            <div class="photo-big" style="margin-top:8px">${x.foto_url ? `<img src="${esc(x.foto_url)}" alt="${esc(x.tipo_alimento)}">` : '🍽️'}</div>
            <div class="title-row"><h2>${esc(x.tipo_alimento)}</h2>${pill('publicado')}</div>
            <p class="greenline">${esc(d.nombre_organizacion || 'Empresa')} · ${esc(fmtCant(x.cantidad, x.unidad))}${x.porciones ? ` · aprox. ${fmtNum(x.porciones)} porciones` : ''}</p>
            <div class="info2">
                <div class="cell">${ico('calendar')}<div><small>Caducidad</small><b>${fmtDMA(x.fecha_caducidad)}</b></div></div>
                <div class="cell">${ico('clock')}<div><small>Retirar hasta</small><b>Hasta las ${fmtHora(x.hora_limite)}</b></div></div>
                <div class="cell wide">${ico('pin')}<div><small>Punto de recogida</small><b>${esc(d.direccion || 'Sin dirección')}</b></div></div>
                <div class="cell wide">${ico('user2')}<div><small>Responsable de entrega</small><b>${esc(d.responsable || '—')} · atiende en el local</b></div></div>
            </div>
            <div class="notice notice-err mt16">${ico('heart')}<div><b>Una reserva, un compromiso</b><span>Cuando aceptas, el excedente queda reservado para ti y deja de verse para los demás comedores. Recógelo antes de las ${fmtHora(x.hora_limite)}.</span></div></div>
            <label class="check mt16"><input type="checkbox" id="ok-compromiso"> Puedo recoger los ${esc(fmtCant(x.cantidad, x.unidad))} dentro del horario indicado.</label>
            <p class="form-error mt8" id="err"></p>
            <button class="btn btn-primary btn-block mt12" id="aceptar" disabled>${ico('check')} Aceptar para ${esc(S.perfil.nombre_organizacion)}</button>`;
        const chk = $('#ok-compromiso'), btn = $('#aceptar');
        chk.addEventListener('change', () => { btn.disabled = !chk.checked; });
        btn.onclick = async () => {
            btn.disabled = true; $('#err').textContent = '';
            const { error: e2 } = await sb.rpc('aceptar_excedente', { p_id: id });
            if (e2) { $('#err').textContent = msgErr(e2); btn.disabled = !chk.checked; if (/ya no está disponible/i.test(e2.message || '')) cargar(); return; }
            toast('¡Reservado! Pasa a recogerlo y luego confirma la recepción.', 'ok');
            go('/reservas');
        };
    };
    S.refresh = cargar;
    try { await cargar(); } catch (e) { $('main').innerHTML = `<div class="notice notice-err">${ico('alert')}<div><b>Error</b><span>${esc(msgErr(e))}</span></div></div>`; }
}

async function vReservas() {
    app.innerHTML = `${topRol()}<main class="screen with-nav">${loader()}</main>${navInferior('/reservas')}`;
    const cargar = async () => {
        const uid = S.session.user.id;
        const [ex, rc] = await Promise.all([
            sb.from('excedentes').select('*, donante:perfiles!donante_id(nombre_organizacion,responsable,telefono,direccion)').eq('comedor_id', uid).order('aceptado_at', { ascending: false }),
            sb.from('recepciones').select('*').eq('comedor_id', uid)
        ]);
        const main = $('main');
        if (!main) return;
        if (ex.error) { main.innerHTML = `<div class="notice notice-err">${ico('alert')}<div><b>No se pudo cargar</b><span>${esc(msgErr(ex.error))}</span></div></div>`; return; }
        const recs = {}; (rc.data || []).forEach((r) => { recs[r.excedente_id] = r; });
        const data = ex.data || [];
        const activas = data.filter((x) => x.estado === 'aceptado');
        const pasadas = data.filter((x) => x.estado !== 'aceptado');
        const ultima = pasadas[0], resto = pasadas.slice(1);
        main.innerHTML = `
            <h1 class="h2 mt8">Mis reservas</h1>
            <p class="lead">${esc(S.perfil.nombre_organizacion)} · Recogidas y recepción</p>
            <div class="tabs"><span class="pill pill-info">${activas.length} por recoger</span></div>
            ${activas.length ? `<div class="grid-list">${activas.map(tarjetaReserva).join('')}</div>`
                : `<div class="empty"><div class="big">🧺</div><b>No tienes recogidas pendientes</b><p class="small mt8">Acepta un excedente desde “Explorar”.</p><button class="btn btn-outline btn-sm mt12" data-go="/explorar">Explorar alimentos</button></div>`}
            ${ultima ? `<h2 class="section-title">Última recepción</h2><div class="grid-list">${tarjetaPasada(ultima, recs[ultima.id])}</div>` : ''}
            ${resto.length ? `<h2 class="section-title">Historial</h2><div class="grid-list">${resto.map((x) => tarjetaPasada(x, recs[x.id])).join('')}</div>` : ''}
            <p class="footnote">Las porciones confirmadas se suman al contador público de Comida Full.</p>`;
    };
    S.refresh = cargar;
    try { await cargar(); } catch (e) { $('main').innerHTML = `<div class="notice notice-err">${ico('alert')}<div><b>Error</b><span>${esc(msgErr(e))}</span></div></div>`; }
}

function tarjetaReserva(x) {
    const d = x.donante || {};
    return `<article class="fcard">
        <div class="fcard-top" style="cursor:default">
            <span class="thumb">${x.foto_url ? `<img src="${esc(x.foto_url)}" alt="" loading="lazy">` : '🍽️'}</span>
            <span style="flex:1;min-width:0">
                <span class="fcard-title" style="display:block">${esc(x.tipo_alimento)}</span>
                <span class="fcard-sub" style="display:block">${esc(d.nombre_organizacion || 'Empresa')} · ${esc(fmtCant(x.cantidad, x.unidad))}</span>
                <span style="display:block;margin-top:5px">${pill('aceptado')}</span>
            </span>
        </div>
        <div class="kv">
            <div>${ico('clock')}<span>Recoger <b>antes de las ${fmtHora(x.hora_limite)}</b></span></div>
            <div>${ico('pin')}<span>Dónde recoger <b>${esc(d.direccion || '—')}</b></span></div>
        </div>
        <p class="fcard-line" style="margin-top:10px">1. Coordina con ${esc(d.responsable || 'la empresa')}${d.telefono ? ` · ${esc(d.telefono)}` : ''}. 2. Recoge en el local. 3. Confirma la recepción.</p>
        <div class="btn-row">
            ${d.telefono ? `<a class="btn btn-outline" style="flex:0 0 auto" href="tel:${esc(d.telefono)}">${ico('phone')} Contactar</a>` : ''}
            <button class="btn btn-primary" data-go="/recepcion/${esc(x.id)}">Confirmar recepción</button>
        </div></article>`;
}

function tarjetaPasada(x, r) {
    const d = x.donante || {};
    const texto = x.estado === 'confirmado' && r ? `Recepción confirmada · ${fmtNum(r.porciones_rescatadas)} porciones rescatadas`
        : x.estado === 'rechazado' && r ? `Lote rechazado · ${esc(r.motivo || '')}` : '';
    return `<article class="fcard">
        <div class="fcard-top" style="cursor:default">
            <span class="thumb">${x.foto_url ? `<img src="${esc(x.foto_url)}" alt="" loading="lazy">` : '🍽️'}</span>
            <span style="flex:1;min-width:0">
                <span class="fcard-title" style="display:block">${esc(x.tipo_alimento)} · ${esc(fmtCant(r && r.cantidad_recibida ? r.cantidad_recibida : x.cantidad, x.unidad))}</span>
                <span class="fcard-sub" style="display:block">${esc(d.nombre_organizacion || 'Empresa')}</span>
                <span style="display:block;margin-top:5px">${pill(x.estado)}</span>
            </span>
        </div>
        ${texto ? `<p class="fcard-line" style="margin-top:10px">${texto}</p>` : ''}</article>`;
}

async function vRecepcion(id) {
    app.innerHTML = `${topBack('/reservas')}<main class="screen with-nav">${loader()}</main>${navInferior('/reservas')}`;
    const { data: x, error } = await sb.from('excedentes')
        .select('*, donante:perfiles!donante_id(nombre_organizacion)').eq('id', id).eq('comedor_id', S.session.user.id).maybeSingle();
    const main = $('main');
    if (!main) return;
    if (error || !x || x.estado !== 'aceptado') {
        main.innerHTML = `<div class="empty"><div class="big">🔍</div><b>${error ? esc(msgErr(error)) : 'Esta reserva ya no está pendiente'}</b><button class="btn btn-primary btn-sm mt12" data-go="/reservas">Volver a mis reservas</button></div>`;
        return;
    }
    const d = x.donante || {};
    const unidad = x.unidad;
    const porcDe = (q) => Math.max(1, Math.round(Number(x.porciones || x.cantidad) * q / Number(x.cantidad)));
    main.innerHTML = `
        <h1 class="h2 mt8">Cierra el recorrido</h1>
        <p class="lead">${esc(x.tipo_alimento)} · ${esc(d.nombre_organizacion || 'Empresa')} · Reserva de ${esc(fmtCant(x.cantidad, unidad))}</p>
        <section class="panel-ok">
            <h3>${ico('checkc')} Confirmar recepción</h3>
            <p class="sub">Registra únicamente lo que realmente llegó en buen estado.</p>
            <div class="row2 mt8">
                <div class="field"><label for="cant">Cantidad real *</label><input class="input" id="cant" type="number" inputmode="decimal" min="0.1" step="any" value="${esc(x.cantidad)}"></div>
                <div class="field"><label for="uni">Unidad *</label><select class="input" id="uni" disabled><option>${esc(unidadTxt(unidad))}</option></select></div>
            </div>
            <p class="calc" id="calc"></p>
            <p class="form-error mt8" id="err-ok"></p>
            <button class="btn btn-primary btn-block mt12" id="confirmar"></button>
        </section>
        <p class="or">O, si algo salió mal, rechaza el lote.</p>
        <section class="panel-bad" style="margin-top:12px">
            <h3>${ico('xc')} Rechazar recepción</h3>
            <div class="field mt8"><label for="motivo">Motivo del rechazo *</label>
                <textarea class="input" id="motivo" maxlength="240" placeholder="Describe qué ocurrió"></textarea></div>
            <p class="hint" style="color:var(--red);margin-top:6px">El motivo es obligatorio y se registra en el historial del lote.</p>
            <p class="form-error mt8" id="err-bad"></p>
            <button class="btn btn-danger btn-block mt12" id="rechazar">Rechazar con motivo</button>
        </section>`;
    const pintarCalc = () => {
        const q = parseFloat($('#cant').value);
        if (q > 0) {
            $('#calc').textContent = `${Number(q).toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${unidadTxt(unidad)} → ${fmtNum(porcDe(q))} porciones rescatadas`;
            $('#confirmar').innerHTML = `${ico('check')} Confirmar ${Number(q).toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${esc(unidadTxt(unidad))} recibidos`;
        } else { $('#calc').textContent = ''; $('#confirmar').innerHTML = `${ico('check')} Confirmar recepción`; }
    };
    $('#cant').addEventListener('input', pintarCalc);
    pintarCalc();

    $('#confirmar').onclick = async () => {
        const q = parseFloat($('#cant').value);
        const e1 = $('#err-ok'); e1.textContent = '';
        if (!(q > 0)) { e1.textContent = 'Indica la cantidad realmente recibida.'; return; }
        $('#confirmar').disabled = true;
        const { error: er } = await sb.rpc('confirmar_recepcion', { p_id: id, p_cantidad: q });
        if (er) { e1.textContent = msgErr(er); $('#confirmar').disabled = false; return; }
        toast('¡Recepción confirmada! El contador público ya subió.', 'ok');
        go('/reservas');
    };
    $('#rechazar').onclick = async () => {
        const m = $('#motivo').value.trim();
        const e2 = $('#err-bad'); e2.textContent = '';
        if (m.length < 3) { e2.textContent = 'Indica el motivo del rechazo.'; return; }
        $('#rechazar').disabled = true;
        const { error: er } = await sb.rpc('rechazar_recepcion', { p_id: id, p_motivo: m });
        if (er) { e2.textContent = msgErr(er); $('#rechazar').disabled = false; return; }
        toast('Lote rechazado y registrado en el historial.');
        go('/reservas');
    };
}

/* =====================================================================
   AVISOS y PERFIL (M09)
   ===================================================================== */
async function vAvisos() {
    app.innerHTML = `${topBack(panelDe(S.perfil))}<main class="screen with-nav">${loader()}</main>${navInferior(null)}`;
    const cargar = async () => {
        const { data, error } = await sb.from('notificaciones').select('*').eq('usuario_id', S.session.user.id).order('created_at', { ascending: false }).limit(50);
        const main = $('main');
        if (!main) return;
        if (error) { main.innerHTML = `<div class="notice notice-err">${ico('alert')}<div><b>No se pudieron cargar los avisos</b><span>${esc(msgErr(error))}</span></div></div>`; return; }
        const donante = S.perfil.rol === 'donante';
        main.innerHTML = `
            <h1 class="h2 mt8">Avisos</h1>
            <p class="lead">Novedades sobre tus excedentes.</p>
            ${data.length ? `<div class="list">${data.map((n) => `
                <${donante && n.excedente_id ? `button data-go="/publicacion/${esc(n.excedente_id)}"` : 'div'} class="item" style="${n.leida ? '' : 'border-color:#9ad5ae;background:#f6fcf8'}">
                    <span class="thumb" style="width:44px;height:44px;border-radius:14px">${ico('bell', 20)}</span>
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
    const d = p.rol === 'donante', c = p.rol === 'comedor';
    const tipo = d ? 'Empresa donante' : c ? 'Comedor' : 'Administrador';
    app.innerHTML = `
        ${topRol()}
        <main class="screen with-nav">
            <h1 class="h2 mt8">Mi perfil</h1>
            <div class="prof-head"><span class="thumb">${ico(d ? 'store' : c ? 'utensils' : 'shield', 26)}</span>
                <div><b>${esc(p.nombre_organizacion || 'Sin nombre')}</b><span>${tipo} · Cuenta activa</span></div></div>
            <div class="card fields-card">
                <div class="frow">${ico('user2')}<div><small>Persona responsable</small><b>${esc(p.responsable || '—')}</b></div></div>
                <div class="frow">${ico('mail')}<div><small>Correo electrónico</small><b>${esc(p.correo || S.session.user.email)}</b></div></div>
                <div class="frow">${ico('phone')}<div><small>Teléfono</small><b>${esc(p.telefono || '—')}</b></div></div>
                <div class="frow">${ico('pin')}<div><small>${d ? 'Dirección de recogida' : 'Dirección'}</small><b>${esc(p.direccion || '—')}</b></div></div>
                ${c ? `<div class="frow">${ico('clock')}<div><small>Horario de atención</small><b>${esc(p.horario_atencion || '—')}</b></div></div>` : ''}
                <button class="btn btn-outline btn-block mt8" id="editar">${ico('edit')} Editar información</button>
            </div>
            <div class="rows">
                <button class="row-link" id="r-clave">${ico('lock')}<span>Cambiar contraseña</span><span class="chev">${ico('chev')}</span></button>
                <button class="row-link" id="r-ayuda">${ico('help')}<span>Ayuda y contacto</span><span class="chev">${ico('chev')}</span></button>
                <button class="row-link" id="r-priv">${ico('shield')}<span>Privacidad y términos</span><span class="chev">${ico('chev')}</span></button>
            </div>
            <button class="logout" id="salir">${ico('logout')} Cerrar sesión</button>
        </main>
        ${navInferior('/perfil')}`;
    $('#salir').onclick = cerrarSesion;
    $('#r-ayuda').onclick = verAyuda;
    $('#r-priv').onclick = verPrivacidad;
    $('#r-clave').onclick = cambiarClave;
    $('#editar').onclick = () => editarPerfil(p, c);
}

function cambiarClave() {
    modal({
        titulo: 'Cambiar contraseña', texto: 'Elige una contraseña nueva de al menos 8 caracteres.', confirmar: 'Guardar',
        cuerpo: `<div class="field mt12"><label for="m-c1">Contraseña nueva</label><input class="input" id="m-c1" type="password" autocomplete="new-password" minlength="8"></div>
                 <div class="field mt12"><label for="m-c2">Repite la contraseña</label><input class="input" id="m-c2" type="password" autocomplete="new-password"></div>`,
        onConfirm: async (m) => {
            const a = $('#m-c1', m).value, b = $('#m-c2', m).value;
            if (a.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
            if (a !== b) throw new Error('Las contraseñas no coinciden.');
            const { error } = await sb.auth.updateUser({ password: a });
            if (error) throw error;
            toast('Contraseña actualizada.', 'ok');
        }
    });
}

function editarPerfil(p, esComedor) {
    modal({
        titulo: 'Editar información', confirmar: 'Guardar cambios',
        cuerpo: `<div class="field mt12"><label for="e-nombre">Nombre ${esComedor ? 'del comedor' : 'de la empresa'}</label><input class="input" id="e-nombre" value="${esc(p.nombre_organizacion)}"></div>
                 <div class="field mt12"><label for="e-resp">Persona responsable</label><input class="input" id="e-resp" value="${esc(p.responsable)}"></div>
                 <div class="field mt12"><label for="e-tel">Teléfono</label><input class="input" id="e-tel" type="tel" value="${esc(p.telefono)}"></div>
                 <div class="field mt12"><label for="e-dir">${esComedor ? 'Dirección' : 'Dirección de recogida'}</label><input class="input" id="e-dir" value="${esc(p.direccion)}"></div>
                 ${esComedor ? `<div class="field mt12"><label for="e-hor">Horario de atención</label><input class="input" id="e-hor" value="${esc(p.horario_atencion)}"></div>` : ''}`,
        onConfirm: async (m) => {
            const v = (id) => ($(id, m) ? $(id, m).value.trim() : '');
            if (!v('#e-nombre') || !v('#e-resp') || !v('#e-dir')) throw new Error('Nombre, responsable y dirección son obligatorios.');
            if (v('#e-tel').replace(/\D/g, '').length < 10) throw new Error('El teléfono debe tener al menos 10 dígitos.');
            const { error } = await sb.rpc('actualizar_mi_perfil', { p_nombre: v('#e-nombre'), p_responsable: v('#e-resp'), p_telefono: v('#e-tel'), p_direccion: v('#e-dir'), p_horario: v('#e-hor') });
            if (error) throw error;
            await API.cargarPerfil();
            toast('Información actualizada.', 'ok');
            vPerfil();
        }
    });
}

/* =====================================================================
   ADMINISTRADOR
   ===================================================================== */
async function vAdmin() {
    let tab = 'pendientes', cuentas = [];
    app.innerHTML = `${topLogo()}<main class="screen with-nav">${loader()}</main>${navInferior('/admin')}`;

    const pintar = () => {
        const pend = cuentas.filter((c) => !c.aprobado && c.activo !== false);
        const resto = cuentas.filter((c) => !(!c.aprobado && c.activo !== false));
        $('main').innerHTML = `
            <h1 class="h2 mt8">Registros</h1>
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
        if (!$('main')) return;
        if (error) { $('main').innerHTML = `<div class="notice notice-err">${ico('alert')}<div><b>No se pudieron cargar los registros</b><span>${esc(msgErr(error))}</span></div></div>`; return; }
        cuentas = data || [];
        pintar();
    };
    S.refresh = cargar;
    await cargar();
}

function tarjetaCuenta(c, pendiente) {
    const estado = c.aprobado && c.activo !== false ? '<span class="pill pill-ok">activa</span>'
        : c.aprobado ? '<span class="pill pill-muted">desactivada</span>'
        : c.activo === false ? '<span class="pill pill-bad">rechazada</span>' : '<span class="pill pill-info">pendiente</span>';
    return `<article class="card">
        <div class="between"><b style="font-size:16px">${esc(c.nombre_organizacion || 'Sin nombre')}</b>${estado}</div>
        <div class="muted small">${c.rol === 'donante' ? 'Empresa' : 'Comedor'} · registrada ${esc(fmtFecha((c.created_at || '').slice(0, 10)))}</div>
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
const ROLES = {
    'mis-publicaciones': 'donante', publicar: 'donante', publicacion: 'donante',
    explorar: 'comedor', excedente: 'comedor', reservas: 'comedor', recepcion: 'comedor',
    admin: 'admin'
};
const ALIAS = { disponibles: '/explorar', recogidas: '/reservas' };

async function route() {
    teardown();
    window.scrollTo(0, 0);
    const [a = '', b = ''] = (location.hash.replace(/^#\/?/, '').split('?')[0]).split('/');
    if (ALIAS[a]) return go(ALIAS[a]);

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
            if (aprobado(S.perfil) && S.perfil.rol !== 'admin') await API.contarAvisos();
        }
    } catch (e) {
        app.innerHTML = `${topLogo()}<main class="screen with-nav"><div class="notice notice-err">${ico('alert')}<div><b>No se pudo conectar con la base de datos</b><span>${esc(msgErr(e))}</span></div></div>
            <button class="btn btn-outline btn-block mt16" onclick="location.reload()">Reintentar</button></main>${navInferior(null)}`;
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
        case 'explorar': return vExplorar();
        case 'excedente': return vExcedente(b);
        case 'reservas': return vReservas();
        case 'recepcion': return vRecepcion(b);
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
function nuevaClave() {
    modal({
        titulo: 'Crea tu nueva contraseña', texto: 'Escribe una contraseña de al menos 8 caracteres.', confirmar: 'Guardar',
        cuerpo: `<div class="field mt12"><label for="m-c1">Contraseña nueva</label><input class="input" id="m-c1" type="password" autocomplete="new-password"></div>`,
        onConfirm: async (m) => {
            const a = $('#m-c1', m).value;
            if (a.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
            const { error } = await sb.auth.updateUser({ password: a });
            if (error) throw error;
            toast('Contraseña actualizada.', 'ok');
        }
    });
}

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
        if (evento === 'PASSWORD_RECOVERY') { setTimeout(nuevaClave, 300); return; }
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
