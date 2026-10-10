import { describe, expect, it, vi } from 'vitest'
import { calcularDivision } from '../../src/domain/calcularDivision.js'
import { crearResultado } from '../../src/domain/resultado.js'

/**
 * Agrupa la fórmula y sustitución del contrato abstracto, sin importar data.
 * No recibe ni devuelve datos; Vitest reporta los fallos de expectativa.
 */
describe('calcularDivision (T011, FR-004, SRP/LSP)', () => {
  /**
   * Comprueba la fórmula exacta y una sola llamada a la estrategia inyectada.
   * Recibe nombre y Cuenta válida; no devuelve datos y sólo señala fallos de aserción.
   */
  it.each([
    ['CA-001', {
      monto: { numerador: 10000n, denominador: 100n },
      personas: 4n,
      porcentajePropina: { numerador: 10n, denominador: 1n },
    }, { numerador: 1100000n, denominador: 40000n }],
    ['propina decimal', {
      monto: { numerador: 100n, denominador: 1n },
      personas: 4n,
      porcentajePropina: { numerador: 125n, denominador: 10n },
    }, { numerador: 112500n, denominador: 4000n }],
    ['0.02/2 con 49% conserva el total 0.0298', {
      monto: { numerador: 2n, denominador: 100n },
      personas: 2n,
      porcentajePropina: { numerador: 49n, denominador: 1n },
    }, { numerador: 298n, denominador: 20000n }],
    ['cero y personas por encima de Number seguro', {
      monto: { numerador: 0n, denominador: 1n },
      personas: 9007199254740993n,
      porcentajePropina: { numerador: 0n, denominador: 1n },
    }, { numerador: 0n, denominador: 900719925474099300n }],
  ])('%s', (nombre, cuenta, cocienteEsperado) => {
    // El doble sólo observa el contrato; devuelve un centavo para verificar delegación.
    const aplicar = vi.fn().mockReturnValue(1n)
    const resultado = calcularDivision(cuenta, { aplicar })
    expect(aplicar, nombre).toHaveBeenCalledTimes(1)
    expect(aplicar).toHaveBeenCalledWith(cocienteEsperado)
    expect(resultado).toEqual({ centavosPorPersona: 1n })
  })

  /**
   * Prueba sustituibilidad sin consultar tipos; no recibe ni devuelve datos.
   * Un retorno o uso distinto del contrato produce un fallo de expectativa.
   */
  it('acepta cualquier doble con aplicar sin inspeccionar tipos o modo', () => {
    const cuenta = {
      monto: Object.freeze({ numerador: 10n, denominador: 1n }),
      personas: 3n,
      porcentajePropina: Object.freeze({ numerador: 0n, denominador: 1n }),
    }
    Object.freeze(cuenta)
    const aplicarA = vi.fn().mockReturnValue(333n)
    const aplicarB = vi.fn().mockReturnValue(400n)
    expect(calcularDivision(cuenta, { aplicar: aplicarA })).toEqual({ centavosPorPersona: 333n })
    expect(calcularDivision(cuenta, { aplicar: aplicarB })).toEqual({ centavosPorPersona: 400n })
    expect(aplicarA.mock.calls[0]).toEqual(aplicarB.mock.calls[0])
  })

  /**
   * Comprueba que Resultado sólo representa centavos y no formatea o reparte.
   * No recibe ni devuelve datos; Vitest informa cualquier campo inesperado.
   */
  it('crearResultado representa el importe individual sin transformarlo', () => {
    expect(crearResultado(2750n)).toEqual({ centavosPorPersona: 2750n })
    expect(crearResultado(0n)).toEqual({ centavosPorPersona: 0n })
  })

  /**
   * Preserva errores de programación del contrato, sin convertirlos en errores de usuario.
   * No recibe ni devuelve datos; Vitest produce un fallo si se oculta el error inyectado.
   */
  it('no oculta los errores de una estrategia que incumple su contrato', () => {
    const cuenta = {
      monto: { numerador: 1n, denominador: 1n },
      personas: 1n,
      porcentajePropina: { numerador: 0n, denominador: 1n },
    }
    const error = new Error('Contrato incumplido')
    // El doble lanza un error de programación deliberado para verificar propagación.
    const aplicar = vi.fn().mockImplementation(() => { throw error })
    expect(() => calcularDivision(cuenta, { aplicar })).toThrow(error)
  })
})
