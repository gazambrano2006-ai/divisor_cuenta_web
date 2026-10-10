# Constitución de divisor_cuenta_web

## Core Principles

### I. Calidad de código

El código respeta SOLID:

- **SRP:** una función o módulo, una razón de cambio. El cálculo no valida ni formatea.
- **OCP:** agregar una nueva regla de redondeo no obliga a editar los módulos que ya existen.
- **LSP:** cualquier implementación de la interfaz de redondeo puede sustituir a otra
  sin que quien la usa pregunte de qué tipo es.
- **ISP:** interfaces pequeñas; nadie depende de funciones que no usa.
- **DIP:** `presentation` depende de abstracciones del `domain`, nunca de
  implementaciones concretas de `data`.

### II. Arquitectura

- Las capas son `src/presentation`, `src/domain` y `src/data`.
- La regla de dependencia es `presentation -> domain <- data`.
- `src/domain/` no importa React ni nada del DOM: es JavaScript puro.
- `src/main.jsx` es el único lugar donde se instancian implementaciones concretas.

### III. Seguridad

Nunca se guardan secretos ni API keys en el repositorio.

### IV. Calidad y pruebas

- Toda funcionalidad crítica tiene pruebas.
- Los criterios de aceptación de la spec se convierten en pruebas ejecutables.

### V. Regla de la materia

Toda función generada por el agente debe poder explicarla el estudiante:
qué hace, por qué existe, qué recibe, qué devuelve y qué errores produce.

## Governance

Esta Constitution contiene únicamente los cinco principios definidos y no agrega reglas adicionales.

**Version**: 1.0.0 | **Ratified**: 2026-10-09 | **Last Amended**: 2026-10-09
