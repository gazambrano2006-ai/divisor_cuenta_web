# Respuestas

## 1. ¿Qué porcentaje de la spec viajó intacto, qué porcentaje necesitó adaptación y qué porcentaje no pudo reutilizarse?

La spec se pudo reutilizar completamente al pasar de Flutter a React.

En `analisis_spec.md` se revisaron 42 enunciados y los 42 fueron clasificados como QUÉ, porque describen cosas que el sistema debe hacer, como los cálculos, las validaciones, los errores y los resultados esperados. Ninguno dependía directamente de Flutter.

Por eso, los resultados fueron:

- Intacto: 42 de 42 = 100 %
- Adaptado: 0 %
- No reutilizable: 0 %

También se compararon los dos archivos `spec.md` con `git diff --no-index` y no apareció ninguna diferencia.

En React se registraron 65,3 minutos hasta la primera compilación correcta y 78,4 minutos hasta que pasaron los seis casos de aceptación. Estos tiempos sirven como referencia del proceso, pero no significan por sí solos que React o Flutter sean mejores.


## 2. ¿Qué pasó con las reglas de la Constitution?

La mayoría de ideas de la Constitution se pudieron mantener. Lo que cambió principalmente fue la forma de escribir algunas reglas para adaptarlas de Flutter/Dart a React/JavaScript.

Se analizaron 13 reglas.

Seis se pudieron mantener prácticamente iguales:

1. Usar las capas presentation, domain y data.
2. Mantener la dependencia `presentation -> domain <- data`.
3. No guardar secretos ni API keys en el repositorio.
4. Probar toda funcionalidad crítica.
5. Convertir los criterios de aceptación en pruebas.
6. Poder explicar cada función generada por el agente.

Otras siete necesitaron adaptar la redacción:

1. SRP pasó de hablar principalmente de clases a funciones o módulos.
2. OCP pasó de nuevas clases de redondeo a nuevos módulos.
3. LSP mantuvo la misma idea, pero el contrato se expresó de forma adecuada para JavaScript.
4. ISP mantuvo la idea de depender solo de lo necesario, aunque JavaScript trabaja distinto a Dart con las interfaces.
5. DIP mantuvo la misma regla de depender de abstracciones y no de implementaciones concretas.
6. La regla de que domain no importe Flutter pasó a que `src/domain` no importe React ni elementos del DOM.
7. `main.dart` fue reemplazado por `src/main.jsx` como punto de composición.

El resultado fue:

- 6 reglas idénticas.
- 7 reglas adaptadas.
- 0 reglas reemplazadas.

En general, los principios sí se pudieron mantener. Lo que cambió fueron principalmente los nombres y detalles propios de cada tecnología.


## 3. ¿Fue necesario modificar algún enunciado de la spec para implementar React?

No fue necesario modificar ningún enunciado de la spec.

Creo que esto fue posible porque la spec estaba enfocada en lo que tenía que hacer el programa y no en cómo debía estar programado.

Por ejemplo, indica qué datos debe ingresar el usuario, cómo se divide la cuenta, qué errores se deben mostrar y cuáles deben ser los resultados. No obliga a utilizar widgets de Flutter, clases específicas de Dart o alguna librería concreta.

Además, al comparar el `spec.md` de Flutter y el de React, el diff quedó vacío.

Durante `/speckit-analyze` sí apareció una observación relacionada con la comprobación del funcionamiento offline, pero el problema estaba en una tarea que no era suficientemente específica. Se corrigió `tasks.md` y no fue necesario cambiar la spec.


## 4. ¿Cambiaron los seis casos de aceptación entre Flutter y React?

No cambiaron.

Los mismos seis casos usados en Flutter se conservaron en React:

1. 100 de monto, 4 personas y 10 % de propina da 27.50.
2. 90 de monto, 3 personas y sin propina da 30.00.
3. Con 0 personas aparece `Debe haber al menos una persona`.
4. Con un monto no numérico aparece `Monto inválido`.
5. 10 dividido para 3 en modo exacto da 3.33.
6. 10 dividido para 3 con redondeo hacia arriba da 4.00.

Lo que cambió fue la forma de escribir las pruebas. En Flutter se utilizaba Dart y las herramientas de prueba de Flutter, mientras que en React se utilizó JavaScript y Vitest.

El archivo `test/casosDePrueba.js` se escribió con los mismos datos y resultados de la versión anterior. Después esos casos se ejecutaron desde `division.test.js`.

Los seis pasaron correctamente. Por eso, la tecnología de las pruebas sí cambió, pero los escenarios y las reglas de negocio se mantuvieron.


## 5. ¿Qué partes del plan de Flutter dejaron de tener sentido en React?

El plan fue una de las partes que más cambió, porque ahí estaban muchas decisiones relacionadas directamente con Flutter.

Por ejemplo:

### Flutter y Dart

El plan anterior usaba Dart, Flutter y archivos `.dart`. En el nuevo proyecto se utilizaron JavaScript, React, Vite y archivos `.js` y `.jsx`.

