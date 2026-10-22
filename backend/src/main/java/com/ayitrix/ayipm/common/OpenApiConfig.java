package com.ayitrix.ayipm.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.ayitrix.ayipm.auth.SessionService;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

/**
 * The OpenAPI spec at /v3/api-docs, shown by Swagger UI at /swagger-ui.html. Every endpoint needs the session cookie
 * unless it says otherwise, as the sign-in endpoints in AuthController do.
 */
@Configuration
public class OpenApiConfig {

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
				.components(new Components().addSecuritySchemes(SessionService.COOKIE_NAME, new SecurityScheme()
						.type(SecurityScheme.Type.APIKEY)
						.in(SecurityScheme.In.COOKIE)
						.name(SessionService.COOKIE_NAME)
						.description("The session cookie set when you sign in. It is httpOnly, so there is nothing to enter "
								+ "under Authorize: sign in with `POST /api/auth/login` and the browser sends it for you.")))
				.addSecurityItem(new SecurityRequirement().addList(SessionService.COOKIE_NAME));
	}

}
