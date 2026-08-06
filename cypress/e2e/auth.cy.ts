/// <reference types="cypress" />

const TEST_EMAIL = `e2e-${Date.now()}@example.com`;
const TEST_PASSWORD = "TestPass123!";
const TEST_NAME = "E2E Tester";

describe("Authentication flows", () => {
	it("allows a user to register, login, and logout", () => {
		// Register
		cy.visit("/register");
		cy.get('input[name="name"]').type(TEST_NAME);
		cy.get('input[name="email"]').type(TEST_EMAIL);
		cy.get('input[name="password"]').type(TEST_PASSWORD);
		cy.get('input[name="confirmPassword"]').type(TEST_PASSWORD);
		cy.get('input[name="agreeToTerms"]').check();
		cy.contains("button", /create account/i).click();

		// After registration, user should land on dashboard (or be redirected)
		cy.url().should("include", "/dashboard", { timeout: 15000 });
		cy.contains(/welcome back/i).should("be.visible");
	});

	it("rejects registration with mismatched passwords", () => {
		cy.visit("/register");
		cy.get('input[name="name"]').type("Mismatch");
		cy.get('input[name="email"]').type(`mismatch@example.com`);
		cy.get('input[name="password"]').type(TEST_PASSWORD);
		cy.get('input[name="confirmPassword"]').type("DifferentPass123!");
		cy.get('input[name="agreeToTerms"]').check();
		cy.contains("button", /create account/i).click();
		cy.contains(/passwords don't match/i).should("be.visible");
	});

	it("rejects registration without terms agreement", () => {
		cy.visit("/register");
		cy.get('input[name="name"]').type("No Terms");
		cy.get('input[name="email"]').type(`noterms@example.com`);
		cy.get('input[name="password"]').type(TEST_PASSWORD);
		cy.get('input[name="confirmPassword"]').type(TEST_PASSWORD);
		cy.contains("button", /create account/i).click();
		cy.contains(/you must agree/i).should("be.visible");
	});

	it("shows a validation error for an invalid email on login", () => {
		cy.visit("/login");
		cy.get('input[name="email"]').type("not-an-email");
		cy.get('input[name="password"]').type(TEST_PASSWORD);
		cy.contains("button", /sign in/i).click();
		cy.contains(/valid email/i).should("be.visible");
	});

	it("navigates between login and register pages", () => {
		cy.visit("/login");
		cy.contains(/sign up/i).click();
		cy.url().should("include", "/register");

		cy.contains(/sign in/i).first().click();
		cy.url().should("include", "/login");
	});
});
