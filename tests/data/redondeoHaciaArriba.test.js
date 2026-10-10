import { describe, expect, it } from 'vitest'
import { aplicar, etiqueta, id } from '../../src/data/redondeoHaciaArriba.js'

/**
 * Agrupa ejemplos del techo entero para verificar el mismo contrato de estrategias.
 * No recibe ni devuelve datos; Vitest comunica fallos de expectativa.
 */
describe('redondeoHaciaArriba.aplicar (T027, CA-006, FR-006)', () => {
  /**
   * Comprueba techo del cociente original, cero e importes grandes sin mutación.
   * Recibe nombre, fracción y centavos esperados; no devuelve datos, sólo aserciones.
   */
  it.each([
    ['CA-006: 10/3', 10n, 3n, 400n],
    ['entero 90/3 no aumenta', 90n, 3n, 3000n],
    ['3.0001 usa el cociente original', 30001n, 10000n, 400n],
    ['cero', 0n, 3n, 0n],
    ['fracción menor que un centavo', 1n, 10000n, 100n],
    ['importe muy grande', 10n ** 309n, 1n, 10n ** 311n],
  ])('%s', (nombre, numerador, denominador, esperado) => {
    const valor = Object.freeze({ numerador, denominador })
    const obtenido = aplicar(valor)
    expect(obtenido, nombre).toBe(esperado)
    expect(typeof obtenido).toBe('bigint')
    expect(valor).toEqual({ numerador, denominador })
  })

  /**
   * Comprueba metadatos sin instanciar implementaciones fuera de main.
   * No recibe ni devuelve datos; diferencias producen errores de expectativa.
   */
  it('exporta id y etiqueta para el catálogo genérico', () => {
    expect(id).toBe('hacia-arriba')
    expect(etiqueta).toBe('Hacia arriba')
  })
})
