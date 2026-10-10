# Feature Specification: Dividir la cuenta de un restaurante

**Feature Branch**: `sdd`

**Feature Directory**: `specs/001-dividir-cuenta`

**Created**: 2026-10-01

**Status**: Draft

**Input**: User description: "Una app de una sola pantalla para dividir la cuenta de un
restaurante entre varias personas. El usuario ingresa el monto total, el número de
personas y el porcentaje de propina, y al tocar Calcular ve cuánto paga cada persona
con dos decimales. Elige entre redondeo exacto y hacia arriba al entero más cercano.
La app funciona sin conexión: no hay red ni base de datos. Los seis escenarios de
aceptación proporcionados por el usuario se conservan a continuación."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Calcular el pago de cada persona (Priority: P1)

Como persona que comparte una cuenta de restaurante, quiero ingresar el monto, el
número de personas y la propina para conocer cuánto paga cada persona por igual.

**Why this priority**: Es el objetivo principal de la aplicación.

**Independent Test**: Ingresar los valores de cada caso, seleccionar Exacto y tocar
"Calcular". Comprobar el importe mostrado en la misma pantalla.

**Acceptance Scenarios**:

1. **CA-001**: **Given** monto `100.00`, `4` personas, propina `10%` y modo Exacto,
   **When** se toca "Calcular", **Then** se muestra `27.50` por persona.
2. **CA-002**: **Given** monto `90.00`, `3` personas, propina `0%` y modo Exacto,
   **When** se toca "Calcular", **Then** se muestra `30.00` por persona.
3. **CA-005**: **Given** monto `10.00`, `3` personas, propina `0%` y modo Exacto,
   **When** se toca "Calcular", **Then** se muestra `3.33` por persona; no se
   distribuye el centavo restante entre las personas.

### User Story 2 - Identificar entradas inválidas (Priority: P1)

Como usuario, quiero conocer el error de mis entradas para corregirlas sin recibir
un resultado incorrecto.

**Why this priority**: Un monto inválido o cero personas impide calcular un pago válido.

**Independent Test**: Intentar calcular cada caso inválido, tanto antes de obtener un
resultado como después de un cálculo válido. Comprobar el mensaje y la ausencia de
resultado.

**Acceptance Scenarios**:

1. **CA-003**: **Given** monto `50.00`, `0` personas y los demás datos válidos,
   **When** se toca "Calcular", **Then** aparece exactamente
   "Debe haber al menos una persona" y no se muestra ningún resultado.
2. **CA-004**: **Given** monto `abc` y los demás datos válidos,
   **When** se toca "Calcular", **Then** aparece exactamente "Monto inválido" y no
   se muestra ningún resultado.

### User Story 3 - Elegir el redondeo hacia arriba (Priority: P1)

Como usuario, quiero elegir Hacia arriba para que el pago de cada persona se eleve
al entero más cercano que sea igual o mayor que su parte de la cuenta.

**Why this priority**: Es el segundo modo de redondeo solicitado.

**Independent Test**: Calcular los mismos datos en ambos modos y comprobar que
"Calcular" utiliza el modo seleccionado en ese momento.

**Acceptance Scenarios**:

1. **CA-006**: **Given** monto `10.00`, `3` personas, propina `0%` y modo Hacia arriba,
   **When** se toca "Calcular", **Then** se muestra `4.00` por persona.
2. **Given** los datos de CA-005, **When** se calcula en Exacto y después se selecciona
   Hacia arriba y se vuelve a tocar "Calcular", **Then** el resultado cambia de
   `3.33` a `4.00`. Al seleccionar Exacto y volver a calcular, se muestra `3.33`.

### User Story 4 - Dividir la cuenta sin conexión (Priority: P1)

Como usuario en un restaurante, quiero completar el cálculo aunque no tenga conexión.

**Why this priority**: La conexión no debe ser necesaria para usar la aplicación.

**Independent Test**: Abrir la aplicación sin conexión y repetir CA-001 a CA-006.

**Acceptance Scenarios**:

1. **Given** el dispositivo sin conexión, **When** se abre la aplicación y se ejecutan
   CA-001 a CA-006, **Then** se obtienen los mismos importes y mensajes, sin solicitar
   conexión ni abandonar la pantalla.

### Edge Cases

- Una sola persona es válida: recibe la cuenta completa con la propina y el redondeo elegido.
- Un monto `0.00` con al menos una persona y propina válida produce `0.00` en ambos modos.
- Un número de personas menor o igual que cero produce
  "Debe haber al menos una persona", sin resultado.
- Un monto vacío, no numérico, no finito o negativo produce "Monto inválido", sin resultado.
- Un número de personas vacío, no numérico o no entero es inválido: aparece un error
  de entrada y no se muestra resultado.
- Una propina vacía, no numérica, no finita o negativa es inválida: aparece un error
  de entrada y no se muestra resultado.
