import raw from './projects.json';
import type { Project } from './types.ts';

type StringTuples = {
  2: readonly [string, string];
  3: readonly [string, string, string];
  4: readonly [string, string, string, string];
};
function isTuple<Size extends keyof StringTuples>(
  values: readonly string[],
  size: Size,
): values is StringTuples[Size] {
  return values.length === size && values.every((v) => typeof v === 'string');
}
function tuple<Size extends keyof StringTuples>(
  values: readonly string[],
  size: Size,
  field: string,
): StringTuples[Size] {
  if (!isTuple(values, size))
    throw new Error(`${field}: expected ${size} strings`);
  return values;
}

// JSON imports infer arrays, not tuples. Check their arity without asserting the content's type.
const projects: readonly Project[] = raw.map((project) => {
  const field = (name: string) => `${project.slug}.${name}`;
  return {
    ...project,
    images: project.images.map((v) => tuple(v, 3, field('images'))),
    sections: project.sections.map((v) => tuple(v, 2, field('sections'))),
    challenges: project.challenges?.map((v) =>
      tuple(v, 4, field('challenges')),
    ),
    facts: project.facts?.map((v) => tuple(v, 3, field('facts'))),
    home: project.home && {
      ...project.home,
      highlights: project.home.highlights.map((v) =>
        tuple(v, 3, field('home.highlights')),
      ),
      notes: project.home.notes.map((v) => tuple(v, 2, field('home.notes'))),
    },
  };
});

export default projects;
