# stats-mcp

[![npm](https://img.shields.io/npm/v/@mukundakatta/stats-mcp.svg)](https://www.npmjs.com/package/@mukundakatta/stats-mcp)
[![mcp](https://img.shields.io/badge/protocol-MCP-blue.svg)](https://modelcontextprotocol.io)

MCP server: descriptive statistics over a numeric array. Returns count,
sum, mean, median, min, max, sample stddev/variance, and configurable
percentiles (linear interpolation, NumPy-default). No deps.

## Tool

### `summary`

```json
{ "values": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }
```

→

```json
{
  "count": 10, "sum": 55,
  "mean": 5.5, "median": 5.5,
  "min": 1, "max": 10,
  "stddev": 3.027650, "variance": 9.166667,
  "percentiles": { "p25": 3.25, "p50": 5.5, "p75": 7.75, "p90": 9.1, "p95": 9.55, "p99": 9.91 }
}
```

Default percentiles: `[25, 50, 75, 90, 95, 99]`. Override via `percentiles: [...]`.

## Configure

```json
{ "mcpServers": { "stats": { "command": "npx", "args": ["-y", "@mukundakatta/stats-mcp"] } } }
```

## License

MIT.
