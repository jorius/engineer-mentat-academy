// engine
import type { QuestionTranslation } from '../../engine/question';

export const translations: Record<string, QuestionTranslation> = {
  'containers-image-vs-container-writable-layer': {
    prompt:
      'Entras con `docker exec` a un contenedor en ejecución, haces `apt-get install curl`, luego eliminas el contenedor con `docker rm -f` y vuelves a hacer `docker run` de la **misma imagen**. ¿Está `curl` instalado en el nuevo contenedor?',
    options: {
      a: 'Sí, porque `docker exec` escribe los cambios de vuelta en la imagen',
      b: 'No: la instalación vivía en la capa escribible del contenedor anterior, que se eliminó; la imagen en sí nunca cambió',
      c: 'Sí, pero solo si el contenedor se inició con `--restart always`',
      d: 'No, porque `apt-get` está bloqueado dentro de los contenedores',
    },
    explanation:
      'Una **imagen** es un sistema de archivos inmutable por capas más metadatos (entrypoint, env, puertos expuestos). Un **contenedor** es una instancia en ejecución de una imagen con una capa escribible delgada encima (copy-on-write) y su propio namespace de procesos. Todo lo que se escribe en tiempo de ejecución va a esa capa y desaparece con el contenedor. Los cambios que quieres conservar van en el Dockerfile (reconstruye la imagen), y los datos que quieres conservar van en un volumen o en un almacenamiento externo. `docker commit` existe, pero produce imágenes no reproducibles; trata los contenedores como desechables.',
    hint:
      'Separa la imagen inmutable de la capa delgada copy-on-write que recibe cada contenedor, y pregúntate qué le pasa a esa capa cuando lo eliminas.',
  },
  'containers-dockerfile-layer-cache-order': {
    prompt:
      'Cada cambio de código en este servicio de Node.js dispara un `npm ci` completo durante `docker build`, que tarda cuatro minutos. ¿Qué orden del Dockerfile lo soluciona?\n\n```dockerfile\nFROM node:22-slim\nWORKDIR /app\nCOPY . .\nRUN npm ci\nCMD ["node", "dist/server.js"]\n```',
    options: {
      a: '`COPY package.json package-lock.json ./`, luego `RUN npm ci`, y solo después `COPY . .`',
      b: 'Mantener el orden y agregar `--no-cache` a `docker build` para que nunca se reutilicen capas obsoletas',
      c: 'Reemplazar `npm ci` por `npm install` para que solo instale lo que cambió',
      d: 'Mover `RUN npm ci` encima de `WORKDIR /app` para que se ejecute antes',
    },
    explanation:
      'Cada instrucción produce una capa, y una capa se reutiliza solo si la instrucción **y todo lo anterior** no cambió; para `COPY`, la clave de caché incluye los checksums de los archivos copiados. `COPY . .` cambia con cada edición, así que todas las capas posteriores se reconstruyen. Copiar primero solo los manifiestos hace que la costosa capa de `npm ci` siga en caché hasta que cambien las dependencias. Regla general: ordena las instrucciones de la que cambia con menos frecuencia a la que cambia con más. `--no-cache` hace todo más lento, `npm install` en un build es menos reproducible que `npm ci`, y los cache mounts de BuildKit (`RUN --mount=type=cache,target=/root/.npm npm ci`) son una aceleración adicional sobre el orden correcto.',
    hint:
      'Una capa se reutiliza solo si su instrucción y todo lo anterior no cambiaron; pregúntate de qué archivos depende realmente el paso costoso.',
  },
  'containers-multi-stage-build-benefits': {
    prompt:
      'Una API de TypeScript pasa a un Dockerfile multi-stage: un stage `build` ejecuta `npm ci` y `tsc`, y un stage final basado en `node:22-slim` copia `package.json` y `package-lock.json`, ejecuta `npm ci --omit=dev` y copia `dist/` con `COPY --from=build`. `typescript` y las herramientas de testing están en `devDependencies`. ¿Qué afirmaciones son verdaderas? Selecciona todas las que apliquen.',
    options: {
      a: 'La imagen final no contiene el compilador de TypeScript, las dependencias de desarrollo ni el árbol `src/`',
      b: '`COPY --from=build` copia solo las rutas que nombras de ese stage, no todo su sistema de archivos',
      c: 'Todas las capas de todos los stages se suben al registry junto con la imagen final',
      d: 'Los builds multi-stage fijan automáticamente los digests de las imágenes base, lo que hace los builds reproducibles',
    },
    explanation:
      'Solo el **último** stage (o el que se selecciona con `--target`) se convierte en la imagen; los stages anteriores existen solo en la caché del build. Eso reduce la imagen y su superficie de ataque: sin compiladores, sin herramientas de desarrollo, sin código fuente, sin secretos de tiempo de build. `COPY --from=<stage>` trae artefactos específicos de un stage a otro. La reproducibilidad es otro tema: fija las imágenes base por digest (`node:22-slim@sha256:...`) y usa un lockfile. Multi-stage también te permite ejecutar los tests en un stage dedicado que CI usa como target sin distribuir las herramientas de testing.',
    hint:
      'Recuerda qué etapa se convierte realmente en la imagen y qué trae `COPY --from`; evalúa por separado cualquier afirmación sobre reproducibilidad.',
  },
  'containers-dockerignore-purpose': {
    prompt:
      '¿Por qué agregarías `node_modules`, `.git` y `.env` a un archivo `.dockerignore`? Selecciona todas las que apliquen.',
    options: {
      a: 'Quedan excluidos del build context, así que se envían menos datos al builder y los builds arrancan más rápido',
      b: 'Un `node_modules` del host (posiblemente compilado para otro sistema operativo) no puede sobrescribir el que instaló `npm ci` cuando haces `COPY . .`',
      c: 'Los secretos de `.env` no terminan incrustados en una capa de la imagen',
      d: 'Esos archivos también quedan ocultos para los bind mounts cuando el contenedor se ejecuta',
    },
    explanation:
      'El **build context** es el árbol de directorios que se envía al builder; `.dockerignore` lo filtra antes de que cualquier `COPY` o `ADD` pueda verlo. Eso acelera los builds, mantiene estable la caché (un `.git` que cambia invalidaría `COPY . .`), evita meter en una imagen Linux módulos nativos compilados para macOS o Windows, y mantiene los secretos fuera de las capas, donde se pueden recuperar aunque una capa posterior los borre. Solo afecta al build: los bind mounts y volúmenes en tiempo de ejecución no se ven afectados. Pasa los secretos reales en tiempo de ejecución, o en tiempo de build con `--mount=type=secret` de BuildKit.',
    hint:
      '`.dockerignore` filtra el build context; pregúntate qué cambia eso al construir y si tiene algún efecto cuando el contenedor ya está corriendo.',
  },
  'containers-pid1-sigterm-graceful-shutdown': {
    prompt:
      'La imagen de una API de Node.js termina con `CMD node server.js` (shell form). En cada despliegue, `docker stop` espera 10 segundos, el contenedor sale con código **137** y las solicitudes en curso se cortan. ¿Qué está pasando y cuál es la corrección completa?',
    options: {
      a: 'Cambiar a exec form `CMD ["node", "server.js"]`; así Node recibe SIGTERM y su comportamiento por defecto drena las conexiones antes de salir',
      b: 'Subir el stop timeout a 60 s para que el proceso tenga tiempo de terminar',
      c: 'SIGTERM no está llegando a un proceso que lo maneje: corrige el PID 1 (exec form, o un init mínimo como `docker run --init` / tini) **y** registra un handler de SIGTERM que deje de aceptar conexiones, drene y salga',
      d: 'Agregar `STOPSIGNAL SIGKILL` para que el contenedor se detenga de inmediato en lugar de esperar',
    },
    explanation:
      '`docker stop` (y Kubernetes o ECS) envía SIGTERM al PID 1, espera un periodo de gracia (10 s por defecto) y luego envía SIGKILL; el código de salida 137 es 128 + 9, el SIGKILL. Con la shell form, el PID 1 suele ser `/bin/sh -c`, que no reenvía las señales al proceso hijo de Node. Pero la exec form sola no basta: el kernel no aplica las acciones por defecto de las señales al PID 1 de un namespace de PID, así que un PID 1 que **no tiene handler** simplemente ignora SIGTERM, e incluso fuera del PID 1 la acción por defecto mata a Node al instante sin drenar. La corrección completa es hacer que Node sea el PID 1 (exec form) o poner delante un init mínimo que reenvíe señales y recoja procesos zombie (`--init`, tini, dumb-init), y manejar `process.on(\'SIGTERM\')` llamando a `server.close()`, terminando el trabajo en curso, cerrando los pools de base de datos y luego saliendo. Evita también `npm start` como entrypoint; ejecuta `node` directamente.\n\n**Dilo en voz alta:** "El PID 1 ignora las señales para las que no tiene handler, así que ejecuto node en exec form o detrás de tini, y manejo SIGTERM drenando las conexiones antes de que el periodo de gracia del orquestador envíe SIGKILL."',
    hint:
      'El código de salida 137 es 128 + 9; piensa en qué proceso es el PID 1 con la forma shell, cómo trata el kernel las señales enviadas al PID 1 y si algo drena las solicitudes.',
  },
  'containers-shrinking-node-image': {
    prompt:
      'La imagen de un servicio de Node.js pesa **1.3 GB** y tarda en descargarse durante el scale-out. Explica paso a paso cómo la investigarías y la reducirías, y qué trade-offs vigilarías.',
    modelAnswer:
      'Primero mido: `docker history` o una herramienta como `dive` muestran qué capas son grandes y por qué. Los culpables habituales son la imagen base completa `node:22` (Debian con herramientas de build), las dependencias de desarrollo, la salida del build más el código fuente, las cachés del gestor de paquetes, y `.git` o el `node_modules` local que se cuelan por falta de un `.dockerignore`. Pasaría a un build multi-stage: compilar en un stage `build`, luego iniciar el stage de runtime desde `node:22-slim`, Alpine o una imagen distroless de Node, instalar con `npm ci --omit=dev` y copiar solo `dist/` y el `node_modules` de producción. La limpieza tiene que ocurrir **en el mismo `RUN`** que creó los archivos, porque borrar en una capa posterior no reduce las capas anteriores. Trade-offs: Alpine usa musl, así que los módulos nativos (sharp, bcrypt, los engines de Prisma) pueden necesitar binarios distintos o romperse, y las imágenes distroless no tienen shell, lo que dificulta la depuración (usa ephemeral debug containers en su lugar). Una imagen más pequeña además se descarga más rápido, arranca más rápido en Fargate o en nodos nuevos y tiene menos CVE que parchear, que es la verdadera razón para que importe.',
    rubric: [
      'Mide primero con docker history o dive en lugar de adivinar',
      'Usa builds multi-stage y dependencias solo de producción',
      'Elige una base más liviana (slim, Alpine o distroless) y menciona un trade-off (módulos nativos con musl, sin shell)',
      'Sabe que borrar archivos en una capa posterior no reduce el tamaño de la imagen',
      'Menciona .dockerignore y relaciona el tamaño con el tiempo de descarga, el cold start o la superficie de CVE',
    ],
    explanation:
      'Señal de senior: medir antes de cambiar, conocer el modelo de capas lo bastante bien como para explicar por qué `RUN rm` en un paso separado no hace nada, y sopesar la elección de la imagen base frente a las dependencias nativas y la facilidad de depuración.\n\n**Dilo en voz alta:** "Las capas son aditivas, así que reduzco las imágenes con builds multi-stage, dependencias solo de producción y una base liviana, y primero mido con dive; imágenes más pequeñas significan un scale-out más rápido y menos CVE."',
    hint:
      'Mide las capas antes de cambiar nada, y luego cubre builds multi-stage, dependencias solo de producción, las concesiones de la imagen base y por qué borrar archivos en una capa posterior no ayuda.',
  },
};
