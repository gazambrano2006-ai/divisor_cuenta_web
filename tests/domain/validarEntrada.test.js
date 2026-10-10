import { describe, expect, it } from 'vitest'
import { crearCuenta } from '../../src/domain/cuenta.js'
import { validarEntrada } from '../../src/domain/validarEntrada.js'

/**
 * Agrupa la normalización para comprobar precisión y valores de Cuenta.
 * No recibe argumentos ni devuelve datos; Vitest comunica fallos de expectativa.
 */
describe('validarEntrada: normalización exacta (T008, FR-008/FR-009)', () => {
  /**
   * Comprueba decimales completos sin truncamiento; recibe texto y fracción esperada.
   * No devuelve datos y sólo produce fallos de expectativa si cambia el contrato.
   */
  it.each([
    ['1.005', 1005n, 1000n],
    ['2.675', 2675n, 1000n],
    ['+1.25', 125n, 100n],
    ['.125', 125n, 1000n],
    ['1.', 1n, 1n],
    ['  12.50  ', 1250n, 100n],
    ['1.25e2', 125n, 1n],
    ['12e-2', 12n, 100n],
    ['+1.25E+2', 125n, 1n],
    ['1e309', 10n ** 309n, 1n],
    ['1e-309', 1n, 10n ** 309n],
  ])('normaliza %s sin perder dígitos', (monto, numerador, denominador) => {
    const entrada = { monto, personas: '1', porcentajePropina: '0' }
    const validacion = validarEntrada(entrada)

    expect(validacion.valido).toBe(true)
    expect(validacion.cuenta.monto).toEqual({ numerador, denominador })
    expect(validacion.cuenta.personas).toBe(1n)
    expect(validacion.cuenta.porcentajePropina).toEqual({
      numerador: 0n,
      denominador: 1n,
    })
    expect(entrada).toEqual({ monto, personas: '1', porcentajePropina: '0' })
  })

  /**
   * Conserva propina decimal para verificar FR-004; no recibe ni devuelve datos.
   * Un valor incorrecto produce únicamente un fallo de expectativa de Vitest.
   */
  it('conserva todos los decimales de la propina', () => {
    const validacion = validarEntrada({
      monto: '100',
      personas: '4',
      porcentajePropina: '12.3456',
    })
    expect(validacion.cuenta.porcentajePropina).toEqual({
      numerador: 123456n,
      denominador: 10000n,
    })
  })

  /**
   * Verifica integralidad exacta de personas; recibe texto y entero esperado.
   * No devuelve datos; Vitest señala errores cuando la normalización no coincide.
   */
  it.each([
    ['9007199254740993', 9007199254740993n],
    ['4.0', 4n],
    ['4e0', 4n],
    ['2e2', 200n],
    ['100e-2', 1n],
    ['1e309', 10n ** 309n],
  ])('admite personas %s sin máximo de enteros seguros', (personas, esperado) => {
    const validacion = validarEntrada({ monto: '0', personas, porcentajePropina: '0' })
    expect(validacion.valido).toBe(true)
    expect(validacion.cuenta.personas).toBe(esperado)
  })

  /**
   * Distingue un cero válido del vacío para evitar resultados engañosos.
   * No recibe ni devuelve datos; Vitest produce los fallos de aserción.
   */
  it('no confunde vacío con cero', () => {
    expect(validarEntrada({ monto: '0', personas: '1', porcentajePropina: '0' }).valido)
      .toBe(true)
    expect(validarEntrada({ monto: '', personas: '1', porcentajePropina: '0' }))
      .toEqual({ valido: false, error: { campo: 'monto', mensaje: 'Monto inválido' } })
  })

  /**
   * Verifica que la fábrica conserve datos normalizados sin validarlos o formatearlos.
   * No recibe ni devuelve datos; cualquier diferencia produce un fallo de expectativa.
   */
  it('crearCuenta representa los tres datos normalizados sin añadir reglas', () => {
    const datos = {
      monto: { numerador: 1005n, denominador: 1000n },
      personas: 3n,
      porcentajePropina: { numerador: 5n, denominador: 10n },
    }
    expect(crearCuenta(datos)).toEqual(datos)
  })
})
