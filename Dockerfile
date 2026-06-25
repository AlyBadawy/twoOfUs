# ── Stage 1: Build frontend ───────────────────────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /workspace
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci --silent
COPY frontend/ ./frontend/
# Existing backend resources needed so Vite outDir copy doesn't clobber them
COPY backend/src/main/resources/ ./backend/src/main/resources/

# Vite outDir is ../backend/src/main/resources/static (relative to frontend/),
# so the bundle lands at /workspace/backend/src/main/resources/static
RUN cd frontend && npm run build

# ── Stage 2: Build backend (with frontend static files already in resources) ──
FROM maven:3.9-amazoncorretto-21 AS backend-build
WORKDIR /workspace
COPY backend/pom.xml ./backend/
RUN mvn -f backend/pom.xml dependency:go-offline -q
COPY backend/src ./backend/src
COPY --from=frontend-build /workspace/backend/src/main/resources/static ./backend/src/main/resources/static
RUN mvn -f backend/pom.xml package -DskipTests -q

# ── Stage 3: Runtime ──────────────────────────────────────────────────────────
FROM amazoncorretto:21-alpine
WORKDIR /app
COPY --from=backend-build /workspace/backend/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-jar", "app.jar"]
