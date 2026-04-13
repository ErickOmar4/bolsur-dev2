--
-- PostgreSQL database dump
--

-- Configuraciones iniciales de sesión
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- ==========================================================
-- BLOQUE DE SEGURIDAD: USUARIO Y ESQUEMA
-- ==========================================================
DO $$ 
BEGIN
  -- Crear el usuario si no existe
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'bolsur_user') THEN
    CREATE ROLE bolsur_user WITH LOGIN PASSWORD 'admin123';
  END IF;
END $$;

-- Crear esquema si no existe y asignar dueño
CREATE SCHEMA IF NOT EXISTS bolsur_dbnormal;
ALTER SCHEMA bolsur_dbnormal OWNER TO bolsur_user;

-- Otorgar permisos base
GRANT ALL PRIVILEGES ON SCHEMA bolsur_dbnormal TO bolsur_user;

-- Establecer ruta de búsqueda para los objetos que siguen
SET search_path TO bolsur_dbnormal, public;
-- ==========================================================

--
-- TOC entry 252 (class 1255 OID 24589)
-- Name: crear_preferencias_automaticas(); Type: FUNCTION; Schema: bolsur_dbnormal; Owner: bolsur_user
--

CREATE OR REPLACE FUNCTION bolsur_dbnormal.crear_preferencias_automaticas() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO bolsur_dbnormal.usuario_preferencias (usuario_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$;

-- Cambiamos el dueño de la función
ALTER FUNCTION bolsur_dbnormal.crear_preferencias_automaticas() OWNER TO bolsur_user;

--
-- TOC entry 251 (class 1255 OID 16386)
-- Name: set_updated_at(); Type: FUNCTION; Schema: bolsur_dbnormal; Owner: bolsur_user
--

CREATE OR REPLACE FUNCTION bolsur_dbnormal.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
 NEW.updated_at = CURRENT_TIMESTAMP;
 RETURN NEW;
END;
$$;

-- Cambiamos el dueño de la función
ALTER FUNCTION bolsur_dbnormal.set_updated_at() OWNER TO bolsur_user;

SET default_tablespace = '';
SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 16387)
-- Name: categorias; Type: TABLE; Schema: bolsur_dbnormal; Owner: bolsur_user
--

CREATE TABLE IF NOT EXISTS bolsur_dbnormal.categorias (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Cambiamos el dueño de la tabla
ALTER TABLE bolsur_dbnormal.categorias OWNER TO bolsur_user;

--
-- TOC entry 221 (class 1259 OID 16394)
-- Name: categorias_id_seq; Type: SEQUENCE; Schema: bolsur_dbnormal; Owner: bolsur_user
--

-- Las secuencias GENERATED ALWAYS pertenecen automáticamente al dueño de la tabla
-- pero nos aseguramos de asignar la propiedad correctamente.
ALTER TABLE bolsur_dbnormal.categorias ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME bolsur_dbnormal.categorias_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 222 (class 1259 OID 16395)
-- Name: clientes; Type: TABLE; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE TABLE bolsur_dbnormal.clientes (
    id integer NOT NULL,
    nombre_comercial character varying(150) NOT NULL,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE bolsur_dbnormal.clientes OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16403)
-- Name: clientes_id_seq; Type: SEQUENCE; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE bolsur_dbnormal.clientes ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME bolsur_dbnormal.clientes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 224 (class 1259 OID 16404)
-- Name: detalle_pedidos; Type: TABLE; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE TABLE bolsur_dbnormal.detalle_pedidos (
    id integer NOT NULL,
    pedido_id integer NOT NULL,
    producto_id integer NOT NULL,
    tipo_servicio character varying(50),
    cantidad integer NOT NULL,
    alto_cm numeric(10,2),
    ancho_cm numeric(10,2),
    color character varying(50),
    precio_unitario numeric(10,2) NOT NULL,
    subtotal numeric(10,2) GENERATED ALWAYS AS (((cantidad)::numeric * precio_unitario)) STORED,
    id_servicio integer
);


ALTER TABLE bolsur_dbnormal.detalle_pedidos OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16413)
-- Name: detalle_pedidos_id_seq; Type: SEQUENCE; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE bolsur_dbnormal.detalle_pedidos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME bolsur_dbnormal.detalle_pedidos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 226 (class 1259 OID 16414)
-- Name: detalle_ventas; Type: TABLE; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE TABLE bolsur_dbnormal.detalle_ventas (
    id integer NOT NULL,
    venta_id integer NOT NULL,
    producto_id integer NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    subtotal numeric(10,2) GENERATED ALWAYS AS (((cantidad)::numeric * precio_unitario)) STORED,
    id_servicio integer
);


ALTER TABLE bolsur_dbnormal.detalle_ventas OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16423)
-- Name: detalle_ventas_id_seq; Type: SEQUENCE; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE bolsur_dbnormal.detalle_ventas ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME bolsur_dbnormal.detalle_ventas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 228 (class 1259 OID 16424)
-- Name: emails_clientes; Type: TABLE; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE TABLE bolsur_dbnormal.emails_clientes (
    id integer NOT NULL,
    cliente_id integer NOT NULL,
    email character varying(100) NOT NULL,
    tipo character varying(20) DEFAULT 'principal'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE bolsur_dbnormal.emails_clientes OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16432)
-- Name: emails_clientes_id_seq; Type: SEQUENCE; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE bolsur_dbnormal.emails_clientes ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME bolsur_dbnormal.emails_clientes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 230 (class 1259 OID 16433)
-- Name: empresa; Type: TABLE; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE TABLE bolsur_dbnormal.empresa (
    id_empresa integer NOT NULL,
    nombre character varying(30),
    telefono character varying(30),
    direccion character varying(100),
    correo character varying(100)
);


ALTER TABLE bolsur_dbnormal.empresa OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16437)
-- Name: metodos_pago; Type: TABLE; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE TABLE bolsur_dbnormal.metodos_pago (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    requiere_referencia boolean DEFAULT false,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE bolsur_dbnormal.metodos_pago OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 16445)
-- Name: metodos_pago_id_seq; Type: SEQUENCE; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE bolsur_dbnormal.metodos_pago ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME bolsur_dbnormal.metodos_pago_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 250 (class 1259 OID 40979)
-- Name: notificaciones; Type: TABLE; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE TABLE bolsur_dbnormal.notificaciones (
    id integer NOT NULL,
    usuario_id integer,
    type character varying(20),
    title character varying(100),
    description text,
    read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE bolsur_dbnormal.notificaciones OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 40978)
-- Name: notificaciones_id_seq; Type: SEQUENCE; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE SEQUENCE bolsur_dbnormal.notificaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE bolsur_dbnormal.notificaciones_id_seq OWNER TO postgres;

--
-- TOC entry 5261 (class 0 OID 0)
-- Dependencies: 249
-- Name: notificaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER SEQUENCE bolsur_dbnormal.notificaciones_id_seq OWNED BY bolsur_dbnormal.notificaciones.id;


--
-- TOC entry 233 (class 1259 OID 16446)
-- Name: pagos; Type: TABLE; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE TABLE bolsur_dbnormal.pagos (
    id_pago integer NOT NULL,
    pedido_id integer,
    venta_id integer,
    metodo_pago_id integer NOT NULL,
    monto numeric(10,2) NOT NULL,
    fecha_pago date NOT NULL,
    referencia character varying(100),
    usuario_registra_id integer NOT NULL,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tipo character varying NOT NULL
);


ALTER TABLE bolsur_dbnormal.pagos OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 16458)
-- Name: pagos_id_pago_seq; Type: SEQUENCE; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE bolsur_dbnormal.pagos ALTER COLUMN id_pago ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME bolsur_dbnormal.pagos_id_pago_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 235 (class 1259 OID 16459)
-- Name: pedidos; Type: TABLE; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE TABLE bolsur_dbnormal.pedidos (
    id integer NOT NULL,
    cliente_id integer NOT NULL,
    usuario_id integer NOT NULL,
    fecha_pedido date NOT NULL,
    fecha_entrega date,
    estado smallint DEFAULT 1,
    subtotal numeric(10,2) DEFAULT 0,
    total numeric(10,2) DEFAULT 0,
    descripcion character varying(170),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pedidos_estado_check CHECK ((estado = ANY (ARRAY[1, 2, 3, 4])))
);


