# Divisor de cuenta

Aplicación de una pantalla para dividir por igual una cuenta de restaurante y su
propina. Usa React, Vite y JavaScript; el estado local se maneja con useState.

Ingresa monto, número de personas y porcentaje de propina, elige Exacto o Hacia arriba
y toca **Calcular**. El resultado muestra dos decimales. Una entrada inválida muestra
un error y oculta el resultado anterior; puedes corregirla y volver a calcular.

## Ejecutar

Requiere Node.js 22.12+ compatible con las dependencias (verificado con Node 24.21.0)
y npm. Desde este directorio:

```sh
npm ci
npm run dev
```

Abre la dirección que indique Vite. La pantalla usa archivos locales y fuentes del sistema.

Si PowerShell no encuentra Node aunque está instalado en Program Files, agrega
esa ubicación sólo al PATH de la terminal actual:

```powershell
$env:Path = 'C:/Program Files/nodejs;' + $env:Path
```

## Pruebas y build

```sh
npm test
npm run lint
npm run build
npx playwright install chromium
npm run test:offline
```

Vitest ejecuta todas las pruebas. Node comprueba funciones puras, jsdom prueba
la presentación y Playwright controla Chromium para validar offline bajo Vitest.

test:offline levanta y cierra su propio preview instrumentado en localhost:4173.
Deja ese puerto libre: no mantengas npm run preview abierto al ejecutar esa suite.
Si existe la descarga local en .cache/playwright, las pruebas la detectan;
en una instalación nueva usan la ubicación habitual de Playwright.

Para revisar manualmente el build:

```sh
npm run preview -- --host localhost --port 4173 --strictPort
```

La guía y los resultados de aceptación están en
[quickstart.md](specs/001-dividir-cuenta/quickstart.md).

## Arquitectura

La dependencia es presentation → domain ← data. main.jsx descubre las reglas
con import.meta.glob, crea sus objetos y conecta la pantalla. Para añadir una regla,
agrega un módulo src/data/redondeo*.js que exporte id, etiqueta y aplicar; reconstruye.
Los consumidores no contienen ramas para cada modo.

| Archivo | Qué hace |
|---------|----------|
| src/domain/cuenta.js | Construye datos de cuenta ya validados. |
| src/domain/resultado.js | Representa centavos por persona. |
| src/domain/validarEntrada.js | Valida textos y conserva su valor decimal exacto. |
| src/domain/calcularDivision.js | Calcula la fracción original y llama a la estrategia. |
| src/domain/estrategiaRedondeo.js | Define el contrato aplicar(valor) mediante JSDoc. |
| src/data/redondeoExacto.js | Redondea al centavo; el empate va al superior. |
| src/data/redondeoHaciaArriba.js | Obtiene el techo entero del cociente original. |
| src/presentation/useDivisor.js | Gestiona entradas, modo, resultado y error con useState. |
| src/presentation/formateadorMoneda.js | Convierte centavos a texto con punto y dos decimales. |
| src/presentation/PantallaDivisor.jsx | Presenta el formulario y su salida. |
| src/main.jsx | Compone dependencias, monta React y prepara el worker en producción. |

Las funciones y sus helpers explican en comentarios qué hacen, por qué existen,
qué reciben, qué devuelven y qué errores producen.

## Precisión y redondeo

El cálculo usa monto × (1 + propina/100) / personas. Los decimales se conservan
como fracciones de BigInt: por ejemplo, 1.005 es 1005/1000. Esto permite mantener
la precisión hasta el redondeo final sin depender de aproximaciones binarias.

El contrato aplicar recibe { numerador, denominador } y devuelve centavos bigint.
Exacto elige el centavo más cercano con empate superior; Hacia arriba toma el techo
del cociente original. El formateador sólo separa entero y centavos; no redondea.
No se redistribuyen sobrantes ni se imponen máximos propios a las entradas.

## Uso sin conexión

npm run build genera dist/sw.js y una caché para los archivos reales del build.
El registro se prepara sólo en producción. Una instalación activa del mismo
ámbito y script se reutiliza al reabrir; los recursos se sirven desde caché,
sin reenvío a red. Las cuentas permanecen únicamente en memoria.

La preparación inicial requiere que los archivos lleguen al dispositivo.
Una vez activado el worker y completada la caché, se puede cerrar y abrir la pantalla
sin conexión. La suite comprueba esa secuencia con observación desde antes de abrir,
incluyendo edición, errores, recuperación, cálculo y actividad del worker.

## Validación

Implementación verificada el 2026-10-09: 139 pruebas de dominio/presentación/aceptación,
2 pruebas de navegador offline/desarrollo, ESLint y build correctos.
Los seis CA cumplen sus valores y mensajes tanto en la pantalla normal como offline.
La spec y la Constitution se conservaron sin modificaciones.
