import { preview } from 'vite'

export const origen = 'http://localhost:4173'

/**
 * Hace: inicia Vite preview y registra cada petición que llega realmente al HTTP.
 * Existe para distinguir una respuesta del worker de un reenvío efectivo a la red.
 * Recibe: ningún argumento. Devuelve: servidor y lista mutable de accesos reales.
 * Errores: propaga fallos de Vite, incluido puerto 4173 ocupado o build ausente.
 */
export async function iniciarPreviewMedido() {
  const accesos = []
  const servidor = await preview({
    configFile: 'vite.config.js',
    preview: { host: 'localhost', port: 4173, strictPort: true, open: false },
    plugins: [{
      name: 'medir-http-de-la-prueba',
      /**
       * Hace: instala el contador antes del middleware de recursos de preview.
       * Existe para observar también sw.js y sus actualizaciones, no sólo páginas.
       * Recibe: servidor de Vite. Devuelve: undefined. Errores: los de middleware.
       */
      configurePreviewServer(servidorPreview) {
        /**
         * Hace: anota un acceso HTTP y permite que Vite atienda la petición.
         * Existe como medición independiente del navegador y del worker.
         * Recibe: request, response y next. Devuelve: undefined.
         * Errores: propaga errores de next; no cambia la respuesta del servidor.
         */
        servidorPreview.middlewares.use(function contarAcceso(peticion, respuesta, siguiente) {
          accesos.push({ metodo: peticion.method, url: peticion.url })
          siguiente()
        })
      },
    }],
  })
  return { servidor, accesos }
}

/**
 * Hace: cierra el servidor HTTP de preview y sus conexiones remanentes.
 * Existe para liberar 4173 y no dejar procesos tras las pruebas.
 * Recibe: servidor Vite preview. Devuelve: promesa de cierre.
 * Errores: rechaza con un error de cierre HTTP si lo hay.
 */
export function cerrarPreview(servidor) {
  /**
   * Hace: transforma el cierre por callback en una promesa.
   * Existe para esperar el cierre al finalizar la suite.
   * Recibe: resolve/reject. Devuelve: undefined. Errores: rechaza errores HTTP.
   */
  return new Promise(function esperarCierre(resolver, rechazar) {
    /**
     * Hace: resuelve o rechaza cuando el servidor terminó de cerrar.
     * Existe para propagar los fallos del cierre al runner.
     * Recibe: error opcional. Devuelve: undefined. Errores: rechaza el recibido.
     */
    servidor.httpServer.close(function terminarCierre(error) {
      if (error) rechazar(error)
      else resolver()
    })
    servidor.httpServer.closeAllConnections()
  })
}

/**
 * Hace: escucha peticiones/respuestas de todas las páginas y del service worker.
 * Existe para detectar reenvíos a red aunque una respuesta figure como fromSW.
 * Recibe: BrowserContext. Devuelve: listas de peticiones, respuestas y fallos.
 * Errores: ninguno propio; la API de Playwright puede fallar si el contexto cerró.
 */
export function observarContexto(contexto) {
  const observacion = { peticiones: [], respuestas: [], fallos: [] }
  /**
   * Hace: registra dueño y URL de una petición lógica.
   * Existe para descubrir fetch iniciado por un worker o hacia destinos externos.
   * Recibe: Request de Playwright. Devuelve: undefined. Errores: ninguno propio.
   */
  contexto.on('request', function registrarPeticion(peticion) {
    observacion.peticiones.push({
      url: peticion.url(),
      worker: Boolean(peticion.serviceWorker()),
    })
  })
  /**
   * Hace: registra origen de respuesta y dueño de su petición.
   * Existe para demostrar que HTML, JS y CSS pasaron por el worker.
   * Recibe: Response de Playwright. Devuelve: undefined. Errores: ninguno propio.
   */
  contexto.on('response', function registrarRespuesta(respuesta) {
    observacion.respuestas.push({
      url: respuesta.url(),
      desdeWorker: respuesta.fromServiceWorker(),
      worker: Boolean(respuesta.request().serviceWorker()),
      tipo: respuesta.request().resourceType(),
      estado: respuesta.status(),
    })
  })
  /**
   * Hace: registra una petición fallida, incluso desde el worker.
   * Existe para no ocultar un intento de fetch fallido al desconectar Chromium.
   * Recibe: Request de Playwright. Devuelve: undefined. Errores: ninguno propio.
   */
  contexto.on('requestfailed', function registrarFallo(peticion) {
    observacion.fallos.push({ url: peticion.url(), error: peticion.failure() })
  })
  return observacion
}

