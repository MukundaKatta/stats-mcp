#!/usr/bin/env node
/**
 * stats MCP server. One tool: `summary`.
 *
 * Descriptive statistics over an array of numbers: count, sum, mean, median,
 * min, max, stddev (sample), variance, and configurable percentiles. Uses a
 * single sort for the order statistics so cost is O(n log n).
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const VERSION = '0.1.0';

export interface SummaryResult {
  count: number;
  sum: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  stddev: number;
  variance: number;
  percentiles: Record<string, number>;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  if (sorted.length === 1) return sorted[0];
  // Linear interpolation between closest ranks (NIST type 7 / numpy default).
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const frac = idx - lo;
  return sorted[lo] * (1 - frac) + sorted[hi] * frac;
}

export function summary(values: number[], pcts: number[] = [25, 50, 75, 90, 95, 99]): SummaryResult {
  if (!Array.isArray(values) || values.length === 0) throw new Error('values must be a non-empty array');
  for (const v of values) if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error('all values must be finite numbers');
  if (!Array.isArray(pcts)) throw new Error('percentiles must be an array of numbers');
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const variance = n > 1
    ? sorted.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)
    : 0;
  const stddev = Math.sqrt(variance);
  const percentiles: Record<string, number> = {};
  for (const p of pcts) {
    if (typeof p !== 'number' || !Number.isFinite(p)) throw new Error('each percentile must be a finite number');
    if (p < 0 || p > 100) throw new Error('percentile must be in [0, 100]');
    percentiles[`p${p}`] = percentile(sorted, p);
  }
  return {
    count: n,
    sum,
    mean,
    median: percentile(sorted, 50),
    min: sorted[0],
    max: sorted[n - 1],
    stddev,
    variance,
    percentiles,
  };
}

const server = new Server({ name: 'stats', version: VERSION }, { capabilities: { tools: {} } });

const TOOLS = [
  {
    name: 'summary',
    description:
      'Descriptive statistics over a numeric array: count, sum, mean, median, min, max, sample stddev/variance, plus configurable percentiles.',
    inputSchema: {
      type: 'object',
      properties: {
        values: { type: 'array', items: { type: 'number' } },
        percentiles: {
          type: 'array',
          items: { type: 'number' },
          default: [25, 50, 75, 90, 95, 99],
        },
      },
      required: ['values'],
    },
  },
] as const;

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    if (name !== 'summary') return errorResult('unknown tool: ' + name);
    const a = args as unknown as { values: number[]; percentiles?: number[] };
    return jsonResult(summary(a.values, a.percentiles));
  } catch (err) {
    return errorResult('stats failed: ' + (err as Error).message);
  }
});

function jsonResult(value: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}
function errorResult(message: string) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`stats MCP server v${VERSION} ready on stdio\n`);
}
