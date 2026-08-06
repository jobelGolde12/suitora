/// <reference types="cypress" />

describe("Wardrobe & favorites flow", () => {
	beforeEach(() => {
		cy.login("e2e-user@example.com", "TestPass123!");
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
		cy.login("e2e-user@example.com", "TestPass123!");
	});

	it("loads the stylist page and can send a message", () => {
		cy.visit("/stylist");
		cy.url().should("include", "/stylist");

		cy.get('[data-cy="stylist-input"]').should("be.visible");
		cy.get('[data-cy="stylist-input"]').type("What should I wear for a summer wedding?");
		cy.get('[data-cy="stylist-send"]').click();

		// Stub the stylist API response
		cy.intercept("POST", "/api/stylist*", {
			statusCode: 200,
			body: {
				success: true,
				data: {
					id: "msg_e2e",
					role: "assistant",
					content: "A flowy midi dress in floral print would be perfect.",
				},
			},
		}).as("stylistReply");

		// The assistant reply should eventually appear
		cy.get('[data-cy="stylist-message"]', { timeout: 10000 })
			.contains(/midi dress/i)
			.should("be.visible");
	});
});
