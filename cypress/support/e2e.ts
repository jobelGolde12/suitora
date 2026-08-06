/// <reference types="cypress" />

import "./commands";

beforeEach(() => {
	// Prevent window.alert from blocking tests
	Cypress.on("window:before:load", (win) => {
		win.alert = (message: string) => console.log("alert:", message);
		win.confirm = () => true;
	});
});

export {};
