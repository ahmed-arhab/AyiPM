package com.ayitrix.ayipm.common;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Stream;

import org.springdoc.core.customizers.GlobalOpenApiCustomizer;
import org.springdoc.core.customizers.GlobalOperationCustomizer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

import com.ayitrix.ayipm.auth.SessionService;

import io.swagger.v3.core.jackson.ModelResolver;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;

/**
 * The OpenAPI spec at /v3/api-docs, shown by Swagger UI at /swagger-ui.html. Every endpoint needs the session cookie
 * unless it says otherwise, as the sign-in endpoints in AuthController do.
 * <p>
 * The frontend generates its API types from this spec, so it has to stay accurate and stable: see
 * {@link RecordSchemaConverter} and "API types" in CONTRIBUTING.md.
 */
@Configuration
public class OpenApiConfig {

	static {
		// Enums become named schemas (Role, TaskStatus, ...) instead of being repeated in every field that uses them.
		ModelResolver.enumsAsRef = true;
	}

	@Bean
	OpenAPI openApi(@Value("${spring.application.version}") String version) {
		return new OpenAPI()
				.info(new Info()
						.title("AyiPM API")
						.version(version)
						.description("""
								The API behind the AyiPM web app. Successful responses are `{ "data": ... }` and errors \
								are `{ "error": "message" }`.

								Most endpoints need a signed-in session. Sign in with `POST /api/auth/login` (or \
								`POST /api/setup` on a new workspace); the browser keeps the session cookie and sends it \
								with every later request, including the ones you try out here."""))
				// Relative, so requests go to wherever the spec was loaded from and the spec doesn't change with the port.
				.servers(List.of(new Server().url("/")))
				.components(new Components().addSecuritySchemes(SessionService.COOKIE_NAME, new SecurityScheme()
						.type(SecurityScheme.Type.APIKEY)
						.in(SecurityScheme.In.COOKIE)
						.name(SessionService.COOKIE_NAME)
						.description("The session cookie set when you sign in. It is httpOnly, so there is nothing to enter "
								+ "under Authorize: sign in with `POST /api/auth/login` and the browser sends it for you.")))
				.addSecurityItem(new SecurityRequirement().addList(SessionService.COOKIE_NAME));
	}

	/**
	 * Names each operation after its controller and method, such as {@code employeeCreate}. By default springdoc uses the
	 * method name and numbers repeats (list_1, list_2, ...) in no fixed order.
	 */
	@Bean
	GlobalOperationCustomizer operationIds() {
		return (operation, handler) -> operation.operationId(
				StringUtils.uncapitalize(handler.getBeanType().getSimpleName().replace("Controller", ""))
						+ StringUtils.capitalize(handler.getMethod().getName()));
	}

	/**
	 * The services check request bodies themselves, and PATCH bodies leave out the fields that don't change, so schemas
	 * that only requests use don't mark any field required. Schemas that responses use keep what
	 * {@link RecordSchemaConverter} marked.
	 */
	@Bean
	@SuppressWarnings("rawtypes")
	GlobalOpenApiCustomizer requestBodiesHaveNoRequiredFields() {
		return openApi -> {
			Map<String, Schema> schemas = openApi.getComponents().getSchemas();
			Set<String> sent = new HashSet<>();
			openApi.getPaths().values().stream()
					.flatMap(path -> path.readOperations().stream())
					.flatMap(operation -> operation.getResponses().values().stream())
					.forEach(response -> collectRefs(response.getContent(), schemas, sent));
			schemas.forEach((name, schema) -> {
				if (!sent.contains(name)) schema.setRequired(null);
			});
		};
	}

	/** Adds the names of the schemas that the content uses, directly or through other schemas. */
	@SuppressWarnings("rawtypes")
	private static void collectRefs(Content content, Map<String, Schema> schemas, Set<String> names) {
		if (content != null) content.values().forEach(media -> collectRefs(media.getSchema(), schemas, names));
	}

	@SuppressWarnings("rawtypes")
	private static void collectRefs(Schema<?> schema, Map<String, Schema> schemas, Set<String> names) {
		if (schema == null) return;
		if (schema.get$ref() != null) {
			String name = schema.get$ref().substring(schema.get$ref().lastIndexOf('/') + 1);
			if (names.add(name)) collectRefs(schemas.get(name), schemas, names);
		}
		if (schema.getProperties() != null) schema.getProperties().values().forEach(property -> collectRefs(property, schemas, names));
		collectRefs(schema.getItems(), schemas, names);
		if (schema.getAdditionalProperties() instanceof Schema<?> values) collectRefs(values, schemas, names);
		Stream.of(schema.getOneOf(), schema.getAnyOf(), schema.getAllOf())
				.filter(Objects::nonNull)
				.flatMap(List::stream)
				.forEach(member -> collectRefs(member, schemas, names));
	}

}
