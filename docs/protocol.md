# HTTP vs gRPC Performance Comparison

This document compares the performance of HTTP and gRPC protocols on high-traffic endpoints. All tests were run 3 times and the median result is reported below.

## Environment
- Apple Silicon M1 Pro chip
- 32GB RAM
- macOS Sequoia 15.5

## Executive Summary

| Endpoint | HTTP Req/sec | gRPC Req/sec | HTTP Advantage | HTTP Latency | gRPC Latency |
|----------|--------------|--------------|----------------|--------------|--------------|
| Weather  | 7,840        | 4,362        | **+80%**       | 1.03 ms      | 1.89 ms      |
| Metrics  | 2,997        | 1,974        | **+52%**       | 2.7 ms       | 4.55 ms      |

**Key Finding:** HTTP consistently outperforms gRPC by 52-80% in throughput with lower latency.

**Additional Observations:**
- gRPC was tested without TLS certificates (insecure mode)
- HTTP appears to use keep-alive connections, reducing TCP handshake overhead

<details>

```js
server.on('connection', (socket) => {
  console.count('New connection established');

  socket.on('close', () => {
    console.count('Socket closed');
  });

  socket.on('end', () => {
    console.count('Socket ended');
  });
});
```

```bash
@weather-subscription/weather:dev: New connection established: 1
@weather-subscription/weather:dev: New connection established: 2
@weather-subscription/weather:dev: New connection established: 3
@weather-subscription/weather:dev: New connection established: 4
@weather-subscription/weather:dev: New connection established: 5
@weather-subscription/weather:dev: New connection established: 6
@weather-subscription/weather:dev: New connection established: 7
@weather-subscription/weather:dev: New connection established: 8
@weather-subscription/weather:dev: New connection established: 9
@weather-subscription/weather:dev: New connection established: 10
@weather-subscription/weather:dev: Socket ended: 1
@weather-subscription/weather:dev: Socket closed: 1
@weather-subscription/weather:dev: Socket ended: 2
@weather-subscription/weather:dev: Socket ended: 3
@weather-subscription/weather:dev: Socket ended: 4
@weather-subscription/weather:dev: Socket ended: 5
@weather-subscription/weather:dev: Socket ended: 6
@weather-subscription/weather:dev: Socket ended: 7
@weather-subscription/weather:dev: Socket ended: 8
@weather-subscription/weather:dev: Socket ended: 9
@weather-subscription/weather:dev: Socket closed: 2
@weather-subscription/weather:dev: Socket closed: 3
@weather-subscription/weather:dev: Socket closed: 4
@weather-subscription/weather:dev: Socket closed: 5
@weather-subscription/weather:dev: Socket closed: 6
@weather-subscription/weather:dev: Socket closed: 7
@weather-subscription/weather:dev: Socket closed: 8
@weather-subscription/weather:dev: Socket closed: 9
@weather-subscription/weather:dev: Socket ended: 10
@weather-subscription/weather:dev: Socket closed: 10
```
</details>

> **Note:** You can reproduce these results yourself by checking out the `hw9-http` branch and running the benchmark tests included in the repository.

---

## Weather Endpoint

**Test Command:**
```bash
npx autocannon "http://localhost:3000/api/weather?city=Chernivtsi"
```

**Performance Comparison:**

| Protocol | Total Requests | Duration | Avg Req/sec | Avg Latency | Throughput | Response Size |
|----------|----------------|----------|-------------|-------------|------------|---------------|
| HTTP     | 86,000         | 11s      | 7,840       | 1.03 ms     | 4.83 MB/s  | 68 bytes      |
| gRPC     | 44,000         | 10s      | 4,362       | 1.89 ms     | 2.63 MB/s  | 27 bytes      |

**Raw Test Output:**

<details>
<summary>gRPC Results</summary>

