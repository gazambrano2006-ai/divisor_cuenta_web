import { describe, expect, it } from 'vitest'
import { validarEntrada } from '../../src/domain/validarEntrada.js'

/**
 * Reúne entradas inválidas para preservar mensajes, prioridad y ausencia de excepciones.
 * No recibe ni devuelve datos; Vitest informa los fallos del contrato.
 */
describe('validarEntrada: errores (T022, CA-003/CA-004, FR-008 a FR-010)', () => {
  /**
   * Comprueba rechazo completo del monto; recibe su texto y evita convertir parciales.
   * No devuelve datos; un rechazo o mensaje incorrecto produce fallo de expectativa.
   */
  it.each(['', '   ', 'abc', 'NaN', 'Infinity', '-Infinity', '-1', '-0.001', '1abc', '1,25', '0x10', '1e', '.', '+', '1.2.3'])(
    'rechaza el monto %s con el mensaje exacto', (monto) => {
      const entrada = { monto, personas: '3', porcentajePropina: '0' }
      expect(() => validarEntrada(entrada)).not.toThrow()
      expect(validarEntrada(entrada)).toEqual({
        valido: false,
        error: { campo: 'monto', mensaje: 'Monto inválido' },
      })
    })

  /**
   * Comprueba personas no numéricas o fraccionarias; recibe texto inválido.
   * No devuelve datos; Vitest comunica diferencias y excepciones inesperadas.
   */
  it.each(['', ' ', 'abc', 'NaN', 'Infinity', '1.5', '1e-1', '2 personas', '0x10'])(
    'rechaza personas %s sin truncarlas', (personas) => {
      const entrada = { monto: '50.00', personas, porcentajePropina: '0' }
      expect(() => validarEntrada(entrada)).not.toThrow()
      expect(validarEntrada(entrada)).toEqual({
        valido: false,
        error: { campo: 'personas', mensaje: 'Número de personas inválido' },
      })
    })

  /**
   * Verifica prioridad de no positividad antes de integralidad; recibe cantidad textual.
   * No devuelve datos; diferencias en el mensaje exacto producen fallos de expectativa.
   */
  it.each(['0', '-0', '-1', '-0.5', '-1e-3'])(
    'personas %s conserva «Debe haber al menos una persona»', (personas) => {
      const entrada = { monto: '50.00', personas, porcentajePropina: '0' }
      expect(() => validarEntrada(entrada)).not.toThrow()
      expect(validarEntrada(entrada)).toEqual({
        valido: false,
        error: { campo: 'personas', mensaje: 'Debe haber al menos una persona' },
      })
    })

  /**
   * Comprueba entradas inválidas de propina; recibe su texto.
   * No devuelve datos; Vitest reporta errores si se acepta un valor o lanza excepción.
   */
  it.each(['', ' ', 'abc', 'NaN', 'Infinity', '-1', '-0.001', '12%', '1e', '1,5'])(
    'rechaza la propina %s sin resultado numérico', (porcentajePropina) => {
      const entrada = { monto: '100', personas: '4', porcentajePropina }
      expect(() => validarEntrada(entrada)).not.toThrow()
      expect(validarEntrada(entrada)).toEqual({
        valido: false,
        error: { campo: 'porcentajePropina', mensaje: 'Propina inválida' },
      })
    })

  /**
   * Preserva el primer error monto → personas → propina para una salida determinista.
   * No recibe ni devuelve datos; sólo produce fallos de expectativa de Vitest.
   */
  it('informa errores en orden monto, personas y propina', () => {
    expect(validarEntrada({ monto: 'abc', personas: '0', porcentajePropina: '-1' }).error.campo)
      .toBe('monto')
    expect(validarEntrada({ monto: '100', personas: '0', porcentajePropina: '-1' }).error.campo)
      .toBe('personas')
    expect(validarEntrada({ monto: '100', personas: '4', porcentajePropina: '-1' }).error.campo)
      .toBe('porcentajePropina')
  })

  /**
   * Comprueba negativos cuya magnitud no hace falta calcular para rechazarlos.
   * Recibe campo y mensaje esperado; no devuelve datos y falla si aparece RangeError
   * o si se pierde el mensaje del formulario ante un exponente decimal enorme.
   */
  it.each([
    ['monto', 'Monto inválido'],
    ['personas', 'Debe haber al menos una persona'],
    ['porcentajePropina', 'Propina inválida'],
  ])('rechaza %s negativo antes de expandir su exponente', (campo, mensaje) => {
    const entrada = { monto: '100', personas: '4', porcentajePropina: '0' }
    entrada[campo] = '-1e999999999999999999999999'
    expect(validarEntrada(entrada)).toEqual({ valido: false, error: { campo, mensaje } })
  })

  /**
   * Distingue cero con signo de un negativo sin expandir un exponente enorme.
   * Recibe el campo que contiene -0; no devuelve datos y las aserciones detectan
   * excepciones o rechazo incorrecto de cero en monto y porcentaje de propina.
   */
  it.each(['monto', 'porcentajePropina'])(
    'acepta cero con signo y exponente enorme en %s', (campo) => {
      const entrada = { monto: '100', personas: '4', porcentajePropina: '0' }
      entrada[campo] = '-0e999999999999999999999999'
      const validacion = validarEntrada(entrada)
      expect(validacion.valido).toBe(true)
      expect(validacion.cuenta[campo]).toEqual({ numerador: 0n, denominador: 1n })
    },
  )

  /**
   * Conserva el error de personas no positivas para -0 con exponente enorme.
   * No recibe ni devuelve datos; Vitest falla ante una excepción o mensaje diferente.
   */
  it('rechaza personas -0 con exponente enorme con el mensaje de no positividad', () => {
    expect(validarEntrada({
      monto: '100',
      personas: '-0e999999999999999999999999',
      porcentajePropina: '0',
    })).toEqual({
      valido: false,
      error: { campo: 'personas', mensaje: 'Debe haber al menos una persona' },
    })
  })
})
