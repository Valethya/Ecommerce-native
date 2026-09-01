# Ecommerce Native — reconstrucción auxiliar 0.15.5

> **DOCUMENTO AUXILIAR / NO NORMATIVO — no sustituye `docs/spec/ecommerce-native-0.15.5.md`.**

**Versión de referencia:** `0.15.5`  
**Fecha de la versión funcional:** 28 de agosto de 2026  
**Estado de este directorio:** Auxiliar / no normativo

Este directorio contiene una reconstrucción modular realizada durante F1-A. La segunda revisión adversarial comprobó divergencias respecto del documento original `ECOMMERCE_NATIVE_ESPECIFICACION_VIVA.md`, por lo que estos archivos **no constituyen la fuente de verdad funcional** y no deben utilizarse para sustituir, completar ni reconstruir la especificación congelada.

La copia literal canónica del documento original 0.15.5 está incorporada en:

`docs/spec/ecommerce-native-0.15.5.md`

Su SHA-256 verificado es:

`cb2d7d232acca4f6ea0c7b61f256ae4f3e79677cfc40a9a8efd418d0dc619d21`

La procedencia y verificación se registran en `docs/spec/0.15.5-freeze.md`. Este directorio se conserva únicamente como material auxiliar para trazabilidad de F1-A y no adquiere autoridad normativa por la incorporación de la copia canónica.

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
- La única copia canónica versionada en el repositorio es `docs/spec/ecommerce-native-0.15.5.md`, verificada contra el original mediante el SHA-256 registrado.
