import { access, readdir } from 'node:fs/promises'
import { resolve, relative, sep } from 'node:path'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  cerrarPreview,
  editarEntradas,
  espiarRegistro,
  iniciarPreviewMedido,
  inspeccionarInstalacion,
  leerIntentosDeRegistro,
  observarContexto,
  origen,
  tieneControlActivo,
} from './entornoOffline.js'

const casos = [
  { id: 'CA-001', monto: '100.00', personas: '4', propina: '10', modo: 'Exacto', salida: '27.50' },
  { id: 'CA-002', monto: '90.00', personas: '3', propina: '0', modo: 'Exacto', salida: '30.00' },
  { id: 'CA-003', monto: '50.00', personas: '0', propina: '0', modo: 'Exacto', error: 'Debe haber al menos una persona' },
  { id: 'CA-004', monto: 'abc', personas: '3', propina: '0', modo: 'Exacto', error: 'Monto inválido' },
  { id: 'CA-005', monto: '10.00', personas: '3', propina: '0', modo: 'Exacto', salida: '3.33' },
  { id: 'CA-006', monto: '10.00', personas: '3', propina: '0', modo: 'Hacia arriba', salida: '4.00' },
]

/**
 * Hace: obtiene las rutas estáticas reales del build sin incluir el propio worker.
 * Existe para comprobar que la caché contiene todo el build y sólo esos archivos.
 * Recibe: directorio del build. Devuelve: promesa de rutas relativas normalizadas.
 * Errores: propaga fallos de lectura del filesystem si el build no está preparado.
 */
async function listarRecursos(directorio) {
  const recursos = []
  /**
   * Hace: recorre una carpeta y acumula los archivos relativos a dist.
   * Existe para incluir los activos anidados del build, sin lista codificada.
   * Recibe: carpeta absoluta. Devuelve: promesa sin valor.
   * Errores: propaga readdir si una carpeta no se puede leer.
   */
  async function visitar(carpeta) {
    const entradas = await readdir(carpeta, { withFileTypes: true })
    for (const entrada of entradas) {
      const archivo = resolve(carpeta, entrada.name)
      if (entrada.isDirectory()) await visitar(archivo)
      else if (entrada.isFile() && archivo !== resolve(directorio, 'sw.js')) {
        recursos.push(relative(directorio, archivo).split(sep).join('/'))
      }
    }
  }
  await visitar(directorio)
  return recursos.sort()
}

/**
 * Hace: comprueba scope, scriptURL, estado y control del worker esperado.
 * Existe para demostrar registro/control reales, sin confundirlos con ready.
 * Recibe: inspección de la página. Devuelve: undefined.
 * Errores: lanza aserciones Vitest cuando el registro no corresponde al build.
 */
function verificarRegistro(inspeccion) {
  expect(inspeccion.scope).toBe(`${origen}/`)
  expect(inspeccion.script).toBe(`${origen}/sw.js`)
  expect(inspeccion.estado).toBe('activated')
  expect(inspeccion.controlador).toBe(`${origen}/sw.js`)
}

/**
 * Hace: envía un CA y comprueba importe o error exacto en la página actual.
 * Existe para ejecutar las mismas reglas mediante la pantalla offline completa.
 * Recibe: página y caso con salida/error. Devuelve: promesa sin valor.
 * Errores: lanza aserciones Vitest o timeouts de Playwright si falla el caso.
 */
async function verificarCaso(pagina, caso) {
  await editarEntradas(pagina, caso)
  await pagina.getByRole('button', { name: 'Calcular', exact: true }).click()
  if (caso.error) {
    await pagina.getByRole('alert').waitFor({ state: 'visible' })
    expect(await pagina.getByRole('alert').textContent(), caso.id).toBe(caso.error)
    expect(await pagina.getByTestId('resultado').count(), caso.id).toBe(0)
  } else {
    await pagina.getByTestId('resultado').waitFor({ state: 'visible' })
    expect(await pagina.getByTestId('resultado').textContent(), caso.id).toBe(`Por persona: ${caso.salida}`)
    expect(caso.salida, caso.id).toMatch(/^\d+\.\d{2}$/)
    expect(await pagina.getByRole('alert').count(), caso.id).toBe(0)
  }
}

