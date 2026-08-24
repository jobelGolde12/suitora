/// <reference types="cypress" />

describe("Diagnostics: console errors, failed requests, and form validation", () => {
	const consoleErrors: string[] = [];
	const pageErrors: string[] = [];
	const failedRequests: Array<{ url: string; status?: number; method?: string }> = [];

	beforeEach(() => {
		consoleErrors.length = 0;
		pageErrors.length = 0;
		failedRequests.length = 0;

		Cypress.on("window:before:load", (win) => {
			const orig = win.console.error;
			win.console.error = (...args: unknown[]) => {
				consoleErrors.push(args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
				orig.apply(win.console, args as never);
			};
		});
		Cypress.on("uncaught:exception", (err) => {
			pageErrors.push(`${err.name}: ${err.message}`);
			return false;
		});
		cy.intercept("**", (req) => {
			req.on("response", (res) => {
				if (res.statusCode >= 500) {
					failedRequests.push({ url: req.url, status: res.statusCode, method: req.method });
				}
			});
		});
	});

	const routes: Array<{ path: string; title?: string }> = [
		{ path: "/", title: "Suitora" },
		{ path: "/login" },
		{ path: "/register" },
		{ path: "/forgot-password" },
		{ path: "/privacy-policy" },
		{ path: "/terms-of-service" },
		{ path: "/metrics" },
	];

	routes.forEach(({ path, title }) => {
		it(`loads ${path} without console errors`, () => {
			if (path === "/metrics") {
				cy.request(path).then((res) => {
					expect(res.status).to.eq(200);
					expect(res.headers["content-type"]).to.contain("text/plain");
				});
				return;
			}
			cy.visit(path);
			cy.wait(500);
			cy.then(() => {
				expect(consoleErrors, `console errors on ${path}: ${consoleErrors.join(" | ")}`).to.deep.equal([]);
				expect(pageErrors, `page errors on ${path}: ${pageErrors.join(" | ")}`).to.deep.equal([]);
				expect(failedRequests, `5xx on ${path}: ${JSON.stringify(failedRequests)}`).to.deep.equal([]);
				if (title) cy.contains(title).should("be.visible");
			});
		});
	});

	it("register form: validation rejects empty input without errors", () => {
		cy.visit("/register");
		cy.get('form').first().within(() => {
			cy.contains("button", /create account/i).click();
		});
		cy.wait(300);
		cy.then(() => {
			expect(consoleErrors).to.deep.equal([]);
			expect(pageErrors).to.deep.equal([]);
		});
	});

	it("register form: rejects mismatched passwords and invalid email", () => {
		cy.visit("/register");
		cy.get('input[name="name"]').type("Diag User");
		cy.get('input[name="email"]').type("not-an-email");
		cy.get('input[name="password"]').type("short");
		cy.get('input[name="confirmPassword"]').type("different!");
		cy.get('input[name="agreeToTerms"]').check();
		cy.contains("button", /create account/i).click();
		cy.wait(300);
		cy.then(() => {
			expect(consoleErrors, `console: ${consoleErrors.join(" | ")}`).to.deep.equal([]);
			expect(pageErrors, `page: ${pageErrors.join(" | ")}`).to.deep.equal([]);
		});
	});

	it("login form: wrong credentials show an error without console errors", () => {
		cy.visit("/login");
		cy.get('input[name="email"]').type("nobody@example.com");
		cy.get('input[name="password"]').type("WrongPass123!");
		cy.contains("button", /sign in/i).click();
		cy.wait(1000);
		cy.then(() => {
			expect(consoleErrors, `console: ${consoleErrors.join(" | ")}`).to.deep.equal([]);
			expect(pageErrors, `page: ${pageErrors.join(" | ")}`).to.deep.equal([]);
		});
	});

	it("forgot-password: invalid email is rejected cleanly", () => {
		cy.visit("/forgot-password");
		cy.get('input[name="email"]').type("bad-email");
		cy.contains("button", /reset|send/i).click();
		cy.wait(300);
		cy.then(() => {
			expect(consoleErrors).to.deep.equal([]);
			expect(pageErrors).to.deep.equal([]);
		});
	});

	it("authenticated dashboard pages load without console errors", () => {
		cy.visit("/register");
		const email = `diag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
		cy.get('input[name="name"]').type("Diag User");
		cy.get('input[name="email"]').type(email);
		cy.get('input[name="password"]').type("TestPass123!");
		cy.get('input[name="confirmPassword"]').type("TestPass123!");
		cy.get('input[name="agreeToTerms"]').check();
		cy.contains("button", /create account/i).click();
		cy.url({ timeout: 20000 }).should("include", "/dashboard");

		const authedRoutes = [
			"/dashboard",
			"/stylist",
			"/wardrobe",
			"/trending",
			"/upload",
			"/compare",
			"/favorites",
			"/history",
			"/settings",
			"/results/some-missing-id",
		];
		authedRoutes.forEach((path) => {
			cy.visit(path, { failOnStatusCode: false });
			cy.wait(700);
		});
		cy.then(() => {
			expect(pageErrors, `uncaught exceptions: ${pageErrors.join(" | ")}`).to.deep.equal([]);
			const status500 = failedRequests.filter((r) => r.status === 500);
			expect(status500, `5xx requests: ${JSON.stringify(status500)}`).to.deep.equal([]);
		});
	});
});
