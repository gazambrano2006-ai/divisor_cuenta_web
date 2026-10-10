# Investigación: dividir la cuenta

**Fecha**: 2026-10-09
**Fuentes del proyecto**: [spec.md](spec.md), Constitution y package.json existentes.
Las decisiones siguientes concretan la implementación; no cambian esos requisitos.

## 1. React, Vite, JavaScript y estado local

**Decisión**: conservar React/Vite del proyecto, usar JSX y módulos ES,
y gestionar el formulario y la salida con useState en useDivisor.
Un estado de salida agrupa resultado/error para sustituirlos juntos al enviar.

**Motivo**: coincide con la instrucción del usuario y el alcance de una pantalla.
Las actualizaciones reemplazan valores; los handlers usan las entradas actuales.
React documenta ese mecanismo en [useState](https://react.dev/reference/react/useState).

**Alternativas consideradas**: Redux, Zustand, Context global y useReducer.
No son necesarios para este formulario; el usuario pidió useState sin bibliotecas de estado.

## 2. Precisión decimal hasta el redondeo final

**Decisión**: representar decimales como fracciones de BigInt y devolver centavos BigInt.
Si monto es A/Da, propina T/Dt y personas P, el cociente se representa como
N/D, con N = A × (100 × Dt + T) y D = Da × 100 × Dt × P.
No se redondea el total ni se convierte esa fracción a Number.

**Motivo**: garantiza empate al centavo superior y techo del cociente original,
sin imponer un máximo de enteros seguros. El análisis de la representación binaria
de Number y la división entera de BigInt se apoya en
[ECMAScript 2026](https://tc39.es/ecma262/2026/multipage/ecmascript-data-types-and-values.html#sec-bigint::divide).
La derivación de las fórmulas es una decisión de este diseño.

**Alternativas consideradas**: toFixed como algoritmo, Math.round sobre Number
y un epsilon fijo. No garantizan los empates decimales de todas las entradas.
Una biblioteca decimal agregaría una dependencia innecesaria para estas operaciones.
El comportamiento de toFixed está definido en
[la especificación de Number](https://tc39.es/ecma262/2026/multipage/numbers-and-dates.html#sec-number.prototype.tofixed).

## 3. Contrato pequeño y extensión de estrategias

**Decisión**: aplicar(valor) recibe { numerador, denominador } y devuelve centavos.
Main descubre módulos redondeo*.js con import.meta.glob eager y crea sus objetos
de estrategia. Id y etiqueta son metadatos del catálogo, separados del contrato.

**Motivo**: el cálculo no conoce los modos; la pantalla deriva sus opciones del catálogo.
Una nueva regla sólo requiere un módulo compatible y un nuevo build.
El descubrimiento queda en la composición, donde Vite permite
[imports por glob](https://vite.dev/guide/features.html#glob-import).

**Alternativas consideradas**: switch por modo en calcularDivision, imports de data
en el hook o registro codificado que obliga a editar main por cada estrategia.
No satisfacen conjuntamente la dependencia y la extensión exigidas.

## 4. Validación completa antes de calcular

**Decisión**: entradas como texto; validar el texto completo, vacío y finitud,
y normalizar decimales de base diez conservando sus dígitos.
Aceptar punto decimal, signo opcional y exponente decimal opcional;
comprobar finitud por la gramática decimal, rechazando NaN e Infinity sin convertir
a Number. No interpretar cadenas parciales con parseFloat ni convertir vacío en cero.
La integralidad de personas se comprueba sobre el valor exacto, no por truncamiento.

**Motivo**: permite escribir abc para CA-004, admite más de dos decimales
y mantiene validación separada del cálculo. Para múltiples campos inválidos,
usar orden monto → personas → propina como decisión de presentación del primer error.

**Alternativas consideradas**: entradas number con validación nativa que impide
enviar el formulario, o validaciones dentro de calcularDivision.
Pueden impedir los mensajes de la spec o mezclar responsabilidades.

## 5. Apertura sin conexión

**Decisión**: service worker nativo generado por un script post-build, registrado
desde main sólo en producción. Precargar HTML, JS, CSS y demás archivos locales
utilizados por la pantalla; servirlos desde caché. No guardar cuentas.
El build enumera los archivos reales de dist y genera dist/sw.js con una caché
identificada por el contenido del build y rutas relativas a su ámbito.

**Motivo**: calcular localmente no basta para una reapertura desconectada.
Vite prepara recursos para [distribución estática](https://vite.dev/guide/build);
la caché y su ciclo de vida son capacidades del navegador definidas por
[Service Workers](https://w3c.github.io/ServiceWorker/#cache-interface).
Preparar recursos es un paso de distribución; el formulario no hace peticiones.

**Alternativas consideradas**: depender de una pestaña ya cargada o de caché HTTP,
abrir dist/index.html directamente con file://, backend y plugin PWA.
El diseño usa recursos precargados y evita dependencias o servicios innecesarios.

**Límite de entrega**: una dirección remota nunca visitada no contiene todavía
los archivos en el dispositivo. La validación prepara primero el build en el mismo
origen/perfil, espera caché y control activos, luego cierra y reabre sin conexión.
Esta condición física de distribución no modifica la spec ni promete una descarga offline.

## 6. Vitest y comprobación en navegador

**Decisión**: Vitest ejecuta todas las suites. Node prueba funciones puras y jsdom
prueba la pantalla con act/DOM nativo. La suite offline se ejecuta con Vitest en Node
y controla Chromium mediante la biblioteca playwright, sin @playwright/test.

**Motivo**: permite probar cálculo, errores y cambios de estado, además de una
navegación offline real. Se comprueba la preparación de caché antes de desconectar;
se abre una página nueva en el mismo contexto, se repiten los seis CA y se observan
respuestas desde el worker y que validar/calcular no inicia ninguna petición de red,
incluidas peticiones al mismo origen. La preparación de archivos se comprueba por separado.

**Alternativas consideradas**: sólo tests del cálculo, simular navigator.onLine
en jsdom o usar un segundo runner. No demuestran la apertura requerida.

Fuentes primarias: [instalación y requisitos de Vitest](https://vitest.dev/guide/),
[entornos Node/jsdom](https://vitest.dev/guide/environment.html),
[React act](https://react.dev/reference/react/act) y
[Playwright setOffline](https://playwright.dev/docs/api/class-browsercontext#browser-context-set-offline).
Node 22.12 o superior satisface la base documentada para estas herramientas.
Las versiones compatibles se fijarán en package-lock.json al implementar.

## Estado de investigación

Decisiones resueltas para esta fase. No se requieren servicios externos, credenciales
ni cambios en la spec o la Constitution. La disponibilidad de Node/npm y la instalación
de herramientas se comprueban en la implementación, según quickstart.md.
