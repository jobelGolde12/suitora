import swaggerYaml from '@/lib/swagger';

export async function GET() {
  // Serve the raw OpenAPI spec so Swagger UI can render it at /api/docs.
  return new Response(swaggerYaml, {
    headers: {
      'Content-Type': 'application/yaml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
