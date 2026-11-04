import raw from './projects.json';
import type { Project, ProjectImage } from './types.ts';

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

function image(
  values: readonly (string | number)[],
  field: string,
): ProjectImage {
  const [file, label, caption, width, height] = values;
  if (
    values.length !== 5 ||
    typeof file !== 'string' ||
    typeof label !== 'string' ||
    typeof caption !== 'string' ||
    typeof width !== 'number' ||
    !Number.isInteger(width) ||
    width <= 0 ||
    typeof height !== 'number' ||
    !Number.isInteger(height) ||
    height <= 0
  )
    throw new Error(
      `${field}: expected file, label, caption and positive image dimensions`,
    );
  return [file, label, caption, width, height];
}

// JSON imports infer arrays, not tuples. Check their arity without asserting the content's type.
const projects: readonly Project[] = raw.map((project) => {
  const field = (name: string) => `${project.slug}.${name}`;
  return {
    ...project,
    images: project.images.map((v) => image(v, field('images'))),
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
