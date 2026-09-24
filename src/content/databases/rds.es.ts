// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'rds-multi-az-vs-read-replica': {
    prompt:
      'En un despliegue clásico de RDS for PostgreSQL de tipo **Multi-AZ DB instance**, ¿qué afirmación lo contrasta correctamente con una read replica?',
    options: {
      a: 'Multi-AZ mantiene un standby replicado de forma síncrona que no atiende tráfico y existe para el failover; una read replica se replica de forma asíncrona, atiende lecturas y tiene su propio endpoint.',
      b: 'Los standbys de Multi-AZ atienden tráfico de lectura a través del reader endpoint, así que Multi-AZ duplica gratis la capacidad de lectura.',
      c: 'Las read replicas usan replicación síncrona, así que leer de ellas nunca devuelve datos desactualizados.',
      d: 'Multi-AZ y las read replicas son la misma funcionalidad; Multi-AZ es simplemente una read replica ubicada en otra Availability Zone.',
    },
    explanation:
      'Multi-AZ es para **disponibilidad**: las escrituras se confirman en el primario y en el standby de forma síncrona, así que el failover no pierde datos confirmados, pero el standby no se puede leer. Las read replicas son para **escalar lecturas**: la replicación asíncrona implica replica lag, así que los flujos de read-after-write deben ir al primario. Una réplica se puede promover manualmente (y puede estar en otra Region para disaster recovery), pero esa es una operación aparte y deliberada. Las opciones más nuevas difuminan esta distinción: el despliegue **Multi-AZ DB cluster** (PostgreSQL y MySQL) tiene dos standbys legibles con un reader endpoint, y las réplicas de Aurora sirven tanto para lecturas como para failover.',
    hint: 'Compara para qué sirve cada función, disponibilidad o escalado de lecturas, y si su replicación es síncrona o asíncrona.',
  },
  'rds-failover-behavior': {
    prompt:
      'Tu despliegue de RDS for MySQL de tipo **Multi-AZ DB instance** (un primario y un standby) pierde su primario. ¿Qué afirmaciones sobre el failover son verdaderas? Selecciona todas las que apliquen.',
    options: {
      a: 'RDS apunta el endpoint DNS de la instancia al standby, que se promueve a primario.',
      b: 'Tienes que actualizar el connection string de la aplicación con el nombre de host del standby.',
      c: 'Los clientes que guardan el DNS en caché durante mucho tiempo (por ejemplo, una JVM con una caché de DNS sin límite) pueden seguir fallando después de que termina el failover.',
      d: 'Las transacciones confirmadas no se pierden, porque la replicación al standby es síncrona.',
      e: 'Las read replicas existentes se promueven automáticamente para reemplazar al primario que falló.',
    },
    explanation:
      'El nombre del endpoint no cambia; RDS cambia su registro DNS al standby promovido, normalmente en uno o dos minutos. Por eso las aplicaciones necesitan un TTL de DNS corto, reintentos de conexión con backoff y un pool que descarte las conexiones rotas; RDS Proxy acorta y oculta buena parte de esto. La replicación síncrona significa que no se pierden datos confirmados, mientras que las transacciones en curso se revierten. Las read replicas no forman parte del failover de RDS Multi-AZ, así que la afirmación de que se promueven automáticamente es falsa para RDS; en **Aurora**, en cambio, se promueve una réplica usando niveles de prioridad de failover.',
    hint: 'Piensa en qué pasa con el nombre del endpoint, la caché DNS del cliente y los datos confirmados, y qué réplicas participan en el failover Multi-AZ.',
  },
  'rds-parameter-group-static-change': {
    prompt:
      'Necesitas cambiar un parámetro **estático** del motor (por ejemplo `shared_buffers` en RDS for PostgreSQL). La instancia usa el parameter group por defecto. ¿Cuál es el procedimiento correcto?',
    options: {
      a: 'Crear un DB parameter group personalizado, fijar ahí el valor, asociarlo a la instancia y luego reiniciarla; hasta entonces el cambio aparece como `pending-reboot`.',
      b: 'Editar el valor en el parameter group por defecto; se aplica de inmediato a todas las instancias sin reiniciar.',
      c: 'Conectarte como el usuario maestro y ejecutar `ALTER SYSTEM SET shared_buffers = ...`, y luego recargar la configuración.',
      d: 'Entrar por SSH al host de RDS, editar `postgresql.conf` y luego reiniciar el servicio.',
    },
    explanation:
      'En RDS, la configuración del motor se gestiona con parameter groups. Los grupos por defecto no se pueden modificar, así que creas un grupo personalizado (idealmente con infraestructura como código) y lo asocias. Los parámetros **dinámicos** se aplican sin reiniciar; los **estáticos** esperan a un reboot, que en producción programas o haces con Multi-AZ para minimizar el tiempo de inactividad. RDS no da acceso al host, y el usuario maestro no es un superusuario real, así que `ALTER SYSTEM` no está disponible. Como un mismo grupo puede estar compartido por muchas instancias, cambiarlo las cambia a todas.',
    hint: 'Recuerda qué te deja modificar RDS (grupos por defecto, acceso al host, permisos de superusuario) y cuándo entra en vigor un parámetro estático.',
  },
  'rds-when-to-choose-aurora': {
    prompt: '¿Cuándo elegirías Amazon Aurora en lugar de RDS estándar para PostgreSQL o MySQL, y cuándo te quedarías con RDS estándar?',
    modelAnswer:
      'Aurora separa el cómputo de una capa de almacenamiento distribuida que guarda seis copias de los datos en tres Availability Zones y crece automáticamente (hasta 256 TiB en las versiones actuales del motor). Como las réplicas leen el mismo almacenamiento, admite hasta 15 lectores con poco lag detrás de un solo reader endpoint, y el failover a una réplica suele tardar bastante menos de un minuto. Agrega funcionalidades que RDS estándar no tiene: Global Database para disaster recovery entre Regions con alrededor de un segundo de lag, clonación rápida de bases de datos, backtrack en MySQL y Serverless v2 para cargas con picos o impredecibles. Lo elegiría para cargas con muchas lecturas que necesitan muchas réplicas, objetivos estrictos de disponibilidad o de recuperación, o datos grandes que crecen rápido. Me quedaría con RDS estándar para cargas pequeñas o estables, donde los precios de instancia más altos de Aurora y los cargos por I/O cuestan más (o evaluaría Aurora I/O-Optimized para cargas con mucho I/O), cuando necesito una versión del motor o una extensión que Aurora todavía no soporta, o cuando importa la portabilidad a PostgreSQL o MySQL estándar. La decisión debe salir de la proporción de lecturas medida, del perfil de I/O y de los objetivos de recuperación, con precios calculados para ambas configuraciones de almacenamiento.',
    rubric: [
      'Explica la capa de almacenamiento compartida y distribuida (seis copias en tres AZ) y por qué acelera las réplicas y el failover',
      'Nombra capacidades concretas exclusivas de Aurora: hasta 15 réplicas, Global Database, clonación, Serverless v2',
      'Analiza el costo: precio de instancia más alto, cargos por I/O frente a I/O-Optimized',
      'Menciona límites de compatibilidad: retraso en versiones, extensiones o funcionalidades no soportadas',
      'Vincula la decisión a datos de la carga (proporción de lecturas, I/O, RPO/RTO) y no a una regla general',
    ],
    explanation:
      'La respuesta senior es un trade-off anclado en la arquitectura de almacenamiento: Aurora ofrece failover más rápido, réplicas baratas y almacenamiento elástico a cambio de otro modelo de costos y cierto retraso en compatibilidad.\n\n**Dilo en voz alta:** "Aurora lleva la durabilidad a una capa de almacenamiento compartida, y por eso sus réplicas son baratas y el failover es rápido; la elijo cuando la disponibilidad o la escala de lectura justifican el precio, y reviso la factura de I/O y el soporte de extensiones antes de comprometerme."',
    hint: 'Ancla la respuesta en la capa de almacenamiento compartido de Aurora, y luego pesa sus funciones extra frente al costo y la compatibilidad con datos de la carga.',
  },
};
