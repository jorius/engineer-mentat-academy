// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'cicd-build-once-promote-artifact': {
    prompt:
      'Un pipeline despliega a `dev`, `staging` y `production`. ¿Qué enfoque para los artefactos de build se considera la mejor práctica?',
    options: {
      a: 'Reconstruir la imagen Docker por separado para cada entorno con la configuración de ese entorno incrustada',
      b: 'Construir un solo artefacto inmutable (por ejemplo, una imagen etiquetada con el SHA del commit) una vez, y luego promover ese mismo artefacto por cada entorno, inyectando la configuración en el momento del despliegue',
      c: 'Construir en los servidores de producción durante el despliegue para que los binarios coincidan exactamente con el host',
      d: 'Etiquetar las imágenes como `latest` y hacer que todos los entornos descarguen `latest`',
    },
    explanation:
      'Si reconstruyes por entorno, lo que probaste en staging no es lo que corre en producción: la resolución de dependencias, las actualizaciones de la imagen base o los flags de build pueden diferir. **Construye una vez, despliega muchas**: produce un artefacto inmutable y versionado, guárdalo en un registry y promuévelo por referencia (tag o digest), mientras la configuración y los secretos específicos de cada entorno vienen del propio entorno (parameter store, secrets manager, variables de entorno). `latest` es mutable, así que no puedes saber qué está corriendo ni hacer rollback de forma confiable.',
  },
  'cicd-blue-green-vs-canary': {
    prompt:
      'Quieres enviar el **5%** del tráfico real de producción a v2, comparar su tasa de errores y su latencia con v1, luego subir a 25%, 50% y 100%, y hacer rollback automáticamente si las métricas empeoran. ¿Qué estrategia es esta, y en qué se diferencia de blue/green?',
    options: {
      a: 'Blue/green: dos entornos completos, y el tráfico se desplaza gradualmente entre ellos por porcentaje',
      b: 'Canary: una porción pequeña y creciente del tráfico valida la versión nueva frente a la anterior; blue/green levanta un entorno paralelo completo y cambia todo el tráfico de una vez, con rollback volviendo a cambiarlo',
      c: 'Rolling update: las instancias se reemplazan una por una, que es lo mismo que un canary',
      d: 'Recreate: detener v1 e iniciar v2, que es la forma más segura de comparar métricas',
    },
    explanation:
      '**Blue/green** ejecuta la versión nueva como un entorno paralelo completo, lo prueba y luego cambia el router o el DNS en un solo paso; el rollback es instantáneo (volver a cambiar), pero duplica la capacidad durante el cambio y todos los usuarios llegan a v2 al mismo tiempo. **Canary** limita el blast radius exponiendo primero un porcentaje pequeño y condicionando cada paso a las métricas (automated canary analysis). **Rolling** reemplaza instancias por lotes sin control a nivel de tráfico ni una comparación limpia. En términos de AWS: CodeDeploy soporta desplazamiento canary y lineal para Lambda y ECS, los alias de Lambda soportan tráfico ponderado, y los target groups ponderados del ALB lo hacen para servicios. Todas requieren cambios de esquema compatibles hacia atrás, porque dos versiones corren al mismo tiempo.',
  },
  'cicd-pipeline-quality-gates': {
    prompt:
      '¿Qué verificaciones son buenos **gates automáticos** que deberían bloquear un merge o una promoción a producción? Selecciona todas las que apliquen.',
    options: {
      a: 'Chequeo de tipos, lint, tests unitarios y de integración, y un build que debe terminar con éxito',
      b: 'Escaneo de dependencias y de secretos que falla ante vulnerabilidades críticas conocidas o credenciales filtradas',
      c: 'Una aprobación manual en cada commit hacia cada entorno, incluido `dev`',
      d: 'Un requisito estricto de 100% de cobertura de líneas en cada cambio',
    },
    explanation:
      'Los buenos gates son **rápidos, deterministas y significativos**: corrección (tipos, tests), capacidad de build, seguridad (SCA, SAST, escaneo de secretos, escaneo de imágenes) y, para la promoción a producción, también un smoke test y métricas de salud o de canary después del despliegue. Las aprobaciones manuales en todas partes frenan la entrega sin aportar señal; resérvalas para producción (o reemplázalas por automated canary analysis). El 100% de cobertura invita a escribir tests que no verifican nada; usa un umbral razonable o cobertura sobre las líneas cambiadas. Los tests inestables (flaky) se deben corregir o poner en cuarentena, porque un gate que la gente aprende a volver a ejecutar no es un gate.',
  },
  'cicd-canary-gate-decision': {
    prompt:
      'Implementa el paso de decisión de un automated canary analysis. `solution(baseline, canary)` recibe `{ requests, errors, p99Ms }` de la versión anterior y de la nueva sobre la misma ventana y devuelve:\n\n- `\'wait\'` si el canary tiene menos de **500** solicitudes (todavía no hay suficientes datos);\n- en otro caso, `\'rollback\'` si la tasa de errores del canary (`errors / requests`) está **más de 1 punto porcentual** por encima de la tasa de errores del baseline, **o** si el p99 del canary está **más de un 20%** por encima del p99 del baseline;\n- en otro caso, `\'promote\'`.',
    explanation:
      'Las tres reglas reflejan un canary analysis real (Argo Rollouts, Flagger, Spinnaker Kayenta, CodeDeploy con alarmas de CloudWatch). Compara **tasas**, no conteos crudos: el canary recibe mucho menos tráfico que el baseline, así que su cantidad absoluta de errores siempre es menor. La regla de muestra mínima evita promover (o hacer rollback) por el ruido de un puñado de solicitudes. Compara contra el **baseline en vivo** sobre la misma ventana en lugar de un umbral fijo, para que un incidente global o un pico de tráfico no culpe al canary. Los sistemas de producción agregan pruebas estadísticas y exigen varios intervalos sanos consecutivos antes de cada paso.',
  },
  'cicd-migrations-and-rollback': {
    prompt:
      'Diseña un pipeline de entrega para un servicio de Node.js con una base de datos PostgreSQL que despliega a producción varias veces al día sin downtime. En particular, ¿cómo manejas las **migraciones de base de datos** y el **rollback**?',
    modelAnswer:
      'Etapas: en cada pull request, ejecutar la instalación, el chequeo de tipos, lint, tests unitarios, tests de integración contra un Postgres real en un contenedor y escaneos de seguridad; al hacer merge, construir una imagen etiquetada con el SHA del commit y subirla. Desplegar esa imagen a staging, ejecutar las migraciones y los smoke tests o tests end-to-end, y luego promover la misma imagen a producción con un rollout canary o blue/green condicionado a la tasa de errores y la latencia, con rollback automático. Las migraciones corren como un paso separado e idempotente del pipeline antes de que salga el código nuevo, y deben ser **compatibles hacia atrás**, porque durante un despliegue canary o rolling las versiones vieja y nueva corren contra el mismo esquema. Por eso uso **expand and contract**: primero agrego columnas nullable o tablas nuevas, despliego código que escribe en ambas y lee la forma nueva, hago el backfill por lotes, y solo elimino o renombro la estructura vieja en un release posterior. Eso hace que el rollback de la aplicación sea seguro (volver a desplegar la imagen anterior), y rara vez hago rollback del esquema; en cambio, avanzo con una corrección (roll forward). Los cambios de larga duración usan formas no bloqueantes como `CREATE INDEX CONCURRENTLY`, y un lock timeout evita que una migración deje el tráfico detenido. Los feature flags desacoplan el despliegue del release, así que un comportamiento riesgoso se puede apagar sin desplegar.',
    rubric: [
      'Enumera etapas concretas con un único artefacto inmutable promovido entre entornos',
      'Usa un rollout progresivo (canary o blue/green) condicionado a métricas con rollback automático',
      'Explica expand and contract para que las versiones vieja y nueva funcionen con el mismo esquema',
      'Trata el rollback como volver a desplegar el artefacto anterior y hacer avanzar el esquema, no como revertir migraciones',
      'Menciona técnicas de migración no bloqueantes o feature flags',
    ],
    explanation:
      'Señal de senior: reconocer que la base de datos es la parte que no puedes revertir al instante, así que cada cambio de esquema debe ser compatible tanto con la versión anterior como con la siguiente del código.\n\n**Dilo en voz alta:** "Construyo una vez, promuevo la misma imagen, despliego de forma progresiva con rollback automático, y hago que cada migración sea expand-then-contract para que el código viejo y el nuevo puedan correr contra el mismo esquema; el código hace rollback, el esquema avanza."',
  },
};
