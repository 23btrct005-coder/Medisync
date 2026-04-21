# Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY backend/pom.xml .
COPY backend/src ./src
# Enforce low-memory build for free tier
ENV MAVEN_OPTS="-Xmx256m"
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/medisync-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
# Strict memory management for clinical stability
ENTRYPOINT ["java", "-Xmx224m", "-Xms128m", "-Xss256k", "-XX:MaxMetaspaceSize=96m", "-XX:+UseSerialGC", "-XX:TieredStopAtLevel=1", "-XX:+ExitOnOutOfMemoryError", "-Djava.net.preferIPv4Stack=true", "-jar", "app.jar"]