ALTER TABLE bolsur_dbnormal.pedidos OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 16472)
-- Name: pedidos_id_seq; Type: SEQUENCE; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE bolsur_dbnormal.pedidos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME bolsur_dbnormal.pedidos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 237 (class 1259 OID 16473)
-- Name: productos; Type: TABLE; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE TABLE bolsur_dbnormal.productos (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion character varying(255),
    categoria_id integer NOT NULL,
    alto_cm numeric(10,2),
    ancho_cm numeric(10,2),
    precio_venta numeric(10,2) NOT NULL,
    stock_actual integer DEFAULT 0,
    stock_minimo integer DEFAULT 0,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE bolsur_dbnormal.productos OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 16485)
-- Name: productos_id_seq; Type: SEQUENCE; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE bolsur_dbnormal.productos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME bolsur_dbnormal.productos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 239 (class 1259 OID 16486)
-- Name: roles; Type: TABLE; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE TABLE bolsur_dbnormal.roles (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE bolsur_dbnormal.roles OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 16492)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE bolsur_dbnormal.roles ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME bolsur_dbnormal.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 241 (class 1259 OID 16493)
-- Name: servicio; Type: TABLE; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE TABLE bolsur_dbnormal.servicio (
    id_servicio integer NOT NULL,
    nombre character varying NOT NULL
);


ALTER TABLE bolsur_dbnormal.servicio OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 16500)
-- Name: telefonos_clientes; Type: TABLE; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE TABLE bolsur_dbnormal.telefonos_clientes (
    id integer NOT NULL,
    cliente_id integer NOT NULL,
    telefono character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE bolsur_dbnormal.telefonos_clientes OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 16507)
-- Name: telefonos_clientes_id_seq; Type: SEQUENCE; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE bolsur_dbnormal.telefonos_clientes ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME bolsur_dbnormal.telefonos_clientes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 248 (class 1259 OID 24591)
-- Name: usuario_preferencias; Type: TABLE; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE TABLE bolsur_dbnormal.usuario_preferencias (
    usuario_id integer NOT NULL,
    notif_pedidos_urgentes boolean DEFAULT true,
    notif_stock_bajo boolean DEFAULT true,
    notif_nuevos_pedidos boolean DEFAULT true,
    imprimir_automatico boolean DEFAULT true,
    enviar_correo_cliente boolean DEFAULT true
);


ALTER TABLE bolsur_dbnormal.usuario_preferencias OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 16508)
-- Name: usuarios; Type: TABLE; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE TABLE bolsur_dbnormal.usuarios (
    id integer NOT NULL,
    nombre_completo character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    rol_id integer NOT NULL,
    activo boolean DEFAULT true,
    ultimo_acceso timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    empresa_id_empresa integer NOT NULL
);


