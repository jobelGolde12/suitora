import { defineConfig } from "cypress";

export default defineConfig({
	e2e: {
		baseUrl: "http://localhost:3000",
		specPattern: "cypress/e2e/**/*.cy.{ts,tsx}",
		supportFile: "cypress/support/e2e.ts",
		setupNodeEvents(on, config) {
			return config;
		},
		env: {
			NODE_ENV: "development",
			BETTER_AUTH_SECRET: "e2e-test-secret-0123456789abcdef",
			BETTER_AUTH_URL: "http://localhost:3000",
			TURSO_DATABASE_URL: "file:./data/e2e-test.db",
			TURSO_AUTH_TOKEN: "",
			TRYON_PROVIDER: "mock",
			OPENAI_API_KEY: "",
			CLOUDINARY_CLOUD_NAME: "",
			CLOUDINARY_API_KEY: "",
			CLOUDINARY_API_SECRET: "",
			UPSTASH_REDIS_REST_URL: "",
			UPSTASH_REDIS_REST_TOKEN: "",
			RESEND_API_KEY: "",
		},
		defaultCommandTimeout: 10000,
		requestTimeout: 10000,
		viewportWidth: 1280,
		viewportHeight: 720,
	},
});
