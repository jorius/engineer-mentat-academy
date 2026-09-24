// packages
import { describe, expect, it } from 'vitest';

// content
import { DOMAINS, domainBlurb, domainName, findDomain, findSubject, findTopic, subjectName, topicName } from './taxonomy';

const subjects = DOMAINS.flatMap((domain) => domain.subjects.map((subject) => [`${domain.id}/${subject.id}`, subject] as const));
const topics = DOMAINS.flatMap((domain) =>
  domain.subjects.flatMap((subject) => subject.topics.map((topic) => [`${domain.id}/${subject.id}/${topic.id}`, topic] as const)),
);

describe('taxonomy localization', () => {
  it.each(DOMAINS.map((domain) => [domain.id, domain] as const))('domain %s has a Spanish name and blurb', (_id, domain) => {
    expect(domain.es?.name).toBeTruthy();
    expect(domain.es?.blurb).toBeTruthy();
  });

  it.each(subjects)('subject %s has a Spanish name', (_path, subject) => {
    expect(subject.es?.name).toBeTruthy();
  });

  it.each(topics)('topic %s has a Spanish name', (_path, topic) => {
    expect(topic.es?.name).toBeTruthy();
  });

  it('returns Spanish names for es and English otherwise', () => {
    const domain = findDomain('databases');
    const subject = findSubject('apis', 'api-design');
    const topic = findTopic('languages', 'javascript', 'fundamentals');
    if (domain === undefined || subject === undefined || topic === undefined) {
      throw new Error('fixture taxonomy nodes missing');
    }
    expect(domainName(domain, 'es')).toBe('Bases de datos');
    expect(domainName(domain, 'en')).toBe('Databases');
    expect(domainBlurb(domain, 'es')).toContain('motores gestionados');
    expect(domainBlurb(domain, 'fr')).toBe(domain.blurb);
    expect(subjectName(subject, 'es')).toBe('Diseño de APIs');
    expect(topicName(topic, 'es')).toBe('Fundamentos');
    expect(topicName(topic, 'en')).toBe('Fundamentals');
  });

  it('falls back to English when a node has no Spanish text', () => {
    expect(domainName({ id: 'x', name: 'X', blurb: 'Bx', subjects: [] }, 'es')).toBe('X');
    expect(domainBlurb({ id: 'x', name: 'X', blurb: 'Bx', es: { name: 'Equis' }, subjects: [] }, 'es')).toBe('Bx');
    expect(subjectName({ id: 's', name: 'S', topics: [] }, 'es')).toBe('S');
    expect(topicName({ id: 't', name: 'T' }, 'es')).toBe('T');
  });
});