ALTER TABLE bolsur_dbnormal.usuarios OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 16520)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE bolsur_dbnormal.usuarios ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME bolsur_dbnormal.usuarios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 246 (class 1259 OID 16521)
-- Name: ventas; Type: TABLE; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE TABLE bolsur_dbnormal.ventas (
    id integer NOT NULL,
    numero_venta character varying(30) NOT NULL,
    cliente_id integer NOT NULL,
    usuario_id integer NOT NULL,
    fecha_venta date NOT NULL,
    subtotal numeric(10,2) DEFAULT 0,
    total numeric(10,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE bolsur_dbnormal.ventas OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 16533)
-- Name: ventas_id_seq; Type: SEQUENCE; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE bolsur_dbnormal.ventas ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME bolsur_dbnormal.ventas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 4975 (class 2604 OID 40982)
-- Name: notificaciones id; Type: DEFAULT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.notificaciones ALTER COLUMN id SET DEFAULT nextval('bolsur_dbnormal.notificaciones_id_seq'::regclass);


--
-- TOC entry 5209 (class 0 OID 16387)
-- Dependencies: 220
-- Data for Name: categorias; Type: TABLE DATA; Schema: bolsur_dbnormal; Owner: postgres
--

INSERT INTO bolsur_dbnormal.categorias (id, nombre, activo, created_at) OVERRIDING SYSTEM VALUE VALUES (1, 'Playeras', true, '2026-04-01 14:41:15.6147');
INSERT INTO bolsur_dbnormal.categorias (id, nombre, activo, created_at) OVERRIDING SYSTEM VALUE VALUES (2, 'Bolsas ecológicas', true, '2026-04-01 14:41:15.6147');
INSERT INTO bolsur_dbnormal.categorias (id, nombre, activo, created_at) OVERRIDING SYSTEM VALUE VALUES (3, 'Posters', true, '2026-04-01 14:41:15.6147');
INSERT INTO bolsur_dbnormal.categorias (id, nombre, activo, created_at) OVERRIDING SYSTEM VALUE VALUES (4, 'Stickers', true, '2026-04-01 14:41:15.6147');
INSERT INTO bolsur_dbnormal.categorias (id, nombre, activo, created_at) OVERRIDING SYSTEM VALUE VALUES (5, 'Papelería', true, '2026-04-01 14:41:15.6147');
INSERT INTO bolsur_dbnormal.categorias (id, nombre, activo, created_at) OVERRIDING SYSTEM VALUE VALUES (6, 'Vinil textil', true, '2026-04-01 14:41:15.6147');
INSERT INTO bolsur_dbnormal.categorias (id, nombre, activo, created_at) OVERRIDING SYSTEM VALUE VALUES (7, 'Herramientas', true, '2026-04-01 14:41:15.6147');
INSERT INTO bolsur_dbnormal.categorias (id, nombre, activo, created_at) OVERRIDING SYSTEM VALUE VALUES (8, 'Tintas', true, '2026-04-01 14:41:15.6147');


--
-- TOC entry 5211 (class 0 OID 16395)
-- Dependencies: 222
-- Data for Name: clientes; Type: TABLE DATA; Schema: bolsur_dbnormal; Owner: postgres
--

INSERT INTO bolsur_dbnormal.clientes (id, nombre_comercial, activo, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (1, 'Público General', true, '2026-04-01 19:54:16.623168', '2026-04-01 19:54:16.623168');
INSERT INTO bolsur_dbnormal.clientes (id, nombre_comercial, activo, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (2, 'Barney el dinosaurio', true, '2026-04-09 13:35:41.992303', '2026-04-09 13:35:41.992303');
INSERT INTO bolsur_dbnormal.clientes (id, nombre_comercial, activo, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (3, 'Rexy el dino', true, '2026-04-09 13:39:35.807915', '2026-04-09 13:39:35.807915');
INSERT INTO bolsur_dbnormal.clientes (id, nombre_comercial, activo, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (4, 'Tasha', true, '2026-04-09 14:11:35.610553', '2026-04-09 14:11:35.610553');
INSERT INTO bolsur_dbnormal.clientes (id, nombre_comercial, activo, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (5, 'Tyrone', true, '2026-04-09 14:12:00.119694', '2026-04-09 14:12:00.119694');
INSERT INTO bolsur_dbnormal.clientes (id, nombre_comercial, activo, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (15, 'Alex el leon', true, '2026-04-10 20:27:48.020981', '2026-04-10 20:27:48.020981');
INSERT INTO bolsur_dbnormal.clientes (id, nombre_comercial, activo, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (16, 'Pablo backyardigans', true, '2026-04-10 23:21:31.845326', '2026-04-10 23:21:31.845326');
INSERT INTO bolsur_dbnormal.clientes (id, nombre_comercial, activo, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (23, 'Jose  Ruiz', true, '2026-04-11 01:00:32.515338', '2026-04-11 01:00:32.515338');
INSERT INTO bolsur_dbnormal.clientes (id, nombre_comercial, activo, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (22, 'Mariana Rodriguez', true, '2026-04-11 00:18:13.989638', '2026-04-11 01:03:10.206727');
INSERT INTO bolsur_dbnormal.clientes (id, nombre_comercial, activo, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (24, 'Andrea Lopez', true, '2026-04-11 02:09:28.917802', '2026-04-11 02:09:28.917802');


--
-- TOC entry 5213 (class 0 OID 16404)
-- Dependencies: 224
-- Data for Name: detalle_pedidos; Type: TABLE DATA; Schema: bolsur_dbnormal; Owner: postgres
--

INSERT INTO bolsur_dbnormal.detalle_pedidos (id, pedido_id, producto_id, tipo_servicio, cantidad, alto_cm, ancho_cm, color, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (21, 18, 24, '1', 1, 45.00, 43.00, '', 2.45, NULL);
INSERT INTO bolsur_dbnormal.detalle_pedidos (id, pedido_id, producto_id, tipo_servicio, cantidad, alto_cm, ancho_cm, color, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (22, 17, 22, '1', 1, 0.00, 0.00, '', 150.00, NULL);
INSERT INTO bolsur_dbnormal.detalle_pedidos (id, pedido_id, producto_id, tipo_servicio, cantidad, alto_cm, ancho_cm, color, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (23, 19, 14, '3', 1, 75.00, 60.00, '', 350.00, NULL);


--
-- TOC entry 5215 (class 0 OID 16414)
-- Dependencies: 226
-- Data for Name: detalle_ventas; Type: TABLE DATA; Schema: bolsur_dbnormal; Owner: postgres
--

INSERT INTO bolsur_dbnormal.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (2, 7, 12, 1, 50.00, NULL);
INSERT INTO bolsur_dbnormal.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (3, 8, 12, 1, 120.00, NULL);
INSERT INTO bolsur_dbnormal.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (4, 9, 15, 1, 90.00, NULL);
INSERT INTO bolsur_dbnormal.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (5, 10, 13, 1, 180.00, NULL);
INSERT INTO bolsur_dbnormal.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (6, 11, 13, 1, 180.00, NULL);
INSERT INTO bolsur_dbnormal.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (7, 12, 18, 1, 120.00, NULL);
INSERT INTO bolsur_dbnormal.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (8, 13, 22, 1, 150.00, NULL);
INSERT INTO bolsur_dbnormal.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (9, 14, 12, 1, 120.00, NULL);
INSERT INTO bolsur_dbnormal.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (10, 15, 20, 1, 250.00, NULL);
INSERT INTO bolsur_dbnormal.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (11, 16, 22, 1, 150.00, NULL);
INSERT INTO bolsur_dbnormal.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (12, 17, 13, 1, 180.00, NULL);
INSERT INTO bolsur_dbnormal.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (13, 18, 12, 1, 120.00, NULL);
INSERT INTO bolsur_dbnormal.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (14, 19, 13, 1, 180.00, NULL);
INSERT INTO bolsur_dbnormal.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (15, 20, 13, 1, 180.00, NULL);
INSERT INTO bolsur_dbnormal.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (16, 21, 12, 1, 120.00, NULL);
INSERT INTO bolsur_dbnormal.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (17, 21, 15, 2, 90.00, NULL);
INSERT INTO bolsur_dbnormal.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (18, 21, 13, 1, 180.00, NULL);
INSERT INTO bolsur_dbnormal.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (19, 22, 13, 1, 180.00, NULL);
INSERT INTO bolsur_dbnormal.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (20, 23, 13, 1, 180.00, NULL);
INSERT INTO bolsur_dbnormal.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (22, 27, 24, 1, 2.45, 1);
INSERT INTO bolsur_dbnormal.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (23, 28, 24, 1, 2.45, 1);
INSERT INTO bolsur_dbnormal.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (24, 29, 15, 1, 90.00, NULL);
INSERT INTO bolsur_dbnormal.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (25, 30, 12, 1, 120.00, NULL);
INSERT INTO bolsur_dbnormal.detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, id_servicio) OVERRIDING SYSTEM VALUE VALUES (26, 31, 14, 1, 350.00, 3);


--
-- TOC entry 5217 (class 0 OID 16424)
-- Dependencies: 228
-- Data for Name: emails_clientes; Type: TABLE DATA; Schema: bolsur_dbnormal; Owner: postgres
--



--
-- TOC entry 5219 (class 0 OID 16433)
-- Dependencies: 230
-- Data for Name: empresa; Type: TABLE DATA; Schema: bolsur_dbnormal; Owner: postgres
--

INSERT INTO bolsur_dbnormal.empresa (id_empresa, nombre, telefono, direccion, correo) VALUES (1, 'Bolsur', '+34 91-374-7368', 'Avenida Juarez 150, Colonia Centro, Oaxaca de Juárez, Oaxaca, 68000, México', 'bolsur@noreply.com');


--
-- TOC entry 5220 (class 0 OID 16437)
-- Dependencies: 231
-- Data for Name: metodos_pago; Type: TABLE DATA; Schema: bolsur_dbnormal; Owner: postgres
--

INSERT INTO bolsur_dbnormal.metodos_pago (id, nombre, requiere_referencia, activo, created_at) OVERRIDING SYSTEM VALUE VALUES (1, 'Efectivo', false, true, '2026-04-11 01:23:31.099048');
INSERT INTO bolsur_dbnormal.metodos_pago (id, nombre, requiere_referencia, activo, created_at) OVERRIDING SYSTEM VALUE VALUES (2, 'Transferencia', true, true, '2026-04-11 01:23:31.099048');


--
-- TOC entry 5239 (class 0 OID 40979)
-- Dependencies: 250
-- Data for Name: notificaciones; Type: TABLE DATA; Schema: bolsur_dbnormal; Owner: postgres
--

INSERT INTO bolsur_dbnormal.notificaciones (id, usuario_id, type, title, description, read, created_at) VALUES (1, 6, 'low_stock', 'Stock bajo', 'Producto: Bolsa de Papel Kraft No. 3 requiere reabastecimiento.', false, '2026-04-11 08:50:00.061465');
INSERT INTO bolsur_dbnormal.notificaciones (id, usuario_id, type, title, description, read, created_at) VALUES (2, 8, 'low_stock', 'Stock bajo', 'Producto: Bolsa de Papel Kraft No. 3 requiere reabastecimiento.', true, '2026-04-11 08:50:00.067266');
INSERT INTO bolsur_dbnormal.notificaciones (id, usuario_id, type, title, description, read, created_at) VALUES (3, 8, 'low_stock', 'Stock bajo', 'Producto: Bolsa de Papel Kraft No. 3 está por debajo del mínimo.', true, '2026-04-11 08:54:50.026493');


--
-- TOC entry 5222 (class 0 OID 16446)
-- Dependencies: 233
-- Data for Name: pagos; Type: TABLE DATA; Schema: bolsur_dbnormal; Owner: postgres
--

INSERT INTO bolsur_dbnormal.pagos (id_pago, pedido_id, venta_id, metodo_pago_id, monto, fecha_pago, referencia, usuario_registra_id, fecha_registro, tipo) OVERRIDING SYSTEM VALUE VALUES (1, 18, 28, 1, 2.45, '2026-04-12', 'Liquidacion', 8, '2026-04-11 01:30:57.188563', 'LIQUIDACION');
INSERT INTO bolsur_dbnormal.pagos (id_pago, pedido_id, venta_id, metodo_pago_id, monto, fecha_pago, referencia, usuario_registra_id, fecha_registro, tipo) OVERRIDING SYSTEM VALUE VALUES (2, 19, 31, 1, 245.00, '2026-04-11', '', 8, '2026-04-11 09:13:51.236894', 'ABONO');
INSERT INTO bolsur_dbnormal.pagos (id_pago, pedido_id, venta_id, metodo_pago_id, monto, fecha_pago, referencia, usuario_registra_id, fecha_registro, tipo) OVERRIDING SYSTEM VALUE VALUES (3, 19, 31, 1, 105.00, '2026-04-11', '', 8, '2026-04-11 09:13:57.514467', 'LIQUIDACION');


--
-- TOC entry 5224 (class 0 OID 16459)
-- Dependencies: 235
-- Data for Name: pedidos; Type: TABLE DATA; Schema: bolsur_dbnormal; Owner: postgres
--

INSERT INTO bolsur_dbnormal.pedidos (id, cliente_id, usuario_id, fecha_pedido, fecha_entrega, estado, subtotal, total, descripcion, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (18, 23, 8, '2026-04-11', '2028-04-02', 4, 0.00, 2.45, '', '2026-04-11 01:00:32.515338', '2026-04-11 01:56:28.568156');
INSERT INTO bolsur_dbnormal.pedidos (id, cliente_id, usuario_id, fecha_pedido, fecha_entrega, estado, subtotal, total, descripcion, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (19, 24, 8, '2026-04-11', '2026-04-09', 4, 0.00, 350.00, 'Sudadera con estampado frontal en serigrafía', '2026-04-11 02:09:28.917802', '2026-04-11 09:14:24.773966');
INSERT INTO bolsur_dbnormal.pedidos (id, cliente_id, usuario_id, fecha_pedido, fecha_entrega, estado, subtotal, total, descripcion, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (17, 22, 8, '2026-04-11', '2026-09-23', 2, 0.00, 150.00, 'Tinta base agua color blanco', '2026-04-11 00:18:13.989638', '2026-04-11 13:09:20.902969');


--
-- TOC entry 5226 (class 0 OID 16473)
-- Dependencies: 237
-- Data for Name: productos; Type: TABLE DATA; Schema: bolsur_dbnormal; Owner: postgres
--

INSERT INTO bolsur_dbnormal.productos (id, nombre, descripcion, categoria_id, alto_cm, ancho_cm, precio_venta, stock_actual, stock_minimo, activo, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (16, 'Poster personalizado', 'Impresión en papel couche mediante serigrafía', 3, 60.00, 40.00, 70.00, 25, 5, true, '2026-04-01 14:42:57.558254', '2026-04-01 14:42:57.558254');
INSERT INTO bolsur_dbnormal.productos (id, nombre, descripcion, categoria_id, alto_cm, ancho_cm, precio_venta, stock_actual, stock_minimo, activo, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (17, 'Sticker serigrafiado', 'Calcomanía resistente al agua impresa en serigrafía', 4, 10.00, 10.00, 15.00, 200, 50, true, '2026-04-01 14:42:57.558254', '2026-04-01 14:42:57.558254');
INSERT INTO bolsur_dbnormal.productos (id, nombre, descripcion, categoria_id, alto_cm, ancho_cm, precio_venta, stock_actual, stock_minimo, activo, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (19, 'Vinil textil personalizado', 'Corte e impresión en vinil textil para prendas', 6, 30.00, 25.00, 80.00, 60, 10, true, '2026-04-01 14:42:57.558254', '2026-04-01 14:42:57.558254');
INSERT INTO bolsur_dbnormal.productos (id, nombre, descripcion, categoria_id, alto_cm, ancho_cm, precio_venta, stock_actual, stock_minimo, activo, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (21, 'Tinta serigráfica negra', 'Tinta base agua color negro', 8, 0.00, 0.00, 150.00, 35, 10, true, '2026-04-01 14:42:57.558254', '2026-04-01 14:42:57.558254');
INSERT INTO bolsur_dbnormal.productos (id, nombre, descripcion, categoria_id, alto_cm, ancho_cm, precio_venta, stock_actual, stock_minimo, activo, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (18, 'Tarjetas de presentación', 'Tarjetas impresas con acabado serigráfico', 5, 9.00, 5.00, 120.00, 99, 20, true, '2026-04-01 14:42:57.558254', '2026-04-01 20:53:29.825315');
INSERT INTO bolsur_dbnormal.productos (id, nombre, descripcion, categoria_id, alto_cm, ancho_cm, precio_venta, stock_actual, stock_minimo, activo, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (22, 'Tinta serigráfica blanca', 'Tinta base agua color blanco', 8, 0.00, 0.00, 150.00, 33, 10, true, '2026-04-01 14:42:57.558254', '2026-04-02 12:08:25.736349');
INSERT INTO bolsur_dbnormal.productos (id, nombre, descripcion, categoria_id, alto_cm, ancho_cm, precio_venta, stock_actual, stock_minimo, activo, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (13, 'Playera premium estampada', 'Playera de alta calidad con estampado a 3 tintas', 1, 72.00, 52.00, 180.00, 22, 10, true, '2026-04-01 14:42:57.558254', '2026-04-09 14:12:00.119694');
INSERT INTO bolsur_dbnormal.productos (id, nombre, descripcion, categoria_id, alto_cm, ancho_cm, precio_venta, stock_actual, stock_minimo, activo, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (20, 'Marco para serigrafía', 'Marco de madera con malla para impresión serigráfica', 7, 50.00, 40.00, 250.00, 14, 5, false, '2026-04-01 14:42:57.558254', '2026-04-10 18:57:35.095877');
INSERT INTO bolsur_dbnormal.productos (id, nombre, descripcion, categoria_id, alto_cm, ancho_cm, precio_venta, stock_actual, stock_minimo, activo, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (23, 'Bolsa de Papel Kraft No. 8', 'Bolsa de papel resistente para panadería o regalos pequeños.', 1, 30.00, 12.00, 1.45, 23, 6, true, '2026-04-10 19:15:05.053654', '2026-04-10 19:15:05.053654');
INSERT INTO bolsur_dbnormal.productos (id, nombre, descripcion, categoria_id, alto_cm, ancho_cm, precio_venta, stock_actual, stock_minimo, activo, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (24, 'Bolsa de Papel Kraft No. 3', NULL, 1, 45.00, 43.00, 2.45, 2, 6, true, '2026-04-10 19:16:07.505597', '2026-04-11 01:56:28.568156');
INSERT INTO bolsur_dbnormal.productos (id, nombre, descripcion, categoria_id, alto_cm, ancho_cm, precio_venta, stock_actual, stock_minimo, activo, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (15, 'Bolsa ecológica estampada', 'Bolsa de tela reutilizable con impresión serigráfica', 2, 40.00, 35.00, 90.00, 36, 10, true, '2026-04-01 14:42:57.558254', '2026-04-11 07:24:12.416469');
INSERT INTO bolsur_dbnormal.productos (id, nombre, descripcion, categoria_id, alto_cm, ancho_cm, precio_venta, stock_actual, stock_minimo, activo, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (12, 'Playera básica estampada', 'Playera de algodón con estampado en serigrafía a una tinta', 1, 70.00, 50.00, 120.00, 44, 10, true, '2026-04-01 14:42:57.558254', '2026-04-11 07:24:26.828647');
INSERT INTO bolsur_dbnormal.productos (id, nombre, descripcion, categoria_id, alto_cm, ancho_cm, precio_venta, stock_actual, stock_minimo, activo, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (14, 'Sudadera con capucha', 'Sudadera con estampado frontal en serigrafía', 1, 75.00, 60.00, 350.00, 19, 5, true, '2026-04-01 14:42:57.558254', '2026-04-11 09:14:24.773966');


--
-- TOC entry 5228 (class 0 OID 16486)
-- Dependencies: 239
-- Data for Name: roles; Type: TABLE DATA; Schema: bolsur_dbnormal; Owner: postgres
--

INSERT INTO bolsur_dbnormal.roles (id, nombre, created_at) OVERRIDING SYSTEM VALUE VALUES (1, 'Administrador', '2026-03-30 20:45:26.22147');


--
-- TOC entry 5230 (class 0 OID 16493)
-- Dependencies: 241
-- Data for Name: servicio; Type: TABLE DATA; Schema: bolsur_dbnormal; Owner: postgres
--

INSERT INTO bolsur_dbnormal.servicio (id_servicio, nombre) VALUES (1, 'Serigrafía');
INSERT INTO bolsur_dbnormal.servicio (id_servicio, nombre) VALUES (2, 'Sublimación');
INSERT INTO bolsur_dbnormal.servicio (id_servicio, nombre) VALUES (3, 'DTF');
INSERT INTO bolsur_dbnormal.servicio (id_servicio, nombre) VALUES (4, 'Bordado');
INSERT INTO bolsur_dbnormal.servicio (id_servicio, nombre) VALUES (5, 'Vinil Textil');


--
-- TOC entry 5231 (class 0 OID 16500)
-- Dependencies: 242
-- Data for Name: telefonos_clientes; Type: TABLE DATA; Schema: bolsur_dbnormal; Owner: postgres
--

INSERT INTO bolsur_dbnormal.telefonos_clientes (id, cliente_id, telefono, created_at) OVERRIDING SYSTEM VALUE VALUES (2, 23, '52 951 976 5678', '2026-04-11 01:00:32.515338');
INSERT INTO bolsur_dbnormal.telefonos_clientes (id, cliente_id, telefono, created_at) OVERRIDING SYSTEM VALUE VALUES (1, 22, '52 951 756 5679', '2026-04-11 00:18:13.989638');
INSERT INTO bolsur_dbnormal.telefonos_clientes (id, cliente_id, telefono, created_at) OVERRIDING SYSTEM VALUE VALUES (3, 24, '52 951 876 5463', '2026-04-11 02:09:28.917802');


--
-- TOC entry 5237 (class 0 OID 24591)
-- Dependencies: 248
-- Data for Name: usuario_preferencias; Type: TABLE DATA; Schema: bolsur_dbnormal; Owner: postgres
--

INSERT INTO bolsur_dbnormal.usuario_preferencias (usuario_id, notif_pedidos_urgentes, notif_stock_bajo, notif_nuevos_pedidos, imprimir_automatico, enviar_correo_cliente) VALUES (6, false, true, true, true, true);
INSERT INTO bolsur_dbnormal.usuario_preferencias (usuario_id, notif_pedidos_urgentes, notif_stock_bajo, notif_nuevos_pedidos, imprimir_automatico, enviar_correo_cliente) VALUES (8, false, true, false, true, false);


--
-- TOC entry 5233 (class 0 OID 16508)
-- Dependencies: 244
-- Data for Name: usuarios; Type: TABLE DATA; Schema: bolsur_dbnormal; Owner: postgres
--

INSERT INTO bolsur_dbnormal.usuarios (id, nombre_completo, email, password_hash, rol_id, activo, ultimo_acceso, created_at, updated_at, empresa_id_empresa) OVERRIDING SYSTEM VALUE VALUES (6, 'Usuario de Prueba', 'test@bolsur.com', '$2b$10$Nhe4lq7vpGPM2j/px068yezSrBpJGUe7Xv/rCsjHCPKUlgmQm91L2', 1, true, NULL, '2026-03-30 20:46:11.621516', '2026-04-02 12:03:20.794241', 1);
INSERT INTO bolsur_dbnormal.usuarios (id, nombre_completo, email, password_hash, rol_id, activo, ultimo_acceso, created_at, updated_at, empresa_id_empresa) OVERRIDING SYSTEM VALUE VALUES (8, 'Monserrat Hernandez', 'admin@bolsur.com', '$2b$10$uzRh5pCfVPcpSRjKggG2G.jWZ7L5.ZneTc2Lhyzcqc0iEVS3ditbu', 1, true, NULL, '2026-04-01 12:41:44.650206', '2026-04-09 14:11:42.745642', 1);


--
-- TOC entry 5235 (class 0 OID 16521)
-- Dependencies: 246
-- Data for Name: ventas; Type: TABLE DATA; Schema: bolsur_dbnormal; Owner: postgres
--

INSERT INTO bolsur_dbnormal.ventas (id, numero_venta, cliente_id, usuario_id, fecha_venta, subtotal, total, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (7, 'TEST-MANUAL-01', 1, 8, '2026-04-01', 50.00, 50.00, '2026-04-01 20:20:29.892498', '2026-04-01 20:20:29.892498');
INSERT INTO bolsur_dbnormal.ventas (id, numero_venta, cliente_id, usuario_id, fecha_venta, subtotal, total, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (8, 'VNT-1775096771743', 1, 8, '2026-04-01', 120.00, 120.00, '2026-04-01 20:26:11.744661', '2026-04-01 20:26:11.744661');
INSERT INTO bolsur_dbnormal.ventas (id, numero_venta, cliente_id, usuario_id, fecha_venta, subtotal, total, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (9, 'VNT-1775097901763', 1, 8, '2026-04-01', 90.00, 90.00, '2026-04-01 20:45:01.762439', '2026-04-01 20:45:01.762439');
INSERT INTO bolsur_dbnormal.ventas (id, numero_venta, cliente_id, usuario_id, fecha_venta, subtotal, total, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (10, 'VNT-1775097954538', 1, 8, '2026-04-01', 180.00, 180.00, '2026-04-01 20:45:54.538007', '2026-04-01 20:45:54.538007');
INSERT INTO bolsur_dbnormal.ventas (id, numero_venta, cliente_id, usuario_id, fecha_venta, subtotal, total, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (11, 'VNT-1775098117797', 1, 8, '2026-04-01', 180.00, 180.00, '2026-04-01 20:48:37.797844', '2026-04-01 20:48:37.797844');
INSERT INTO bolsur_dbnormal.ventas (id, numero_venta, cliente_id, usuario_id, fecha_venta, subtotal, total, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (12, 'VNT-1775098409823', 1, 8, '2026-04-01', 120.00, 120.00, '2026-04-01 20:53:29.825315', '2026-04-01 20:53:29.825315');
INSERT INTO bolsur_dbnormal.ventas (id, numero_venta, cliente_id, usuario_id, fecha_venta, subtotal, total, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (13, 'VNT-1775098666023', 1, 8, '2026-04-01', 150.00, 150.00, '2026-04-01 20:57:46.023657', '2026-04-01 20:57:46.023657');
INSERT INTO bolsur_dbnormal.ventas (id, numero_venta, cliente_id, usuario_id, fecha_venta, subtotal, total, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (14, 'VNT-1775099055920', 1, 8, '2026-04-01', 120.00, 120.00, '2026-04-01 21:04:15.921478', '2026-04-01 21:04:15.921478');
INSERT INTO bolsur_dbnormal.ventas (id, numero_venta, cliente_id, usuario_id, fecha_venta, subtotal, total, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (15, 'VNT-1775099226726', 1, 8, '2026-04-01', 250.00, 250.00, '2026-04-01 21:07:06.727977', '2026-04-01 21:07:06.727977');
INSERT INTO bolsur_dbnormal.ventas (id, numero_venta, cliente_id, usuario_id, fecha_venta, subtotal, total, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (16, 'VNT-1775153305736', 1, 8, '2026-04-02', 150.00, 150.00, '2026-04-02 12:08:25.736349', '2026-04-02 12:08:25.736349');
INSERT INTO bolsur_dbnormal.ventas (id, numero_venta, cliente_id, usuario_id, fecha_venta, subtotal, total, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (17, 'VNT-1775153337677', 1, 8, '2026-04-02', 180.00, 180.00, '2026-04-02 12:08:57.677896', '2026-04-02 12:08:57.677896');
INSERT INTO bolsur_dbnormal.ventas (id, numero_venta, cliente_id, usuario_id, fecha_venta, subtotal, total, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (18, 'VNT-1775762321069', 1, 8, '2026-04-09', 120.00, 120.00, '2026-04-09 13:18:41.069674', '2026-04-09 13:18:41.069674');
INSERT INTO bolsur_dbnormal.ventas (id, numero_venta, cliente_id, usuario_id, fecha_venta, subtotal, total, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (19, 'VNT-1775762725485', 1, 8, '2026-04-09', 180.00, 180.00, '2026-04-09 13:25:25.485698', '2026-04-09 13:25:25.485698');
INSERT INTO bolsur_dbnormal.ventas (id, numero_venta, cliente_id, usuario_id, fecha_venta, subtotal, total, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (20, 'VNT-1775763341999', 2, 8, '2026-04-09', 180.00, 180.00, '2026-04-09 13:35:41.992303', '2026-04-09 13:35:41.992303');
INSERT INTO bolsur_dbnormal.ventas (id, numero_venta, cliente_id, usuario_id, fecha_venta, subtotal, total, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (21, 'VNT-1775763575808', 3, 8, '2026-04-09', 480.00, 480.00, '2026-04-09 13:39:35.807915', '2026-04-09 13:39:35.807915');
INSERT INTO bolsur_dbnormal.ventas (id, numero_venta, cliente_id, usuario_id, fecha_venta, subtotal, total, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (22, 'VNT-1775765495612', 4, 8, '2026-04-09', 180.00, 180.00, '2026-04-09 14:11:35.610553', '2026-04-09 14:11:35.610553');
INSERT INTO bolsur_dbnormal.ventas (id, numero_venta, cliente_id, usuario_id, fecha_venta, subtotal, total, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (23, 'VNT-1775765520124', 5, 8, '2026-04-09', 180.00, 180.00, '2026-04-09 14:12:00.119694', '2026-04-09 14:12:00.119694');
INSERT INTO bolsur_dbnormal.ventas (id, numero_venta, cliente_id, usuario_id, fecha_venta, subtotal, total, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (27, 'VNT-PED-18-9945', 23, 8, '2026-04-11', 0.00, 2.45, '2026-04-11 01:54:39.943746', '2026-04-11 01:54:39.943746');
INSERT INTO bolsur_dbnormal.ventas (id, numero_venta, cliente_id, usuario_id, fecha_venta, subtotal, total, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (28, 'VNT-PED-18-8567', 23, 8, '2026-04-11', 0.00, 2.45, '2026-04-11 01:56:28.568156', '2026-04-11 01:56:28.568156');
INSERT INTO bolsur_dbnormal.ventas (id, numero_venta, cliente_id, usuario_id, fecha_venta, subtotal, total, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (29, 'VNT-1775913852416', 1, 8, '2026-04-11', 0.00, 90.00, '2026-04-11 07:24:12.416469', '2026-04-11 07:24:12.416469');
INSERT INTO bolsur_dbnormal.ventas (id, numero_venta, cliente_id, usuario_id, fecha_venta, subtotal, total, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (30, 'VNT-1775913866828', 1, 8, '2026-04-11', 0.00, 120.00, '2026-04-11 07:24:26.828647', '2026-04-11 07:24:26.828647');
INSERT INTO bolsur_dbnormal.ventas (id, numero_venta, cliente_id, usuario_id, fecha_venta, subtotal, total, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (31, 'VNT-PED-19-4774', 24, 8, '2026-04-11', 0.00, 350.00, '2026-04-11 09:14:24.773966', '2026-04-11 09:14:24.773966');


--
-- TOC entry 5279 (class 0 OID 0)
-- Dependencies: 221
-- Name: categorias_id_seq; Type: SEQUENCE SET; Schema: bolsur_dbnormal; Owner: postgres
--

SELECT pg_catalog.setval('bolsur_dbnormal.categorias_id_seq', 8, true);


--
-- TOC entry 5280 (class 0 OID 0)
-- Dependencies: 223
-- Name: clientes_id_seq; Type: SEQUENCE SET; Schema: bolsur_dbnormal; Owner: postgres
--

SELECT pg_catalog.setval('bolsur_dbnormal.clientes_id_seq', 56, true);


--
-- TOC entry 5281 (class 0 OID 0)
-- Dependencies: 225
-- Name: detalle_pedidos_id_seq; Type: SEQUENCE SET; Schema: bolsur_dbnormal; Owner: postgres
--

SELECT pg_catalog.setval('bolsur_dbnormal.detalle_pedidos_id_seq', 55, true);


--
-- TOC entry 5282 (class 0 OID 0)
-- Dependencies: 227
-- Name: detalle_ventas_id_seq; Type: SEQUENCE SET; Schema: bolsur_dbnormal; Owner: postgres
--

SELECT pg_catalog.setval('bolsur_dbnormal.detalle_ventas_id_seq', 26, true);


--
-- TOC entry 5283 (class 0 OID 0)
-- Dependencies: 229
-- Name: emails_clientes_id_seq; Type: SEQUENCE SET; Schema: bolsur_dbnormal; Owner: postgres
--

SELECT pg_catalog.setval('bolsur_dbnormal.emails_clientes_id_seq', 1, false);


--
-- TOC entry 5284 (class 0 OID 0)
-- Dependencies: 232
-- Name: metodos_pago_id_seq; Type: SEQUENCE SET; Schema: bolsur_dbnormal; Owner: postgres
--

SELECT pg_catalog.setval('bolsur_dbnormal.metodos_pago_id_seq', 3, true);


--
-- TOC entry 5285 (class 0 OID 0)
-- Dependencies: 249
-- Name: notificaciones_id_seq; Type: SEQUENCE SET; Schema: bolsur_dbnormal; Owner: postgres
--

SELECT pg_catalog.setval('bolsur_dbnormal.notificaciones_id_seq', 3, true);


--
-- TOC entry 5286 (class 0 OID 0)
-- Dependencies: 234
-- Name: pagos_id_pago_seq; Type: SEQUENCE SET; Schema: bolsur_dbnormal; Owner: postgres
--

SELECT pg_catalog.setval('bolsur_dbnormal.pagos_id_pago_seq', 3, true);


--
-- TOC entry 5287 (class 0 OID 0)
-- Dependencies: 236
-- Name: pedidos_id_seq; Type: SEQUENCE SET; Schema: bolsur_dbnormal; Owner: postgres
--

SELECT pg_catalog.setval('bolsur_dbnormal.pedidos_id_seq', 51, true);


--
-- TOC entry 5288 (class 0 OID 0)
-- Dependencies: 238
-- Name: productos_id_seq; Type: SEQUENCE SET; Schema: bolsur_dbnormal; Owner: postgres
--

SELECT pg_catalog.setval('bolsur_dbnormal.productos_id_seq', 24, true);


--
-- TOC entry 5289 (class 0 OID 0)
-- Dependencies: 240
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: bolsur_dbnormal; Owner: postgres
--

SELECT pg_catalog.setval('bolsur_dbnormal.roles_id_seq', 1, true);


--
-- TOC entry 5290 (class 0 OID 0)
-- Dependencies: 243
-- Name: telefonos_clientes_id_seq; Type: SEQUENCE SET; Schema: bolsur_dbnormal; Owner: postgres
--

SELECT pg_catalog.setval('bolsur_dbnormal.telefonos_clientes_id_seq', 35, true);


--
-- TOC entry 5291 (class 0 OID 0)
-- Dependencies: 245
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: bolsur_dbnormal; Owner: postgres
--

SELECT pg_catalog.setval('bolsur_dbnormal.usuarios_id_seq', 8, true);


--
-- TOC entry 5292 (class 0 OID 0)
-- Dependencies: 247
-- Name: ventas_id_seq; Type: SEQUENCE SET; Schema: bolsur_dbnormal; Owner: postgres
--

SELECT pg_catalog.setval('bolsur_dbnormal.ventas_id_seq', 31, true);


--
-- TOC entry 4980 (class 2606 OID 16535)
-- Name: categorias categorias_nombre_key; Type: CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.categorias
    ADD CONSTRAINT categorias_nombre_key UNIQUE (nombre);


--
-- TOC entry 4982 (class 2606 OID 16537)
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);


--
-- TOC entry 4984 (class 2606 OID 16539)
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- TOC entry 4986 (class 2606 OID 16541)
-- Name: detalle_pedidos detalle_pedidos_pkey; Type: CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.detalle_pedidos
    ADD CONSTRAINT detalle_pedidos_pkey PRIMARY KEY (id);


--
-- TOC entry 4989 (class 2606 OID 16543)
-- Name: detalle_ventas detalle_ventas_pkey; Type: CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.detalle_ventas
    ADD CONSTRAINT detalle_ventas_pkey PRIMARY KEY (id);


--
-- TOC entry 4992 (class 2606 OID 16545)
-- Name: emails_clientes emails_clientes_cliente_id_email_key; Type: CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.emails_clientes
    ADD CONSTRAINT emails_clientes_cliente_id_email_key UNIQUE (cliente_id, email);


--
-- TOC entry 4994 (class 2606 OID 16547)
-- Name: emails_clientes emails_clientes_pkey; Type: CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.emails_clientes
    ADD CONSTRAINT emails_clientes_pkey PRIMARY KEY (id);


--
-- TOC entry 4996 (class 2606 OID 16549)
-- Name: empresa empresa_pkey; Type: CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.empresa
    ADD CONSTRAINT empresa_pkey PRIMARY KEY (id_empresa);


--
-- TOC entry 4998 (class 2606 OID 16551)
-- Name: metodos_pago metodos_pago_nombre_key; Type: CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.metodos_pago
    ADD CONSTRAINT metodos_pago_nombre_key UNIQUE (nombre);


--
-- TOC entry 5000 (class 2606 OID 16553)
-- Name: metodos_pago metodos_pago_pkey; Type: CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.metodos_pago
    ADD CONSTRAINT metodos_pago_pkey PRIMARY KEY (id);


--
-- TOC entry 5035 (class 2606 OID 40989)
-- Name: notificaciones notificaciones_pkey; Type: CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.notificaciones
    ADD CONSTRAINT notificaciones_pkey PRIMARY KEY (id);


--
-- TOC entry 5003 (class 2606 OID 16555)
-- Name: pagos pagos_pkey; Type: CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.pagos
    ADD CONSTRAINT pagos_pkey PRIMARY KEY (id_pago);


--
-- TOC entry 5007 (class 2606 OID 16557)
-- Name: pedidos pedidos_pkey; Type: CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.pedidos
    ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id);


--
-- TOC entry 5011 (class 2606 OID 16559)
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- TOC entry 5013 (class 2606 OID 16561)
-- Name: roles roles_nombre_key; Type: CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.roles
    ADD CONSTRAINT roles_nombre_key UNIQUE (nombre);


--
-- TOC entry 5015 (class 2606 OID 16563)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 5017 (class 2606 OID 16565)
-- Name: servicio servicio_pkey; Type: CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.servicio
    ADD CONSTRAINT servicio_pkey PRIMARY KEY (id_servicio);


--
-- TOC entry 5019 (class 2606 OID 16567)
-- Name: telefonos_clientes telefonos_clientes_cliente_id_telefono_key; Type: CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.telefonos_clientes
    ADD CONSTRAINT telefonos_clientes_cliente_id_telefono_key UNIQUE (cliente_id, telefono);


--
-- TOC entry 5021 (class 2606 OID 16569)
-- Name: telefonos_clientes telefonos_clientes_pkey; Type: CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.telefonos_clientes
    ADD CONSTRAINT telefonos_clientes_pkey PRIMARY KEY (id);


--
-- TOC entry 5033 (class 2606 OID 24601)
-- Name: usuario_preferencias usuario_preferencias_pkey; Type: CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.usuario_preferencias
    ADD CONSTRAINT usuario_preferencias_pkey PRIMARY KEY (usuario_id);


--
-- TOC entry 5024 (class 2606 OID 16571)
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- TOC entry 5026 (class 2606 OID 16573)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 5029 (class 2606 OID 16575)
-- Name: ventas ventas_numero_venta_key; Type: CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.ventas
    ADD CONSTRAINT ventas_numero_venta_key UNIQUE (numero_venta);


--
-- TOC entry 5031 (class 2606 OID 16577)
-- Name: ventas ventas_pkey; Type: CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.ventas
    ADD CONSTRAINT ventas_pkey PRIMARY KEY (id);


--
-- TOC entry 4987 (class 1259 OID 16578)
-- Name: idx_detalle_pedido; Type: INDEX; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE INDEX idx_detalle_pedido ON bolsur_dbnormal.detalle_pedidos USING btree (pedido_id);


--
-- TOC entry 4990 (class 1259 OID 16579)
-- Name: idx_detalle_venta; Type: INDEX; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE INDEX idx_detalle_venta ON bolsur_dbnormal.detalle_ventas USING btree (venta_id);


--
-- TOC entry 5001 (class 1259 OID 16580)
-- Name: idx_pago_fecha; Type: INDEX; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE INDEX idx_pago_fecha ON bolsur_dbnormal.pagos USING btree (fecha_pago);


--
-- TOC entry 5004 (class 1259 OID 16581)
-- Name: idx_pedido_cliente; Type: INDEX; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE INDEX idx_pedido_cliente ON bolsur_dbnormal.pedidos USING btree (cliente_id);


--
-- TOC entry 5005 (class 1259 OID 16582)
-- Name: idx_pedido_fecha; Type: INDEX; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE INDEX idx_pedido_fecha ON bolsur_dbnormal.pedidos USING btree (fecha_pedido);


--
-- TOC entry 5008 (class 1259 OID 16583)
-- Name: idx_producto_categoria; Type: INDEX; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE INDEX idx_producto_categoria ON bolsur_dbnormal.productos USING btree (categoria_id);


--
-- TOC entry 5009 (class 1259 OID 16584)
-- Name: idx_producto_stock; Type: INDEX; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE INDEX idx_producto_stock ON bolsur_dbnormal.productos USING btree (stock_actual);


--
-- TOC entry 5022 (class 1259 OID 16585)
-- Name: idx_usuario_rol; Type: INDEX; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE INDEX idx_usuario_rol ON bolsur_dbnormal.usuarios USING btree (rol_id);


--
-- TOC entry 5027 (class 1259 OID 16586)
-- Name: idx_venta_fecha; Type: INDEX; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE INDEX idx_venta_fecha ON bolsur_dbnormal.ventas USING btree (fecha_venta);


--
-- TOC entry 5059 (class 2620 OID 24590)
-- Name: usuarios tr_despues_de_crear_usuario; Type: TRIGGER; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE TRIGGER tr_despues_de_crear_usuario AFTER INSERT ON bolsur_dbnormal.usuarios FOR EACH ROW EXECUTE FUNCTION bolsur_dbnormal.crear_preferencias_automaticas();


--
-- TOC entry 5057 (class 2620 OID 16587)
-- Name: pedidos trg_pedidos_updated; Type: TRIGGER; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE TRIGGER trg_pedidos_updated BEFORE UPDATE ON bolsur_dbnormal.pedidos FOR EACH ROW EXECUTE FUNCTION bolsur_dbnormal.set_updated_at();


--
-- TOC entry 5058 (class 2620 OID 16588)
-- Name: productos trg_productos_updated; Type: TRIGGER; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE TRIGGER trg_productos_updated BEFORE UPDATE ON bolsur_dbnormal.productos FOR EACH ROW EXECUTE FUNCTION bolsur_dbnormal.set_updated_at();


--
-- TOC entry 5060 (class 2620 OID 16589)
-- Name: usuarios trg_usuarios_updated; Type: TRIGGER; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE TRIGGER trg_usuarios_updated BEFORE UPDATE ON bolsur_dbnormal.usuarios FOR EACH ROW EXECUTE FUNCTION bolsur_dbnormal.set_updated_at();


--
-- TOC entry 5061 (class 2620 OID 16590)
-- Name: ventas trg_ventas_updated; Type: TRIGGER; Schema: bolsur_dbnormal; Owner: postgres
--

CREATE TRIGGER trg_ventas_updated BEFORE UPDATE ON bolsur_dbnormal.ventas FOR EACH ROW EXECUTE FUNCTION bolsur_dbnormal.set_updated_at();


--
-- TOC entry 5036 (class 2606 OID 16591)
-- Name: detalle_pedidos detalle_pedidos_pedido_id_fkey; Type: FK CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.detalle_pedidos
    ADD CONSTRAINT detalle_pedidos_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES bolsur_dbnormal.pedidos(id) ON DELETE CASCADE;


--
-- TOC entry 5037 (class 2606 OID 16596)
-- Name: detalle_pedidos detalle_pedidos_producto_id_fkey; Type: FK CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.detalle_pedidos
    ADD CONSTRAINT detalle_pedidos_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES bolsur_dbnormal.productos(id);


--
-- TOC entry 5039 (class 2606 OID 16601)
-- Name: detalle_ventas detalle_ventas_producto_id_fkey; Type: FK CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.detalle_ventas
    ADD CONSTRAINT detalle_ventas_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES bolsur_dbnormal.productos(id);


--
-- TOC entry 5040 (class 2606 OID 16606)
-- Name: detalle_ventas detalle_ventas_servicio_id_fkey; Type: FK CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.detalle_ventas
    ADD CONSTRAINT detalle_ventas_servicio_id_fkey FOREIGN KEY (id_servicio) REFERENCES bolsur_dbnormal.servicio(id_servicio) NOT VALID;


--
-- TOC entry 5041 (class 2606 OID 16611)
-- Name: detalle_ventas detalle_ventas_venta_id_fkey; Type: FK CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.detalle_ventas
    ADD CONSTRAINT detalle_ventas_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES bolsur_dbnormal.ventas(id) ON DELETE CASCADE;


--
-- TOC entry 5042 (class 2606 OID 16616)
-- Name: emails_clientes emails_clientes_cliente_id_fkey; Type: FK CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.emails_clientes
    ADD CONSTRAINT emails_clientes_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES bolsur_dbnormal.clientes(id) ON DELETE CASCADE;


--
-- TOC entry 5055 (class 2606 OID 24602)
-- Name: usuario_preferencias fk_usuario_preferencias; Type: FK CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.usuario_preferencias
    ADD CONSTRAINT fk_usuario_preferencias FOREIGN KEY (usuario_id) REFERENCES bolsur_dbnormal.usuarios(id) ON DELETE CASCADE;


--
-- TOC entry 5056 (class 2606 OID 40990)
-- Name: notificaciones notificaciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.notificaciones
    ADD CONSTRAINT notificaciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES bolsur_dbnormal.usuarios(id);


--
-- TOC entry 5043 (class 2606 OID 16621)
-- Name: pagos pagos_metodo_pago_id_fkey; Type: FK CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.pagos
    ADD CONSTRAINT pagos_metodo_pago_id_fkey FOREIGN KEY (metodo_pago_id) REFERENCES bolsur_dbnormal.metodos_pago(id);


--
-- TOC entry 5044 (class 2606 OID 16626)
-- Name: pagos pagos_pedido_id_fkey; Type: FK CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.pagos
    ADD CONSTRAINT pagos_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES bolsur_dbnormal.pedidos(id);


--
-- TOC entry 5045 (class 2606 OID 16631)
-- Name: pagos pagos_usuario_registra_id_fkey; Type: FK CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.pagos
    ADD CONSTRAINT pagos_usuario_registra_id_fkey FOREIGN KEY (usuario_registra_id) REFERENCES bolsur_dbnormal.usuarios(id);


--
-- TOC entry 5046 (class 2606 OID 16636)
-- Name: pagos pagos_venta_id_fkey; Type: FK CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.pagos
    ADD CONSTRAINT pagos_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES bolsur_dbnormal.ventas(id);


--
-- TOC entry 5047 (class 2606 OID 16641)
-- Name: pedidos pedidos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.pedidos
    ADD CONSTRAINT pedidos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES bolsur_dbnormal.clientes(id);


--
-- TOC entry 5048 (class 2606 OID 16646)
-- Name: pedidos pedidos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.pedidos
    ADD CONSTRAINT pedidos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES bolsur_dbnormal.usuarios(id);


--
-- TOC entry 5049 (class 2606 OID 16651)
-- Name: productos productos_categoria_id_fkey; Type: FK CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.productos
    ADD CONSTRAINT productos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES bolsur_dbnormal.categorias(id);


--
-- TOC entry 5038 (class 2606 OID 16656)
-- Name: detalle_pedidos servicios_del_producto_id_fkey; Type: FK CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.detalle_pedidos
    ADD CONSTRAINT servicios_del_producto_id_fkey FOREIGN KEY (id_servicio) REFERENCES bolsur_dbnormal.servicio(id_servicio) NOT VALID;


--
-- TOC entry 5050 (class 2606 OID 16661)
-- Name: telefonos_clientes telefonos_clientes_cliente_id_fkey; Type: FK CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.telefonos_clientes
    ADD CONSTRAINT telefonos_clientes_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES bolsur_dbnormal.clientes(id) ON DELETE CASCADE;


--
-- TOC entry 5051 (class 2606 OID 16666)
-- Name: usuarios usuarios_empresa_id_empresa_fkey; Type: FK CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.usuarios
    ADD CONSTRAINT usuarios_empresa_id_empresa_fkey FOREIGN KEY (empresa_id_empresa) REFERENCES bolsur_dbnormal.empresa(id_empresa);


--
-- TOC entry 5052 (class 2606 OID 16671)
-- Name: usuarios usuarios_rol_id_fkey; Type: FK CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.usuarios
    ADD CONSTRAINT usuarios_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES bolsur_dbnormal.roles(id);


--
-- TOC entry 5053 (class 2606 OID 16676)
-- Name: ventas ventas_cliente_id_fkey; Type: FK CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.ventas
    ADD CONSTRAINT ventas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES bolsur_dbnormal.clientes(id);


--
-- TOC entry 5054 (class 2606 OID 16681)
-- Name: ventas ventas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER TABLE ONLY bolsur_dbnormal.ventas
    ADD CONSTRAINT ventas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES bolsur_dbnormal.usuarios(id);


--
-- TOC entry 5245 (class 0 OID 0)
-- Dependencies: 6
-- Name: SCHEMA bolsur_dbnormal; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA bolsur_dbnormal TO bolsur_user;


--
-- TOC entry 5246 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO bolsur_user;


--
-- TOC entry 5247 (class 0 OID 0)
-- Dependencies: 220
-- Name: TABLE categorias; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON TABLE bolsur_dbnormal.categorias TO bolsur_user;


--
-- TOC entry 5248 (class 0 OID 0)
-- Dependencies: 221
-- Name: SEQUENCE categorias_id_seq; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON SEQUENCE bolsur_dbnormal.categorias_id_seq TO bolsur_user;


--
-- TOC entry 5249 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE clientes; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON TABLE bolsur_dbnormal.clientes TO bolsur_user;


--
-- TOC entry 5250 (class 0 OID 0)
-- Dependencies: 223
-- Name: SEQUENCE clientes_id_seq; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON SEQUENCE bolsur_dbnormal.clientes_id_seq TO bolsur_user;


--
-- TOC entry 5251 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE detalle_pedidos; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON TABLE bolsur_dbnormal.detalle_pedidos TO bolsur_user;


--
-- TOC entry 5252 (class 0 OID 0)
-- Dependencies: 225
-- Name: SEQUENCE detalle_pedidos_id_seq; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON SEQUENCE bolsur_dbnormal.detalle_pedidos_id_seq TO bolsur_user;


--
-- TOC entry 5253 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE detalle_ventas; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON TABLE bolsur_dbnormal.detalle_ventas TO bolsur_user;


--
-- TOC entry 5254 (class 0 OID 0)
-- Dependencies: 227
-- Name: SEQUENCE detalle_ventas_id_seq; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON SEQUENCE bolsur_dbnormal.detalle_ventas_id_seq TO bolsur_user;


--
-- TOC entry 5255 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE emails_clientes; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON TABLE bolsur_dbnormal.emails_clientes TO bolsur_user;


--
-- TOC entry 5256 (class 0 OID 0)
-- Dependencies: 229
-- Name: SEQUENCE emails_clientes_id_seq; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON SEQUENCE bolsur_dbnormal.emails_clientes_id_seq TO bolsur_user;


--
-- TOC entry 5257 (class 0 OID 0)
-- Dependencies: 230
-- Name: TABLE empresa; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON TABLE bolsur_dbnormal.empresa TO bolsur_user;


--
-- TOC entry 5258 (class 0 OID 0)
-- Dependencies: 231
-- Name: TABLE metodos_pago; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON TABLE bolsur_dbnormal.metodos_pago TO bolsur_user;


--
-- TOC entry 5259 (class 0 OID 0)
-- Dependencies: 232
-- Name: SEQUENCE metodos_pago_id_seq; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON SEQUENCE bolsur_dbnormal.metodos_pago_id_seq TO bolsur_user;


--
-- TOC entry 5260 (class 0 OID 0)
-- Dependencies: 250
-- Name: TABLE notificaciones; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON TABLE bolsur_dbnormal.notificaciones TO bolsur_user;


--
-- TOC entry 5262 (class 0 OID 0)
-- Dependencies: 249
-- Name: SEQUENCE notificaciones_id_seq; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON SEQUENCE bolsur_dbnormal.notificaciones_id_seq TO bolsur_user;


--
-- TOC entry 5263 (class 0 OID 0)
-- Dependencies: 233
-- Name: TABLE pagos; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON TABLE bolsur_dbnormal.pagos TO bolsur_user;


--
-- TOC entry 5264 (class 0 OID 0)
-- Dependencies: 234
-- Name: SEQUENCE pagos_id_pago_seq; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON SEQUENCE bolsur_dbnormal.pagos_id_pago_seq TO bolsur_user;


--
-- TOC entry 5265 (class 0 OID 0)
-- Dependencies: 235
-- Name: TABLE pedidos; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON TABLE bolsur_dbnormal.pedidos TO bolsur_user;


--
-- TOC entry 5266 (class 0 OID 0)
-- Dependencies: 236
-- Name: SEQUENCE pedidos_id_seq; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON SEQUENCE bolsur_dbnormal.pedidos_id_seq TO bolsur_user;


--
-- TOC entry 5267 (class 0 OID 0)
-- Dependencies: 237
-- Name: TABLE productos; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON TABLE bolsur_dbnormal.productos TO bolsur_user;


--
-- TOC entry 5268 (class 0 OID 0)
-- Dependencies: 238
-- Name: SEQUENCE productos_id_seq; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON SEQUENCE bolsur_dbnormal.productos_id_seq TO bolsur_user;


--
-- TOC entry 5269 (class 0 OID 0)
-- Dependencies: 239
-- Name: TABLE roles; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON TABLE bolsur_dbnormal.roles TO bolsur_user;


--
-- TOC entry 5270 (class 0 OID 0)
-- Dependencies: 240
-- Name: SEQUENCE roles_id_seq; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON SEQUENCE bolsur_dbnormal.roles_id_seq TO bolsur_user;


--
-- TOC entry 5271 (class 0 OID 0)
-- Dependencies: 241
-- Name: TABLE servicio; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON TABLE bolsur_dbnormal.servicio TO bolsur_user;


--
-- TOC entry 5272 (class 0 OID 0)
-- Dependencies: 242
-- Name: TABLE telefonos_clientes; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON TABLE bolsur_dbnormal.telefonos_clientes TO bolsur_user;


--
-- TOC entry 5273 (class 0 OID 0)
-- Dependencies: 243
-- Name: SEQUENCE telefonos_clientes_id_seq; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON SEQUENCE bolsur_dbnormal.telefonos_clientes_id_seq TO bolsur_user;


--
-- TOC entry 5274 (class 0 OID 0)
-- Dependencies: 248
-- Name: TABLE usuario_preferencias; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON TABLE bolsur_dbnormal.usuario_preferencias TO bolsur_user;


--
-- TOC entry 5275 (class 0 OID 0)
-- Dependencies: 244
-- Name: TABLE usuarios; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON TABLE bolsur_dbnormal.usuarios TO bolsur_user;


--
-- TOC entry 5276 (class 0 OID 0)
-- Dependencies: 245
-- Name: SEQUENCE usuarios_id_seq; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON SEQUENCE bolsur_dbnormal.usuarios_id_seq TO bolsur_user;


--
-- TOC entry 5277 (class 0 OID 0)
-- Dependencies: 246
-- Name: TABLE ventas; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON TABLE bolsur_dbnormal.ventas TO bolsur_user;


--
-- TOC entry 5278 (class 0 OID 0)
-- Dependencies: 247
-- Name: SEQUENCE ventas_id_seq; Type: ACL; Schema: bolsur_dbnormal; Owner: postgres
--

GRANT ALL ON SEQUENCE bolsur_dbnormal.ventas_id_seq TO bolsur_user;


--
-- TOC entry 2133 (class 826 OID 16688)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: bolsur_dbnormal; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA bolsur_dbnormal GRANT ALL ON TABLES TO bolsur_user;


--
-- TOC entry 2132 (class 826 OID 16689)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO bolsur_user;


-- Completed on 2026-04-12 12:20:31

--
-- PostgreSQL database dump complete
--

