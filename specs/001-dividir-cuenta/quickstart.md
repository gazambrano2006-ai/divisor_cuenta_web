# Guía de ejecución y validación

Implementación del feature 001-dividir-cuenta completada el 2026-10-09.
La [spec](spec.md) y la Constitution se conservaron intactas.
El diseño está en [plan.md](plan.md) y las tareas verificadas en [tasks.md](tasks.md).

## Preparación

Desde divisor_cuenta_web, usar Node.js 22.12+ compatible y npm.
Esta implementación se verificó con Node 24.21.0 y npm 11.19.0.

```powershell
Set-Location 'C:/Users/Gabriel/Desktop/USFQ/ProgAsistida/divisor_cuenta_web'
node --version
npm --version
npm ci
npx playwright install chromium
```

Si Node no está en PATH pero existe en Program Files:

```powershell
$env:Path = 'C:/Program Files/nodejs;' + $env:Path
```

Las herramientas quedaron fijadas en package-lock.json: Vitest 5.0.3,
jsdom 30.1.2 y Playwright 1.64.0; Chromium 156.0.8078.4 para navegador.
La primera instalación de paquetes y navegador necesita acceso a sus recursos.
Las pruebas detectan .cache/playwright si está disponible; de otro modo usan
la ubicación de descarga habitual de Playwright.

## Comandos disponibles

| Comando | Acción |
|---------|--------|
| npm run dev | Vite de desarrollo, sin registrar el worker. |
| npm test | Vitest de dominio, data, formato, hook y aceptación de pantalla. |
| npm run test:watch | Las mismas suites en modo interactivo. |
| npm run lint | ESLint de código y pruebas. |
| npm run build | Build Vite seguido del generador de dist/sw.js. |
| npm run preview | Revisión manual del build. |
| npm run test:offline | Vitest con Chromium y preview HTTP instrumentado automático. |

Para usar la pantalla en desarrollo:

```powershell
npm run dev
```

Abrir la dirección que imprime Vite. Ingresar los tres datos, seleccionar el modo
y tocar Calcular; el resultado no aparece ni se actualiza antes de ese envío.

## Aceptación de pantalla

```powershell
npm test
npm run lint
npm run build
```

| Caso | Monto | Personas | Propina | Modo | Resultado |
|------|-------|----------|---------|------|-----------|
| CA-001 | 100.00 | 4 | 10 | Exacto | 27.50 |
| CA-002 | 90.00 | 3 | 0 | Exacto | 30.00 |
| CA-003 | 50.00 | 0 | 0 | Exacto | Debe haber al menos una persona; sin resultado. |
| CA-004 | abc | 3 | 0 | Exacto | Monto inválido; sin resultado. |
| CA-005 | 10.00 | 3 | 0 | Exacto | 3.33 |
| CA-006 | 10.00 | 3 | 0 | Hacia arriba | 4.00 |

Las suites cubren esos casos, todos los límites de
[aceptacion.md](contracts/aceptacion.md), eliminación del resultado anterior,
corrección de errores y cambio Exacto → Hacia arriba → Exacto al enviar.

También comprueban empate superior (1.005 → 1.01, 2.675 → 2.68),
total sin redondeo previo (0.02/2 con 49% → 0.01), cociente original en Hacia arriba,
cero, una persona y números grandes sin notación exponencial.
Los negativos no cero con exponentes enormes se rechazan antes de construir su magnitud.

## Validación offline automática

Después del build, con el puerto 4173 libre:

```powershell
npm run test:offline
```

La suite levanta y cierra su propio preview en http://localhost:4173.
No abrir simultáneamente npm run preview.

1. Preparar los recursos, comprobar scope y scriptURL, worker activated y controller
   de la página, además de caché completa con sólo archivos estáticos.
2. Cerrar la página y desconectar el mismo contexto. Empezar la observación antes
   de crear y navegar otra página.
3. Abrir/reabrir, editar las entradas, validar y calcular sin conexión.
   Ejecutar los seis CA, errores antes/después de válido, recuperación y cambios de modo.
4. Comprobar cero accesos HTTP efectivos al servidor (también sw.js/actualizaciones),
   ausencia de destinos externos, peticiones fallidas y fetch del worker.
   Comprobar HTML/JS/CSS servidos desde la caché; una respuesta fromServiceWorker
   por sí sola no prueba ausencia de reenvío a red.
5. Reabrir otra vez y confirmar estado inicial sin resultado ni cuentas guardadas.
   Una prueba adicional verifica cero llamadas de registro en desarrollo.

Para una revisión manual independiente:

```powershell
npm run preview -- --host localhost --port 4173 --strictPort
```

Abrir la pantalla mientras sus archivos están disponibles y esperar control/caché.
Cerrar y volver a abrir con el navegador offline, repitiendo la matriz anterior.
Cerrar este preview antes de ejecutar la suite automática.
En distribución se usa HTTPS; los recursos deben haberse preparado previamente.

## Resultados registrados

| Comprobación | Resultado |
|--------------|-----------|
| npm test | 10 archivos, 139 pruebas correctas. |
| npm run test:offline | 1 archivo, 2 pruebas correctas en Chromium. |
| npm run lint | Sin errores. |
| npm run build | Correcto; dist/sw.js generado con 5 recursos estáticos. |
| CA-001 a CA-006 | 6/6 importes y mensajes correctos, también offline. |
| A1 / FR-012 | Apertura, edición, validación y cálculo observados sin tráfico de red real. |
| Extensión Hacia arriba | Incorporada agregando su módulo, sin editar los consumidores. |
| Spec y Constitution | Hashes idénticos a los del inicio de implementación. |

Los comentarios del código explican los cinco aspectos exigidos para cada función.
La comprobación visual y la revisión final de los cinco principios complementan las suites.
