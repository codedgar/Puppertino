/* Structured component data: the single source for the Buttons page.
   Doc sections render from this, and the same data feeds the machine
   endpoints (JSON islands today, llms.txt generation next), so the
   two can never drift. Voice rules from specs/writing-docs.md apply
   to every `use` string. */

export default {
  name: 'buttons',
  base: 'p-button',
  variants: [
    {
      id: 'default',
      label: 'Default',
      code: '<button class="p-button p-button-default">Default</button>',
      use: 'For neutral actions in toolbars and dialogs. Light fill, primary text color, no claim on attention.',
    },
    {
      id: 'colored',
      label: 'Colored',
      code: '<button class="p-button p-button-colored">Colored</button>',
      use: 'A filled accent button that picks up the current tint. Use it for the most important action in a group when that action is not the default-Return-key action.',
    },
    {
      id: 'secondary',
      label: 'Secondary',
      code: '<button class="p-button p-button-secondary">Secondary</button>',
      use: 'A tinted variant of Colored. Background sits at 12% of the tint, text uses the full tint. Use it for affirmative actions that should not steal focus from a primary.',
    },
    {
      id: 'destructive',
      label: 'Destructive',
      code: '<button class="p-button p-button-destructive">Delete</button>',
      use: 'Always red, and it ignores any color class you drop on it. Use it only when the action removes data that cannot be recovered. Pair it with confirmation when the action is irreversible.',
    },
    {
      id: 'primary',
      label: 'Primary',
      code: '<button class="p-button p-button-primary">Primary</button>',
      use: 'The default action. It shares Colored’s appearance and additionally responds to the Return key.',
    },
    {
      id: 'borderless',
      label: 'Borderless',
      code: '<button class="p-button p-button-borderless">Borderless</button>',
      use: 'Text only. Use it for tertiary actions that should feel like links inside a dense interface. Toolbar overflow menus, footer affordances, “Show more” toggles.',
    },
  ],
  tokens: [
    { token: '--p-button-height', value: '24px', note: 'Regular size. Mini is 16px, small is 19px, large is 32px.' },
    { token: '--p-button-padding-x', value: '16px', note: 'Horizontal padding on each side.' },
    { token: '--p-button-radius', value: '6px', note: 'macOS regular button radius. Large jumps to 8px.' },
    { token: '--p-button-font-size', value: '13px', note: 'Matches macOS body.' },
    { token: '--p-button-font-weight', value: '510', note: 'Apple’s "system medium." Large bumps to 590.' },
    { token: '--p-button-icon-size', value: '13px', note: 'Matches the label. SVG and <i> children both scale to this token.' },
    { token: '--p-button-default-tint', value: '#0D6FFF', note: 'The macOS 26 button blue, used when no color class is set.' },
  ],
};
