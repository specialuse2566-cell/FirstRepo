# Step 1: Build stage (compile using Maven)
FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copy everything
COPY . .

# Build the project (skip tests for faster build)
RUN mvn clean package -DskipTests


# Step 2: Run stage (lightweight image)
FROM openjdk:17-jdk-slim

WORKDIR /app

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Render uses dynamic port → very important
EXPOSE 8080

# Start Spring Boot app
CMD ["java", "-jar", "app.jar"]