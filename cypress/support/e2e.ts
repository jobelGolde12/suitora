/// <reference types="cypress" />

import "./commands";
// Registers cy.injectAxe()/cy.configureAxe()/cy.checkA11y() commands and the
// axe-core global typing (S-02: automated a11y regression).
import "cypress-axe";

beforeEach(() => {
	// Prevent window.alert from blocking tests
	Cypress.on("window:before:load", (win) => {
		win.alert = (message: string) => console.log("alert:", message);
		win.confirm = () => true;
	});
});

export {};