/**
 * Hace: consulta registro/control del worker y contenido de CacheStorage.
 * Existe para verificar registro real antes y después de reabrir, sin registrarlo.
 * Recibe: ningún argumento; se ejecuta dentro de page.evaluate.
 * Devuelve: metadatos del registro, controller y entradas de caché.
 * Errores: propaga fallos nativos al consultar serviceWorker o CacheStorage.
 */
export async function inspeccionarInstalacion() {
  const registro = await navigator.serviceWorker.getRegistration()
  const nombres = await caches.keys()
  const recursos = []
  for (const nombre of nombres) {
    const cache = await caches.open(nombre)
    const solicitudes = await cache.keys()
    for (const solicitud of solicitudes) recursos.push({ nombre, url: solicitud.url })
  }
  return {
    scope: registro?.scope,
    script: registro?.active?.scriptURL,
    estado: registro?.active?.state,
    controlador: navigator.serviceWorker.controller?.scriptURL,
    nombres,
    recursos,
  }
}

/**
 * Hace: indica si un worker activated ya controla esta página.
 * Existe para esperar la instalación completa antes de medir el uso offline.
 * Recibe: ningún argumento; se ejecuta dentro de page.waitForFunction.
 * Devuelve: promesa de booleano. Errores: propaga consultas de serviceWorker.
 */
export async function tieneControlActivo() {
  const registro = await navigator.serviceWorker.getRegistration()
  return registro?.active?.state === 'activated'
    && navigator.serviceWorker.controller?.scriptURL === registro.active.scriptURL
}

/**
 * Hace: escribe las tres entradas y elige un modo sin enviar el formulario.
 * Existe para comprobar edición sin recalcular y reutilizar los CA en Chromium.
 * Recibe: página y datos de un caso. Devuelve: promesa sin valor.
 * Errores: propaga timeouts si falta cualquier entrada u opción de la pantalla.
 */
export async function editarEntradas(pagina, { monto, personas, propina, modo }) {
  await pagina.getByLabel('Monto de la cuenta', { exact: true }).fill(monto)
  await pagina.getByLabel('Número de personas', { exact: true }).fill(personas)
  await pagina.getByLabel('Propina (%)', { exact: true }).fill(propina)
  await pagina.getByLabel('Redondeo', { exact: true }).selectOption({ label: modo })
}

/**
 * Hace: espía register antes de cargar una página de desarrollo.
 * Existe para detectar llamadas incluso si terminan sin un registro activo.
 * Recibe: ningún argumento; se ejecuta como init script del navegador.
 * Devuelve: undefined. Errores: propaga register original si una llamada ocurre.
 */
export function espiarRegistro() {
  globalThis.intentosDeRegistro = []
  const original = navigator.serviceWorker.register.bind(navigator.serviceWorker)
  /**
   * Hace: anota una llamada y delega al register original.
   * Existe para detectar el registro indebido en desarrollo sin bloquearlo.
   * Recibe: URL y opciones de register. Devuelve: promesa original.
   * Errores: conserva los del método original.
   */
  navigator.serviceWorker.register = function registrarEspiado(...argumentos) {
    globalThis.intentosDeRegistro.push(argumentos)
    return original(...argumentos)
  }
}

/**
 * Hace: devuelve las llamadas a register observadas en la página.
 * Existe para afirmar cero intentos de registro en desarrollo.
 * Recibe: nada; se ejecuta dentro de page.evaluate. Devuelve: array.
 * Errores: ninguno propio.
 */
export function leerIntentosDeRegistro() {
  return globalThis.intentosDeRegistro
}
