# Ecommerce Native — reconstrucción auxiliar 0.15.5

> **DOCUMENTO AUXILIAR / NO NORMATIVO — no sustituye `docs/spec/ecommerce-native-0.15.5.md`.**

**Versión de referencia:** `0.15.5`  
**Fecha de la versión funcional:** 28 de agosto de 2026  
**Estado de este directorio:** Auxiliar / no normativo

Este directorio contiene una reconstrucción modular realizada durante F1-A. La segunda revisión adversarial comprobó divergencias respecto del documento original `ECOMMERCE_NATIVE_ESPECIFICACION_VIVA.md`, por lo que estos archivos **no constituyen la fuente de verdad funcional** y no deben utilizarse para sustituir, completar ni reconstruir la especificación congelada.

La única copia normativa permitida dentro del repositorio será una copia literal del documento original 0.15.5 en:

`docs/spec/ecommerce-native-0.15.5.md`

Hasta que esa copia literal pueda incorporarse con identidad documental verificable, el documento original 0.15.5 sigue siendo la referencia funcional y este directorio se conserva únicamente como material auxiliar para trazabilidad de F1-A.

## Índice auxiliar

| Archivo | Contenido aproximado |
| --- | --- |
| [`00-09-foundation-shopping.md`](./00-09-foundation-shopping.md) | 0–9: propósito, producto, alcance, configuración, carrito, checkout y reservas |
| [`10-13-payments-orders-aftersales.md`](./10-13-payments-orders-aftersales.md) | 10–13: transferencia, pasarela, pedidos, cancelaciones, reembolsos y devoluciones |
| [`14-17-commerce-operations.md`](./14-17-commerce-operations.md) | 14–17: catálogo, inventario, descuentos, despacho y retiro |
| [`18-20-administration-and-evidence.md`](./18-20-administration-and-evidence.md) | 18–20: panel administrativo, notificaciones y auditoría |
| [`21-22-freeze-and-changelog.md`](./21-22-freeze-and-changelog.md) | 21–22: cierre, decisiones restantes y registro de cambios |

## Regla de uso

- No citar estos módulos como contrato funcional.
- No corregir sus divergencias por inferencia.
- No combinarlos para generar una nueva fuente canónica.
- No declarar completa la corrección documental hasta incorporar literalmente el original 0.15.5 y registrar su SHA-256.
