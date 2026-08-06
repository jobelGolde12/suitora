/**
 * Smoke scenario for k6 (Pillar 05, Action Item 7).
 *
 * Validates correctness with a small number of virtual users before
 * ramping to the peak load. Exits quickly if the service is down.
 */

/* eslint-disable import/no-anonymous-default-export */

import http from "k6/http";
import { check, sleep } from "k6";

const TARGET_URL = __ENV.TARGET_URL || "http://localhost:3000";

export const options = {
	vus: 1,
	vusMultiplier: 10,
	exec: "default",
	scenarios: {
		smoke: {
			executor: "constant-vus",
			vus: 1,
			duration: "30s",
			exec: "default",
		},
	},
	thresholds: {
		http_req_failed: ["rate<0.01"], // no failures in smoke
		http_req_duration: ["p(95)<200"],
	},
};

export default function () {
	check(http.get(`${TARGET_URL}/`), {
		"landing page returns 200": (r) => r.status === 200,
	});

	const res = http.get(`${TARGET_URL}/api/dashboard/stats`, {
		headers: { "Content-Type": "application/json" },
	});

	check(res, {
		"dashboard responds": (r) => r.status === 200 || r.status === 401,
	});

	sleep(1);
}
