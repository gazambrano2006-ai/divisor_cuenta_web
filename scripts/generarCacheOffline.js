import { createHash } from 'node:crypto'
import { access, readFile, readdir, writeFile } from 'node:fs/promises'
import { resolve, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const directorioBuild = fileURLToPath(new URL('../dist/', import.meta.url))

/**
 * Hace: enumera todos los archivos estáticos del build, excepto su propio sw.js.
 * Existe para precargar los recursos reales, incluidos archivos anidados.
 * Recibe: carpeta actual y raíz del build. Devuelve: promesa de rutas relativas.
 * Errores: propaga errores del filesystem; no omite una carpeta ilegible.
 */
async function enumerarArchivos(carpeta, raiz) {
  const archivos = []
  const entradas = await readdir(carpeta, { withFileTypes: true })
  for (const entrada of entradas) {
    const archivo = resolve(carpeta, entrada.name)
    if (entrada.isDirectory()) {
      archivos.push(...await enumerarArchivos(archivo, raiz))
    } else if (entrada.isFile() && archivo !== resolve(raiz, 'sw.js')) {
      archivos.push(relative(raiz, archivo).split(sep).join('/'))
    }
  }
  return archivos.sort()
}

/**
 * Hace: codifica cada segmento de una ruta relativa como una URL de recurso.
 * Existe para preservar archivos con espacios o caracteres reservados en su nombre.
 * Recibe: ruta relativa normalizada con /. Devuelve: texto relativo codificado.
 * Errores: encodeURIComponent puede lanzar URIError ante texto Unicode inválido.
 */
function codificarRuta(ruta) {
  const segmentos = []
  for (const segmento of ruta.split('/')) segmentos.push(encodeURIComponent(segmento))
  return segmentos.join('/')
}

/**
 * Hace: crea la huella SHA-256 de nombres y contenido de los recursos del build.
 * Existe para separar cachés de builds diferentes sin incluir el propio worker.
 * Recibe: lista ordenada de archivos y raíz del build. Devuelve: promesa de huella.
 * Errores: propaga errores de lectura o de la API criptográfica de Node.
 */
async function calcularHuella(archivos, raiz) {
  const huella = createHash('sha256')
  for (const archivo of archivos) {
    const contenido = await readFile(resolve(raiz, archivo))
    huella.update(archivo)
    huella.update('\0')
    huella.update(String(contenido.length))
    huella.update('\0')
    huella.update(contenido)
  }
  return huella.digest('hex')
}

/**
 * Hace: produce el código del worker con recursos relativos y una caché de build.
 * Existe para distribuir soporte offline nativo sin dependencias ni datos de cuentas.
 * Recibe: URLs relativas codificadas y huella. Devuelve: código JavaScript como texto.
 * Errores: ninguno propio; el worker generado propaga los errores de precarga.
 */
function generarWorker(recursos, huella) {
  return `// Generado por scripts/generarCacheOffline.js; guarda sólo recursos estáticos.
const RECURSOS = ${JSON.stringify(recursos, null, 2)}
const AMBITO = new URL(self.registration.scope)
const PREFIJO = 'divisor-cuenta-web-' + encodeURIComponent(AMBITO.href) + '-'
const NOMBRE_CACHE = PREFIJO + '${huella}'

/**
 * Hace: precarga todos los recursos antes de permitir la activación del worker.
 * Existe para que una instalación parcial nunca controle una apertura offline.
 * Recibe: nada. Devuelve: promesa sin valor tras precarga completa y skipWaiting.
 * Errores: borra una caché incompleta y propaga fallos de descarga/CacheStorage.
 */
async function prepararCache() {
  try {
    const cache = await caches.open(NOMBRE_CACHE)
    const solicitudes = []
    for (const recurso of RECURSOS) {
      solicitudes.push(new Request(new URL(recurso, AMBITO), { cache: 'reload' }))
    }
    await cache.addAll(solicitudes)
    await self.skipWaiting()
  } catch (error) {
    await caches.delete(NOMBRE_CACHE)
    throw error
  }
}

/**
 * Hace: mantiene pendiente la instalación hasta completar la precarga.
 * Existe para separar la preparación online del uso posterior sin conexión.
 * Recibe: InstallEvent. Devuelve: undefined. Errores: waitUntil refleja precarga fallida.
 */
self.addEventListener('install', function instalar(evento) {
  evento.waitUntil(prepararCache())
})

/**
 * Hace: elimina cachés antiguas de esta aplicación/ámbito y reclama sus páginas.
 * Existe para activar sólo el build completo y conservar cachés ajenas.
 * Recibe: nada. Devuelve: promesa sin valor.
 * Errores: propaga fallos de CacheStorage o clients.claim.
 */
async function activarCache() {
  const nombres = await caches.keys()
  for (const nombre of nombres) {
    if (nombre.startsWith(PREFIJO) && nombre !== NOMBRE_CACHE) await caches.delete(nombre)
  }
  await self.clients.claim()
}

/**
 * Hace: espera la limpieza propia y el control de páginas al activar.
 * Existe para que la preparación pueda comprobar un controller activated real.
 * Recibe: ExtendableEvent. Devuelve: undefined. Errores: waitUntil refleja activación fallida.
 */
self.addEventListener('activate', function activar(evento) {
  evento.waitUntil(activarCache())
})

/**
 * Hace: busca una respuesta estática local, incluida navegación a la raíz del ámbito.
 * Existe para abrir la aplicación sin enviar solicitudes a la red.
 * Recibe: Request y URL de la petición. Devuelve: promesa de Response de caché.
 * Errores: propaga CacheStorage; un recurso ausente devuelve Response.error sin fetch.
 */
async function responderDesdeCache(solicitud, url) {
  const cache = await caches.open(NOMBRE_CACHE)
  const esRaiz = solicitud.mode === 'navigate' && url.pathname === AMBITO.pathname
  const recurso = esRaiz ? new URL('index.html', AMBITO).href : url.href
  const respuesta = await cache.match(recurso, { ignoreSearch: true })
  return respuesta || Response.error()
}

/**
 * Hace: atiende GET de este origen/ámbito exclusivamente con recursos precargados.
 * Existe para cargar HTML/JS/CSS sin red; no procesa ni guarda datos del formulario.
 * Recibe: FetchEvent. Devuelve: undefined. Errores: respondWith refleja errores de caché.
 */
self.addEventListener('fetch', function atenderRecurso(evento) {
  const url = new URL(evento.request.url)
  if (evento.request.method !== 'GET' || url.origin !== AMBITO.origin || !url.href.startsWith(AMBITO.href)) return
  evento.respondWith(responderDesdeCache(evento.request, url))
})
`
}

await access(resolve(directorioBuild, 'index.html'))
const archivos = await enumerarArchivos(directorioBuild, directorioBuild)
const recursos = []
for (const archivo of archivos) recursos.push(codificarRuta(archivo))
const huella = await calcularHuella(archivos, directorioBuild)
await writeFile(resolve(directorioBuild, 'sw.js'), generarWorker(recursos, huella), 'utf8')
process.stdout.write(`Worker offline generado: ${recursos.length} recursos estáticos.\n`)
