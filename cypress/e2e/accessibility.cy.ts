/// <reference types="cypress" />

import type { RunOptions } from "axe-core";

/**
 * Automated accessibility regression (S-02).
 *
 * Scans key public + authenticated routes with axe-core using the WCAG
 * 2.0/2.1 A + AA rule set. Any violation fails the test, so the frontend
 * accessibility plan (suitora-frontend-test-plan/17-accessibility.md) is
 * enforced in CI going forward: new violations are merge blockers.
 *
 * Baseline exclusions: if a rule ever needs to be scoped out for a page, add
 * it to `BASELINE_RULES` with a comment explaining why — never without a
 * reason, and prefer fixing the markup instead.
 */
describe("Accessibility (WCAG 2.0/2.1 A+AA via axe-core)", () => {
	/**
	 * Explicit rule overrides. Kept empty on purpose: the app ships AA-tuned
	 * tokens (A11Y-020/021/022) and full label/landmark coverage, so the
	 * scan should run strict. Add an entry only with a documented reason.
	 */
	const BASELINE_RULES: RunOptions["rules"] = {};

	const AXE_OPTIONS: RunOptions = {
		runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
		rules: BASELINE_RULES,
	};

	const scanPage = (): void => {
		// Route-entrance fades (auth pages' motion.div, 0.6s) animate opacity
		// 0→1; axe composites text through semi-transparent ancestors, which
		// yields false contrast violations mid-animation. Let the fade settle.
		cy.wait(1200);
		cy.injectAxe();
		cy.checkA11y(undefined, AXE_OPTIONS, (violations) => {
			// Surface rule IDs / affected nodes in the failure message — the
			// stock cypress-axe error only reports the count.
			if (violations.length === 0) return;
			const details = violations
				.map((v) => {
					const targets = v.nodes
						.map((n) => n.target.join(" "))
						.join(", ");
					return `- ${v.id} [${v.impact}]: ${v.help} (${v.helpUrl}) — ${v.nodes.length} node(s): ${targets}`;
				})
				.join("\n");
			throw new Error(`Accessibility violations:\n${details}`);
		});
	};

	context("public routes", () => {
		it("landing page", () => {
			cy.visit("/");
			scanPage();
		});

		it("login", () => {
			cy.visit("/login");
			scanPage();
		});

		it("register", () => {
			cy.visit("/register");
			scanPage();
		});
	});

	context("authenticated routes", () => {
		it("dashboard", () => {
			cy.seedUser();
			cy.visit("/dashboard");
			scanPage();
		});

		it("upload", () => {
			cy.seedUser();
			cy.visit("/upload");
			scanPage();
		});

		it("settings", () => {
			cy.seedUser();
			cy.visit("/settings");
			scanPage();
		});

		it("history", () => {
			cy.seedUser();
			cy.visit("/history");
			scanPage();
		});

		it("favorites", () => {
			cy.seedUser();
			cy.visit("/favorites");
			scanPage();
		});

		it("stylist", () => {
			cy.seedUser();
			cy.visit("/stylist");
			scanPage();
		});

		it("trending", () => {
			cy.seedUser();
			cy.visit("/trending");
			scanPage();
		});
	});
});