- Si un cálculo válido fue seguido por uno inválido, el resultado anterior deja de mostrarse.
- En Hacia arriba, una parte que ya es entera no aumenta: `90.00` entre `3` personas,
  con `0%` de propina, sigue dando `30.00`.
- El modo Hacia arriba se aplica al cociente original, no a un valor ya mostrado con
  dos decimales. No se redondea antes el total para decidir el pago individual.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La aplicación DEBE ofrecer en una sola pantalla tres entradas: monto total
  de la cuenta antes de propina, número de personas y porcentaje de propina.
- **FR-002**: La misma pantalla DEBE permitir elegir Exacto o Hacia arriba, incluir un
  botón con el texto "Calcular" y mostrar el resultado o el error correspondiente.
- **FR-003**: El cálculo DEBE ejecutarse al tocar "Calcular", con las entradas y el modo
  seleccionados en ese momento. Antes del primer cálculo no DEBE mostrarse un resultado.
- **FR-004**: La propina DEBE calcularse sobre el monto ingresado. La parte sin redondear
  DEBE ser `monto × (1 + porcentaje de propina / 100) / número de personas`.
- **FR-005**: En Exacto, todas las personas DEBEN tener el mismo pago. El cociente DEBE
  presentarse con dos decimales, sin redistribuir sobrantes para completar la cuenta.
- **FR-006**: En Hacia arriba, el pago DEBE ser el menor entero igual o mayor que el
  cociente sin redondear, y DEBE mostrarse con dos decimales, incluidos `.00`.
- **FR-007**: El resultado válido DEBE indicar claramente cuánto paga cada persona,
  siempre con exactamente dos cifras decimales.
- **FR-008**: El número de personas DEBE ser un entero mayor o igual que uno. Si es cero
  o negativo, se DEBE mostrar exactamente "Debe haber al menos una persona".
- **FR-009**: Un monto inválido DEBE mostrar exactamente "Monto inválido". El monto `abc`
  DEBE activar este comportamiento.
- **FR-010**: Ante cualquier entrada inválida, la aplicación DEBE mostrar el error y
  ocultar cualquier resultado, incluido uno obtenido en un cálculo anterior.
- **FR-011**: Al corregir los datos y volver a tocar "Calcular", la aplicación DEBE
  permitir obtener un resultado válido en la misma pantalla.
- **FR-012**: La apertura, la entrada de datos, la validación y el cálculo DEBEN funcionar
  sin conexión. La aplicación no DEBE realizar comunicaciones de red ni usar una base
  de datos para esta funcionalidad.

### Key Entities *(include if feature involves data)*

- **Datos de la cuenta**: monto antes de propina, cantidad de personas y porcentaje de
  propina ingresados por el usuario para un cálculo.
- **Modo de redondeo**: elección entre Exacto y Hacia arriba para el pago individual.
- **Resultado**: importe que paga cada persona con dos decimales, o un error de entrada
  que impide mostrar ese importe.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Los seis escenarios de aceptación del usuario cumplen sus valores y
  mensajes esperados: `6 de 6` casos correctos.
- **SC-002**: El `100%` de los resultados válidos de CA-001, CA-002, CA-005 y CA-006 se
  muestran con exactamente dos cifras decimales, incluido el resultado entero `4.00`.
- **SC-003**: CA-003 y CA-004 muestran los mensajes exactos y ningún resultado, incluso
  cuando se ejecutan después de un cálculo válido: `2 de 2` casos correctos.
- **SC-004**: CA-001 a CA-006 producen los mismos resultados con el dispositivo sin
  conexión: `6 de 6` casos completables sin solicitar acceso a Internet.
- **SC-005**: El usuario puede ingresar y corregir datos, elegir cualquiera de los dos
  modos, calcular y consultar el importe o el error sin salir de la única pantalla.

## Assumptions

- Se divide la cuenta por igual entre todas las personas; el monto ingresado no incluye
  la propina que se añadirá mediante el porcentaje.
- Los montos y los porcentajes válidos son números finitos no negativos. La cantidad
  válida de personas es un entero positivo. No se establece un máximo arbitrario.
- Se admite el punto como separador decimal, tal como aparece en los ejemplos. Los
  resultados usan punto decimal; no se prescribe ningún formato de entrada adicional.
- En Exacto se usa el redondeo convencional al centavo para presentar el cociente:
  se elige el centavo más cercano y, si hay empate, el superior. El cálculo conserva
  la precisión hasta aplicar el modo de redondeo al pago individual.
- Los pagos mostrados pueden sumar un importe distinto del monto con propina, tanto
  por los dos decimales como por el redondeo hacia arriba; no se ajustan otras personas.
- No se fijan valores iniciales obligatorios para las tres entradas o el selector;
  los escenarios indican expresamente el modo y los datos que deben usarse.
- Los datos corresponden al uso actual de la pantalla. El alcance no incluye guardar
  cuentas para recuperarlas después y no depende de servicios externos.
- Los textos exactos de error solo se fijan para monto inválido y cantidad de personas
  menor o igual que cero. Los demás errores de entrada deben mostrarse sin resultado.
