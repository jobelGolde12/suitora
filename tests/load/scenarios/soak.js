/**
 * Soak scenario for k6 (Pillar 05, Action Item 7).
 *
 * Runs a moderate load continuously to surface memory leaks and
 * degradation over time. Run for 10–30 minutes against staging.
 */

/* eslint-disable import/no-anonymous-default-export */

import http from "k6/http";
import { check, sleep } from "k6";

const TARGET_URL = __ENV.TARGET_URL || "http://localhost:3000";

export const options = {
	scenarios: {
		soak: {
			executor: "constant-vus",
			vus: 20,
			duration: "10m",
			exec: "default",
		},
	},
	thresholds: {
		http_req_duration: ["p(95)<300"],
		http_req_failed: ["rate<0.001"],
	},
};

export default function () {
	const res = http.get(`${TARGET_URL}/api/trending?limit=8`);
	check(res, {
		"trending responds": (r) => r.status === 200,
	});
	sleep(2);
}
