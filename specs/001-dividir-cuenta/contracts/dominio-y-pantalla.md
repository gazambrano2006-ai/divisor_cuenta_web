# Contratos de dominio y pantalla

Este documento concreta interfaces de la aplicación local.
No hay endpoints HTTP ni integración con servicios externos.
Las firmas describen JavaScript/JSDoc; no son implementación.

## EstrategiaRedondeo — src/domain/estrategiaRedondeo.js

**Única operación**: aplicar(valor) → centavos: bigint.

- Recibe un valor racional { numerador: bigint, denominador: bigint },
  con numerador no negativo y denominador positivo.
- Devuelve centavos por persona, no texto ni un importe en Number.
- Es determinista, no cambia el valor recibido y no valida entradas del formulario.
- No usa React, DOM, almacenamiento ni red.
- Ninguna estrategia exige parámetros o precondiciones adicionales.
- El consumidor llama aplicar sin preguntar por el tipo o el nombre del modo.

Los valores fuera de estas precondiciones representan un error de programación,
no un error de usuario. No se garantizan salidas para un contrato incumplido;
los errores nativos, como división entera por cero, no se traducen en mensajes del formulario.

### Exacto — src/data/redondeoExacto.js

Para valor N/D, calcular q y r de la división entera (100 × N) / D.
El resultado en centavos es q, más uno cuando 2 × r es mayor o igual que D.
Así se obtiene el centavo más cercano con empate superior.

Ejemplos: 10/3 devuelve 333n; 1005/1000 devuelve 101n.
No redistribuye sobrantes y no añade formato de pantalla.

### Hacia arriba — src/data/redondeoHaciaArriba.js

Calcular q y r de N/D. Si r es cero, devolver q × 100;
si no, devolver (q + 1) × 100 centavos.
Usa N/D original, sin aplicar previamente Exacto ni formato.

Ejemplos: 10/3 devuelve 400n; 90/3 devuelve 3000n; cero devuelve 0n.

## Datos y operaciones del dominio

| Operación | Recibe | Devuelve | Errores |
|-----------|--------|----------|---------|
| crearCuenta(datosNormalizados) | Monto y propina racionales, personas bigint ya validados. | Cuenta. | No produce errores de usuario; no valida precondiciones. |
| validarEntrada(entrada) | Tres textos de monto, personas y porcentajePropina. | Resultado de validación descrito en data-model.md. | Devuelve error de entrada; no lanza excepciones por datos inválidos. |
| calcularDivision(cuenta, estrategia) | Cuenta válida y contrato aplicar. | Resultado con centavosPorPersona. | No valida ni formatea; un contrato roto es error de programación. |
| crearResultado(centavosPorPersona) | Centavos bigint devueltos por la estrategia. | Resultado. | No produce errores de usuario; no añade reglas de redondeo. |

calcularDivision construye el cociente descrito en research.md, llama exactamente
una vez a estrategia.aplicar y usa crearResultado para devolver su salida.
No examina tipos, ids o etiquetas. No convierte el cociente a Number ni redondea el total.

## Descubrimiento y composición — src/main.jsx

La convención de módulos es src/data/redondeo*.js.
Cada módulo exporta id único, etiqueta y la función aplicar.
main los descubre con import.meta.glob y eager: true, ordena el catálogo por id
para una presentación estable, y crea un objeto { aplicar } por módulo.
Main inyecta también modoInicialId con valor exacto como configuración inicial;
el hook usa ese parámetro y no conoce los nombres de los modos.

Esos módulos no exportan una instancia creada de estrategia ni hacen trabajo de
composición al importarse. Sólo main importa implementaciones de data para
componer la aplicación y entrega el catálogo a PantallaDivisor.

Errores de composición como id duplicado o ausencia de aplicar son errores del
desarrollo, no entradas inválidas. Se detectan al montar con un diagnóstico claro.
Agregar un módulo compatible y reconstruir es suficiente para incorporar una regla;
no se modifica código de módulos existentes ni se codifican modos en el hook.

Las pruebas unitarias pueden llamar directamente las funciones exportadas.
Las pruebas de aceptación montan la composición de main en un elemento DOM de prueba;
no crean objetos de estrategia concretos fuera de main.
Una función de montaje en main permite desmontar la raíz React entre casos
sin mover la composición a otro archivo.

## Presentation

| Operación | Contrato y propósito | Retorno y errores |
|-----------|----------------------|------------------|
| useDivisor(catalogo, modoInicialId) | Encapsula useState y coordina el envío con domain. | Entradas, modoId, salida y acciones de edición/cálculo; errores del validador en salida. |
| formateadorMoneda(centavos) | Separa parte entera y resto de centavos; completa dos dígitos. | string como 27.50, 3.33 o 4.00; sin redondeo ni localización variable. |
| PantallaDivisor({ catalogo, modoInicialId }) | Renderiza formulario, opciones y salida en una sola pantalla. | JSX; sólo muestra resultado o error, sin calcular en el render. |

Las entradas usan texto con inputMode apropiado y etiquetas visibles;
el formulario evita que validación nativa impida ejecutar los mensajes definidos.
Se envía con el botón «Calcular». No hay un resultado antes del primer envío.
La salida válida se muestra como «Por persona: importe» con punto y dos decimales.
El error muestra el mensaje, con ausencia del elemento de resultado.

No hay recálculo automático al editar campos o modo.
Cambiar de modo y volver a enviar usa la estrategia elegida en ese momento.
La presentación depende de los contratos y funciones del domain;
no importa módulos de data.

## Recursos offline

El script scripts/generarCacheOffline.js enumera los recursos locales del build,
incluye index.html y genera dist/sw.js. Su código no participa en el cálculo.
El worker precarga esos recursos, sirve respuestas de caché y sólo gestiona
cachés de la aplicación. No almacena entradas ni resultados.

main registra el worker sólo en producción y en su ámbito de distribución.
En desarrollo se usa Vite sin worker para evitar interferencia de recursos viejos.
Una caché nueva se activa únicamente tras preparar todos sus recursos;
el envío del formulario, la validación y el cálculo no generan peticiones de red,
ni externas ni al mismo origen. La precarga pertenece a la preparación de la entrega.

La apertura offline se valida después de preparar los recursos en el mismo origen
y perfil. Una página nueva, no sólo el componente ya montado, debe abrir y ejecutar
CA-001 a CA-006 sin conexión.
