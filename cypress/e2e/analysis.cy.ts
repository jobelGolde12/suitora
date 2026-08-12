/// <reference types="cypress" />

describe("Upload & analysis flow", () => {
	beforeEach(() => {
		cy.seedUser();
	});

	it("loads the upload page with dual upload areas", () => {
		cy.visit("/upload");
		cy.url().should("include", "/upload");
		cy.get('[data-cy="user-image-upload"]').should("be.visible");
		cy.get('[data-cy="clothing-image-upload"]').should("be.visible");
	});

	it("keeps the analyze action disabled until both images are provided", () => {
		cy.visit("/upload");
		cy.get('[data-cy="analyze-cta"]').should("be.disabled");
	});

	it("can upload mock images and start an analysis", () => {
		cy.visit("/upload");

		// Use fixture images via the dropzone file inputs.
		cy.get('[data-cy="user-image-upload"] input[type="file"]').selectFile(
			"cypress/fixtures/selfie.jpg",
			{ force: true }
		);
		cy.get('[data-cy="clothing-image-upload"] input[type="file"]').selectFile(
			"cypress/fixtures/dress.jpg",
			{ force: true }
		);

		// The CTA enables once the self photo has uploaded and been saved.
		cy.get('[data-cy="analyze-cta"]', { timeout: 15000 }).should("be.enabled");
		cy.get('[data-cy="analyze-cta"]').click();

		// The analysis is created and we leave the upload page (either still
		// polling on /analysis, or already on the results page once completed).
		cy.url({ timeout: 30000 }).should("not.include", "/upload");
		cy.url().should("match", /\/analysis|\/results\//);
	});
});
