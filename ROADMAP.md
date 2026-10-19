# Roadmap de Agora DAO

Los 6 módulos base de la plataforma. Marca cada casilla al completar el módulo.

## Módulos

| # | Módulo | Qué incluye | Estado |
|---|---|---|---|
| 1 | **Tareas** | Crear, tomar, entregar, revisar y pagar con escrow | Completo: contrato, publicar, lista, detalle y acciones |
| 2 | **Votaciones** | Propuestas y decisiones de la DAO | Completo: contrato, publicar, lista, detalle, voto y cierre |
| 3 | **Eventos** | Encuentros con fecha, lugar, cupo e inscripción | Completo: contrato, publicar, lista, detalle con asistentes |
| 4 | **Reputación y Recompensas** | Puntos, niveles, insignias NFT | Completo: contrato, hooks desde los otros módulos, Perfil con galería |
| 5 | **Tesorería / escrow** | Fondos de la DAO y pagos de tareas | Completo: contrato, donación, historial y pagos aprobados por votación |


Reputación y Recompensas se tocan: los NFTs de nivel son recompensas. Van como contratos separados. Reputación lleva la cuenta de puntos y nivel, y Recompensas emite los NFTs cuando se alcanza un nivel.

## Orden propuesto

- [x] 1. Arreglar los bugs de seguridad de roles
- [x] 2. Tareas (con escrow propio en el módulo; la Tesorería lo integrará después)
- [x] 3. Votaciones (texto, voto por wallet, quorum 20%)
- [x] 4. Tesorería (donaciones + pagos aprobados por votación)
- [x] 5. Reputación y Recompensas (puntos por acciones, 6 niveles, insignias NFT soulbound)
- [x] 6. Eventos (publicación por miembros, inscripción solo para miembros)

## Ya hecho

- [x] Factory para crear DAOs, con categorías múltiples (máx. 3) y nombres únicos
- [x] Unirse a una DAO y roles (`AUDITOR`, `TASK_MANAGER`, `PROPOSAL_MANAGER`, `USER`)
- [x] Configuración de roles en el frontend
- [x] Landing, lista de DAOs (con filtros múltiples) y creación de DAOs
- [x] Bugs de seguridad de roles (`Rol.sol` y factory), con tests
- [x] Inicio de la DAO: dashboard con datos reales
- [x] Perfil: roles, antigüedad y espacio reservado para nivel y NFTs
- [x] Guía de bienvenida para usuarios nuevos (se guarda por DAO)
- [x] Módulo de Tareas: publicar, lista, detalle, acciones por rol y almacenamiento con firma de wallet (Supabase)
- [x] Módulo de Votaciones: publicar propuestas, votar a favor/en contra/abstención y cierre con quorum 20%
- [x] Módulo de Tesorería: ETH recibido por donaciones, pagos solo con propuesta aprobada que se ejecuta desde el contrato de votos
- [x] Módulo de Eventos: cualquier miembro publica un evento (título, fecha, lugar, cupo, portada opcional, descripción opcional en Markdown); solo miembros se inscriben; creador o admin pueden cancelar
- [x] Módulo de Reputación y Recompensas: puntos automáticos por completar tareas (50), publicar eventos (10), votar (5), apuntarse a eventos (5); 6 niveles con insignias NFT soulbound (imagen SVG on-chain)

## Arquitectura de módulos

- El factory solo crea la DAO. Cada DAO es un clon (EIP-1167) de `AgoraDao`, y **cada módulo es su propio contrato**, también clonado y creado junto con la DAO (todas las DAOs tienen todos los módulos desde el primer día).
- `AgoraDao` guarda la dirección de cada módulo (`dao.tasks()`), y los módulos le preguntan a la DAO quién tiene cada rol (`isRole`).
- Para agregar un módulo: crear el contrato, desplegar su implementación en `deploy/01_deploy_agora_dao.ts`, pasarla al factory y clonarla en `createDao`.
- Los ids de rol viven en `contracts/shared/RoleIds.sol` y deben coincidir con `constants/roles.ts`.

## Reglas del módulo de reputación y recompensas

- Puntos automáticos: 50 al cobrar una tarea, 10 al publicar un evento, 5 por votar, 5 por apuntarse a un evento.
- 6 niveles con umbrales [100, 300, 600, 1000, 1500, 2500].
- Al subir de nivel se mintea una insignia **soulbound** (ERC-721 que no se puede transferir).
- La imagen de la insignia se genera on-chain (SVG + data URI), sin dependencia de servidores.
- `AgoraReputation.award` solo acepta llamadas de los otros módulos de la DAO; `AgoraRewards.mint` solo de reputación.

## Reglas del módulo de eventos

- Publica eventos cualquier miembro de la DAO (incluido el admin). Datos: título (100), resumen (300), fecha y hora, ubicación (200), cupo máximo (0 = sin límite). Portada e imagen opcionales, en Supabase, con huella SHA-256 en el contrato.
- La fecha debe estar entre 1 hora y 2 años en el futuro.
- Se inscriben solo miembros y admins. Un voto por wallet. Se puede cancelar la inscripción hasta la fecha.
- Cancela el evento el creador o un admin, hasta la fecha. Un evento cancelado se queda en la lista con su etiqueta.
- Buckets de Supabase: `event-covers` (público, 1 MB, PNG/JPG) y `event-details` (público, 100 KB, JSON).

