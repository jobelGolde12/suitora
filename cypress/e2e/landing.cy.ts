/// <reference types="cypress" />

describe("Landing page", () => {
	it("renders the hero headline and primary CTA", () => {
		cy.visit("/");
		cy.contains("h1", /look good/i).should("be.visible");
		cy.contains(/stop wondering/i).should("be.visible");
		cy.contains("button", /start free trial/i).should("be.visible");
	});

	it("navigates to the register page from the hero CTA", () => {
		cy.visit("/");
		cy.contains("button", /start free trial/i).click();
		cy.url().should("include", "/register");
	});

	it("renders the feature grid and how-it-works sections", () => {
		cy.visit("/");
		cy.contains(/virtual try-on/i).should("be.visible");
		cy.contains(/compatibility scores/i).should("be.visible");
		cy.get('[data-cy="how-it-works"]').should("exist");
	});

	it("shows the FAQ accordion and expands an item", () => {
		cy.visit("/");
		cy.get('[data-cy="faq"]').first().should("be.visible");
		cy.get('[data-cy="faq-question"]').first().click();
		cy.get('[data-cy="faq-answer"]').first().should("be.visible");
	});

	it("renders the final CTA section", () => {
		cy.visit("/");
		cy.get('[data-cy="cta-section"]').should("be.visible");
	});
});