La función del programa sigue siendo la misma, pero la forma de implementarla es diferente.

### `main.dart`

En Flutter, `main.dart` era el lugar donde se conectaban las implementaciones.

En React esta responsabilidad pasó a `src/main.jsx`.

La idea de tener un solo lugar para hacer la composición se mantiene, pero el archivo y la forma de hacerlo cambian.

### Manejo del estado

En Flutter se trabajaba con el estado de Flutter y `setState`.

En React se utiliza `useState`, principalmente dentro de `useDivisor.js`.

El usuario sigue viendo el mismo comportamiento, pero internamente se maneja de otra manera.

### Pruebas

Las herramientas de Flutter dejaron de tener sentido en React.

En el proyecto nuevo se usó Vitest y jsdom para las pruebas. También se utilizaron herramientas del navegador para comprobar el funcionamiento offline.

### Funcionamiento offline

En la versión web fue necesario trabajar con un service worker y CacheStorage para guardar los recursos estáticos.

Eso es propio del funcionamiento de una aplicación web y no se implementa de la misma forma en Flutter.

Según el conteo realizado, se modificaron 140 enunciados del plan. Esto muestra que el plan estaba mucho más relacionado con la tecnología que la spec.


## 6. ¿Qué artefacto fue el más reusable y cuál fue el menos reusable?

El artefacto más reusable fue la spec.

Los 42 enunciados pudieron utilizarse sin cambios y la comparación entre los dos archivos `spec.md` no mostró diferencias. Esto tiene sentido porque la spec estaba enfocada principalmente en lo que debía hacer el sistema.

Los casos de aceptación también fueron bastante reutilizables. Aunque las pruebas se escribieron con otra sintaxis, los mismos datos, errores y resultados se conservaron.

El artefacto menos reusable fue el plan.

El plan sí tenía muchas decisiones relacionadas directamente con Flutter, como Dart, archivos `.dart`, `main.dart`, `setState` y las herramientas de pruebas.

Al pasar a React, estas decisiones tuvieron que cambiar por JavaScript, archivos `.js` y `.jsx`, `main.jsx`, `useState`, Vitest y otras herramientas de una aplicación web.

Para mí, este ejercicio muestra que el QUÉ puede mantenerse bastante bien cuando una especificación está bien separada de la tecnología. En cambio, el CÓMO cambia mucho más cuando se cambia de framework.

# Evidencias de verificación

## Comparación de la spec

Se ejecutó:

`git diff --no-index -- "..\participacion7\specs\001-dividir-cuenta\spec.md" ".\specs\001-dividir-cuenta\spec.md"`

Resultado: no se mostró ninguna diferencia.

Esto confirma que la spec React comenzó y terminó igual que la spec Flutter.

## Análisis de Spec Kit

La segunda ejecución de `/speckit-analyze` terminó con:

- 17 requisitos cubiertos de 17.
- Cobertura documental: 100 %.
- 0 ambigüedades pendientes.
- 0 duplicaciones problemáticas.
- 0 conflictos críticos.
- Sin conflictos con la Constitution.

## Pruebas

Al ejecutar `npm test`:

`149 pruebas correctas`

Dentro de estas pruebas se encuentran los seis casos de aceptación, la prueba de LSP y las tres pruebas de pantalla solicitadas.

Los seis casos de aceptación quedaron en verde a los 78,4 minutos desde el inicio de la medición.

## Verificación SOLID

### Domain independiente de React

Se verificó que `src/domain/` no importe React.

Resultado: sin coincidencias.

### OCP y LSP

Se verificó que `calcularDivision.js` no contenga comprobaciones como:

- `instanceof`
- `=== 'exacto'`
- `=== 'arriba'`

Resultado: sin coincidencias.

### SRP

Se verificó que `calcularDivision.js` no contenga:

- `toFixed`
- `inválido`
- `al menos una persona`

Resultado: sin coincidencias.

### Composición de estrategias

Las implementaciones se encuentran en `src/data/redondeoExacto.js` y `src/data/redondeoHaciaArriba.js`.

`src/main.jsx` las descubre mediante:

`import.meta.glob('./data/redondeo*.js', { eager: true })`

De esta forma, `main.jsx` sigue siendo el punto donde se conectan las implementaciones concretas con la aplicación.

## Build final

Se ejecutó `npm run build` y terminó correctamente:

- Vite: 24 módulos transformados.
- Build generado correctamente.
- Tiempo del build final: 732 ms.
- Worker offline generado con 5 recursos estáticos.

La primera compilación correcta registrada durante el proceso ocurrió a los 65,3 minutos.

## Convergencia final

Se ejecutó `/speckit-converge`.

Resultado:

- 12 requisitos funcionales revisados.
- 5 criterios de éxito revisados.
- 8 escenarios de aceptación revisados.
- 8 decisiones del plan revisadas.
- 42 tareas revisadas.
- 5 principios de la Constitution revisados.
- 0 hallazgos accionables.

La implementación quedó consistente con la spec, el plan y las tareas.