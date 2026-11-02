// js/supabase-config.js

// 1. Extraer la función createClient de la librería global
const { createClient } = window.supabase;

// 2. Credenciales del proyecto
// REEMPLAZA la URL del dashboard por la URL API terminada en .supabase.co
const supabaseUrl = 'https://jevxmmcmajxhafuoukym.supabase.co';
const supabaseKey = 'sb_publishable_Ik9sLjyDt8UgjukvZBibXQ_hfbSJ2vk'; 
const supabaseKey2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpldnhtbWNtYWp4aGFmdW91a3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2MzQxMzcsImV4cCI6MjEwOTIxMDEzN30._0YdzzcAsa88TWAPS8NRMo26mjHaeaszsAwUqOhxbmY';
// 3. Crear y exponer la variable global
var supabaseClient = createClient(supabaseUrl, supabaseKey);
window.supabaseClient = supabaseClient;