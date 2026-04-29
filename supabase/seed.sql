-- =============================================================================
-- SEED DATA FOR GENTLE-JOBS
-- Date: 2026-04-21
-- =============================================================================

-- Clean existing data to avoid duplicates (Optional - Be careful in production)
-- TRUNCATE public.preventive_tasks, public.work_orders, public.locations, public.buildings, public.user_roles, public.profiles CASCADE;

-- 1. USERS (auth.users)
-- Note: In a real Supabase environment, users are usually created via Auth API.
-- For seeding, we manually insert into auth.users.
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_log_metadata)
VALUES 
('u0000000-0000-0000-0000-000000000001', 'admin@gentlejobs.com', 'pbkdf2_sha256$10000$fakehash', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Administrador Global"}'),
('u0000000-0000-0000-0000-000000000002', 'tech1@gentlejobs.com', 'pbkdf2_sha256$10000$fakehash', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Juan Pérez"}'),
('u0000000-0000-0000-0000-000000000003', 'tech2@gentlejobs.com', 'pbkdf2_sha256$10000$fakehash', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"María García"}'),
('u0000000-0000-0000-0000-000000000004', 'tech3@gentlejobs.com', 'pbkdf2_sha256$10000$fakehash', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Carlos López"}');

-- 2. PROFILES
INSERT INTO public.profiles (id, full_name, email)
VALUES 
('u0000000-0000-0000-0000-000000000001', 'Administrador Global', 'admin@gentlejobs.com'),
('u0000000-0000-0000-0000-000000000002', 'Juan Pérez', 'tech1@gentlejobs.com'),
('u0000000-0000-0000-0000-000000000003', 'María García', 'tech2@gentlejobs.com'),
('u0000000-0000-0000-0000-000000000004', 'Carlos López', 'tech3@gentlejobs.com');

-- 3. USER ROLES
INSERT INTO public.user_roles (user_id, role)
VALUES 
('u0000000-0000-0000-0000-000000000001', 'admin'),
('u0000000-0000-0000-0000-000000000002', 'tecnico'),
('u0000000-0000-0000-0000-000000000003', 'tecnico'),
('u0000000-0000-0000-0000-000000000004', 'tecnico');

-- 4. BUILDINGS
INSERT INTO public.buildings (id, name, address, notes)
VALUES 
('b0000000-0000-0000-0000-000000000001', 'Edificio Principal', 'Av. Central 123, Zona 1', 'Sede central de operaciones'),
('b0000000-0000-0000-0000-000000000002', 'Almacén Norte', 'Km 15 Carretera al Norte', 'Área de almacenamiento y logística'),
('b0000000-0000-0000-0000-000000000003', 'Sede Administrativa', 'Calle Los Pinos 45', 'Oficinas corporativas');

-- 5. LOCATIONS
INSERT INTO public.locations (id, building_id, name, floor, description)
VALUES 
('l0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Sala de Servidores', '3', 'Control de temperatura y racks principales'),
('l0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Oficina Gerencia', '2', 'Área ejecutiva'),
('l0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Baños Planta Baja', '1', 'Suministros sanitarios'),
('l0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'Área de Carga', '1', 'Muelles de descarga'),
('l0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'Taller Mecánico', '1', 'Mantenimiento de flota'),
('l0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003', 'Recepción', '1', 'Entrada principal'),
('l0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000003', 'Sala de Juntas', '2', 'Equipos audiovisuales'),
('l0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 'Área de Archivo', 'Sótano', 'Almacenamiento de documentos');

-- 6. WORK ORDERS
-- Today: 2026-04-21
INSERT INTO public.work_orders (title, description, priority, status, location_id, assigned_to, created_by, due_date, completed_at)
VALUES 
('Fuga de agua en baño', 'Goteo constante en lavamanos', 'media', 'pendiente', 'l0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000001', '2026-04-25', NULL),
('Aire acondicionado no enfría', 'Sala de servidores reporta temperatura alta', 'urgente', 'en_curso', 'l0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000001', '2026-04-21', NULL),
('Cambio de luminarias', 'Varios focos fundidos en pasillo', 'baja', 'pendiente', 'l0000000-0000-0000-0000-000000000008', 'u0000000-0000-0000-0000-000000000004', 'u0000000-0000-0000-0000-000000000001', '2026-04-30', NULL),
('Puerta de entrada trabada', 'Cerradura dañada en recepción', 'alta', 'completada', 'l0000000-0000-0000-0000-000000000006', 'u0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000001', '2026-04-15', '2026-04-16 10:00:00'),
('Revisión de montacargas', 'Ruido extraño en motor', 'alta', 'pendiente', 'l0000000-0000-0000-0000-000000000005', 'u0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000001', '2026-04-18', NULL), -- VENCIDA
('Pintura de muros', 'Retoque de pintura en oficina gerencia', 'baja', 'pendiente', 'l0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000004', 'u0000000-0000-0000-0000-000000000001', '2026-05-10', NULL),
('Cables sueltos en sala juntas', 'Riesgo de tropiezo con cables HDMI', 'media', 'en_curso', 'l0000000-0000-0000-0000-000000000007', 'u0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000001', '2026-04-23', NULL),
('Limpieza de drenajes', 'Prevención de inundaciones en área de carga', 'media', 'completada', 'l0000000-0000-0000-0000-000000000004', 'u0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000001', '2026-04-10', '2026-04-11 14:00:00'),
('Sillas ergonómicas ajuste', 'Sillas en archivo necesitan ajuste', 'baja', 'pendiente', 'l0000000-0000-0000-0000-000000000008', 'u0000000-0000-0000-0000-000000000004', 'u0000000-0000-0000-0000-000000000001', '2026-04-12', NULL), -- VENCIDA
('Revisión eléctrica general', 'Inspección de tableros principales', 'alta', 'pendiente', 'l0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000001', '2026-04-26', NULL);

-- 7. PREVENTIVE TASKS
-- Today: 2026-04-21
INSERT INTO public.preventive_tasks (title, description, location_id, assigned_to, frequency_days, next_due_date, last_completed_at, active, created_by)
VALUES 
('Limpieza de Filtros AC', 'Limpieza mensual de filtros de aire', 'l0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000002', 30, '2026-04-10', '2026-03-10 09:00:00', true, 'u0000000-0000-0000-0000-000000000001'), -- VENCIDA
('Inspección de Extintores', 'Verificación de presión y fecha', 'l0000000-0000-0000-0000-000000000006', 'u0000000-0000-0000-0000-000000000003', 180, '2026-04-25', '2025-10-25 08:00:00', true, 'u0000000-0000-0000-0000-000000000001'), -- PLANEADA
('Engrase de Maquinaria', 'Lubricación de ejes y motores', 'l0000000-0000-0000-0000-000000000005', 'u0000000-0000-0000-0000-000000000004', 60, '2026-04-15', '2026-02-15 11:00:00', true, 'u0000000-0000-0000-0000-000000000001'), -- VENCIDA
('Copia de Seguridad Servidores', 'Verificación de backups semanales', 'l0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000002', 7, '2026-04-28', '2026-04-21 02:00:00', true, 'u0000000-0000-0000-0000-000000000001'), -- PLANEADA
('Revisión de Bombas Agua', 'Chequeo de presión y fugas', 'l0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000003', 30, '2026-04-05', '2026-03-05 10:00:00', true, 'u0000000-0000-0000-0000-000000000001'), -- VENCIDA
('Mantenimiento de Elevador', 'Lubricación de cables y sensores', 'l0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000004', 90, '2026-05-02', '2026-02-02 15:00:00', true, 'u0000000-0000-0000-0000-000000000001'), -- PLANEADA
('Limpieza de Cisternas', 'Desinfección semestral', 'l0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000002', 180, '2026-04-20', '2025-10-20 09:00:00', true, 'u0000000-0000-0000-0000-000000000001'), -- VENCIDA
('Ajuste de Puertas Cortafuego', 'Verificación de cierre hermético', 'l0000000-0000-0000-0000-000000000004', 'u0000000-0000-0000-0000-000000000003', 365, '2026-06-15', '2025-06-15 10:00:00', true, 'u0000000-0000-0000-0000-000000000001'), -- PLANEADA (lejana)
('Prueba de Generador Eléctrico', 'Arranque y prueba de carga', 'l0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000004', 30, '2026-04-18', '2026-03-18 08:00:00', true, 'u0000000-0000-0000-0000-000000000001'), -- VENCIDA
('Revisión de Señalética', 'Sustitución de avisos desgastados', 'l0000000-0000-0000-0000-000000000006', 'u0000000-0000-0000-0000-000000000002', 365, '2026-04-30', '2025-04-30 14:00:00', true, 'u0000000-0000-0000-0000-000000000001'); -- PLANEADA