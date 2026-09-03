# F1-B — Identidad administrativa de infraestructura

## Estado

Documento de identidad administrativa de infraestructura para `ecommerce-native`.

Esta fase no implementa identidad funcional de usuarios, autenticación, sesiones, MFA, TOTP, códigos de recuperación ni permisos de aplicación. La obligación futura de MFA definida por la especificación funcional canónica `0.15.5` permanece íntegramente vigente y fuera del alcance de F1-B.

## Baseline verificada

- Repositorio: `Valethya/Ecommerce-native`
- Rama base: `master`
- Baseline F1-A: `232b329764c3b142e1c1a5d87ba3bf75ecbc7154`
- PR F1-A: `#1`, merged
- HEAD F1-A revisado: `8ec99748739bdf83d7e075136827d09a1bf6a682`
- Especificación canónica: `docs/spec/ecommerce-native-0.15.5.md`
- Versión funcional: `0.15.5`
- SHA-256 registrado: `cb2d7d232acca4f6ea0c7b61f256ae4f3e79677cfc40a9a8efd418d0dc619d21`

## Instalación

- Identificador lógico de la instalación: `ecommerce-native`
- Modelo: una instalación corresponde a una tienda.
- Persistencia seleccionada: MongoDB.
- Proveedor administrado seleccionado: MongoDB Atlas.
- No se adopta Supabase para esta instalación.

## MongoDB

### Recurso verificado en repositorio

La baseline F1-A ya define MongoDB como frontera de persistencia y mantiene una instancia técnica reproducible para desarrollo y CI:

- Motor: MongoDB
- Imagen fijada: `mongo:8.3.8`
- Servicio local: `mongo`
- Binding local: `127.0.0.1:27017`
- Volumen Docker: `ecommerce_native_mongo`
- Archivo de evidencia: `docker-compose.yml`
- Estado: verificado en `master`.

Este recurso local/CI no constituye por sí solo una identidad de proveedor administrado externo.

### MongoDB Atlas — proyecto administrativo

El 2026-09-03 se creó y verificó visualmente en MongoDB Atlas un proyecto separado destinado exclusivamente a esta instalación.

- Nombre lógico/intencionado del proyecto: `ecommerce-native`
- Project ID: `6a9998cc0e040463c79da23b`
- Organización: organización personal existente de la propietaria; el nombre aparece truncado en la evidencia disponible.
- Organization ID: pendiente de verificación.
- Clústeres: ninguno creado para este proyecto durante F1-B.
- Estado del proyecto: creado y accesible.
- Estado de infraestructura de datos: no aprovisionada; F1-B no crea clúster, esquema, tablas/colecciones, usuarios de base de datos ni configuración de red.

La evidencia aportada muestra la pantalla de configuración del proyecto Atlas con el Project ID anterior y la pantalla general del proyecto sin clúster creado. La interfaz del navegador puede presentar traducción automática del nombre visible; el identificador administrativo estable usado para desambiguación es el Project ID.

No se registra ninguna connection string, password, API key, token ni secreto reutilizable.

## Vercel

El equipo accesible fue consultado directamente mediante la integración autenticada de Vercel.

- Organización/equipo: `valethya's projects`
- Slug: `valethyas-projects`
- Team ID: `team_fiyhwpzFrNb9uSSdgedrTloA`
- Plan observado: `hobby`
- Estado: verificado.

No se creó proyecto, deployment, dominio, variable de entorno ni configuración de runtime en Vercel como parte de F1-B.

## Relación administrativa

La relación documentada es:

`ecommerce-native` → MongoDB Atlas project `6a9998cc0e040463c79da23b` → administración web futura bajo el equipo Vercel `team_fiyhwpzFrNb9uSSdgedrTloA` cuando una superficie desplegable sea autorizada en una fase posterior.

F1-B no autoriza despliegues ni convierte Vercel en autoridad de datos. MongoDB permanece como frontera de persistencia establecida por F1-A.

## Evidencia de verificación

### GitHub

Se verificaron en GitHub:

- PR #2 abierto y en Draft;
- rama `agent/f1-b-administrative-identity`;
- base `master`;
- baseline `232b329764c3b142e1c1a5d87ba3bf75ecbc7154`;
- PR #1 merged;
- `docker-compose.yml` con MongoDB 8.3.8.

### Vercel

La integración autenticada de Vercel devolvió exactamente un equipo accesible:

- `valethya's projects`
- `valethyas-projects`
- `team_fiyhwpzFrNb9uSSdgedrTloA`

### MongoDB Atlas

Evidencia visual verificada el 2026-09-03:

- proyecto Atlas separado para `ecommerce-native`;
- Project ID `6a9998cc0e040463c79da23b`;
- proyecto sin clúster creado;
- Organization ID todavía no visible en la evidencia recibida.

## Seguridad documental

Este documento contiene únicamente referencias administrativas no secretas.

No contiene:

- passwords;
- tokens;
- API keys privadas;
- service-role keys;
- access tokens;
- refresh tokens;
- cookies;
- secretos OAuth;
- connection strings autenticadas;
- variables de entorno sensibles;
- credenciales reutilizables.

## Límites de F1-B

F1-B no modifica ni implementa:

- autenticación;
- sesiones;
- Supabase Auth;
- MFA o TOTP;
- recuperación de acceso;
- permisos funcionales;
- API;
- modelos;
- rutas;
- middleware;
- frontend;
- catálogo;
- inventario comercial;
- checkout;
- pedidos;
- pagos;
- CI;
- dependencias;
- producción.

La especificación `docs/spec/ecommerce-native-0.15.5.md` no se modifica.

## Estado de cierre

La identidad del proyecto MongoDB Atlas y la identidad del equipo Vercel están verificadas y documentadas.

Permanece pendiente únicamente el Organization ID de MongoDB Atlas para completar la identificación administrativa de la organización sin ambigüedad. Hasta registrar ese identificador, F1-B no debe considerarse completamente cerrada.
