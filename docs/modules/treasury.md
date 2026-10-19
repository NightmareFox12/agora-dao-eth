# Módulo de Tesorería

> La caja de la DAO. Entra fácil, sale solo cuando los miembros lo deciden votando.

Este documento explica cómo funciona el módulo de tesorería de Agora DAO: para qué sirve, cómo se recibe dinero, cómo se paga, y qué garantías tiene cada paso.

**Contenido**

- [Qué es y para qué sirve](#qué-es-y-para-qué-sirve)
- [Un ejemplo completo](#un-ejemplo-completo)
- [Cómo entra el dinero](#cómo-entra-el-dinero)
- [Cómo sale el dinero](#cómo-sale-el-dinero)
- [Qué no hace (todavía)](#qué-no-hace-todavía)
- [Seguridad](#seguridad)
- [Estado del módulo](#estado-del-módulo)
- [Para desarrolladores](#para-desarrolladores)

## Qué es y para qué sirve

Una DAO necesita un sitio donde guardar sus fondos: donaciones, cuotas, lo que gana por su actividad. Y necesita reglas claras para gastarlos, sin que una sola persona pueda vaciar la caja.

El módulo de tesorería hace exactamente eso: **recibir ETH de cualquiera, y pagar solo cuando una propuesta aprobada por los miembros lo autoriza.** No hay dueño, ni función de retiro, ni botón de emergencia.

**La idea en una frase:** una caja compartida con llave que solo abre un voto mayoritario.

## Un ejemplo completo

> La DAO tiene **2 ETH** en la tesorería (de donaciones). Necesita pagar **0.5 ETH** por un servidor para su web.

1. **Marta**, gestora de propuestas, publica una propuesta **de pago**: título «Pagar el servidor», descripción con el detalle, destinatario `0xabc…def`, monto `0.5 ETH`, plazo 3 días.
2. Los miembros votan. Al cerrar la votación, si pasa el quorum y «a favor» gana, la propuesta queda **Aprobada**.
3. Cualquiera pulsa **«Ejecutar el pago»**. El contrato de votos le dice a la tesorería que envíe esos 0.5 ETH al destinatario. La propuesta queda **Ejecutada** y la tesorería baja a 1.5 ETH.

Si la propuesta se rechaza o no alcanza el quorum, la tesorería no se mueve.

## Cómo entra el dinero

**Donaciones.** Cualquier wallet puede enviar ETH a la dirección de la tesorería y el saldo sube. No hace falta ser miembro ni pedir permiso. Desde la página de Tesorería hay un botón para donar con cualquier monto.

**Lo que se guarda:** el saldo actual, cuánto se ha recibido en total y cuánto se ha pagado en total. Cada movimiento queda registrado como un evento, así que la página muestra el historial de donaciones y pagos sin tener que confiar en nadie.

## Cómo sale el dinero

**El único camino es una propuesta de pago aprobada.** No hay otra forma.

1. **Publicar:** un gestor de propuestas o un administrador crea una propuesta eligiendo *«de pago»*, el destinatario y el monto en ETH.
2. **Votar:** los miembros votan durante el plazo (3 a 14 días).
3. **Cerrar:** cuando vence el plazo, cualquiera cierra la votación y se calcula el resultado.
4. **Ejecutar:** si la propuesta se aprobó, cualquiera puede pulsar «Ejecutar el pago» y el ETH sale de la tesorería al destinatario. La propuesta pasa a estado **Ejecutada** para que no se pueda ejecutar otra vez.

Todas las reglas del módulo de Votaciones aplican aquí: quorum del 20%, mayoría simple, un voto por wallet, voto inalterable, snapshot del número de miembros al publicar.

**Si la tesorería no tiene fondos suficientes** cuando se intenta ejecutar, la ejecución falla y la propuesta sigue en «Aprobada». Se puede reintentar cuando entre más dinero.

## Qué no hace (todavía)

- **Solo ETH.** Ningún token (USDC, DAI...) por ahora.
- **Pagos individuales.** No hay propuestas con varios pagos a la vez.
- **No financia tareas automáticamente.** Hoy el creador de una tarea pone el escrow de su propia wallet. Más adelante se puede añadir una propuesta que financie una tarea desde la tesorería.
- **No permite llamar a otros contratos.** Las propuestas solo pueden pagar ETH a una dirección. Un día se podrá ampliar a «llamar a este contrato con estos datos», pero añade riesgo y queremos empezar seguros.
- **No calcula ingresos recurrentes** ni cuotas automáticas.

## Seguridad

### Las reglas vienen del contrato
Como el resto de módulos, las reglas las hace cumplir el contrato. Nadie puede saltarse la página.

### Protecciones concretas

| Riesgo | Cómo se evita |
|---|---|
| Alguien se lleva los fondos | El contrato no tiene dueño ni función de retiro. La única salida pasa por el módulo de votos |
| Un admin paga a espaldas de los miembros | `pay()` solo lo acepta del contrato de votos; cualquier otro, incluido el admin, es rechazado |
| Pagar dos veces | Al ejecutar, la propuesta pasa a «Ejecutada» antes de enviar el ETH, así que no se puede ejecutar de nuevo |
| Ataque de reentrada al pagar | El estado cambia antes del envío y la función va protegida con un bloqueo contra reentrada |
| Pagar más de lo que hay | El contrato comprueba el saldo antes de enviar; si no alcanza, la ejecución falla y nada cambia |
| Pagar a la dirección cero | Rechazado al crear la propuesta y al ejecutar |
| Montos de cero | Rechazados tanto al donar como al pagar |

### Lo que no protege
- **La disponibilidad del contrato de votos.** Es el único autorizado a gastar; si una futura versión del módulo de votos tuviera un fallo, podría ejecutar pagos que no debería. Por eso cualquier cambio en Votaciones debe revisarse con cuidado.
- **Decisiones malas.** Si la mayoría vota algo mal, el pago sale igual. El objetivo es seguir el proceso, no juzgarlo.

### Cómo se comprobó
17 pruebas automáticas: creación, donaciones, intentos de pago por canales no autorizados (admin, miembros, cualquiera), pago válido tras aprobación, ejecución de propuesta rechazada o de texto, doble ejecución, pago mayor al saldo, varios pagos seguidos y campos de la acción.

## Estado del módulo

| | |
|---|---|
| **Contrato inteligente** | Terminado |
| **Pruebas automáticas** | 17 del contrato de tesorería (147 entre todos los contratos) |
| **Interfaz** | Página con saldo, totales, donación e historial. Propuestas de pago integradas en Votaciones |
| **Auditoría externa de seguridad** | Pendiente. Recomendable antes de guardar dinero real |
| **Red** | Solo pruebas locales. Aún no desplegado en una red pública |

## Para desarrolladores

**Dónde está el código**

- Contrato: [`packages/hardhat/contracts/AgoraTreasury.sol`](../../packages/hardhat/contracts/AgoraTreasury.sol)
- Contrato de votos (ejecuta las propuestas): [`packages/hardhat/contracts/AgoraVotes.sol`](../../packages/hardhat/contracts/AgoraVotes.sol)
- Pruebas: [`packages/hardhat/test/AgoraTreasury.ts`](../../packages/hardhat/test/AgoraTreasury.ts)

**Cómo encaja**

- Cada DAO tiene su propia tesorería, creada como clon por el factory junto con la DAO y el módulo de votos.
- La dirección se obtiene con `AgoraDao.treasury()`. La tesorería guarda la dirección de su módulo de votos en `votes` y rechaza llamadas de cualquier otro.
- El flujo completo: `AgoraVotes.createPayoutProposal(...)` → `AgoraVotes.castVote(...)` → `AgoraVotes.finalize(id)` → `AgoraVotes.execute(id)` → internamente llama a `AgoraTreasury.pay(to, amount, id)`.

**Funciones principales de la tesorería**

| Función | Quién | Cuándo |
|---|---|---|
| `receive() payable` | Cualquiera | Envía ETH y el saldo sube |
| `pay(to, amount, proposalId)` | Solo el contrato de votos | Al ejecutar una propuesta de pago aprobada |
| `balance()` / `totalDeposited()` / `totalPaid()` | Lectura | Siempre |

**Funciones nuevas en el contrato de votos**

| Función | Qué hace |
|---|---|
| `createPayoutProposal(title, description, votingDays, recipient, amount)` | Crea una propuesta con acción `PayETH` |
| `execute(id)` | Ejecuta la acción de una propuesta aprobada. La propuesta pasa a `Executed` |

**Eventos de la tesorería:** `Deposited(from, amount)`, `Paid(to, amount, proposalId)`.

**Estado nuevo en Votaciones:** `Executed = 4`. Una propuesta de texto aprobada se queda en `Approved`; una propuesta de pago aprobada pasa a `Executed` al correr `execute`.

**Probar**

```bash
cd packages/hardhat
yarn hardhat test test/AgoraTreasury.ts --network hardhat
```
