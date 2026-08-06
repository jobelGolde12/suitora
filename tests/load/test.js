/**
 * k6 load test for Suitora (Pillar 05, Action Item 7).
 *
 * Runs the smoke and peak scenarios against a deployed environment.
 * Override the target URL with TARGET_URL env var (defaults to localhost).
 *
 * Usage:
 *   k6 run tests/load/test.js                       # run smoke only
 *   k6 run --env TARGET_URL=https://app.example.com tests/load/test.js
 *   k6 run --env SCENARIO=peak tests/load/test.js   # run peak only
 */

/* eslint-disable import/no-anonymous-default-export */

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Trend } from "k6/metrics";
import { SharedArray } from "k6/data";

const TARGET_URL = __ENV.TARGET_URL || "http://localhost:3000";
const SCENARIO = __ENV.SCENARIO || "smoke";

// --- Reusable metrics ---
const analysisLatency = new Trend("analysis_latency");
const authLatency = new Trend("auth_latency");
const wardrobeLatency = new Trend("wardrobe_latency");

// --- Test data ---
const testUsers = new SharedArray("testUsers", function () {
	return [
		{ email: "e2e-user@example.com", password: "TestPass123!" },
		{ email: "load-user-1@example.com", password: "TestPass456!" },
		{ email: "load-user-2@example.com", password: "TestPass789!" },
		{ email: "load-user-3@example.com", password: "TestPass012!" },
		{ email: "load-user-4@example.com", password: "TestPass345!" },
	];
});

const productUrls = [
	"https://example-shop.com/dress-1",
	"https://example-shop.com/dress-2",
	"https://example-shop.com/shirt-1",
	"https://example-shop.com/pants-1",
	"https://example-shop.com/jacket-1",
];

/**
 * Shared checks for a successful API response.
 */
function assertSuccess(res, label) {
	check(res, {
		[`${label} returns 2xx`]: (r) => r.status >= 200 && r.status < 300,
		[`${label} has success flag`]: (r) => {
			try {
				return JSON.parse(r.body).success === true;
			} catch {
				return false;
			}
		},
	});
}

export const options = {
	thresholds: {
		// SLOs (see docs/04_observability_logging.md)
		http_req_duration: ["p(95)<200", "p(99)<500"],
		http_req_failed: ["rate<0.001"], // < 0.1%
		analysis_latency: ["p(95)<300"],
		auth_latency: ["p(95)<150"],
	},
	scenarios: {
		smoke: {
			executor: "constant-vus",
			vus: 1,
			duration: "30s",
			exec: "smokeScenario",
			...SCENARIO === "peak" && { exec: "peakScenario" },
		},
		peak: {
			executor: "ramping-vus",
			startVUs: 0,
			stages: [
				{ duration: "30s", target: 50 },
				{ duration: "1m", target: 100 },
				{ duration: "2m", target: 200 },
				{ duration: "3m", target: 500 },
				{ duration: "3m", target: 667 }, // ~1000 RPS at ~1.5 req/s per VU
				{ duration: "1m", target: 0 },
			],
			exec: "peakScenario",
		},
	},
};

/**
 * Smoke scenario: validate correctness with 1–10 VUs.
 */
export function smokeScenario() {
	assertSuccess(http.get(`${TARGET_URL}/`), "landing");
	sleep(1);

	group("login check", function () {
		const user = testUsers[Math.floor(Math.random() * testUsers.length)];
		const res = http.post(`${TARGET_URL}/api/auth/sign-in/email`, JSON.stringify(user), {
			headers: { "Content-Type": "application/json" },
		});
		const start = Date.now();
		authLatency.add(Date.now() - start);
		check(res, {
			"login responds": (r) => r.status === 200 || r.status === 401,
		});
		sleep(1);
	});
}

/**
 * Peak scenario: ramp to 1000 RPS against the deployed app.
 * Models a realistic user mix: auth, analysis, wardrobe, favorites, trending.
 */
export function peakScenario() {
	const user = testUsers[Math.floor(Math.random() * testUsers.length)];
	const sessionId = `${user.email}-${Date.now()}`;

	// 1. Auth (login)
	group("login", function () {
		const res = http.post(`${TARGET_URL}/api/auth/sign-in/email`, JSON.stringify(user), {
			headers: { "Content-Type": "application/json" },
			cookies: { session: sessionId },
		});
		const start = Date.now();
		authLatency.add(Date.now() - start);
		check(res, {
			"login responds": (r) => r.status === 200 || r.status === 401,
		});
		sleep(0.5);
	});

	// 2. Dashboard stats
	group("dashboard_stats", function () {
	const res = http.get(`${TARGET_URL}/api/dashboard/stats`, {
		cookies: { session: sessionId },
	});
		check(res, {
			"dashboard stats 200": (r) => r.status === 200,
		});
		sleep(0.3);
	});

	// 3. Trending items
	group("trending", function () {
		const res = http.get(`${TARGET_URL}/api/trending?limit=8`, {
			cookies: { session: sessionId },
		});
		check(res, {
			"trending 200": (r) => r.status === 200,
		});
		sleep(0.5);
	});

	// 4. Analysis (POST product URL, GET result)
	group("analysis", function () {
		const productUrl = productUrls[Math.floor(Math.random() * productUrls.length)];
		const start = Date.now();
		const res = http.post(
			`${TARGET_URL}/api/analysis`,
			JSON.stringify({ productUrl }),
			{
				headers: { "Content-Type": "application/json" },
				cookies: { session: sessionId },
			}
		);
		analysisLatency.add(Date.now() - start);
		check(res, {
			"analysis POST 200": (r) => r.status === 200 || r.status === 202,
		});
		sleep(0.5);
	});

	// 5. Wardrobe
	group("wardrobe", function () {
		const start = Date.now();
		const res = http.get(`${TARGET_URL}/api/wardrobe`, {
			cookies: { session: sessionId },
		});
		wardrobeLatency.add(Date.now() - start);
		check(res, {
			"wardrobe GET 200": (r) => r.status === 200,
		});
		sleep(0.3);
	});

	// 6. Favorites
	group("favorites", function () {
		const res = http.get(`${TARGET_URL}/api/favorites`, {
			cookies: { session: sessionId },
		});
		check(res, {
			"favorites GET 200": (r) => r.status === 200,
		});
		sleep(0.5);
	});
}

export default function () {
	if (SCENARIO === "peak") {
		peakScenario();
	} else {
		smokeScenario();
	}
}
