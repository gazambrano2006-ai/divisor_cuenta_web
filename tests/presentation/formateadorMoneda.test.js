import { describe, expect, it } from 'vitest'
import { formateadorMoneda } from '../../src/presentation/formateadorMoneda.js'

// La suite recibe casos de centavos y verifica su texto; no redondea y devuelve aserciones.
describe('FR-007 / SC-002 — formateadorMoneda', () => {
  it.each([
    [0n, '0.00'],
    [333n, '3.33'],
    [2750n, '27.50'],
    [400n, '4.00'],
    [1n, '0.01'],
    [99n, '0.99'],
    [100000000000000000000000n, '1000000000000000000000.00'],
    [10n ** 311n, `1${'0'.repeat(309)}.00`],
  ])('centavos %s se muestran como %s', (centavos, texto) => {
    expect(formateadorMoneda(centavos)).toBe(texto)
  })
})