## Reglas del módulo de tesorería

- La tesorería es un contrato por DAO: recibe ETH de cualquiera (donaciones) y guarda totales de lo recibido y lo pagado.
- No tiene dueño ni función de retiro. **La única forma de gastar es una propuesta de pago aprobada por votación.**
- Las propuestas de pago llevan destinatario y monto en ETH. Al aprobarse, cualquiera puede ejecutarlas: `AgoraVotes.execute(id)` llama a `AgoraTreasury.pay(to, amount, id)` y la propuesta pasa a `Executed` antes de enviar el ETH (sin reentrada, pago único).
- Si la tesorería no tiene fondos al ejecutar, la transacción falla y la propuesta sigue en `Approved`: se puede reintentar cuando entre más.
- Solo ETH por ahora. Sin pagos múltiples, sin financiar tareas automáticamente, sin llamadas a otros contratos.

## Reglas del módulo de votaciones

- Publican propuestas: gestor de propuestas o administrador. Título (100), descripción Markdown (2000) y plazo de **3 a 14 días**.
- Votan los miembros y los administradores, un voto por wallet, una vez. No se puede cambiar.
- Opciones: a favor, en contra y abstención. La abstención cuenta para el quorum.
- **Quorum fijo del 20%** de los miembros al publicar la propuesta (el denominador se congela, así entrar en masa no sabotea una votación en curso).
- Para aprobarse: quorum alcanzado y a favor > en contra (mayoría estricta; empate = rechazo).
- Cualquiera puede «cerrar la votación» cuando vence el plazo; eso publica el resultado.
- Las propuestas son solo de texto: por ahora no ejecutan nada on-chain.

## Reglas del módulo de tareas

- Crean tareas: gestor de tareas o administrador, enviando la recompensa en ETH (queda retenida en el contrato).
- Toma una tarea cualquier miembro (no el creador). Mientras nadie la toma corre una cuenta de **30 días**: si vence, se reembolsa al creador (cualquiera puede ejecutar el reembolso). Al tomarla, la cuenta se apaga.
- Quien la toma tiene el plazo de entrega que fijó el creador (**de 7 a 30 días**) para entregar un enlace (Figma, GitHub...). Si no entrega, el creador puede quitarle la tarea y vuelve a abrirse. El que trabaja también puede abandonarla.
- Los detalles de la tarea (descripción larga, hasta 3 imágenes, criterios de aceptación y enlaces) viven en un archivo en Supabase Storage; el contrato solo guarda su SHA-256, y la página lo comprueba al leerlo: lo acordado no se puede alterar sin que se note.
- El creador revisa en **7 días**. Aprueba y se paga al instante, o rechaza con un motivo. Si no responde en 7 días, quien entregó puede cobrar.
- Si el rechazo no convence, el que trabajó abre una disputa y un **auditor o administrador** (que no sea parte de la tarea) decide: pagar o reembolsar.
- Una vez tomada, el creador no puede cancelarla.

## Pendientes conocidos

- Rutas de subida (`/api/upload`) sin límite de frecuencia: cualquier wallet puede subir logos. Conviene añadir un límite por wallet o por IP antes de abrirlo al público.
- Hacer copias de seguridad periódicas de los tres buckets de Supabase (el archivo no se puede alterar sin detectarse, pero sí borrar).
- Los archivos que se suben y luego no se usan (la persona cancela la transacción) quedan huérfanos. Se pueden limpiar con un proceso que compare los archivos con los que referencia la blockchain.

## Configuración del almacenamiento

- Tres buckets públicos en Supabase Storage, sin ninguna policy (nadie escribe con claves públicas): `dao-logos` y `task-images` (1 MB, PNG y JPG) y `task-details` (100 KB, JSON).
- Variables en `packages/nextjs/.env`: `SUPABASE_URL` y `SUPABASE_SECRET_KEY` (solo servidor; **la clave secreta nunca lleva el prefijo `NEXT_PUBLIC_`**) y `NEXT_PUBLIC_SUPABASE_URL` (para armar las direcciones públicas de los archivos).
- Solo el servidor escribe en Supabase. Cada subida pide una firma de wallet que el servidor verifica; para los archivos de una tarea comprueba además en la blockchain que quien firma sea gestor o admin de esa DAO.

## Para cuando se agreguen pantallas

- Cada pantalla nueva puede tener su propia guía: define los pasos en un archivo `*.tour.ts` junto a la página y llama a `useTour(id, pasos)`. Los elementos se señalan con `data-tour="..."`.
- El Perfil crece con el módulo de Reputación: nivel, experiencia, insignias NFT e historial de contribuciones.

## Por decidir

- ¿Qué es un "evento público"? Puede ser un meetup con asistentes, o una actividad abierta a quien no es miembro de la DAO.
- Ocultar "Configuración" del menú a quien no es administrador.
