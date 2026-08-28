# Ecommerce Native — Especificación funcional 0.15.5

**Estado:** Congelada  
**Versión funcional:** `0.15.5`  
**Fecha efectiva:** 28 de agosto de 2026  
**Planificación técnica:** Autorizada  
**Implementación de código:** No iniciada por el hito de congelación

Este directorio contiene el **snapshot funcional canónico dentro del repositorio** para `ecommerce-native`.

La especificación se conserva por módulos para que GitHub, CI y futuras revisiones puedan consultar las reglas sin depender de archivos externos o del historial de una conversación. Los archivos de este directorio, leídos en conjunto y en orden, constituyen la especificación funcional congelada `0.15.5` para fines de implementación.

## Autoridad documental

1. Las reglas funcionales de estos archivos son vinculantes para la implementación.
2. `docs/spec/0.15.5-freeze.md` registra el hito de congelación y el control de cambios; no sustituye esta especificación.
3. Una decisión técnica puede resolverse durante la implementación siempre que no cambie comportamiento funcional, autoridades, invariantes, estados, permisos o exclusiones aquí definidos.
4. Todo cambio funcional posterior debe reabrir explícitamente la especificación, indicar qué regla reemplaza y crear una nueva versión funcional.
5. No se crea `0.15.6` únicamente por haber incorporado este snapshot al repositorio.

## Índice normativo

| Archivo | Secciones |
| --- | --- |
| [`00-09-foundation-shopping.md`](./00-09-foundation-shopping.md) | 0–9: propósito, producto, alcance, configuración, carrito, checkout y reservas |
| [`10-13-payments-orders-aftersales.md`](./10-13-payments-orders-aftersales.md) | 10–13: transferencia, pasarela, pedidos, cancelaciones, reembolsos y devoluciones |
| [`14-17-commerce-operations.md`](./14-17-commerce-operations.md) | 14–17: catálogo, inventario, descuentos, despacho y retiro |
| [`18-20-administration-and-evidence.md`](./18-20-administration-and-evidence.md) | 18–20: panel administrativo, notificaciones y auditoría |
| [`21-22-freeze-and-changelog.md`](./21-22-freeze-and-changelog.md) | 21–22: cierre, decisiones restantes y registro de cambios |

## Principio rector

> Construir sólo lo necesario para la operación actual, dejando límites claros que permitan crecer o reemplazar componentes sin rehacer el sistema.

## Regla transversal de retención pendiente

Mientras una instalación no tenga aprobada su política de conservación comercial aplicable, **no se implementará ni ejecutará purga automática de pedidos, pagos, reservas o movimientos comerciales**. El vencimiento de eventos de auditoría no autoriza la eliminación de esos registros.

## Integridad del snapshot

La incorporación de este directorio es un cambio de gobernanza y reproducibilidad documental. **No modifica ninguna regla comercial de la versión 0.15.5**, ni autoriza funcionalidades nuevas.