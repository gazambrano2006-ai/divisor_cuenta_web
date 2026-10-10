import { useState } from 'react'
import { validarEntrada } from '../domain/validarEntrada.js'
import { calcularDivision } from '../domain/calcularDivision.js'

/**
 * Mantiene entradas, selección y salida para coordinar validación y cálculo al
 * enviar. Recibe el catálogo inyectado y su id inicial; devuelve estado y acciones.
 * Los errores de entrada se devuelven en salida, sin excepciones. Un catálogo o
 * contrato incorrecto es un error de programación y sus excepciones se propagan.
 * @param {Array<{id: string, etiqueta: string, estrategia: import('../domain/estrategiaRedondeo.js').EstrategiaRedondeo}>} catalogo
 * @param {string} modoInicialId
 */
export function useDivisor(catalogo, modoInicialId) {
  const [entradas, setEntradas] = useState({ monto: '', personas: '', porcentajePropina: '0' })
  const [modoId, setModoId] = useState(modoInicialId)
  const [salida, setSalida] = useState({ resultado: null, error: null })

  /**
   * Guarda el texto de un campo para conservar la precisión de lo ingresado.
   * Recibe nombre de campo y texto; devuelve undefined. No valida ni calcula;
   * un nombre fuera de los tres campos es un error de programación del consumidor.
   */
  function editarEntrada(campo, valor) {
    // Recibe el estado anterior y devuelve una copia editada para conservar los
    // otros campos. Este actualizador no produce errores de usuario.
    setEntradas((anteriores) => ({ ...anteriores, [campo]: valor }))
  }

  /**
   * Guarda la selección para utilizarla en el próximo envío. Recibe un id del
   * catálogo, devuelve undefined y no calcula ni valida. Un id inexistente
   * incumple el contrato de la presentación y fallará al solicitar el cálculo.
   */
  function cambiarModo(id) {
    setModoId(id)
  }

  /**
   * Coordina un envío con los datos actuales: valida y, si son válidos, calcula.
   * No recibe argumentos; devuelve undefined y reemplaza la salida completa.
   * Los errores de usuario van en salida.error, con resultado null; los errores
   * de programación de una estrategia o catálogo se propagan.
   */
  function calcular() {
    const validacion = validarEntrada(entradas)
    if (!validacion.valido) {
      setSalida({ resultado: null, error: validacion.error })
      return
    }
    // Recibe una opción y devuelve si coincide con el id; permite elegir por
    // configuración y no produce errores de usuario.
    const modo = catalogo.find((opcion) => opcion.id === modoId)
    const resultado = calcularDivision(validacion.cuenta, modo.estrategia)
    setSalida({ resultado, error: null })
  }

  return { entradas, modoId, salida, editarEntrada, cambiarModo, calcular }
}
