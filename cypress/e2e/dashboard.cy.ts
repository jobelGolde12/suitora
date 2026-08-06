/// <reference types="cypress" />

describe("Dashboard navigation", () => {
	beforeEach(() => {
		cy.login("e2e-user@example.com", "TestPass123!");
	});

	it("renders the dashboard with stats and quick actions", () => {
		cy.visit("/dashboard");
		cy.url().should("include", "/dashboard");
		cy.contains(/welcome back/i).should("be visible");
		cy.contains(/quick actions/i).should("be.visible");

		// Quick action cards
		cy.contains(/upload photo/i).should("be.visible");
		cy.contains(/wardrobe/i).should("be.visible");
		cy.contains(/ai stylist/i).should("be.visible");
		cy.contains(/history/i).should("be.visible");
	});

	it("navigates to the upload page from the quick action", () => {
		cy.visit("/dashboard");
		cy.contains(/upload photo/i).click();
		cy.url().should("include", "/upload");
	});

	it("navigates to the wardrobe page", () => {
		cy.visit("/dashboard");
		cy.contains(/wardrobe/i).click();
		cy.url().should("include", "/wardrobe");
	});

	it("navigates to the stylist page", () => {
		cy.visit("/dashboard");
		cy.contains(/ai stylist/i).click();
		cy.url().should("include", "/stylist");
	});

	it("shows the history page with empty state", () => {
		cy.visit("/history");
		cy.contains(/no analyses yet/i).should("be.visible");
	});
});
