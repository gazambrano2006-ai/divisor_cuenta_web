# Implementation Plan: Dividir la cuenta de un restaurante

**Branch**: `master` | **Date**: 2026-10-09 | **Spec**: [spec.md](spec.md)

**Input**: `specs/001-dividir-cuenta/spec.md`
**Feature activo**: `001-dividir-cuenta`

La variable `SPECIFY_FEATURE_DIRECTORY` no estaba definida y no existía
`.specify/feature.json`. Se resolvió al único feature del proyecto, también abierto
en el IDE, y se pasó al script de planificación sólo para esta ejecución, sin persistirlo.
El identificador devuelto por Spec Kit es `001-dividir-cuenta`; la rama Git real es
`master`. El valor histórico `sdd` de la spec se conserva en ese documento.

## Summary

Implementar una sola pantalla de React con Vite y JavaScript para dividir por igual
monto y propina, elegir Exacto o Hacia arriba y mostrar un importe con dos decimales
o un error. El cálculo ocurre al pulsar «Calcular». El estado local usa únicamente
`useState`, encapsulado en `useDivisor.js`.

Separar validación, cálculo, redondeo y formato en las capas solicitadas.
`main.jsx` compone las estrategias y entrega su catálogo a la pantalla.
El contrato de cada estrategia tiene una sola función: `aplicar(valor)`.
Representar el cociente como fracción de enteros `BigInt` y el resultado como
centavos para cumplir los empates decimales y conservar la precisión.

La apertura offline requiere distribuir previamente los recursos de la aplicación.
Un service worker nativo almacena sólo archivos estáticos del build. Las cuentas
permanecen en memoria. Vitest verifica dominio, estrategias, pantalla y aceptación;
la suite offline usa Playwright como controlador del navegador bajo Vitest.

## Technical Context

**Language/Version**: JavaScript con módulos ES, JSX y `BigInt`; sin TypeScript.
Node.js 22.12 o superior para las herramientas.

**Primary Dependencies**: React y React DOM `^19.2.8`, Vite `^8.3.0` y
`@vitejs/plugin-react` `^6.1.1`, según el `package.json` existente.
No agregar bibliotecas para estado. Conservar las versiones resueltas del lockfile.

**Storage**: Datos del formulario y resultado en `useState`; sin base de datos ni
persistencia de cuentas. CacheStorage únicamente para recursos estáticos offline.

**Testing**: Vitest como único runner; entorno Node para funciones puras,
`jsdom` para React/DOM y `playwright` como dependencia de desarrollo para
manejar Chromium en la suite offline. Usar React `act` y APIs DOM nativas.
No se requiere `@playwright/test` ni una biblioteca de estado o de pruebas de componentes.

**Target Platform**: Navegador moderno con React, `BigInt`, service workers y
CacheStorage; HTTPS en distribución o localhost en validación.

**Project Type**: Aplicación web de una sola pantalla.

**Performance Goals**: Cálculo local al enviar el formulario. La spec no establece
umbrales de tiempo, memoria o carga; el plan no agrega métricas arbitrarias.

**Constraints**: Sin peticiones de red para validar o calcular; sin secretos o API keys;
dos decimales con punto; mensajes exactos en CA-003 y CA-004; no redondear antes el total;
no redistribuir sobrantes ni imponer máximos arbitrarios.

**Scale/Scope**: Tres entradas, selector de redondeo, un botón y resultado/error.
CA-001 a CA-006, escenarios adicionales y casos límite de la spec.

La terminal de esta sesión no encontró `node` ni `npm` en PATH. Su disponibilidad
se comprobará antes de implementar o ejecutar pruebas; no impide preparar estos artefactos.

## Constitution Check

La comprobación se limita a los cinco principios de la Constitution.
«Conforme» indica que el diseño los satisface; aún no es evidencia de implementación.

| Principio | Comprobación previa a investigación | Comprobación tras diseño |
|-----------|------------------------------------|--------------------------|
| Calidad de código: SRP | Validar, calcular, redondear y formatear separados. | Conforme: responsabilidades y contratos por archivo definidos. |
| Calidad de código: OCP | Incorporar estrategias sin cambiar módulos existentes. | Conforme: descubrimiento genérico en main y selector derivado del catálogo. |
| Calidad de código: LSP | Un único contrato de entrada/salida para ambas estrategias. | Conforme: aplicar recibe racional y devuelve centavos; sin consultar tipos. |
| Calidad de código: ISP | Estrategia con sólo aplicar(valor). | Conforme: id y etiqueta pertenecen al catálogo, no al contrato de estrategia. |
| Calidad de código: DIP | Presentation usa domain y dependencias inyectadas. | Conforme: sólo main conecta data; domain no importa data. |
| Arquitectura | Tres capas, domain puro y main como punto de composición. | Conforme: árbol y responsabilidades conservan esas reglas. |
| Seguridad | No se necesitan secretos ni API keys. | Conforme: recursos locales; ninguna credencial prevista. |
| Calidad y pruebas | Funcionalidad crítica y aceptación con pruebas ejecutables. | Conforme: matriz de pruebas en contracts/aceptacion.md y suite offline prevista. |
| Regla de la materia | Cada función debe poder explicarse en los cinco aspectos pedidos. | Conforme: documentar propósito, entradas, retorno y errores de cada función y helper. |

