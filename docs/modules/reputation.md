# Módulo de Reputación y Recompensas

> Tus aportes a la DAO se acumulan como puntos. Al subir de nivel, ganas una insignia NFT que no se puede transferir.

## Contenido
- [Qué es y para qué sirve](#qué-es-y-para-qué-sirve)
- [Un ejemplo completo](#un-ejemplo-completo)
- [Cómo se ganan los puntos](#cómo-se-ganan-los-puntos)
- [Niveles e insignias](#niveles-e-insignias)
- [Qué no hace (todavía)](#qué-no-hace-todavía)
- [Seguridad](#seguridad)
- [Estado del módulo](#estado-del-módulo)
- [Para desarrolladores](#para-desarrolladores)

## Qué es y para qué sirve

Agora DAO necesita diferenciar al que se acaba de unir del que lleva meses trabajando. La reputación hace de registro público: cada acción que suma a la DAO (completar una tarea, votar, publicar un evento, apuntarse a uno) deposita puntos en la wallet del miembro. Al cruzar un umbral, el miembro **sube de nivel** y recibe una insignia NFT que acompaña siempre a su wallet.

Son dos contratos que trabajan juntos:
- **AgoraReputation** lleva los puntos y los niveles.
- **AgoraRewards** emite las insignias (ERC-721 soulbound).

## Un ejemplo completo

> **Ana** acaba de unirse a una DAO.

1. Ana completa una tarea de diseño por 1 ETH. El contrato de tareas, al pagarle, le da **50 puntos** de reputación.
2. Ana publica un evento (meetup de bienvenida): **+10 puntos**.
3. Vota en diez propuestas: **+50 puntos**.
4. Al llegar a **100 puntos** cruza el umbral del nivel 1. Automáticamente le aparece en el wallet una insignia **"Aprendiz"**, un NFT con una imagen bronce.
5. Sigue aportando: en unos meses alcanza 300 puntos y gana la insignia **"Colaborador"** (nivel 2, plateada).

Las insignias no se pueden vender ni traspasar. Son solo para Ana.

## Cómo se ganan los puntos

| Acción | Puntos |
|---|---|
| Completar una tarea (cobrarla) | 50 |
| Publicar un evento | 10 |
| Votar en una propuesta | 5 |
| Apuntarse a un evento | 5 |

Esto se dispara automáticamente desde los módulos de Tareas, Votaciones y Eventos. El miembro no tiene que reclamar nada.

Decisiones de diseño:
- **No hay puntos negativos.** Nadie te quita reputación por cancelar o rechazar.
- **No hay puntos "por rol" por sí mismos.** Ser auditor o gestor de tareas no da puntos; solo las acciones concretas.
- **Las donaciones a la tesorería no dan puntos hoy.** Se puede añadir fácilmente, pero decidimos no premiar algo medible solo en dinero para evitar comprar reputación con ETH.

## Niveles e insignias

| Nivel | Nombre | Puntos | Color |
|---|---|---|---|
| 1 | Aprendiz | 100 | Bronce |
| 2 | Colaborador | 300 | Plata |
| 3 | Veterano | 600 | Oro |
| 4 | Experto | 1.000 | Cielo |
| 5 | Maestro | 1.500 | Violeta |
| 6 | Leyenda | 2.500 | Rojo |

Cada nivel se corresponde con **una insignia NFT**. Si un solo golpe de puntos te hace saltar varios niveles, se mintean todas las insignias intermedias.

**Las insignias son soulbound.** Son un ERC-721 estándar que:
- No se puede transferir (ni con `transferFrom`, ni con `safeTransferFrom`, ni con `approve + transferFrom`).
- Se puede ver en cualquier marketplace o wallet, pero no cambiar de dueño.
- Tiene la imagen embebida en el propio contrato (SVG generado on-chain). No depende de ningún servidor para mostrarse.

## Qué no hace (todavía)

- **Los puntos no se pueden canjear por nada.** Son solo un registro.
- **La reputación no afecta el voto.** Cada wallet sigue valiendo un voto. Si quieres voto ponderado, es una decisión aparte.
- **No se puede quitar reputación.** Un troll no pierde puntos por serlo (y tampoco gana por sí solo, porque sus puntos vienen de acciones concretas).
- **Es por DAO.** La reputación en una DAO no se cuenta en otra.
- **No se pueden ajustar los puntos.** Si decides que un evento debe dar más, hay que redesplegar.

## Seguridad

### Protecciones concretas

| Riesgo | Cómo se evita |
|---|---|
| Alguien se autoasigna puntos | `AgoraReputation.award` solo acepta llamadas de los módulos de la DAO (tasks, votes, events, treasury). Se verifica en vivo |
| Alguien mintea insignias falsas | `AgoraRewards.mint` solo acepta llamadas de la reputación |
| Comprar insignias ya ganadas | Soulbound: el `_update` revierte cualquier transferencia |
| Reentrada al conceder puntos | Se usa `_mint` (no `_safeMint`), que no llama de vuelta al receptor |
| Insignias "clonadas" de otras DAOs | Cada DAO tiene su propio contrato de reputación y rewards. Un NFT es siempre de la DAO en la que se ganó |
| Puntos sin top (overflow) | El límite de uint256 es tan alto que es inalcanzable en la práctica |

### Cómo se comprobó
30 pruebas automáticas: creación, acceso solo desde módulos, hooks de tareas / votos / eventos, umbrales de nivel (bajo, exacto, varios niveles de un golpe), soulbound (3 vías de transferencia bloqueadas), tokenURI con JSON y SVG embebido, insignias no duplicadas al no cambiar de nivel.

## Estado del módulo

| | |
|---|---|
| **Contratos** | AgoraReputation y AgoraRewards, terminados |
| **Pruebas automáticas** | 30 nuevos (209 entre todos los contratos) |
| **Interfaz** | Pantalla de Perfil con nivel, puntos, barra al siguiente nivel, galería de insignias y guía para ganar puntos |
| **Auditoría externa** | Pendiente |
| **Red** | Solo pruebas locales |

## Para desarrolladores

**Dónde está el código**
- Reputación: [`contracts/AgoraReputation.sol`](../../packages/hardhat/contracts/AgoraReputation.sol)
- Recompensas: [`contracts/AgoraRewards.sol`](../../packages/hardhat/contracts/AgoraRewards.sol)
- Tests: [`test/AgoraReputation.ts`](../../packages/hardhat/test/AgoraReputation.ts), [`test/AgoraRewards.ts`](../../packages/hardhat/test/AgoraRewards.ts)

**Funciones principales**

| Contrato | Función | Quién | Cuándo |
|---|---|---|---|
| Reputation | `award(user, amount)` | Solo módulos de la DAO | Cada vez que pasa algo que da puntos |
| Reputation | `levelOf(user)` / `points(user)` / `pointsToNextLevel(user)` | Lectura | Siempre |
| Rewards | `mint(to, level)` | Solo la reputación | Cuando se cruza un umbral |
| Rewards | `tokenURI(tokenId)` | Lectura | Siempre; devuelve data URI con SVG embebido |

**Hooks añadidos a los otros módulos**
- `AgoraTasks._pay` → `award(assignee, 50)`
- `AgoraVotes.castVote` → `award(msg.sender, 5)`
- `AgoraEvents.createEvent` → `award(msg.sender, 10)`
- `AgoraEvents.register` → `award(msg.sender, 5)`

**Probar**

```bash
cd packages/hardhat
yarn hardhat test test/AgoraReputation.ts test/AgoraRewards.ts --network hardhat
```
