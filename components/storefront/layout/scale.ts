import type {
  Align,
  AlignWithBaseline,
  Border,
  Justify,
  MinHeight,
  NonZeroSpacingScale,
  Radius,
  Shadow,
  SpacingScale,
} from '@/lib/layout';

export const PADDING_CLASS: Record<SpacingScale, string> = {
  none: 'p-0',
  xs: 'p-2',
  sm: 'p-3',
  md: 'p-6',
  lg: 'p-10',
  xl: 'p-16',
  xxl: 'p-24',
};

export const PADDING_CLASS_MD: Record<SpacingScale, string> = {
  none: 'md:p-0',
  xs: 'md:p-2',
  sm: 'md:p-3',
  md: 'md:p-6',
  lg: 'md:p-10',
  xl: 'md:p-16',
  xxl: 'md:p-24',
};

export const PADDING_Y_CLASS: Record<SpacingScale, string> = {
  none: 'py-0',
  xs: 'py-3',
  sm: 'py-6',
  md: 'py-12',
  lg: 'py-20',
  xl: 'py-28',
  xxl: 'py-40',
};

export const PADDING_Y_CLASS_MD: Record<SpacingScale, string> = {
  none: 'md:py-0',
  xs: 'md:py-3',
  sm: 'md:py-6',
  md: 'md:py-12',
  lg: 'md:py-20',
  xl: 'md:py-28',
  xxl: 'md:py-40',
};

export const GAP_CLASS: Record<SpacingScale, string> = {
  none: 'gap-0',
  xs: 'gap-2',
  sm: 'gap-3',
  md: 'gap-6',
  lg: 'gap-10',
  xl: 'gap-16',
  xxl: 'gap-24',
};

export const GAP_CLASS_MD: Record<SpacingScale, string> = {
  none: 'md:gap-0',
  xs: 'md:gap-2',
  sm: 'md:gap-3',
  md: 'md:gap-6',
  lg: 'md:gap-10',
  xl: 'md:gap-16',
  xxl: 'md:gap-24',
};

export const GAP_X_CLASS: Record<SpacingScale, string> = {
  none: 'gap-x-0',
  xs: 'gap-x-2',
  sm: 'gap-x-3',
  md: 'gap-x-6',
  lg: 'gap-x-10',
  xl: 'gap-x-16',
  xxl: 'gap-x-24',
};

export const GAP_X_CLASS_MD: Record<SpacingScale, string> = {
  none: 'md:gap-x-0',
  xs: 'md:gap-x-2',
  sm: 'md:gap-x-3',
  md: 'md:gap-x-6',
  lg: 'md:gap-x-10',
  xl: 'md:gap-x-16',
  xxl: 'md:gap-x-24',
};

export const GAP_Y_CLASS: Record<SpacingScale, string> = {
  none: 'gap-y-0',
  xs: 'gap-y-2',
  sm: 'gap-y-3',
  md: 'gap-y-6',
  lg: 'gap-y-10',
  xl: 'gap-y-16',
  xxl: 'gap-y-24',
};

export const GAP_Y_CLASS_MD: Record<SpacingScale, string> = {
  none: 'md:gap-y-0',
  xs: 'md:gap-y-2',
  sm: 'md:gap-y-3',
  md: 'md:gap-y-6',
  lg: 'md:gap-y-10',
  xl: 'md:gap-y-16',
  xxl: 'md:gap-y-24',
};

export const GUTTER_VERTICAL_CLASS: Record<NonZeroSpacingScale, string> = {
  xs: 'h-3',
  sm: 'h-6',
  md: 'h-12',
  lg: 'h-20',
  xl: 'h-32',
  xxl: 'h-48',
};

export const GUTTER_VERTICAL_CLASS_MD: Record<NonZeroSpacingScale, string> = {
  xs: 'md:h-3',
  sm: 'md:h-6',
  md: 'md:h-12',
  lg: 'md:h-20',
  xl: 'md:h-32',
  xxl: 'md:h-48',
};

export const GUTTER_HORIZONTAL_CLASS: Record<NonZeroSpacingScale, string> = {
  xs: 'w-3',
  sm: 'w-6',
  md: 'w-12',
  lg: 'w-20',
  xl: 'w-32',
  xxl: 'w-48',
};

export const GUTTER_HORIZONTAL_CLASS_MD: Record<NonZeroSpacingScale, string> = {
  xs: 'md:w-3',
  sm: 'md:w-6',
  md: 'md:w-12',
  lg: 'md:w-20',
  xl: 'md:w-32',
  xxl: 'md:w-48',
};

