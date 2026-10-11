# Roadmap de Agora DAO

Los 6 módulos base de la plataforma. Marca cada casilla al completar el módulo.

## Módulos

| # | Módulo | Qué incluye | Estado |
|---|---|---|---|
| 1 | **Tareas** | Crear, tomar, entregar, revisar y pagar con escrow | Contrato, publicar y ver tareas listos; falta el detalle y las acciones (tomar, entregar, aprobar...) |
| 2 | **Votaciones** | Propuestas y decisiones de la DAO | Pendiente |
| 3 | **Eventos públicos** | Pendiente de definir | Pendiente |
| 4 | **Recompensas** | Tokens y NFTs | Pendiente |
| 5 | **Tesorería / escrow** | Fondos de la DAO y pagos de tareas | Pendiente |
| 6 | **Reputación** | Niveles y NFTs según cuánto aportas | Pendiente (la pantalla de Perfil ya espera este módulo) |

Reputación y Recompensas se tocan: los NFTs de nivel son recompensas. Van como contratos separados. Reputación lleva la cuenta de puntos y nivel, y Recompensas emite los NFTs cuando se alcanza un nivel.

## Orden propuesto

- [x] 1. Arreglar los bugs de seguridad de roles
- [ ] 2. Tesorería
- [ ] 3. Tareas (paga desde la tesorería y suma puntos de reputación)
- [ ] 4. Votaciones
- [ ] 5. Reputación y Recompensas
- [ ] 6. Eventos públicos (independientes: en paralelo o al final)

## Ya hecho

- [x] Factory para crear DAOs, con categorías múltiples (máx. 3) y nombres únicos
- [x] Unirse a una DAO y roles (`AUDITOR`, `TASK_MANAGER`, `PROPOSAL_MANAGER`, `USER`)
- [x] Configuración de roles en el frontend
- [x] Landing, lista de DAOs (con filtros múltiples) y creación de DAOs
- [x] Bugs de seguridad de roles (`Rol.sol` y factory), con tests
- [x] Inicio de la DAO: dashboard con datos reales
- [x] Perfil: roles, antigüedad y espacio reservado para nivel y NFTs
- [x] Guía de bienvenida para usuarios nuevos (se guarda por DAO)

## Arquitectura de módulos

- El factory solo crea la DAO. Cada DAO es un clon (EIP-1167) de `AgoraDao`, y **cada módulo es su propio contrato**, también clonado y creado junto con la DAO (todas las DAOs tienen todos los módulos desde el primer día).
- `AgoraDao` guarda la dirección de cada módulo (`dao.tasks()`), y los módulos le preguntan a la DAO quién tiene cada rol (`isRole`).
- Para agregar un módulo: crear el contrato, desplegar su implementación en `deploy/01_deploy_agora_dao.ts`, pasarla al factory y clonarla en `createDao`.
- Los ids de rol viven en `contracts/shared/RoleIds.sol` y deben coincidir con `constants/roles.ts`.

## Reglas del módulo de tareas

- Crean tareas: gestor de tareas o administrador, enviando la recompensa en ETH (queda retenida en el contrato).
- Toma una tarea cualquier miembro (no el creador). Mientras nadie la toma corre una cuenta de **30 días**: si vence, se reembolsa al creador (cualquiera puede ejecutar el reembolso). Al tomarla, la cuenta se apaga.
- Quien la toma tiene el plazo de entrega que fijó el creador (**de 7 a 30 días**) para entregar un enlace (Figma, GitHub...). Si no entrega, el creador puede quitarle la tarea y vuelve a abrirse. El que trabaja también puede abandonarla.
- Los detalles de la tarea (descripción larga, hasta 3 imágenes, criterios de aceptación y enlaces) viven en IPFS; el contrato solo guarda su enlace, así que lo acordado no se puede alterar.
- El creador revisa en **7 días**. Aprueba y se paga al instante, o rechaza con un motivo. Si no responde en 7 días, quien entregó puede cobrar.
- Si el rechazo no convence, el que trabajó abre una disputa y un **auditor o administrador** (que no sea parte de la tarea) decide: pagar o reembolsar.
- Una vez tomada, el creador no puede cancelarla.

## Pendientes conocidos

- Detalle de la tarea y sus acciones (tomar, entregar, aprobar, rechazar, disputar, cobrar y reembolsar).
- Borrar de Pinata lo que se subió si el usuario rechaza la transacción en su wallet (también aplica al logo de las DAOs). Hay que proteger antes la ruta de borrado, porque sin autenticación cualquiera podría borrar archivos ajenos.
- Las rutas `/api/upload-image` y `/api/upload-task` tampoco tienen autenticación: cualquiera puede subir archivos a la cuenta de Pinata.

## Para cuando se agreguen pantallas

- Cada pantalla nueva puede tener su propia guía: define los pasos en un archivo `*.tour.ts` junto a la página y llama a `useTour(id, pasos)`. Los elementos se señalan con `data-tour="..."`.
- El Perfil crece con el módulo de Reputación: nivel, experiencia, insignias NFT e historial de contribuciones.

## Por decidir

- ¿Qué es un "evento público"? Puede ser un meetup con asistentes, o una actividad abierta a quien no es miembro de la DAO.
- Ocultar "Configuración" del menú a quien no es administrador.
