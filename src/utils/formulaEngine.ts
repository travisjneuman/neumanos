/**
 * Formula Engine - Custom parser for formula expressions
 * Security: Does NOT use any code execution methods
 */

import type { CustomFieldsMap } from '../types/customFields';

export type FormulaValue = number | string | boolean | null;

export interface FormulaEvaluationResult {
  value: FormulaValue;
  error?: string;
}

export function evaluateFormula(expression: string, fieldValues: CustomFieldsMap): FormulaEvaluationResult {
  try {
    const resolved = expression.replace(/\{([^}]+)\}/g, (_, fieldId) => {
      const val = fieldValues[fieldId];
      if (val === null || val === undefined) return '0';
      return typeof val === 'string' ? `"${val}"` : String(val);
    });
    return { value: parseExpr(resolved) };
  } catch (error) {
    return { value: null, error: error instanceof Error ? error.message : 'Invalid formula' };
  }
}

function parseExpr(expr: string): FormulaValue {
  const t = expr.trim();
  if (t.toUpperCase().startsWith('IF(')) return parseIf(t);
  if (t.toUpperCase().startsWith('SUM(')) return parseSum(t);
  if (t.toUpperCase().startsWith('AVERAGE(')) return parseAvg(t);
  if (t.toUpperCase().startsWith('COUNT(')) return parseCnt(t);
  if (t.toUpperCase().startsWith('DAYS_BETWEEN(')) return parseDays(t);
  if (t.includes('=') || t.includes('!') || t.includes('>') || t.includes('<')) return parseComp(t);
  if (t.includes('+') || t.includes('-') || t.includes('*') || t.includes('/')) return parseMath(t);
  return parseLit(t);
}

function parseIf(expr: string): FormulaValue {
  const m = expr.match(/^IF\s*\((.*)\)$/i);
  if (!m) throw new Error('Invalid IF');
  const args = splitArgs(m[1]);
  if (args.length !== 3) throw new Error('IF needs 3 args');
  return parseExpr(args[0]) ? parseExpr(args[1]) : parseExpr(args[2]);
}

function parseSum(expr: string): number {
  const m = expr.match(/^SUM\s*\((.*)\)$/i);
  if (!m) throw new Error('Invalid SUM');
  return splitArgs(m[1]).reduce((s, a) => s + (Number(parseExpr(a)) || 0), 0);
}

function parseAvg(expr: string): number {
  const m = expr.match(/^AVERAGE\s*\((.*)\)$/i);
  if (!m) throw new Error('Invalid AVG');
  const args = splitArgs(m[1]);
  return args.length ? parseSum(`SUM(${m[1]})`) / args.length : 0;
}

function parseCnt(expr: string): number {
  const m = expr.match(/^COUNT\s*\((.*)\)$/i);
  if (!m) throw new Error('Invalid COUNT');
  return splitArgs(m[1]).filter(a => { const v = parseExpr(a); return v !== null && v !== undefined && v !== ''; }).length;
}

function parseDays(expr: string): number {
  const m = expr.match(/^DAYS_BETWEEN\s*\((.*)\)$/i);
  if (!m) throw new Error('Invalid DAYS_BETWEEN');
  const args = splitArgs(m[1]);
  if (args.length !== 2) throw new Error('DAYS_BETWEEN needs 2 args');
  const d1 = new Date(String(parseExpr(args[0])));
  const d2 = new Date(String(parseExpr(args[1])));
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) throw new Error('Invalid date');
  return Math.floor((d2.getTime() - d1.getTime()) / 86400000);
}

function parseComp(expr: string): boolean {
  const m = expr.match(/^(.+?)\s*(<=|>=|!=|=|<|>)\s*(.+)$/);
  if (!m) throw new Error('Invalid comparison');
  const [, l, op, r] = m;
  const left = parseExpr(l), right = parseExpr(r);
  switch (op) {
    case '=': return left === right;
    case '!=': return left !== right;
    case '<': return Number(left) < Number(right);
    case '>': return Number(left) > Number(right);
    case '<=': return Number(left) <= Number(right);
    case '>=': return Number(left) >= Number(right);
    default: throw new Error('Unknown op');
  }
}

function parseMath(expr: string): number {
  let toks = expr.split(/([+\-*/])/).map(t => t.trim()).filter(t => t);
  for (let i = 1; i < toks.length; i += 2) {
    if (toks[i] === '*' || toks[i] === '/') {
      const res = toks[i] === '*' ? Number(toks[i-1]) * Number(toks[i+1]) : Number(toks[i-1]) / Number(toks[i+1]);
      if (toks[i] === '/' && Number(toks[i+1]) === 0) throw new Error('Div by zero');
      toks.splice(i-1, 3, String(res));
      i -= 2;
    }
  }
  for (let i = 1; i < toks.length; i += 2) {
    if (toks[i] === '+' || toks[i] === '-') {
      const res = toks[i] === '+' ? Number(toks[i-1]) + Number(toks[i+1]) : Number(toks[i-1]) - Number(toks[i+1]);
      toks.splice(i-1, 3, String(res));
      i -= 2;
    }
  }
  return Number(toks[0]);
}

function parseLit(v: string): FormulaValue {
  const t = v.trim();
  if (t.toLowerCase() === 'true') return true;
  if (t.toLowerCase() === 'false') return false;
  if (t.toLowerCase() === 'null') return null;
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
  const n = Number(t);
  return !isNaN(n) ? n : t;
}

function splitArgs(s: string): string[] {
  const args: string[] = [];
  let cur = '', depth = 0, inStr = false, strCh = '';
  for (const c of s) {
    if ((c === '"' || c === "'") && !inStr) { inStr = true; strCh = c; cur += c; continue; }
    if (c === strCh && inStr) { inStr = false; strCh = ''; cur += c; continue; }
    if (inStr) { cur += c; continue; }
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (c === ',' && depth === 0) { args.push(cur.trim()); cur = ''; } else cur += c;
  }
  if (cur.trim()) args.push(cur.trim());
  return args;
}

export function detectCircularReferences(fieldId: string, refs: string[], all: Array<{ id: string; referencedFields?: string[] }>): boolean {
  const vis = new Set<string>();
  function dfs(id: string): boolean {
    if (vis.has(id)) return true;
    vis.add(id);
    const f = all.find(x => x.id === id);
    if (f?.referencedFields) for (const r of f.referencedFields) if (dfs(r)) return true;
    vis.delete(id);
    return false;
  }
  for (const r of refs) {
    if (r === fieldId) return true;
    const f = all.find((x: { id: string }) => x.id === r);
    if (f?.referencedFields && dfs(r)) return true;
  }
  return false;
}

export function extractFieldReferences(expr: string): string[] {
  return Array.from(new Set(Array.from(expr.matchAll(/\{([^}]+)\}/g), m => m[1])));
}
