import { describe, expect, it } from 'vitest'
import { aplicar, etiqueta, id } from '../../src/data/redondeoExacto.js'

/**
 * Agrupa ejemplos del contrato Exacto para comprobar centavos sin pérdida binaria.
 * No recibe ni devuelve datos; Vitest comunica los errores de expectativa.
 */
describe('redondeoExacto.aplicar (T010, FR-005)', () => {
  /**
   * Contrasta importes, empates y cantidades grandes con resultados definidos.
   * Recibe nombre, fracción y centavos esperados; no devuelve datos, sólo aserciones.
   */
  it.each([
    ['CA-005: 10/3', 10n, 3n, 333n],
    ['cero', 0n, 3n, 0n],
    ['empate 1.005', 1005n, 1000n, 101n],
    ['empate 2.675', 2675n, 1000n, 268n],
    ['entero', 90n, 3n, 3000n],
    ['debajo de medio centavo', 49n, 10000n, 0n],
    ['medio centavo', 5n, 1000n, 1n],
    ['importe muy grande', 10n ** 309n, 1n, 10n ** 311n],
  ])('%s', (nombre, numerador, denominador, esperado) => {
    const valor = Object.freeze({ numerador, denominador })
    const obtenido = aplicar(valor)
    expect(obtenido, nombre).toBe(esperado)
    expect(typeof obtenido).toBe('bigint')
    expect(valor).toEqual({ numerador, denominador })
  })

  /**
   * Verifica metadatos usados por main sin crear una estrategia concreta.
   * No recibe ni devuelve datos; diferencias producen un fallo de expectativa.
   */
  it('exporta metadatos separados del contrato aplicar', () => {
    expect(id).toBe('exacto')
    expect(etiqueta).toBe('Exacto')
  })
})
