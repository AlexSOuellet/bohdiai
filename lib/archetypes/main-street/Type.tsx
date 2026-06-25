/**
 * Main Street — Type: the single way to render typed text.
 *
 * Every piece of text in the archetype names its ROLE (brand, body, eyebrow…)
 * and nothing else about its type. `<Type role="brand" as="h1">` stamps the
 * element with `data-type="brand"`; the skin's generated CSS (skinVarsCss) does
 * the rest — family, size, weight, tracking, all from `--ms-t-*` variables keyed
 * off that role. No font ever lives inline, so type can use media queries, the
 * cascade can override it (a hero amplifying its masthead writes a scoped rule),
 * and a family's type package retunes the whole store by changing the variables.
 *
 * Amplification (the editorial masthead, an italic letter quote) is NOT a prop:
 * the component that wants it writes a scoped CSS rule against `[data-type="X"]`
 * inside its own class — a real rule, media-query-capable, never inline.
 */
import React from 'react';
import type { MainStreetRoles } from './skins';

/** The 17 type roles a skin defines — the only values `role` accepts. */
export type TypeRoleName = keyof MainStreetRoles;

type TypeOwnProps = { role: TypeRoleName };

type TypeProps<E extends React.ElementType> = TypeOwnProps & {
  /** The element to render. Defaults to `span`. */
  as?: E;
} & Omit<React.ComponentPropsWithoutRef<E>, keyof TypeOwnProps | 'as'>;

export function Type<E extends React.ElementType = 'span'>({ role, as, ...rest }: TypeProps<E>) {
  const Tag = (as ?? 'span') as React.ElementType;
  return <Tag data-type={role} {...rest} />;
}
