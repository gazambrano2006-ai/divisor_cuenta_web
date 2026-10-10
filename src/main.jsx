import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { PantallaDivisor } from './presentation/PantallaDivisor.jsx'

// Vite descubre módulos al compilar: una regla nueva no requiere editar los consumidores.
const modulosRedondeo = import.meta.glob('./data/redondeo*.js', { eager: true })

/**
 * Crea las estrategias concretas y su catálogo para conectar data con presentation.
 * Recibe módulos con id, etiqueta y aplicar; devuelve un catálogo ordenado por id.
 * Existe como único punto de composición. Lanza Error ante metadatos inválidos o repetidos.
 */
export function crearCatalogo(modulos) {
  const ids = new Set()
  // La conversión recibe exports de cada módulo y devuelve su descriptor; errores de composición.
  const catalogo = Object.values(modulos).map((modulo) => {
    const { id, etiqueta, aplicar } = modulo
    if (typeof id !== 'string' || !id || ids.has(id)
      || typeof etiqueta !== 'string' || !etiqueta || typeof aplicar !== 'function') {
      throw new Error('Contrato o identificador de redondeo inválido')
    }
    ids.add(id)
    return { id, etiqueta, estrategia: { aplicar } }
  })
  // Compara dos ids para que el orden sea estable; devuelve -1/0/1 y no produce errores propios.
  return catalogo.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
}

/**
 * Monta la pantalla con sus dependencias reales, también en los escenarios de aceptación.
 * Recibe un elemento DOM y devuelve la raíz React para desmontarla al terminar.
 * Existe para conectar las capas aquí. Propaga errores de composición o del montaje React.
 */
export function montarAplicacion(elemento) {
  const catalogo = crearCatalogo(modulosRedondeo)
  const modoInicialId = 'exacto'
  // Comprueba una configuración inicial, no el tipo de una estrategia; devuelve booleano, sin errores.
  if (!catalogo.some((opcion) => opcion.id === modoInicialId)) {
    throw new Error('El modo inicial no está disponible')
  }
  const raiz = createRoot(elemento)
  raiz.render(
    <StrictMode>
      <PantallaDivisor catalogo={catalogo} modoInicialId={modoInicialId} />
    </StrictMode>,
  )
  return raiz
}

/**
 * Prepara el worker únicamente en producción, sin bloquear el formulario.
 * No recibe argumentos; devuelve el registro o null si la plataforma no lo utiliza.
 * Existe para abrir el build offline. Propaga fallos de las APIs de registro.
 * Reutiliza un registro activo del mismo ámbito/script sin solicitar su actualización.
 */
export async function prepararWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return null
  const scope = new URL(import.meta.env.BASE_URL, document.baseURI).href
  const scriptURL = new URL('sw.js', scope).href
  const registro = await navigator.serviceWorker.getRegistration(scope)
  if (registro?.scope === scope && registro.active?.scriptURL === scriptURL) return registro
  return navigator.serviceWorker.register(scriptURL, { scope })
}

const elementoInicial = typeof document === 'undefined' ? null : document.getElementById('root')
if (elementoInicial) {
  montarAplicacion(elementoInicial)
  // Recibe un fallo de preparación, lo informa en consola y devuelve undefined; no bloquea el cálculo.
  void prepararWorker().catch((error) => console.warn('No se pudo preparar la apertura offline', error))
}
