/**
 * Peak scenario for k6 (Pillar 05, Action Item 7).
 *
 * Ramps virtual users to generate ~1000 RPS against the deployed app.
 * Thresholds: p95 latency < 200ms, error rate < 0.1%.
 * Target: deployed environment (see 01_architecture_scalability.md).
 */

export const options = {
	exec: "peakScenario",
	scenarios: {
		peak: {
			executor: "ramping-vus",
			startVUs: 0,
			stages: [
				{ duration: "30s", target: 50 },   // warm-up
				{ duration: "1m", target: 100 },   // ramp up
				{ duration: "2m", target: 200 },  // sustained
				{ duration: "3m", target: 500 },   // peak
				{ duration: "3m", target: 667 },   // ~1000 RPS
				{ duration: "1m", target: 0 },      // ramp down
			],
			exec: "peakScenario",
		},
	},
	thresholds: {
		http_req_duration: ["p(95)<200", "p(99)<500"],
		http_req_failed: ["rate<0.001"],
		analysis_latency: ["p(95)<300"],
	},
};
