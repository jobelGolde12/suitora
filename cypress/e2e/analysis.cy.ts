/// <reference types="cypress" />

describe("Upload & analysis flow", () => {
	beforeEach(() => {
		cy.login("e2e-user@example.com", "TestPass123!");
	});

	it("loads the upload page with dual upload areas", () => {
		cy.visit("/upload");
		cy.url().should("include", "/upload");
		cy.get('[data-cy="user-image-upload"]').should("be.visible");
		cy.get('[data-cy="clothing-image-upload"]').should("be.visible");
	});

	it("shows validation error when submitting without images", () => {
		cy.visit("/upload");
		cy.contains("button", /next/i).first().click();
		cy.contains(/select/i).should("be.visible");
	});

	it("can upload mock images and start an analysis", () => {
		cy.visit("/upload");

		// Use fixture images for drag-and-drop or file input
		cy.get('[data-cy="user-image-upload"] input[type="file"]').selectFile(
			"cypress/fixtures/selfie.jpg",
			{ force: true }
		);
		cy.get('[data-cy="clothing-image-upload"] input[type="file"]').selectFile(
			"cypress/fixtures/dress.jpg",
			{ force: true }
		);

		cy.contains("button", /next/i).first().click();
		cy.contains("button", /analyze/i).click();

		// Should redirect to the analysis page
		cy.url({ timeout: 10000 }).should("include", "/analysis");

		// Stub the analysis API to return a completed result
		cy.intercept("GET", "/api/analysis/*", {
			statusCode: 200,
			body: {
				success: true,
				data: {
					id: "analysis-e2e-1",
					overallScore: 82,
					status: "completed",
				},
			},
		}).as("getAnalysis");

		cy.url({ timeout: 15000 }).should("include", "/results/");
	});
});
