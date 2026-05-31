import { TYPE_SCALE_ROLES } from './types';
import type { StyleSheet } from '@/lib/style-sheet';

export interface DesignSystemIssue {
  path: string;
  message: string;
}

export interface DesignSystemValidationResult {
  ok: boolean;
  issues: DesignSystemIssue[];
}

export function validateDesignSystem(sheet: StyleSheet): DesignSystemValidationResult {
  const issues: DesignSystemIssue[] = [];
  const fontNames = new Set(sheet.fonts.map((f) => f.name));

  for (const role of TYPE_SCALE_ROLES) {
    const entry = sheet.typeScale[role];
    if (!fontNames.has(entry.fontName)) {
      issues.push({
        path: `typeScale.${role}.fontName`,
        message: `font "${entry.fontName}" not found in fonts array — add it or correct the name`,
      });
    }
  }

  if (sheet.spacing.unit < 4) {
    issues.push({ path: 'spacing.unit', message: 'spacing unit must be ≥ 4px' });
  }

  return { ok: issues.length === 0, issues };
}
