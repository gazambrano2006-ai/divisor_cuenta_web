# Guía de implementación y validación

Esta guía se ejecuta cuando se implemente el plan. Ahora sólo existen los artefactos
de diseño; Vitest, scripts de prueba y soporte offline aún deben configurarse.

## Prerrequisitos

- Trabajar en divisor_cuenta_web, donde están package.json y .specify.
- Node.js 22.12 o superior y npm disponibles en PATH.
- Navegador con BigInt/service workers y Chromium para la suite automatizada.
- Recursos y herramientas preparados antes de validar sin conexión.

En la terminal de esta planificación, node y npm no se encontraron en PATH.
Comprobarlos en la terminal de implementación:

```powershell
Set-Location 'C:/Users/Gabriel/Desktop/USFQ/ProgAsistida/divisor_cuenta_web'
node --version
npm --version
```

## Preparación durante la implementación

Conservar dependencias existentes y agregar sólo herramientas de prueba.
La instalación inicial requiere disponer de los paquetes y del navegador:

```powershell
npm ci
npm install --save-dev vitest jsdom playwright
npx playwright install chromium
```

Fijar las versiones compatibles en package-lock.json.
Implementar las capas de [plan.md](plan.md) y sus
[contratos](contracts/dominio-y-pantalla.md), sin modificar spec.md.

Configurar estos comandos en package.json:

| Comando | Comportamiento previsto |
|---------|-------------------------|
| npm run dev | Servidor Vite de desarrollo, sin worker offline. |
| npm test | Vitest en ejecución única para domain/data/presentation/acceptance; excluir offline. |
| npm run test:watch | Vitest interactivo para esas suites. |
| npm run build | Vite build seguido de scripts/generarCacheOffline.js; genera dist/sw.js. |
| npm run preview | Servir el build local para validación. |
| npm run test:offline | Vitest con vitest.offline.config.js, entorno Node y biblioteca playwright. |
| npm run lint | ESLint con entornos adecuados para browser, herramientas Node y pruebas. |

vitest.config.js conserva el plugin React de Vite y usa Node por defecto.
Las suites DOM seleccionan jsdom. vitest.offline.config.js incluye sólo tests/offline/.
Todas las suites pertenecen a Vitest; Playwright sólo controla el navegador.

## Comprobación del cálculo y la pantalla

```powershell
npm test
npm run lint
npm run build
npm run dev
```

En la única pantalla ejecutar CA-001 a CA-006 y la secuencia de cambios de modo,
según [aceptacion.md](contracts/aceptacion.md).
Verificar textos exactos, dos decimales, ausencia inicial de resultado y eliminación
de resultados después de errores. Corregir datos y calcular nuevamente.
Los casos de precisión, cero e integralidad están en la misma matriz.

## Apertura offline real

El entorno de desarrollo no prueba la entrega offline; usar el build.
En una terminal, después de npm run build:

```powershell
npm run preview -- --host localhost --port 4173 --strictPort
```

En otra terminal, en el mismo directorio:

```powershell
npm run test:offline
```

La suite usa http://localhost:4173 como origen de validación y debe:

1. Abrir el build con acceso a sus recursos. Esperar precarga completa y worker
   activado; confirmar que una navegación ya está controlada por el worker.
2. Conservar el contexto del navegador y sus recursos, cerrar la página,
   activar modo offline y abrir una página nueva en el mismo origen.
3. Comprobar carga del HTML, JS y CSS desde caché y repetir CA-001 a CA-006,
   incluidos errores después de un resultado válido y cambios de modo.
4. Confirmar que enviar, validar y calcular no inicia ninguna petición de red,
   ni siquiera al mismo origen, y que la caché no guarda cuentas.
   La pantalla reabierta comienza sin resultado.

La misma secuencia puede validarse manualmente con las herramientas de red del navegador.
No reemplazar la apertura por una prueba sobre una pestaña que ya estaba cargada.
Para distribución, servir bajo HTTPS y mantener el ámbito de caché de esa instalación.
Una primera descarga remota requiere que los recursos puedan llegar al dispositivo;
la aceptación offline se realiza con la aplicación previamente preparada.

## Resultado esperado

- Los seis CA pasan tanto en ejecución normal como offline.
- Los mensajes y estados cumplen FR-001 a FR-012 y SC-001 a SC-005.
- Exacto cumple empate superior; Hacia arriba utiliza el cociente original.
- Cada función puede explicarse con propósito, entradas, retorno y errores.
- La revisión de capas y composición cumple los cinco principios de la Constitution.

Registrar resultados al implementar. No hay resultados de tests producidos en esta planificación.
