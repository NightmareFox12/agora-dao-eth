# Roadmap de Agora DAO

Los 6 módulos base de la plataforma. Marca cada casilla al completar el módulo.

## Módulos

| # | Módulo | Qué incluye | Estado |
|---|---|---|---|
| 1 | **Tareas** | Crear, asignar, entregar, auditar y pagar | Solo UI con datos de prueba |
| 2 | **Votaciones** | Propuestas y decisiones de la DAO | Pendiente |
| 3 | **Eventos públicos** | Pendiente de definir | Pendiente |
| 4 | **Recompensas** | Tokens y NFTs | Pendiente |
| 5 | **Tesorería / escrow** | Fondos de la DAO y pagos de tareas | Pendiente |
| 6 | **Reputación** | Niveles y NFTs según cuánto aportas | Pendiente |

Reputación y Recompensas se tocan: los NFTs de nivel son recompensas. Van como contratos separados. Reputación lleva la cuenta de puntos y nivel, y Recompensas emite los NFTs cuando se alcanza un nivel.

## Orden propuesto

- [ ] 1. Arreglar los dos bugs de seguridad (ver abajo)
- [ ] 2. Tesorería
- [ ] 3. Tareas (paga desde la tesorería y suma puntos de reputación)
- [ ] 4. Votaciones
- [ ] 5. Reputación y Recompensas
- [ ] 6. Eventos públicos (independientes: en paralelo o al final)

## Ya hecho

- [x] Factory para crear DAOs, con categorías y listado
- [x] Unirse a una DAO y roles (`AUDITOR`, `TASK_MANAGER`, `PROPOSAL_MANAGER`, `USER`)
- [x] Configuración de roles en el frontend
- [x] Landing

## Bugs de seguridad pendientes (paso 1)

- [ ] `Rol.sol`: un `AUDITOR` puede asignar `DEFAULT_ADMIN_ROLE` a cualquiera (en `registerRole` y `registerRoleBatch`)
- [ ] `AgoraDaoFactory.addUserCounter` es público y sin control: cualquiera puede inflar `userCounter`
- [ ] `Rol.sol`: el factory queda como admin de cada DAO por el constructor
- [ ] `grantRole`, `revokeRole` y `renounceRole` de OpenZeppelin siguen públicos y desincronizan `roleUsers`

## Por decidir

- ¿Qué es un "evento público"? Puede ser un meetup con asistentes, o una actividad abierta a quien no es miembro de la DAO.
