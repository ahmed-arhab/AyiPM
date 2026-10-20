# Build the jar with the Maven wrapper, then run it on a slim JRE image.
FROM eclipse-temurin:21-jdk AS build
WORKDIR /src

# Download dependencies in their own layer so code changes don't re-download them.
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN ./mvnw -B -q dependency:go-offline

COPY src src
RUN ./mvnw -B -q package -DskipTests && cp target/ayipm-backend-*.jar app.jar

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 1001 ayipm
COPY --from=build /src/app.jar app.jar
USER ayipm
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
