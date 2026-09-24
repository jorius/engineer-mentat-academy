// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'serverless-definition': {
    prompt: '¿Qué descripción de **serverless** es la más precisa?',
    options: {
      a: 'El código se ejecuta sin ningún servidor, directamente en el borde de la red del proveedor',
      b: 'El proveedor ejecuta, parchea y escala los servidores; tú despliegas funciones o servicios administrados, pagas por uso y la capacidad puede escalar a cero',
      c: 'Cualquier aplicación desplegada en contenedores',
      d: 'Una VM que el proveedor reinicia automáticamente cuando falla',
    },
    explanation:
      'Siguen existiendo servidores; simplemente no los administras tú. Los rasgos que lo definen son **sin gestión de capacidad**, **escalado automático** (incluso a cero), **pago por solicitud o por unidad de trabajo** en lugar de por hora aprovisionada, y un uso intensivo de piezas administradas: Lambda, API Gateway, DynamoDB, SQS, SNS, EventBridge, Step Functions, S3. Los contenedores son un formato de empaquetado y pueden ser serverless (Fargate, Cloud Run) o no (un cluster de Kubernetes autoadministrado).',
  },
  'serverless-cold-start-mitigation': {
    prompt:
      'Una API de checkout sensible a la latencia sobre Lambda muestra picos en el p99 causados por cold starts. ¿Qué mitigaciones ayudan de verdad? Selecciona todas las que apliquen.',
    options: {
      a: 'Provisioned concurrency en la función de checkout, dimensionada para el pico esperado y ajustada con Application Auto Scaling',
      b: 'Crear los clientes del SDK y las conexiones a la base de datos fuera del handler y mantener pequeño el bundle (con tree-shaking, solo los clientes del SDK v3 que usas)',
      c: 'Un ping programado cada 5 minutos, que mantiene suficientes entornos calientes para absorber ráfagas de tráfico',
      d: 'Subir el timeout de la función de 10 s a 60 s',
    },
    explanation:
      'Un cold start ocurre cada vez que Lambda tiene que crear un nuevo entorno de ejecución: la primera solicitud, un scale-out más allá de los entornos calientes actuales, un despliegue nuevo, o después de que Lambda descarta un entorno inactivo. La **provisioned concurrency** mantiene N entornos inicializados (con costo). Los bundles más pequeños y un código de init liviano acortan cada cold start, y el trabajo de init hecho fuera del handler se reutiliza en las invocaciones en caliente. Más memoria también da proporcionalmente más CPU, lo que acelera el init. **SnapStart** toma un snapshot del entorno inicializado y lo restaura; cubre los runtimes administrados de Java, Python y .NET y, desde julio de 2026, las funciones empaquetadas como imagen de contenedor, así que revisa tu runtime y tu empaquetado. Un ping mantiene caliente aproximadamente **un** entorno; una ráfaga de 50 solicitudes concurrentes igual necesita 49 nuevos. El timeout no tiene ningún efecto sobre el arranque.',
  },
  'serverless-stateless-warm-environment': {
    prompt:
      '`createExecutionEnvironment` simula un cold start de Lambda: su cuerpo es el scope del módulo (se ejecuta una vez por entorno) y devuelve el handler. Dos entornos atienden tres solicitudes. ¿Qué imprime esto, un valor por línea?',
    explanation:
      'El estado en el scope del módulo sobrevive entre invocaciones **en el mismo entorno** (un warm start), y por eso ahí inicializas los clientes. Pero es por entorno, no por función: `envB` tiene su propio contador y su propia caché, y el router decide qué entorno atiende cada solicitud. Así que los contadores en memoria son incorrectos, y las cachés en memoria pueden servir datos obsoletos (`envA` sigue diciendo `Ana` después del cambio de nombre). Trata el scope del módulo solo como una optimización: todo lo que tenga que ser correcto o compartido va a DynamoDB, ElastiCache o algo similar, con TTL en las cachés.',
  },
  'serverless-cost-model-steady-load': {
    prompt:
      'Una API interna sobre Lambda ahora atiende **2,000 solicitudes por segundo de forma constante, 24/7**, con una duración promedio de 150 ms y 1 GB de memoria. La factura mensual sorprendió a finanzas. ¿Qué afirmación describe mejor el modelo de costos?',
    options: {
      a: 'Lambda siempre es lo más barato porque solo pagas mientras el código se ejecuta, y los entornos inactivos entre solicitudes no cuestan nada',
      b: 'Lambda cobra por solicitud más los GB-segundo de duración; con una utilización alta y sostenida, eso a menudo supera a contenedores bien dimensionados funcionando cerca de su capacidad máxima, mientras que el tráfico irregular o bajo favorece a Lambda',
      c: 'El costo de Lambda depende solo del número de solicitudes, así que bajar la memoria o la duración no cambiará la factura',
      d: 'El costo está dominado por los cold starts, porque con 2,000 solicitudes por segundo constantes casi cada invocación crea un nuevo entorno de ejecución',
    },
    explanation:
      'El precio de Lambda es una tarifa por solicitud más **duración x memoria** (GB-segundo), redondeada al milisegundo; desde agosto de 2025 también se cobra la fase de init. Eso es ideal cuando el tráfico llega en ráfagas o está inactivo gran parte del tiempo, porque la inactividad no cuesta nada. Con una carga alta y constante, en la práctica estás pagando un sobreprecio por capacidad que podrías correr con alta utilización en Fargate o EC2 con Savings Plans. Palancas antes de migrar: ajusta la memoria con Lambda Power Tuning (más memoria puede terminar más rápido y costar lo mismo o menos), usa Graviton (arm64) y procesa el trabajo en lotes. Aquí los cold starts son raros: 2,000 solicitudes por segundo a 150 ms mantienen unos 300 entornos ocupados todo el tiempo. De hecho, la provisioned concurrency es una palanca de costo con esta utilización: su precio por GB-segundo (reserva más duración) es menor que el on-demand por encima de aproximadamente un 60% de utilización, y los Compute Savings Plans también aplican a Lambda. Recuerda también los costos ocultos alrededor de la función: las solicitudes de API Gateway, los datos del NAT gateway y la ingesta de CloudWatch Logs.',
  },
  'serverless-when-it-fits': {
    prompt:
      'Un equipo de producto quiere construir su próximo backend "totalmente serverless". ¿Qué preguntas haces para decidir si encaja, y cómo diseñas en función de sus restricciones?',
    modelAnswer:
      'Serverless encaja en cargas orientadas a eventos y con picos: APIs con tráfico irregular, procesamiento de archivos y streams, trabajos programados, webhooks y el pegamento entre servicios administrados, sobre todo para equipos pequeños que no quieren operar infraestructura. Encaja mal en trabajo de larga duración o con estado (Lambda tiene un límite de 15 minutos), servicios con alto throughput sostenido donde los contenedores son más baratos, requisitos de latencia muy baja y predecible donde los cold starts duelen, y cargas que necesitan conexiones persistentes o mucho estado local. Pregunto por la forma del tráfico, los SLO de latencia, la duración de la ejecución, los patrones de acceso a datos y la madurez operativa del equipo. Diseño en función de las restricciones: mantengo las funciones **sin estado** e idempotentes porque los disparadores son at-least-once, pongo colas entre servicios para absorber ráfagas y proteger las bases de datos (Lambda puede escalar más rápido de lo que una base de datos relacional acepta conexiones, así que uso RDS Proxy o DynamoDB), uso Step Functions para flujos de varios pasos en lugar de funciones que llaman a otras funciones, e invierto en logs estructurados, tracing y alarmas desde el primer día, porque no hay una máquina a la cual entrar por SSH.',
    rubric: [
      'Menciona buenos casos de uso: orientado a eventos, tráfico con picos o bajo, pegamento y procesamiento asíncrono',
      'Menciona malos casos de uso: larga duración, alto throughput constante, latencia estricta, estado o conexiones persistentes',
      'Diseña para la ausencia de estado y la idempotencia bajo entrega at-least-once',
      'Protege a los sistemas aguas abajo del scale-out (colas, reserved concurrency, RDS Proxy)',
      'Menciona la orquestación (Step Functions) y la observabilidad',
    ],
    explanation:
      'Señal de senior: responder "depende" con las dimensiones concretas (forma del tráfico, duración, latencia, estado) y luego nombrar los patrones de diseño que hacen confiable a serverless.\n\n**Dilo en voz alta:** "Serverless gana en trabajo con picos y orientado a eventos, y en equipos pequeños; diseño cada función para que sea sin estado e idempotente, amortiguo con colas para que el scale-out no pueda saturar la base de datos, y orquesto con Step Functions en lugar de encadenar funciones."',
  },
  'serverless-vendor-lock-in': {
    prompt:
      'A la dirección le preocupa que pasar a serverless en AWS deje a la empresa atada al proveedor. ¿Dónde vive la mayor parte del lock-in **real**, y cuál es una mitigación pragmática?',
    options: {
      a: 'En la firma del handler; envolver cada función en un framework multi-nube mantiene los handlers sin cambios, lo que elimina la mayor parte del costo de cambio',
      b: 'En la versión del runtime de Node.js que provee AWS; empaquetar tu propio runtime como custom runtime o imagen de contenedor elimina el lock-in',
      c: 'En las fuentes de eventos, IAM, los almacenes de datos administrados y los flujos alrededor del código; mantén la lógica de dominio detrás de ports and adapters y acepta el acoplamiento a servicios administrados donde compense',
      d: 'En ningún lugar importante: cualquier función Lambda se puede mover a otra nube volviendo a desplegar el mismo zip en el servicio de funciones de ese proveedor',
    },
    explanation:
      'El código del handler es la parte barata de mover; las partes caras son las integraciones a su alrededor: las formas de los eventos y los disparadores, las políticas de IAM, los patrones de acceso de DynamoDB, las máquinas de estado de Step Functions, las reglas de EventBridge, además de los dashboards y los runbooks. Una estructura hexagonal mantiene las reglas de negocio en módulos sin framework y convierte al handler de Lambda en un adaptador delgado que parsea el evento y llama al dominio, lo que además facilita las pruebas unitarias y ejecutarlo en un contenedor si hace falta. La neutralidad total entre nubes suele costar más (servicios del mínimo común denominador, más cosas que operar) que el costo de cambio contra el que te asegura, así que decide de forma deliberada qué acoplamientos valen la pena.\n\n**Dilo en voz alta:** "El lock-in está en los servicios administrados y las integraciones, no en el handler, así que mantengo la lógica de dominio detrás de adaptadores delgados y acepto el acoplamiento a servicios administrados donde el ahorro operativo supera el costo de cambio."',
  },
};
