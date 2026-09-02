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
- Estado: verificado en `master` el 2026-09-02.

Este recurso local/CI no constituye por sí solo una identidad de proveedor administrado de producción.

### Recurso administrado externo

No se verificó ni creó un proyecto MongoDB Atlas u otro recurso MongoDB administrado externo durante F1-B.

Motivo: no existe en esta ejecución un conector autenticado de MongoDB Atlas que permita consultar de forma confiable una organización/proyecto existente, y crear infraestructura externa sin poder verificar previamente duplicados o correspondencia inequívoca violaría el alcance conservador de la fase.

Estado: **pendiente de verificación administrativa externa**.

Cuando se habilite acceso autenticado al proveedor elegido, este documento deberá registrar exclusivamente identificadores no secretos suficientes para distinguir el recurso, por ejemplo organización/proyecto/cluster según corresponda. No se incorporarán connection strings con credenciales, passwords, API keys, tokens ni secretos reutilizables.

## Vercel

El equipo accesible fue consultado directamente mediante la integración autenticada de Vercel el 2026-09-02.

- Organización/equipo: `valethya's projects`
- Slug: `valethyas-projects`
- Team ID: `team_fiyhwpzFrNb9uSSdgedrTloA`
- Plan observado: `hobby`
- Estado: verificado.

No se creó proyecto, deployment, dominio, variable de entorno ni configuración de runtime en Vercel como parte de F1-B.

## Relación administrativa

La relación prevista y actualmente documentada es:

`ecommerce-native` → persistencia MongoDB → administración web futura bajo el equipo Vercel `team_fiyhwpzFrNb9uSSdgedrTloA` cuando una superficie desplegable sea autorizada en una fase posterior.

F1-B no autoriza despliegues ni convierte Vercel en autoridad de datos. MongoDB permanece como frontera de persistencia establecida por F1-A.

La identidad de un recurso MongoDB administrado externo todavía no puede vincularse de forma inequívoca porque dicho recurso no fue verificable con los accesos disponibles durante esta fase.

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

### MongoDB administrado

No existe evidencia autenticada suficiente en esta ejecución para registrar un project ID de Atlas u otro identificador externo equivalente sin inventarlo. Por ese motivo no se registra ninguno.

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

La identidad administrativa de Vercel y la selección de MongoDB están verificadas y documentadas.

La identidad de un recurso MongoDB administrado externo permanece pendiente. Por lo tanto, F1-B no debe considerarse completamente cerrada hasta verificar o crear de manera explícitamente autorizada el recurso MongoDB externo que corresponda, evitando duplicados y sin introducir secretos en el repositorio.
