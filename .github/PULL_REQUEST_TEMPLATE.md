## What this adds or changes

<!-- One paragraph. For content: which domain / subject / topics, how many questions per level and kind. -->

## Type

- [ ] New technology (subject) with questions
- [ ] More questions for an existing subject
- [ ] Fix to an existing question (wrong key, unclear prompt, outdated fact)
- [ ] Translation fix
- [ ] App change (engine, UI, docs)

## Content checklist

- [ ] The subject and its topics exist in `src/content/taxonomy.ts` (English and Spanish names) and have a glyph in `src/content/glyphs.ts`
- [ ] Every question has an English entry in `src/content/<domain>/<subject>.ts` and a full Spanish entry in `<subject>.es.ts` (prompt, options, explanation, model answer, rubric, hint)
- [ ] Every question has a `hint` that names the concept or the trap without giving the answer away
- [ ] Senior explanations end with a **Say this out loud:** line (Spanish: **Dilo en voz alta:**)
- [ ] No explanation, hint or option refers to another option by letter ("option b", "(c)")
- [ ] Code in prompts and options uses fenced blocks with a language tag when it spans more than one statement
- [ ] `code`, `fix`, `sql` and `predict` questions have a reference the content test can execute (JavaScript, TypeScript and SQL only)
- [ ] The correct option is not the longest one in most of the new single-choice questions

## Verification

- [ ] `npm run lint` has no errors
- [ ] `npm test` passes (the content test executes every reference solution)
- [ ] `npm run build` succeeds
- [ ] I read every new question as an interviewer would and the marked answer is the only correct one

## Notes for the reviewer

<!-- Sources you checked, versions the questions assume, anything you were unsure about. -->
