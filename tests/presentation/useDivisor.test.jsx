// @vitest-environment jsdom
import { act, useLayoutEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDivisor } from '../../src/presentation/useDivisor.js'

let raiz
let contenedor
let estado
let aplicarPrimero
let aplicarSegundo

/**
 * Expone el hook bajo React para probar sus acciones sin acoplarlo a UI ni data.
 * Recibe catálogo abstracto e id inicial; devuelve null, propaga errores del hook.
 */
function Sonda({ catalogo, modoInicialId }) {
  const actual = useDivisor(catalogo, modoInicialId)
  // Captura el estado tras el render para observar el hook sin efectos dentro
  // del render; no recibe argumentos, devuelve undefined y no genera errores.
  useLayoutEffect(() => { estado = actual })
  return null
}

/**
 * Completa una cuenta válida mediante acciones del hook. No recibe argumentos;
 * devuelve undefined y propaga errores de React; evita duplicar datos en cada caso.
 */
function prepararCuentaValida() {
  // act agrupa las ediciones, no recibe entradas adicionales y devuelve undefined; propaga errores del hook.
  act(() => {
    estado.editarEntrada('monto', '100.00')
    estado.editarEntrada('personas', '4')
    estado.editarEntrada('porcentajePropina', '10')
  })
}

// Prepara una raíz y dobles del contrato aplicar; devuelve undefined y propaga errores del montaje.
beforeEach(() => {
  contenedor = document.createElement('div')
  document.body.append(contenedor)
  raiz = createRoot(contenedor)
  aplicarPrimero = vi.fn().mockReturnValue(2750n)
  aplicarSegundo = vi.fn().mockReturnValue(2800n)
  const catalogo = [
    { id: 'opcion-a', etiqueta: 'Primera', estrategia: { aplicar: aplicarPrimero } },
    { id: 'opcion-b', etiqueta: 'Segunda', estrategia: { aplicar: aplicarSegundo } },
  ]
  // act recibe render de la sonda, retorna undefined y propaga errores de React.
  act(() => { raiz.render(<Sonda catalogo={catalogo} modoInicialId="opcion-a" />) })
})

// Libera la raíz y DOM de la sonda; devuelve undefined y propaga errores de React.
afterEach(() => {
  // act recibe un desmontaje, retorna undefined y propaga errores de React.
  act(() => { raiz.unmount() })
  contenedor.remove()
})

// Comprueba las transiciones de estado con estrategias abstractas; los fallos son aserciones de Vitest.
describe('useDivisor — estado local y coordinación abstracta', () => {
  it('FR-003 inicia sin resultado ni error y no conoce ids concretos de data', () => {
    expect(estado.entradas).toEqual({ monto: '', personas: '', porcentajePropina: '0' })
    expect(estado.modoId).toBe('opcion-a')
    expect(estado.salida).toEqual({ resultado: null, error: null })
    prepararCuentaValida()
    expect(aplicarPrimero).not.toHaveBeenCalled()
    expect(estado.salida.resultado).toBeNull()
  })

  it('FR-003 calcula con entradas actuales y la estrategia elegida sólo al enviar', () => {
    prepararCuentaValida()
    // act recibe el cálculo solicitado, devuelve undefined y propaga errores del contrato abstracto.
    act(() => { estado.calcular() })
    expect(aplicarPrimero).toHaveBeenCalledTimes(1)
    expect(estado.salida).toEqual({ resultado: { centavosPorPersona: 2750n }, error: null })
    // act cambia el modo, devuelve undefined y no aplica ninguna estrategia.
    act(() => { estado.cambiarModo('opcion-b') })
    expect(aplicarSegundo).not.toHaveBeenCalled()
    expect(estado.salida.resultado.centavosPorPersona).toBe(2750n)
    // act recibe el siguiente envío, devuelve undefined y propaga errores del contrato abstracto.
    act(() => { estado.calcular() })
    expect(aplicarSegundo).toHaveBeenCalledTimes(1)
    expect(estado.salida.resultado.centavosPorPersona).toBe(2800n)
  })

  it('FR-010/FR-011 sustituye válido → inválido → corregido sin conservar salida anterior', () => {
    prepararCuentaValida()
    // act recibe un envío válido, devuelve undefined y propaga errores de programación.
    act(() => { estado.calcular() })
    // act recibe una edición inválida, devuelve undefined y no valida automáticamente.
    act(() => { estado.editarEntrada('personas', '0') })
    // act recibe un envío inválido, devuelve undefined y el validador devuelve el error de usuario.
    act(() => { estado.calcular() })
    expect(estado.salida).toEqual({
      resultado: null,
      error: { campo: 'personas', mensaje: 'Debe haber al menos una persona' },
    })
    expect(aplicarPrimero).toHaveBeenCalledTimes(1)
    // act corrige la entrada, devuelve undefined y no recalcula automáticamente.
    act(() => { estado.editarEntrada('personas', '4') })
    // act recibe el envío corregido, devuelve undefined y propaga errores de programación.
    act(() => { estado.calcular() })
    expect(estado.salida.error).toBeNull()
    expect(estado.salida.resultado.centavosPorPersona).toBe(2750n)
  })
})
