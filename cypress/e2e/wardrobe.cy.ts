/// <reference types="cypress" />

describe("Wardrobe & favorites flow", () => {
	beforeEach(() => {
		cy.seedUser();
	});

	it("navigates the favorites page", () => {
		cy.visit("/favorites");
		cy.url().should("include", "/favorites");
	});

	it("navigates the wardrobe page", () => {
		cy.visit("/wardrobe");
		cy.url().should("include", "/wardrobe");
	});

	it("can view analysis history", () => {
		cy.visit("/history");
		cy.url().should("include", "/history");
	});
});

describe("Stylist chatbot flow", () => {
	beforeEach(() => {
		cy.seedUser();
	});

	it("loads the stylist page and can send a message", () => {
		// Stub the stylist API response before the request fires
		cy.intercept("POST", "/api/stylist*", {
			statusCode: 200,
			body: {
				success: true,
				message: "A flowy midi dress in floral print would be perfect.",
			},
		}).as("stylistReply");

		cy.visit("/stylist");
		cy.url().should("include", "/stylist");

		cy.get('[data-cy="stylist-input"]').should("be.visible");
		cy.get('[data-cy="stylist-input"]').type("What should I wear for a summer wedding?");
		cy.get('[data-cy="stylist-send"]').click();

		// The assistant reply should eventually appear
		cy.get('[data-cy="stylist-message"]', { timeout: 10000 })
			.contains(/midi dress/i)
			.should("be.visible");
	});
});