/**
 * Hace: agrupa aceptación offline y ausencia de registro en desarrollo.
 * Existe para verificar FR-012/T034 con el navegador real bajo Vitest.
 * Recibe: ningún argumento. Devuelve: undefined. Errores: los de sus pruebas.
 */
describe('FR-012 / SC-004: abrir, editar, validar y calcular sin tráfico real', function suiteOffline() {
  let navegador
  let medidor

  /**
   * Hace: exige build/worker y prepara Chromium y preview instrumentado.
   * Existe para separar la preparación de la ventana observada sin conexión.
   * Recibe: nada. Devuelve: promesa sin valor.
   * Errores: propaga build ausente, puerto ocupado o Chromium no instalado.
   */
  beforeAll(async function prepararHerramientas() {
    await access(resolve('dist/index.html'))
    await access(resolve('dist/sw.js'))
    medidor = await iniciarPreviewMedido()
    navegador = await chromium.launch({ headless: true })
  })

  /**
   * Hace: cierra Chromium y preview aunque una prueba haya fallado.
   * Existe para liberar recursos y el puerto al terminar Vitest.
   * Recibe: nada. Devuelve: promesa sin valor. Errores: propaga errores de cierre.
   */
  afterAll(async function cerrarHerramientas() {
    try {
      if (navegador) await navegador.close()
    } finally {
      if (medidor) await cerrarPreview(medidor.servidor)
    }
  })

  /**
   * Hace: precarga online y prueba dos aperturas nuevas offline y todos los CA.
   * Existe para cubrir A1, incluyendo red del worker y estado sin cuentas guardadas.
   * Recibe: nada. Devuelve: promesa sin valor.
   * Errores: propaga fallos de instalación, navegación y aserciones de aceptación.
   */
  it('CA-001 a CA-006 / T034: reabre desde caché, conserva registro y produce cero tráfico real', async function verificarReapertura() {
    const contexto = await navegador.newContext({ serviceWorkers: 'allow' })
    try {
      const precarga = await contexto.newPage()
      await precarga.goto(origen)
      await precarga.getByRole('button', { name: 'Calcular', exact: true }).waitFor()
      await precarga.waitForFunction(tieneControlActivo)
      await precarga.waitForLoadState('networkidle')
      const preparada = await precarga.evaluate(inspeccionarInstalacion)
      verificarRegistro(preparada)
      const recursosReales = await listarRecursos(resolve('dist'))
      const esperados = []
      for (const recurso of recursosReales) esperados.push(new URL(recurso, `${origen}/`).href)
      const almacenados = []
      for (const recurso of preparada.recursos) almacenados.push(recurso.url)
      expect(preparada.nombres).toHaveLength(1)
      expect(almacenados.sort()).toEqual(esperados.sort())
      expect(medidor.accesos.length).toBeGreaterThan(0)
      await precarga.close()
      await contexto.setOffline(true)

      // La medición comienza antes de crear o navegar ninguna página desconectada.
      const inicioAccesos = medidor.accesos.length
      const observacion = observarContexto(contexto)
      const pagina = await contexto.newPage()
      await pagina.goto(origen)
      await pagina.getByRole('button', { name: 'Calcular', exact: true }).waitFor()
      expect(await pagina.getByTestId('resultado').count()).toBe(0)
      expect(await pagina.getByRole('alert').count()).toBe(0)
      verificarRegistro(await pagina.evaluate(inspeccionarInstalacion))

      await editarEntradas(pagina, casos[0])
      expect(await pagina.getByTestId('resultado').count()).toBe(0)
      // Errores desde estado inicial y recuperación posterior sin abandonar la pantalla.
      await verificarCaso(pagina, casos[2])
      await verificarCaso(pagina, casos[3])
      await verificarCaso(pagina, casos[0])
      await verificarCaso(pagina, casos[1])
      await verificarCaso(pagina, casos[0])
      await verificarCaso(pagina, casos[2])
      await verificarCaso(pagina, casos[0])
      await verificarCaso(pagina, casos[3])
      await verificarCaso(pagina, casos[4])
      await editarEntradas(pagina, casos[5])
      expect(await pagina.getByTestId('resultado').textContent()).toBe('Por persona: 3.33')
      await verificarCaso(pagina, casos[5])
      await verificarCaso(pagina, casos[4])
      expect(pagina.url()).toBe(`${origen}/`)
      const despues = await pagina.evaluate(inspeccionarInstalacion)
      expect(despues.recursos).toEqual(preparada.recursos)
      await pagina.close()

      // Una segunda reapertura verifica que no se depende de una pestaña viva.
      const reabierta = await contexto.newPage()
      await reabierta.goto(`${origen}/`)
      await reabierta.getByRole('button', { name: 'Calcular', exact: true }).waitFor()
      expect(await reabierta.getByTestId('resultado').count()).toBe(0)
      expect(await reabierta.getByRole('alert').count()).toBe(0)
      verificarRegistro(await reabierta.evaluate(inspeccionarInstalacion))
      await verificarCaso(reabierta, casos[0])
      await reabierta.waitForLoadState('networkidle')
      await reabierta.close()

      expect(medidor.accesos.slice(inicioAccesos), 'Accesos efectivos al servidor, incluidos sw.js y actualizaciones').toEqual([])
      expect(observacion.fallos, 'Ninguna acción intenta una petición fallida de red').toEqual([])
      for (const peticion of observacion.peticiones) {
        expect(peticion.worker, `El worker no debe reenviar a red: ${peticion.url}`).toBe(false)
        expect(new URL(peticion.url).origin, `Ningún destino externo: ${peticion.url}`).toBe(origen)
      }
      const tipos = new Set()
      for (const respuesta of observacion.respuestas) {
        expect(respuesta.desdeWorker, `Respuesta local del worker: ${respuesta.url}`).toBe(true)
        expect(respuesta.worker, `Ninguna respuesta de fetch del worker: ${respuesta.url}`).toBe(false)
        expect(respuesta.estado).toBe(200)
        tipos.add(respuesta.tipo)
      }
      expect(tipos.has('document')).toBe(true)
      expect(tipos.has('script')).toBe(true)
      expect(tipos.has('stylesheet')).toBe(true)
    } finally {
      await contexto.close()
    }
  })

  /**
   * Hace: abre el servidor de desarrollo y registra cualquier intento de register.
   * Existe para comprobar el registro sólo en producción sin simular el worker.
   * Recibe: nada. Devuelve: promesa sin valor.
   * Errores: propaga fallos de Vite/Playwright/aserciones y cierra ambos recursos.
   */
  it('T034: en desarrollo no intenta registrar ningún worker', async function verificarDesarrollo() {
    const servidor = await createServer({
      configFile: 'vite.config.js',
      mode: 'development',
      server: { host: 'localhost', port: 0, open: false },
    })
    const contexto = await navegador.newContext({ serviceWorkers: 'allow' })
    try {
      await servidor.listen()
      const direccion = servidor.httpServer.address()
      const url = `http://localhost:${direccion.port}`
      await contexto.addInitScript(espiarRegistro)
      const pagina = await contexto.newPage()
      await pagina.goto(url)
      await verificarCaso(pagina, casos[0])
      expect(await pagina.evaluate(leerIntentosDeRegistro)).toEqual([])
      const instalacion = await pagina.evaluate(inspeccionarInstalacion)
      expect(instalacion.scope).toBeUndefined()
      expect(instalacion.controlador).toBeUndefined()
      expect(instalacion.nombres).toEqual([])
    } finally {
      await contexto.close()
      await servidor.close()
    }
  })
})
