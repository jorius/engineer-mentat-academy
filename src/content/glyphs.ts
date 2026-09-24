// packages
import {
  FiActivity,
  FiBox,
  FiCheckCircle,
  FiCheckSquare,
  FiCloud,
  FiCode,
  FiCompass,
  FiCpu,
  FiDatabase,
  FiGlobe,
  FiGrid,
  FiLayers,
  FiLock,
  FiPackage,
  FiServer,
  FiShield,
  FiTool,
} from 'react-icons/fi';
import {
  SiAmazondynamodb,
  SiAmazonrds,
  SiAmazonwebservices,
  SiApachekafka,
  SiAwslambda,
  SiDocker,
  SiDotnet,
  SiExpress,
  SiGithubactions,
  SiGraphql,
  SiJavascript,
  SiMongodb,
  SiNestjs,
  SiNextdotjs,
  SiNodedotjs,
  SiOpenjdk,
  SiPrisma,
  SiReact,
  SiReactrouter,
  SiRedux,
  SiSpringboot,
  SiTerraform,
  SiTestinglibrary,
  SiTypeorm,
  SiTypescript,
} from 'react-icons/si';
import { TbBrandCSharp } from 'react-icons/tb';
import type { IconType } from 'react-icons';

/** Domain id → icon, per spec §3 "Glyphs". */
export const domainGlyphs: Record<string, IconType> = {
  languages: FiCode,
  libraries: FiPackage,
  frameworks: FiLayers,
  runtimes: FiServer,
  apis: FiGlobe,
  architecture: FiGrid,
  databases: FiDatabase,
  cloud: FiCloud,
  practices: FiTool,
};

/** Subject id → icon, per spec §3 "Glyphs" (brand icons, then neutral ones). */
export const subjectGlyphs: Record<string, IconType> = {
  javascript: SiJavascript,
  typescript: SiTypescript,
  csharp: TbBrandCSharp,
  java: SiOpenjdk,
  react: SiReact,
  redux: SiRedux,
  'react-router': SiReactrouter,
  'react-testing-library': SiTestinglibrary,
  typeorm: SiTypeorm,
  prisma: SiPrisma,
  express: SiExpress,
  nestjs: SiNestjs,
  nextjs: SiNextdotjs,
  dotnet: SiDotnet,
  aspnet: SiDotnet,
  'spring-boot': SiSpringboot,
  nodejs: SiNodedotjs,
  graphql: SiGraphql,
  'distributed-systems': SiApachekafka,
  nosql: SiMongodb,
  dynamodb: SiAmazondynamodb,
  rds: SiAmazonrds,
  aws: SiAmazonwebservices,
  containers: SiDocker,
  iac: SiTerraform,
  serverless: SiAwslambda,
  cicd: SiGithubactions,
  rest: FiGlobe,
  'api-design': FiCompass,
  'api-security': FiShield,
  'design-patterns': FiLayers,
  solid: FiCheckSquare,
  'clean-code': FiCode,
  'architecture-patterns': FiGrid,
  sql: FiDatabase,
  testing: FiCheckCircle,
  security: FiLock,
  operations: FiActivity,
  'ai-assisted-development': FiCpu,
};

/** Domain glyph for `id`, falling back to `FiBox` for an unknown id. */
export function domainGlyph(id: string): IconType {
  return domainGlyphs[id] ?? FiBox;
}

/** Subject glyph for `id`, falling back to `FiBox` for an unknown id. */
export function subjectGlyph(id: string): IconType {
  return subjectGlyphs[id] ?? FiBox;
}
