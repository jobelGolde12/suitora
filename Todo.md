

## Prompt: Dockerize My Next.js Application

**Context:** I have a Next.js 14 application (or specify your version) with the following setup:
- Using App Router (or Pages Router)
- Package manager: npm/yarn/pnpm (specify which)
- Port: 3000 (default)
- Environment variables: List any required ones
- Special configurations: Include any custom server setup, middleware, or specific build requirements

**Task:** Please create a production-ready Docker setup for my Next.js application with the following requirements:

### Docker Configuration Requirements:

1. **Dockerfile** - Create a multi-stage Dockerfile that:
   - Uses appropriate Node.js base image (specify version, e.g., node:20-alpine)
   - Implements dependency caching for faster builds
   - Handles environment variables properly
   - Optimizes for production (small image size, security)
   - Uses standalone output from Next.js for minimal size

2. **Docker Compose** - Include docker-compose.yml file that:
   - Sets up the application with proper port mapping
   - Allows for development and production modes
   - Includes healthcheck configuration

3. **.dockerignore** - Create a proper .dockerignore file

4. **Scripts** - Add helpful npm scripts for Docker operations

5. **Documentation** - Provide clear instructions for:
   - Building the Docker image
   - Running in development mode
   - Running in production mode
   - Common troubleshooting steps

6. **Makefile or Scripts** (optional) - Helper commands for common Docker operations

### Specific Requirements:
- [ ] Optimize image size using Next.js standalone output
- [ ] Handle both development and production environments
- [ ] Include health checks for container monitoring
- [ ] Implement proper signal handling (SIGTERM/SIGINT)
- [ ] Support environment variables for runtime configuration
- [ ] Include caching strategy for faster rebuilds
- [ ] Add proper security practices (non-root user)

Please provide the complete implementation with all necessary files and thorough comments explaining each part.
