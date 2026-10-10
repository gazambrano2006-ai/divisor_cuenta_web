// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  completarCuenta, desmontarPantalla, editarCampo, montarPantalla,
  obtenerError, obtenerResultado, pulsarCalcular, seleccionarModo,
} from '../helpers/pantalla.js'

let pantalla

// Cada preparación monta main para no sustituir la composición; retorna undefined y propaga errores.
beforeEach(() => { pantalla = montarPantalla() })
// Cada limpieza recibe el montaje actual, retorna undefined y propaga errores de React.
afterEach(() => { desmontarPantalla(pantalla) })

// La suite recibe escenarios reales, comprueba UI y precisión; falla mediante aserciones de Vitest.
describe('US1 — calcular en Exacto con la composición real', () => {
  it.each([
    ['CA-001', '100.00', '4', '10', '27.50'],
    ['CA-002', '90.00', '3', '0', '30.00'],
    ['CA-005', '10.00', '3', '0', '3.33'],
    ['FR-004 una persona', '100.00', '1', '10', '110.00'],
    ['FR-007 cero', '0.00', '4', '20', '0.00'],
    ['FR-005 empate 1.005', '1.005', '1', '0', '1.01'],
    ['FR-005 empate 2.675', '2.675', '1', '0', '2.68'],
    ['FR-004 conserva total original', '0.02', '2', '49', '0.01'],
    ['FR-004 propina decimal', '100', '4', '12.5', '28.13'],
    ['FR-008 personas mayores al entero seguro', '0', '9007199254740993', '0', '0.00'],
    ['FR-007 monto grande', '1000000000000000000000', '1', '0', '1000000000000000000000.00'],
    ['FR-007 1e309 sin límite Number', '1e309', '1', '0', `1${'0'.repeat(309)}.00`],
  ])('%s muestra el importe individual con dos decimales', (_caso, monto, personas, porcentajePropina, esperado) => {
    const { contenedor } = pantalla
    completarCuenta(contenedor, { monto, personas, porcentajePropina })
    seleccionarModo(contenedor, 'exacto')
    pulsarCalcular(contenedor)
    expect(obtenerResultado(contenedor).textContent).toBe(`Por persona: ${esperado}`)
    expect(obtenerError(contenedor)).toBeNull()
  })

  it('FR-001/FR-002/SC-005 ofrece campos, opciones y Calcular en una pantalla', () => {
    const { contenedor } = pantalla
    expect(contenedor.querySelectorAll('input')).toHaveLength(3)
    expect(contenedor.querySelector('label[for="monto"]').textContent).toBe('Monto de la cuenta')
    expect(contenedor.querySelector('label[for="personas"]').textContent).toBe('Número de personas')
    expect(contenedor.querySelector('label[for="porcentajePropina"]').textContent).toBe('Propina (%)')
    expect(contenedor.querySelector('label[for="modoId"]').textContent).toBe('Redondeo')
    // Recibe cada opción y devuelve su etiqueta para comprobar la opción US1;
    // no produce errores de usuario ni exige estrategias de fases posteriores.
    expect([...contenedor.querySelectorAll('select option')].map((opcion) => opcion.textContent)).toContain('Exacto')
    expect(contenedor.querySelector('button[type="submit"]').textContent).toBe('Calcular')
  })

  it('FR-003 no muestra resultado inicial ni calcula al editar', () => {
    const { contenedor } = pantalla
    expect(obtenerResultado(contenedor)).toBeNull()
    expect(obtenerError(contenedor)).toBeNull()
    completarCuenta(contenedor, { monto: '100.00', personas: '4', porcentajePropina: '10' })
    expect(obtenerResultado(contenedor)).toBeNull()
    pulsarCalcular(contenedor)
    expect(obtenerResultado(contenedor).textContent).toBe('Por persona: 27.50')
    editarCampo(contenedor, 'monto', '200')
    expect(obtenerResultado(contenedor).textContent).toBe('Por persona: 27.50')
    pulsarCalcular(contenedor)
    expect(obtenerResultado(contenedor).textContent).toBe('Por persona: 55.00')
  })
})
