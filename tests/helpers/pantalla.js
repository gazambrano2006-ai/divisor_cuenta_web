import { act } from 'react'
import { montarAplicacion } from '../../src/main.jsx'

/**
 * Monta la composición real para comprobar el flujo del usuario. No recibe datos;
 * devuelve contenedor y raíz para aislar cada caso. Propaga errores de montaje.
 */
export function montarPantalla() {
  const contenedor = document.createElement('div')
  document.body.append(contenedor)
  let raiz
  // act recibe el montaje, sincroniza React y devuelve undefined; propaga errores de React.
  act(() => { raiz = montarAplicacion(contenedor) })
  return { contenedor, raiz }
}

/**
 * Desmonta una pantalla para no compartir estado entre pruebas. Recibe su montaje,
 * devuelve undefined y propaga errores de React; admite una referencia ausente.
 */
export function desmontarPantalla(pantalla) {
  if (!pantalla) return
  // act recibe la limpieza, sincroniza React y devuelve undefined; propaga errores del desmontaje.
  act(() => { pantalla.raiz.unmount() })
  pantalla.contenedor.remove()
}

/**
 * Edita un campo como el usuario, evitando el setter que React instala en el DOM.
 * Recibe contenedor, nombre y texto; devuelve undefined. Un nombre ausente es error de la prueba.
 */
export function editarCampo(contenedor, nombre, valor) {
  const entrada = contenedor.querySelector(`[name="${nombre}"]`)
  const establecerValor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
  // act recibe una edición DOM, aplica el evento y devuelve undefined; propaga errores del helper.
  act(() => {
    establecerValor.call(entrada, valor)
    entrada.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

/**
 * Cambia la opción visible para probar que el cálculo usa el modo actual.
 * Recibe contenedor e id; devuelve undefined. Propaga errores si falta el selector.
 */
export function seleccionarModo(contenedor, modoId) {
  const selector = contenedor.querySelector('[name="modoId"]')
  // act recibe el cambio del selector, sincroniza React y devuelve undefined; propaga errores DOM.
  act(() => {
    selector.value = modoId
    selector.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

/**
 * Completa las tres entradas para reutilizar escenarios sin saltarse el DOM.
 * Recibe contenedor y textos de cuenta; devuelve undefined y propaga errores de edición.
 */
export function completarCuenta(contenedor, { monto, personas, porcentajePropina }) {
  editarCampo(contenedor, 'monto', monto)
  editarCampo(contenedor, 'personas', personas)
  editarCampo(contenedor, 'porcentajePropina', porcentajePropina)
}

/**
 * Pulsa Calcular para probar el envío real. Recibe contenedor, devuelve undefined
 * y propaga errores de React/DOM o de un contrato de programación incumplido.
 */
export function pulsarCalcular(contenedor) {
  // act recibe el clic, sincroniza la salida de React y devuelve undefined; propaga errores DOM.
  act(() => { contenedor.querySelector('button[type="submit"]').click() })
}

/**
 * Lee el resultado para comparar texto exacto y ausencia de salida. Recibe
 * contenedor, devuelve el elemento o null; no produce errores de usuario.
 */
export function obtenerResultado(contenedor) {
  return contenedor.querySelector('[data-testid="resultado"]')
}

/**
 * Lee el error visible para comprobar mensajes. Recibe contenedor y devuelve
 * el elemento o null; no produce errores de usuario.
 */
export function obtenerError(contenedor) {
  return contenedor.querySelector('[role="alert"]')
}