Durante la implementación, la revisión de cada función incluirá qué hace, por qué
existe, qué recibe, qué devuelve y qué errores produce, incluyendo helpers, handlers,
composición y soporte offline. No se modifica la Constitution ni se agregan principios.

## Project Structure

### Documentation (this feature)

```text
specs/001-dividir-cuenta/
├── spec.md                   # Existente; no se modifica
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    ├── dominio-y-pantalla.md
    └── aceptacion.md
```

`tasks.md` corresponde al comando posterior `/speckit-tasks`; no se crea en esta fase.

### Source Code (repository root)

Estructura prevista para la implementación; estos archivos no se generan en esta fase.

```text
src/
├── domain/
│   ├── cuenta.js
│   ├── resultado.js
│   ├── calcularDivision.js
│   ├── validarEntrada.js
│   └── estrategiaRedondeo.js
├── data/
│   ├── redondeoExacto.js
│   └── redondeoHaciaArriba.js
├── presentation/
│   ├── useDivisor.js
│   ├── formateadorMoneda.js
│   └── PantallaDivisor.jsx
├── main.jsx
└── index.css
scripts/
└── generarCacheOffline.js     # Post-build: genera dist/sw.js y su lista de recursos
tests/
├── domain/
├── data/
├── presentation/
├── acceptance/
└── offline/
vite.config.js
vitest.config.js
vitest.offline.config.js
package.json
package-lock.json
index.html
```

**Structure Decision**: Conservar exactamente los archivos de las tres capas pedidos.
El soporte de build, estilos y pruebas queda fuera del dominio. `dist/sw.js` es
un artefacto generado. El componente de ejemplo `App.jsx` será reemplazado como
entrada visual por `PantallaDivisor.jsx` durante la implementación.

| Archivo | Responsabilidad |
|---------|-----------------|
| domain/cuenta.js | Definir datos validados de cuenta y construir su valor; sin reglas de redondeo. |
| domain/resultado.js | Representar centavos por persona; sin mensajes visuales ni formato. |
| domain/calcularDivision.js | Construir el cociente original, llamar aplicar y devolver Resultado. |
| domain/validarEntrada.js | Validar entradas completas y convertir decimales válidos a datos exactos. |
| domain/estrategiaRedondeo.js | Declarar mediante JSDoc el contrato aplicar(valor) y sus tipos; sin implementación concreta. |
| data/redondeoExacto.js | Exportar aplicar para redondear al centavo con empate superior, más id y etiqueta. |
| data/redondeoHaciaArriba.js | Exportar aplicar para obtener el techo entero del cociente, más id y etiqueta. |
| presentation/useDivisor.js | Gestionar useState y coordinar validación/cálculo al enviar, con catálogo inyectado. |
| presentation/formateadorMoneda.js | Convertir centavos a texto con punto y dos dígitos; no redondear. |
| presentation/PantallaDivisor.jsx | Renderizar entradas, catálogo, Calcular y resultado/error en una sola pantalla. |
| main.jsx | Descubrir módulos de data, crear objetos de estrategia, inyectarlos y montar React; registrar soporte offline. |

### Composición y flujo

En `main.jsx`, `import.meta.glob('./data/redondeo*.js', { eager: true })`
descubre módulos con exports `id`, `etiqueta` y `aplicar`.
Sólo main crea cada objeto de estrategia `{ aplicar }` y el catálogo
`{ id, etiqueta, estrategia }`. Los módulos de data exportan funciones y metadatos,
sin crear objetos de estrategia al importarse.

`PantallaDivisor` recibe el catálogo y `modoInicialId` desde main, y obtiene de
`useDivisor(catalogo, modoInicialId)` el formulario, modo seleccionado, resultado/error
y acciones. Main configura `modoInicialId` como `exacto`; el hook no conoce ese nombre.
El selector se deriva del catálogo.
El hook selecciona por id y entrega al cálculo el objeto de estrategia; no distingue
clases ni contiene ramas para Exacto/Hacia arriba.

Flujo al enviar: entradas actuales → `validarEntrada` → cuenta válida →
`calcularDivision(cuenta, estrategia)` → resultado numérico →
`formateadorMoneda` → pantalla. Si hay error, el hook borra cualquier resultado
y muestra el mensaje. La corrección y un nuevo envío sustituyen error por resultado.
Editar campos o modo no ejecuta el cálculo automáticamente.

Agregar una regla significa agregar un módulo `src/data/redondeo*.js` compatible
y reconstruir. No se edita main, domain ni presentation.
La convención de descubrimiento y sus metadatos se detallan en
[el contrato](contracts/dominio-y-pantalla.md).

## Implementation Phases

1. **Fase 0 — Investigación completada**: decisiones y alternativas en
   [research.md](research.md); precisión decimal, composición, estado y offline resueltos.
2. **Fase 1 — Diseño completado**: [data-model.md](data-model.md),
   [contratos](contracts/dominio-y-pantalla.md), [aceptación](contracts/aceptacion.md)
   y [quickstart.md](quickstart.md).
3. **Implementación posterior**: configurar Vitest, implementar las capas y composición,
   preparar build offline y ejecutar la matriz de aceptación. Este comando entrega diseño,
   no código funcional ni resultados de pruebas.

## Complexity Tracking

Sin violaciones ni excepciones a la Constitution.
Las fracciones con BigInt resuelven precisión y empate de la spec; el soporte offline
resuelve FR-012 y la apertura de US4. No se añaden capacidades de negocio.
