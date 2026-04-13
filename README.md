# Bolsur - Sistema de Gestión 📈

Este repositorio contiene el código fuente para el sistema Bolsur, dividido en un cliente (Frontend) y una API (Backend).

## 🚀 Estructura del Proyecto

El proyecto se organiza en las siguientes carpetas:
- **/frontend**: Aplicación cliente desarrollada con React + Vite.
- **/backend**: API REST desarrollada con Node.js + Express.
- **/db**: Scripts de inicialización y respaldos de la base de datos.

---

## 🛠️ Requisitos Previos

Asegúrate de tener instalado:
- **Node.js**: Versión 22 LTS (Recomendada).
- **PostgreSQL**: Versión 16 o superior.
- **Git**: Para la gestión de versiones.

---

## 🗄️ Configuración de la Base de Datos

El script de la base de datos se encuentra en `db/bolsur_db.sql`. Para levantar el entorno:

1. **Crear la DB**: En pgAdmin o psql, crea una base de datos llamada `bolsur_dbnormal`.
2. **Importar el Script**: 
   - Ubica el archivo en `db/bolsur_db.sql`.
   - Abre el **Query Tool** en la base de datos creada.
   - Copia y pega el contenido del archivo o arrástralo a la herramienta.
   - Presiona **F5** para ejecutar.
3. **Resultado**: El script crea automáticamente el rol `bolsur_user` (clave: `admin123`), genera las tablas y carga los datos de prueba.

---

## 🔧 Instalación y Configuración

Antes de correr el proyecto por primera vez, debes instalar las dependencias en ambos directorios.

### 1. Instalación de Módulos
Abre dos terminales y ejecuta:

**En el Backend:**
```bash
cd backend
npm ci
```

**En el Frontend:**
```bash
cd frontend
npm ci
```

### 2. Variables de Entorno (.env)
Los archivos `.env` ya están incluidos en este repositorio para facilitar el testeo. Verifica que los datos de conexión coincidan con tu instancia local de PostgreSQL.

---

## 🏃 Cómo Ejecutar el Proyecto

Una vez instalados los módulos, inicia los servicios en terminales independientes:

### Backend (API)
```bash
cd backend
npm run dev
```
*El servidor correrá en `http://localhost:4000`*

### Frontend (Interfaz)
```bash
cd frontend
npm run dev
```

---

## 🔑 Accesos de Prueba (Login)

Utiliza estas credenciales precargadas para explorar el sistema:

| Usuario | Contraseña | Rol |
| :--- | :--- | :--- |
| `admin@bolsur.com` | `123456` | Administrador |
| `test@bolsur.com` | `123456` | Usuario de prueba |

---

## 🛠️ Herramientas Adicionales

### Crear nuevos usuarios
Si necesitas registrar un usuario con contraseña encriptada usa el script de utilidad en el backend:
1. Edita los datos en `backend/createUser.js`.
2. Ejecuta: `node createUser.js`.