```
Running 10s test @ http://localhost:3000/api/weather?city=Chernivtsi
10 connections


┌─────────┬──────┬──────┬───────┬──────┬─────────┬─────────┬───────┐
│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%  │ Avg     │ Stdev   │ Max   │
├─────────┼──────┼──────┼───────┼──────┼─────────┼─────────┼───────┤
│ Latency │ 1 ms │ 2 ms │ 3 ms  │ 3 ms │ 1.89 ms │ 0.67 ms │ 16 ms │
└─────────┴──────┴──────┴───────┴──────┴─────────┴─────────┴───────┘
┌───────────┬────────┬────────┬─────────┬─────────┬─────────┬────────┬─────────┐
│ Stat      │ 1%     │ 2.5%   │ 50%     │ 97.5%   │ Avg     │ Stdev  │ Min     │
├───────────┼────────┼────────┼─────────┼─────────┼─────────┼────────┼─────────┤
│ Req/Sec   │ 3,965  │ 3,965  │ 4,403   │ 4,579   │ 4,361.9 │ 177.03 │ 3,965   │
├───────────┼────────┼────────┼─────────┼─────────┼─────────┼────────┼─────────┤
│ Bytes/Sec │ 2.4 MB │ 2.4 MB │ 2.66 MB │ 2.76 MB │ 2.63 MB │ 107 kB │ 2.39 MB │
└───────────┴────────┴────────┴─────────┴─────────┴─────────┴────────┴─────────┘

Req/Bytes counts sampled once per second.
# of samples: 10

44k requests in 10.01s, 26.3 MB read
```

```ts
const grpcResponseSize = WeatherServiceDefinition.methods.getWeather.responseType.encode({ weather: await weatherService.getWeather(city) }).finish().byteLength;
```
</details>

<details>
<summary>HTTP Results</summary>

```
Running 10s test @ http://localhost:3000/api/weather?city=Chernivtsi
10 connections


┌─────────┬──────┬──────┬───────┬──────┬─────────┬─────────┬───────┐
│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%  │ Avg     │ Stdev   │ Max   │
├─────────┼──────┼──────┼───────┼──────┼─────────┼─────────┼───────┤
│ Latency │ 0 ms │ 1 ms │ 2 ms  │ 2 ms │ 1.03 ms │ 0.44 ms │ 10 ms │
└─────────┴──────┴──────┴───────┴──────┴─────────┴─────────┴───────┘
┌───────────┬─────────┬─────────┬─────────┬─────────┬──────────┬────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg      │ Stdev  │ Min     │
├───────────┼─────────┼─────────┼─────────┼─────────┼──────────┼────────┼─────────┤
│ Req/Sec   │ 7,331   │ 7,331   │ 7,883   │ 8,015   │ 7,839.82 │ 180.38 │ 7,328   │
├───────────┼─────────┼─────────┼─────────┼─────────┼──────────┼────────┼─────────┤
│ Bytes/Sec │ 4.52 MB │ 4.52 MB │ 4.86 MB │ 4.94 MB │ 4.83 MB  │ 111 kB │ 4.51 MB │
└───────────┴─────────┴─────────┴─────────┴─────────┴──────────┴────────┴─────────┘

Req/Bytes counts sampled once per second.
# of samples: 11

86k requests in 11.01s, 53.1 MB read
```

```ts
const httpResponseSize = Buffer.from(JSON.stringify({ weather: await weatherService.getWeather(city) })).byteLength;
```
</details>

---

## Metrics Endpoint

**Test Command:**
```bash
npx autocannon "http://localhost:3000/api/metrics"
```

**Performance Comparison:**

| Protocol | Total Requests | Duration | Avg Req/sec | Avg Latency | Throughput | Response Size |
|----------|----------------|----------|-------------|-------------|------------|---------------|
| HTTP     | 33,000         | 11s      | 2,997       | 2.7 ms      | 27.2 MB/s  | 8964 bytes    |
| gRPC     | 20,000         | 10s      | 1,974       | 4.55 ms     | 18.1 MB/s  | 8581 bytes    |

**Raw Test Output:**

<details>
<summary>gRPC Results</summary>