export const MIN_HEIGHT_CLASS: Record<MinHeight, string> = {
  auto: '',
  sm: 'min-h-[40vh]',
  md: 'min-h-[60vh]',
  lg: 'min-h-[80vh]',
  screen: 'min-h-screen',
};

export const MIN_HEIGHT_CLASS_MD: Record<MinHeight, string> = {
  auto: '',
  sm: 'md:min-h-[40vh]',
  md: 'md:min-h-[60vh]',
  lg: 'md:min-h-[80vh]',
  screen: 'md:min-h-screen',
};

export const RADIUS_CLASS: Record<Radius, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  pill: 'rounded-pill',
  full: 'rounded-full',
};

export const RADIUS_CLASS_MD: Record<Radius, string> = {
  none: 'md:rounded-none',
  sm: 'md:rounded-sm',
  md: 'md:rounded-md',
  lg: 'md:rounded-lg',
  pill: 'md:rounded-pill',
  full: 'md:rounded-full',
};

export const BORDER_CLASS: Record<Border, string> = {
  none: 'border-0',
  hairline: 'border-[0.5px]',
  thin: 'border',
  medium: 'border-2',
  thick: 'border-4',
};

export const BORDER_CLASS_MD: Record<Border, string> = {
  none: 'md:border-0',
  hairline: 'md:border-[0.5px]',
  thin: 'md:border',
  medium: 'md:border-2',
  thick: 'md:border-4',
};

export const SHADOW_CLASS: Record<Shadow, string> = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
};

export const SHADOW_CLASS_MD: Record<Shadow, string> = {
  none: 'md:shadow-none',
  sm: 'md:shadow-sm',
  md: 'md:shadow-md',
  lg: 'md:shadow-lg',
};

export const ALIGN_ITEMS_CLASS: Record<Align, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

export const ALIGN_ITEMS_CLASS_MD: Record<Align, string> = {
  start: 'md:items-start',
  center: 'md:items-center',
  end: 'md:items-end',
  stretch: 'md:items-stretch',
};

export const ALIGN_ITEMS_WITH_BASELINE_CLASS: Record<AlignWithBaseline, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

export const ALIGN_ITEMS_WITH_BASELINE_CLASS_MD: Record<AlignWithBaseline, string> = {
  start: 'md:items-start',
  center: 'md:items-center',
  end: 'md:items-end',
  stretch: 'md:items-stretch',
  baseline: 'md:items-baseline',
};

export const JUSTIFY_CONTENT_CLASS: Record<Justify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
  stretch: 'justify-stretch',
};

export const JUSTIFY_CONTENT_CLASS_MD: Record<Justify, string> = {
  start: 'md:justify-start',
  center: 'md:justify-center',
  end: 'md:justify-end',
  between: 'md:justify-between',
  around: 'md:justify-around',
  evenly: 'md:justify-evenly',
  stretch: 'md:justify-stretch',
};

export const ALIGN_CONTENT_CLASS: Record<Align, string> = {
  start: 'content-start',
  center: 'content-center',
  end: 'content-end',
  stretch: 'content-stretch',
};

export const ALIGN_CONTENT_CLASS_MD: Record<Align, string> = {
  start: 'md:content-start',
  center: 'md:content-center',
  end: 'md:content-end',
  stretch: 'md:content-stretch',
};

export const GRID_COLS_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
  11: 'grid-cols-11',
  12: 'grid-cols-12',
};

export const GRID_COLS_CLASS_MD: Record<number, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
  6: 'md:grid-cols-6',
  7: 'md:grid-cols-7',
  8: 'md:grid-cols-8',
  9: 'md:grid-cols-9',
  10: 'md:grid-cols-10',
  11: 'md:grid-cols-11',
  12: 'md:grid-cols-12',
};

export const GRID_ROWS_CLASS: Record<number, string> = {
  1: 'grid-rows-1',
  2: 'grid-rows-2',
  3: 'grid-rows-3',
  4: 'grid-rows-4',
  5: 'grid-rows-5',
  6: 'grid-rows-6',
};

export function joinClasses(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

export function defaultMobileColumnsForDesktop(desktopColumns: number): number {
  if (desktopColumns >= 5) return 2;
  if (desktopColumns >= 3) return 2;
  if (desktopColumns === 2) return 1;
  return 1;
}
