import { useDivisor } from './useDivisor.js'
import { formateadorMoneda } from './formateadorMoneda.js'

/**
 * Convierte un elemento del catálogo en una opción para mantener extensible el
 * selector. Recibe id y etiqueta y devuelve JSX; no produce errores de usuario.
 * Metadatos incorrectos incumplen el contrato de composición.
 */
function renderizarOpcion({ id, etiqueta }) {
  return <option key={id} value={id}>{etiqueta}</option>
}

/**
 * Presenta formulario y salida en una sola pantalla, sin duplicar reglas de
 * cálculo o validación. Recibe catálogo abstracto e id inicial; devuelve JSX.
 * Muestra los errores de entrada del hook; los errores de programación de
 * la composición o de React se propagan.
 */
export function PantallaDivisor({ catalogo, modoInicialId }) {
  const { entradas, modoId, salida, editarEntrada, cambiarModo, calcular } = useDivisor(catalogo, modoInicialId)
  const { resultado, error } = salida

  /**
   * Traslada una edición al estado para conservar el texto del campo. Recibe el
   * evento de una entrada con name y value; devuelve undefined. No calcula ni
   * valida y sólo puede fallar si el evento incumple el contrato de React.
   */
  function editarFormulario(evento) {
    editarEntrada(evento.currentTarget.name, evento.currentTarget.value)
  }

  /**
   * Traslada el modo al estado para aplicarlo en el siguiente envío. Recibe
   * el evento del selector y devuelve undefined; no produce errores de usuario.
   * Un selector con valores ajenos al catálogo es un error de programación.
   */
  function cambiarRedondeo(evento) {
    cambiarModo(evento.currentTarget.value)
  }

  /**
   * Mantiene el envío en esta pantalla y solicita el cálculo. Recibe el evento
   * submit y devuelve undefined. Los errores de entrada quedan en la salida;
   * los errores de programación del cálculo se propagan.
   */
  function enviar(evento) {
    evento.preventDefault()
    calcular()
  }

  return (
    <main className="aplicacion">
      <header className="marca">
        <span className="marca-simbolo" aria-hidden="true">÷</span>
        <span>divisor<span className="marca-acento">.</span></span>
      </header>

      <section className="introduccion" aria-labelledby="titulo">
        <p className="sobre-titulo">LA CUENTA, COMPARTIDA</p>
        <h1 id="titulo">Una cuenta.<br />Partes iguales.</h1>
        <p className="descripcion">Ingresa la cuenta y la propina para saber cuánto paga cada persona.</p>
      </section>

      <div className="paneles">
        <section className="tarjeta-formulario" aria-labelledby="titulo-datos">
          <div className="cabecera-tarjeta">
            <span className="numero-paso" aria-hidden="true">01</span>
            <h2 id="titulo-datos">Los datos de la cuenta</h2>
          </div>

          <form noValidate autoComplete="off" onSubmit={enviar}>
            <div className="campos">
              <div className="campo campo-completo">
                <label htmlFor="monto">Monto de la cuenta</label>
                <input
                  id="monto" name="monto" type="text" inputMode="decimal"
                  placeholder="0.00" value={entradas.monto} onChange={editarFormulario}
                  aria-invalid={error?.campo === 'monto' || undefined}
                  aria-describedby={error?.campo === 'monto' ? 'error-entrada' : undefined}
                  spellCheck={false}
                />
              </div>

              <div className="campo">
                <label htmlFor="personas">Número de personas</label>
                <input
                  id="personas" name="personas" type="text" inputMode="numeric"
                  placeholder="Ej. 4" value={entradas.personas} onChange={editarFormulario}
                  aria-invalid={error?.campo === 'personas' || undefined}
                  aria-describedby={error?.campo === 'personas' ? 'error-entrada' : undefined}
                  spellCheck={false}
                />
              </div>

              <div className="campo">
                <label htmlFor="porcentajePropina">Propina (%)</label>
                <input
                  id="porcentajePropina" name="porcentajePropina" type="text" inputMode="decimal"
                  value={entradas.porcentajePropina} onChange={editarFormulario}
                  aria-invalid={error?.campo === 'porcentajePropina' || undefined}
                  aria-describedby={error?.campo === 'porcentajePropina' ? 'error-entrada' : undefined}
                  spellCheck={false}
                />
              </div>

              <div className="campo campo-completo">
                <label htmlFor="modoId">Redondeo</label>
                <select id="modoId" name="modoId" value={modoId} onChange={cambiarRedondeo}>
                  {catalogo.map(renderizarOpcion)}
                </select>
              </div>
            </div>

            <button type="submit">Calcular</button>
          </form>
        </section>

        <section className={`tarjeta-resultado${error ? ' con-error' : ''}`} aria-labelledby="titulo-resultado">
          <div className="cabecera-tarjeta">
            <span className="numero-paso" aria-hidden="true">02</span>
            <h2 id="titulo-resultado">La parte de cada persona</h2>
          </div>

          <div className="salida">
            {resultado && (
              <p className="importe" role="status" data-testid="resultado">Por persona: <strong>{formateadorMoneda(resultado.centavosPorPersona)}</strong></p>
            )}
            {error && (
              <div className="estado-error">
                <span className="signo-error" aria-hidden="true">!</span>
                <p id="error-entrada" role="alert">{error.mensaje}</p>
                <p className="ayuda-error">Revisa los datos y vuelve a calcular.</p>
              </div>
            )}
            {!resultado && !error && (
              <div className="estado-inicial">
                <div className="recibo" aria-hidden="true"><span /><span /><span /></div>
                <p>Completa los datos<br />y toca Calcular.</p>
              </div>
            )}
          </div>

          <p className="nota-resultado">El resultado se actualiza al tocar Calcular.</p>
        </section>
      </div>

      <footer className="pie">Para compartir la mesa y la cuenta.</footer>
    </main>
  )
}
