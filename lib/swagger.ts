import fs from 'fs';

// Path to the OpenAPI spec we maintain by hand at docs/api/swagger.yaml.
// We serve the raw YAML so Swagger UI can parse it directly without a
// YAML-to-JSON conversion step at request time.
const swaggerYaml = fs.readFileSync(
  new URL('../docs/api/swagger.yaml', import.meta.url),
  'utf8'
);

// Export for use in routes
export default swaggerYaml;