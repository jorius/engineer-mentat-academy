// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'iac-iaas-vs-iac-definitions': {
    prompt: '¿Qué afirmación distingue correctamente **IaaS** de **IaC**?',
    options: {
      a: 'Son lo mismo: IaC es el nombre más nuevo de IaaS',
      b: 'IaaS es un modelo de servicio en la nube en el que alquilas cómputo, almacenamiento y red (EC2, VPC, EBS); IaC es la práctica de definir esa infraestructura en código versionado y revisable (Terraform, CloudFormation)',
      c: 'IaaS es para máquinas virtuales e IaC es para contenedores',
      d: 'IaC es una oferta del proveedor, como IaaS o PaaS, en la que el proveedor escribe el código de infraestructura por ti',
    },
    explanation:
      '**IaaS / PaaS / SaaS** describen *qué* le compras a un proveedor y cuánto del stack administras tú. **IaC** describe *cómo* administras infraestructura de cualquier tipo: archivos declarativos en Git, revisados en pull requests y aplicados por automatización, de modo que los entornos sean reproducibles y los cambios auditables en lugar de hacerse a mano con clics en una consola. Puedes usar IaC para administrar recursos IaaS, servicios PaaS, DNS, configuración de SaaS (GitHub, Datadog) y más.',
  },
  'iac-terraform-saved-plan-apply': {
    prompt:
      '¿Por qué un pipeline de CI ejecuta `terraform plan -out=tfplan`, hace que una persona lo revise y luego ejecuta `terraform apply tfplan`, en lugar de ejecutar `terraform apply` más tarde?',
    options: {
      a: '`apply tfplan` ejecuta exactamente el conjunto de cambios revisado, y se niega a correr si el state cambió desde que se generó el plan',
      b: '`plan` crea los recursos en una cuenta sandbox y `apply` los promueve a producción',
      c: 'Un `terraform apply` a secas no refresca el state, así que puede pasar por alto el drift',
      d: 'El archivo de plan es un resumen legible pensado para hacer commit en Git con fines de auditoría',
    },
    explanation:
      '`terraform plan` refresca el state, lo compara con tu configuración y propone acciones de crear, actualizar, reemplazar o destruir sin cambiar nada. Un `terraform apply` a secas calcula un plan **nuevo** en el momento del apply, que puede diferir de lo que se revisó si el código, el state o la infraestructura real cambiaron entre medio. Un plan guardado fija las acciones revisadas, y Terraform lo rechaza por obsoleto si el state avanzó. Los archivos de plan pueden contener valores sensibles en texto plano, así que trátalos como artefactos de build secretos, no como commits; muéstralos para revisión con `terraform show`.',
  },
  'iac-terraform-remote-state-locking': {
    prompt:
      'Un equipo guarda `terraform.tfstate` en local y le hace commit en Git. Dos veces este mes, dos ingenieros hicieron apply al mismo tiempo y el state se corrompió. ¿Cuál es la corrección estándar?',
    options: {
      a: 'Ejecutar `terraform refresh` antes de cada apply para que todos partan del mismo state',
      b: 'Darle a cada ingeniero su propio `terraform workspace` para que nunca compartan un state file',
      c: 'Mover el state a un backend remoto con locking, como S3 con lockfiles nativos (`use_lockfile = true`) o HCP Terraform, con cifrado y versionado, y hacer apply solo desde CI',
      d: 'Seguir haciendo commit del state, pero exigir revisión en un pull request para cada cambio a `terraform.tfstate`',
    },
    explanation:
      'El state mapea las direcciones de tus recursos a los IDs de los recursos reales y guarda sus atributos, para que Terraform sepa qué le pertenece y qué debe cambiar. Tiene que estar **compartido** (todos ven lo más reciente), **bloqueado** (un solo escritor a la vez) y **protegido** (contiene secretos en texto plano, como contraseñas generadas). Un backend remoto da las tres cosas. Para S3, Terraform 1.10+ soporta locking nativo con un objeto de lock en el bucket; la antigua tabla de lock en DynamoDB está deprecada. Habilita el versionado del bucket para recuperarte de una escritura errónea. Los workspaces con el mismo backend solo crean states separados para la misma configuración; no resuelven los applies concurrentes sobre un mismo entorno.',
  },
  'iac-terraform-module-practices': {
    prompt: '¿Cuáles son buenas prácticas para módulos reutilizables de Terraform? Selecciona todas las que apliquen.',
    options: {
      a: 'Fijar las versiones de los módulos (`version = "~> 5.0"` para módulos del registry, `?ref=v1.4.0` para fuentes Git)',
      b: 'Exponer lo que necesitan los llamadores mediante valores `output` y recibir entradas mediante bloques `variable` tipados con validación',
      c: 'Declarar bloques `provider` dentro de cada módulo hijo para que el módulo sea autocontenido',
      d: 'Envolver todo el entorno de producción en un solo módulo para que cada cambio sea un único apply',
    },
    explanation:
      'Un módulo es una función: entradas tipadas, salidas y ninguna configuración global oculta. Fijar versiones evita que un cambio en un módulo se propague en silencio a todos los entornos. La configuración del provider pertenece al módulo **raíz** y se pasa hacia abajo (de forma implícita, o con `providers = { aws = aws.us_east_1 }`); un módulo hijo con su propio bloque `provider` no se puede usar con `count`, `for_each` ni `depends_on`, y quitarlo después deja recursos huérfanos. Una sola raíz gigante significa plans enormes, applies lentos y un blast radius grande; divide el state por ciclo de vida y por dueño (red, datos, servicios) y conéctalos mediante outputs o data sources.',
  },
  'iac-terraform-plan-diff': {
    prompt:
      'Modela lo que hace `terraform plan`. Implementa `solution(desired, current, forceNew)`, donde `desired` (tu configuración) y `current` (el state refrescado) mapean direcciones de recursos a objetos planos de atributos, y `forceNew` lista los nombres de atributos cuyo cambio exige reemplazo. Devuelve `{ create, update, replace, destroy }`, cada uno un arreglo **ordenado** de direcciones:\n\n- `create`: solo en `desired`.\n- `destroy`: solo en `current`.\n- Para las direcciones presentes en ambos, compara la unión de las keys de atributos con `!==` (una key que falta en un lado cuenta como cambio). Sin cambios: omitir. Cualquier key cambiada que esté en `forceNew`: `replace`. En otro caso: `update`.',
    explanation:
      'Este es el núcleo de toda herramienta declarativa de IaC: comparar la configuración deseada con la realidad refrescada. El caso interesante es **replace**: algunos atributos no pueden cambiar in place (el `ami` de EC2, el `engine` de RDS, el nombre de un bucket), así que el provider los marca como `ForceNew` y el plan muestra `-/+ must be replaced`. En producción, de ahí salen los incidentes, así que quienes revisan buscan primero los reemplazos. Las mitigaciones son `lifecycle { create_before_destroy = true }` para evitar downtime, `prevent_destroy = true` en recursos con estado, y bloques `moved` cuando solo renombraste una dirección (de lo contrario, un renombre parece un destroy más un create).',
  },
  'iac-terraform-drift-handling': {
    prompt:
      'Durante un incidente, alguien abrió el puerto 5432 en un security group administrado por Terraform desde la consola de AWS. ¿Qué hace el siguiente `terraform plan` y cuál es la forma correcta de manejarlo?',
    options: {
      a: 'Nada: Terraform solo compara la configuración con el state file, que todavía tiene las reglas anteriores',
      b: 'El plan refresca el recurso real, detecta el drift y propone revertirlo; el equipo o bien codifica la regla en HCL o bien deja que el apply la elimine, y puede inspeccionar solo el drift con `terraform plan -refresh-only`',
      c: 'Ejecutar `terraform import` sobre la nueva regla para que Terraform la adopte automáticamente',
      d: 'Terraform reescribe los archivos `.tf` para incluir el cambio de la consola en el siguiente plan',
    },
    explanation:
      'Por defecto, `plan` refresca los recursos administrados desde la API del provider, así que las ediciones hechas por fuera aparecen como cambios que el apply **revertiría** para que coincidan con el código. Ese es el punto de IaC: el código es la fuente de verdad. La decisión es organizacional: conservar el cambio agregándolo a HCL (revisado, y luego el plan no muestra diferencias) o dejar que el apply lo elimine. `plan -refresh-only` / `apply -refresh-only` muestra o acepta el drift en el state sin tocar la infraestructura. Para atributos que legítimamente se administran en otro lado (el desired count de un autoscaler), usa `lifecycle { ignore_changes = [...] }`. Advertencias: el drift solo se detecta en los recursos que Terraform administra, no en cosas creadas completamente por fuera, y mezclar reglas inline con recursos `aws_security_group_rule` separados causa un vaivén interminable. Los plans programados de detección de drift en CI lo detectan temprano.\n\n**Dilo en voz alta:** "El plan refresca, así que los cambios hechos en la consola aparecen como drift que el apply revertiría; o codificamos el cambio o dejamos que Terraform lo deshaga, y ejecutamos detección de drift programada para que esto no sea una sorpresa."',
  },
  'iac-cloudformation-stacks-change-sets': {
    prompt: '¿Qué afirmaciones sobre los stacks y change sets de CloudFormation son verdaderas? Selecciona todas las que apliquen.',
    options: {
      a: 'Un change set muestra de antemano qué recursos se agregarán, modificarán o eliminarán, y si cada modificación requiere reemplazo (`True`, `False` o `Conditional`), antes de que lo ejecutes',
      b: 'Una actualización fallida del stack hace rollback automáticamente; si el propio rollback falla, el stack queda en `UPDATE_ROLLBACK_FAILED` hasta que continúes el rollback, posiblemente omitiendo recursos',
      c: 'CloudFormation detecta el drift de forma continua y revierte los cambios de la consola en la siguiente actualización',
      d: 'CloudFormation no guarda ningún registro de lo que desplegó, así que, a diferencia de Terraform, no puede saber qué recursos le pertenecen a un stack',
    },
    explanation:
      'Un **stack** es la unidad de despliegue: CloudFormation rastrea sus recursos del lado del servidor (el equivalente al state de Terraform, que AWS administra por ti) y aplica las actualizaciones de forma transaccional, haciendo rollback si algo falla. Los **change sets** son el `plan` de CloudFormation; la columna `Replacement` es lo que revisas antes de tocar bases de datos. La detección de drift existe, pero es **bajo demanda** y solo reporta; nunca revierte. Protege los recursos con estado con `DeletionPolicy: Retain` o `Snapshot` y `UpdateReplacePolicy`, agrega stack policies para bloquear actualizaciones a recursos críticos y activa la protección contra terminación en los stacks de producción.\n\n**Dilo en voz alta:** "Siempre despliego a través de un change set y leo la columna Replacement, y pongo políticas de borrado Retain o Snapshot en todo lo que tenga estado, porque un rollback no puede recuperar datos borrados."',
  },
  'iac-terraform-vs-cloudformation-choice': {
    prompt:
      'Un equipo nuevo pregunta si estandarizar en **Terraform** o en **CloudFormation** (posiblemente vía CDK) para su plataforma en AWS. ¿Cómo decides?',
    modelAnswer:
      'Parto del alcance: si todo vive en AWS y el equipo quiere que AWS sea dueño del state y del rollback, **CloudFormation** es una opción sólida; el state se administra del lado del servidor, las actualizaciones hacen rollback automáticamente, las nuevas funciones de AWS y los StackSets para despliegues multi-cuenta son de primera mano, y CDK permite que los desarrolladores lo escriban en TypeScript. Si la plataforma abarca más que AWS, como DNS en Cloudflare, GitHub, Datadog, Kubernetes u otra nube, **Terraform** (u OpenTofu) da un solo lenguaje y un solo flujo de trabajo entre providers, un gran ecosistema de módulos y un `plan` que a muchos ingenieros les resulta más claro que los change sets. Los costos son distintos: Terraform implica hacerse cargo del state remoto, del locking y del manejo de secretos en el state, y no hace rollback de un cambio aplicado a medias; CloudFormation tiene límites de recursos por stack, feedback más lento y estados trabados ocasionales como `UPDATE_ROLLBACK_FAILED`. La contratación y las habilidades existentes importan tanto como las funciones. Elija lo que elija, las prácticas son las mismas: revisión de código sobre los plans o change sets, applies solo desde CI, state dividido según el blast radius y detección de drift.',
    rubric: [
      'Plantea la decisión en torno al alcance: solo AWS frente a múltiples providers',
      'Menciona las fortalezas de CloudFormation: state administrado, rollback automático, StackSets o CDK',
      'Menciona las fortalezas de Terraform: múltiples providers, ecosistema, flujo de plan',
      'Explica los costos operativos de cada uno (state y locking frente a límites del stack y rollbacks trabados)',
      'Menciona las habilidades del equipo y las prácticas comunes (applies solo desde CI, revisión de plans o change sets)',
    ],
    explanation:
      'Señal de senior: nada de tribalismo de herramientas; la respuesta dice quién es dueño del state, cómo se comportan los fallos y el rollback, y qué usa ya la organización.\n\n**Dilo en voz alta:** "Solo AWS y queremos que AWS sea dueño del state y del rollback: CloudFormation o CDK. Múltiples providers y un solo flujo de trabajo para todo: Terraform, aceptando que el backend del state es nuestro."',
  },
};
