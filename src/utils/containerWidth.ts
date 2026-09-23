// Question screens hold the two-pane workbench, so they get the wide shell; reading pages stay narrow.
const WIDE_ROUTES = /^\/(drill|mock|review|q)(\/|$)/;

export function containerWidth(pathname: string): string {
  return WIDE_ROUTES.test(pathname) ? 'max-w-screen-2xl' : 'max-w-5xl';
}
