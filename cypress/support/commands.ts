/// <reference types="cypress" />

/* eslint-disable @typescript-eslint/no-namespace */

declare global {
	namespace Cypress {
		interface Chainable {
			/** Register a new user through the UI */
			register(email: string, password: string, name?: string): Chainable<void>;
			/** Log in through the UI using form submit */
			login(email: string, password: string): Chainable<void>;
			/** Log out the current user */
			logout(): Chainable<void>;
			/** Stub the AI analysis API to return a fixed result */
			stubAnalysis(): Chainable<void>;
		}
	}
}

const TEST_NAME = "E2E Tester";

Cypress.Commands.add("register", (email, password, name = TEST_NAME) => {
	cy.visit("/register");
	cy.get('input[name="name"]').type(name);
	cy.get('input[name="email"]').type(email);
	cy.get('input[name="password"]').type(password);
	cy.get('input[name="confirmPassword"]').type(password);
	cy.get('input[name="agreeToTerms"]').check();
	cy.contains("button", /create account/i).click();
});

Cypress.Commands.add("login", (email, password) => {
	cy.visit("/login");
	cy.get('input[name="email"]').type(email);
	cy.get('input[name="password"]').type(password);
	cy.contains("button", /sign in/i).click();
});

Cypress.Commands.add("logout", () => {
	cy.get('[data-cy="logout"]').click({ force: true });
});

Cypress.Commands.add("stubAnalysis", () => {
	cy.intercept("POST", "/api/analyze", {
		statusCode: 200,
		body: {
			success: true,
			data: {
				id: "analysis-e2e-1",
				overallScore: 82,
				bodyScore: 80,
				styleScore: 85,
				colorScore: 90,
				bodyShape: "hourglass",
				skinTone: "warm",
				faceShape: "oval",
				styleType: "casual",
				status: "completed",
				recommendations: ["Pair with neutral tones", "Add a statement belt"],
			},
		},
	}).as("analysis");
});

export {};