```
Running 10s test @ http://localhost:3000/api/metrics
10 connections


┌─────────┬──────┬──────┬───────┬──────┬─────────┬─────────┬───────┐
│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%  │ Avg     │ Stdev   │ Max   │
├─────────┼──────┼──────┼───────┼──────┼─────────┼─────────┼───────┤
│ Latency │ 4 ms │ 4 ms │ 6 ms  │ 7 ms │ 4.55 ms │ 0.89 ms │ 22 ms │
└─────────┴──────┴──────┴───────┴──────┴─────────┴─────────┴───────┘
┌───────────┬─────────┬─────────┬─────────┬─────────┬─────────┬────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg     │ Stdev  │ Min     │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┼─────────┤
│ Req/Sec   │ 1,867   │ 1,867   │ 1,990   │ 2,019   │ 1,973.5 │ 49.18  │ 1,867   │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┼─────────┤
│ Bytes/Sec │ 17.1 MB │ 17.1 MB │ 18.2 MB │ 18.5 MB │ 18.1 MB │ 448 kB │ 17.1 MB │
└───────────┴─────────┴─────────┴─────────┴─────────┴─────────┴────────┴─────────┘

Req/Bytes counts sampled once per second.
# of samples: 10

20k requests in 10.01s, 181 MB read
```

```ts
const grpcResponseSize = WeatherServiceDefinition.methods.collectMetrics.responseType.encode(await metricsService.collectMetrics()).finish().byteLength;
```
</details>

<details>
<summary>HTTP Results</summary>

```
Running 10s test @ http://localhost:3000/api/metrics
10 connections


┌─────────┬──────┬──────┬───────┬──────┬────────┬─────────┬───────┐
│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%  │ Avg    │ Stdev   │ Max   │
├─────────┼──────┼──────┼───────┼──────┼────────┼─────────┼───────┤
│ Latency │ 2 ms │ 2 ms │ 6 ms  │ 6 ms │ 2.7 ms │ 1.13 ms │ 23 ms │
└─────────┴──────┴──────┴───────┴──────┴────────┴─────────┴───────┘
┌───────────┬─────────┬─────────┬─────────┬─────────┬─────────┬────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg     │ Stdev  │ Min     │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┼─────────┤
│ Req/Sec   │ 2,879   │ 2,879   │ 3,005   │ 3,043   │ 2,997   │ 44.42  │ 2,879   │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┼─────────┤
│ Bytes/Sec │ 26.2 MB │ 26.2 MB │ 27.3 MB │ 27.7 MB │ 27.2 MB │ 411 kB │ 26.2 MB │
└───────────┴─────────┴─────────┴─────────┴─────────┴─────────┴────────┴─────────┘

Req/Bytes counts sampled once per second.
# of samples: 11

33k requests in 11.01s, 300 MB read
```

```ts
const httpResponseSize = Buffer.from(JSON.stringify(await metricsService.collectMetrics())).byteLength;
```
</details>

---

## Performance Analysis

Based on the benchmark results:

1. **HTTP significantly outperforms gRPC** in both throughput and latency
2. **Weather endpoint**: HTTP achieves 80% higher throughput (7,840 vs 4,362 req/sec)
3. **Metrics endpoint**: HTTP achieves 52% higher throughput (2,997 vs 1,974 req/sec)
4. **Latency**: HTTP consistently shows lower latency across both endpoints
5. **Response size**: gRPC produces smaller payloads (60% smaller for weather, 4.3% smaller for metrics) due to Protocol Buffers binary serialization, but this doesn't translate to better performance

## Summary

**Use HTTP for these high-traffic endpoints** due to:
- Eliminates gRPC serialization/deserialization overhead when converting between different data formats (JSON to Protocol Buffers and back)
- Lower latency
- Better resource utilization
- Despite larger response sizes, HTTP's performance advantages outweigh the bandwidth overhead

**Consider gRPC when** specific features are required:
- Streaming capabilities
- Strong typing with Protocol Buffers
- Built-in load balancing
- Advanced routing features
- Bandwidth is a critical constraint (gRPC produces 4-60% smaller payloads)
