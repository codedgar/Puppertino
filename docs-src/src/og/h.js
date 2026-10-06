/* Hyperscript helper for Satori element trees. Produces the
   { type, props: { children, ...rest } } shape Satori expects, so the
   templates need no React or JSX. */
export function h(type, props, ...children) {
  const flat = children.flat().filter((child) => child !== null && child !== undefined && child !== false);
  return {
    type,
    props: {
      ...(props ?? {}),
      children: flat.length === 0 ? undefined : flat.length === 1 ? flat[0] : flat,
    },
  };
}
