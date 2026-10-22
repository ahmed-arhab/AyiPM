package com.ayitrix.ayipm.auth;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.ParseException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.JWKSourceBuilder;
import com.nimbusds.jose.proc.BadJOSEException;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jose.util.DefaultResourceRetriever;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.proc.DefaultJWTClaimsVerifier;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Talks to Google with OpenID Connect: the authorization code flow with PKCE, for a confidential web client. The
 * endpoints come from the issuer's discovery document, and the ID token's signature is checked against the issuer's
 * published keys. Spring Security's OAuth client isn't used, because it would switch on Spring Security for every
 * endpoint of the app.
 */
@Component
class GoogleOidcClient {

	/** Where Google sends the browser back to, through the frontend's /api proxy. */
	static final String CALLBACK_PATH = "/api/auth/google/callback";
	static final String GOOGLE_ISSUER = "https://accounts.google.com";

	private static final Logger log = LoggerFactory.getLogger(GoogleOidcClient.class);
	private static final Duration TIMEOUT = Duration.ofSeconds(10);
	private static final Duration DISCOVERY_TTL = Duration.ofHours(24);
	private static final int JWKS_MAX_BYTES = 256 * 1024;

	private final String clientId;
	private final String clientSecret;
	private final String issuer;
	private final Set<String> acceptedIssuers;
	private final String redirectUri;
	private final JsonMapper json;
	private final Clock clock;
	private final HttpClient http = HttpClient.newBuilder().connectTimeout(TIMEOUT).followRedirects(HttpClient.Redirect.NEVER).build();
	private volatile Provider provider;

	/** What a verified ID token says about the person. */
	record Identity(String subject, String email, boolean emailVerified, String hostedDomain) {
	}

	private record Provider(URI authorizationEndpoint, URI tokenEndpoint, DefaultJWTProcessor<SecurityContext> idTokens, Instant fetchedAt) {
	}

	GoogleOidcClient(@Value("${ayipm.google.client-id:}") String clientId, @Value("${ayipm.google.client-secret:}") String clientSecret,
			@Value("${ayipm.google.issuer:" + GOOGLE_ISSUER + "}") String issuer, @Value("${ayipm.public-url}") String publicUrl, JsonMapper json,
			Clock clock) {
		this.clientId = clientId.strip();
		this.clientSecret = clientSecret.strip();
		if (this.clientId.isEmpty() != this.clientSecret.isEmpty()) {
			throw new IllegalStateException("Set both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to offer sign-in with Google, or neither.");
		}
		this.issuer = checkIssuer(issuer.strip().replaceAll("/+$", ""));
		// Google's ID tokens name their issuer with or without the scheme.
		this.acceptedIssuers = this.issuer.equals(GOOGLE_ISSUER) ? Set.of(GOOGLE_ISSUER, "accounts.google.com") : Set.of(this.issuer);
		this.redirectUri = AccessLinkEmails.checkPublicUrl(publicUrl) + CALLBACK_PATH;
		this.json = json;
		this.clock = clock;
		if (isConfigured()) log.info("Sign-in with Google is on. Its authorised redirect URI is {}", redirectUri);
		else log.info("Sign-in with Google is off because GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not set.");
	}

	boolean isConfigured() {
		return !clientId.isEmpty();
	}

	/**
	 * The Google page to send the browser to. The hosted domain limits the accounts Google offers, and the login hint
	 * picks one; neither is a check, so {@link #exchange} still verifies who signed in.
	 */
	URI authorizationUri(String state, String nonce, String codeVerifier, String hostedDomain, String loginHint) {
		Map<String, String> params = new LinkedHashMap<>();
		params.put("response_type", "code");
		params.put("client_id", clientId);
		params.put("redirect_uri", redirectUri);
		params.put("scope", "openid email");
		params.put("state", state);
		params.put("nonce", nonce);
		params.put("code_challenge", codeChallenge(codeVerifier));
		params.put("code_challenge_method", "S256");
		// Lets people with several Google accounts choose the right one instead of being signed in with the last one used.
		params.put("prompt", "select_account");
		if (hostedDomain != null) params.put("hd", hostedDomain);
		if (loginHint != null) params.put("login_hint", loginHint);
		String endpoint = provider().authorizationEndpoint().toString();
		return URI.create(endpoint + (endpoint.contains("?") ? "&" : "?") + form(params));
	}

	/** Redeems the authorization code and returns who signed in, once the ID token and its nonce check out. */
	Identity exchange(String code, String codeVerifier, String nonce) {
		Provider current = provider();
		Map<String, String> params = new LinkedHashMap<>();
		params.put("grant_type", "authorization_code");
		params.put("code", code);
		params.put("redirect_uri", redirectUri);
		params.put("client_id", clientId);
		params.put("client_secret", clientSecret);
		params.put("code_verifier", codeVerifier);
		HttpRequest request = HttpRequest.newBuilder(current.tokenEndpoint())
				.timeout(TIMEOUT)
				.header("Content-Type", "application/x-www-form-urlencoded")
				.header("Accept", "application/json")
				.POST(HttpRequest.BodyPublishers.ofString(form(params)))
				.build();
		JsonNode body = send(request, "redeem the authorization code");
		String idToken = body.path("id_token").stringValue(null);
		if (idToken == null) throw failed("Google's token response has no ID token.");
		return verify(current, idToken, nonce);
	}

	private Identity verify(Provider current, String idToken, String nonce) {
		JWTClaimsSet claims;
		try {
			claims = current.idTokens().process(idToken, null);
		} catch (ParseException | BadJOSEException | JOSEException e) {
			throw failed("The ID token from Google was refused: " + e.getMessage());
		}
		if (!acceptedIssuers.contains(claims.getIssuer())) throw failed("The ID token is from " + claims.getIssuer() + ", not " + issuer + ".");
		List<String> audience = claims.getAudience();
		Object authorizedParty = claims.getClaim("azp");
		if ((audience.size() > 1 || authorizedParty != null) && !clientId.equals(authorizedParty)) {
			throw failed("The ID token was issued to another client (azp " + authorizedParty + ").");
		}
		if (!(claims.getClaim("nonce") instanceof String tokenNonce) || !constantTimeEquals(tokenNonce, nonce)) {
			throw failed("The ID token's nonce doesn't match this sign-in.");
		}
		Object verified = claims.getClaim("email_verified");
		boolean emailVerified = Boolean.TRUE.equals(verified) || "true".equals(verified);
		try {
			return new Identity(claims.getSubject(), claims.getStringClaim("email"), emailVerified, claims.getStringClaim("hd"));
		} catch (ParseException e) {
			throw failed("The ID token's email or hd claim isn't text.");
		}
	}

	// Fetched on first use, then again once a day. If Google can't be reached, the last document keeps working.
	private Provider provider() {
		Provider current = provider;
		if (current != null && current.fetchedAt().plus(DISCOVERY_TTL).isAfter(clock.instant())) return current;
		synchronized (this) {
			if (provider != current) return provider;
			try {
				provider = discover();
			} catch (GoogleSignInException e) {
				if (current == null) throw e;
				log.warn("Keeping Google's OpenID configuration from {}, because it couldn't be fetched again.", current.fetchedAt());
				provider = new Provider(current.authorizationEndpoint(), current.tokenEndpoint(), current.idTokens(), clock.instant());
			}
			return provider;
		}
	}

	private Provider discover() {
		URI discovery = URI.create(issuer + "/.well-known/openid-configuration");
		JsonNode document = send(HttpRequest.newBuilder(discovery).timeout(TIMEOUT).header("Accept", "application/json").GET().build(),
				"fetch " + discovery);
		String documentIssuer = document.path("issuer").stringValue("");
		if (!documentIssuer.replaceAll("/+$", "").equals(issuer)) throw failed(discovery + " names the issuer \"" + documentIssuer + "\".");
		URI authorizationEndpoint = endpoint(document, "authorization_endpoint");
		URI tokenEndpoint = endpoint(document, "token_endpoint");
		URI jwksUri = endpoint(document, "jwks_uri");

		JWKSource<SecurityContext> keys;
		try {
			int timeout = (int) TIMEOUT.toMillis();
			// Cached, and fetched again when a token names a key that isn't known yet, because Google rotates its keys.
			keys = JWKSourceBuilder.<SecurityContext>create(jwksUri.toURL(), new DefaultResourceRetriever(timeout, timeout, JWKS_MAX_BYTES))
					.refreshAheadCache(false)
					.build();
		} catch (MalformedURLException e) {
			throw failed("jwks_uri is not a URL: " + jwksUri);
		}
		DefaultJWTProcessor<SecurityContext> idTokens = new DefaultJWTProcessor<>();
		idTokens.setJWSKeySelector(new JWSVerificationKeySelector<>(JWSAlgorithm.RS256, keys));
		// Checks the audience, expiry and issue time (allowing a minute of clock difference) against the app's clock.
		idTokens.setJWTClaimsSetVerifier(new DefaultJWTClaimsVerifier<>(Set.of(clientId), null, Set.of("iss", "sub", "aud", "exp", "iat", "email"), null) {
			@Override
			protected Date currentTime() {
				return Date.from(clock.instant());
			}
		});
		return new Provider(authorizationEndpoint, tokenEndpoint, idTokens, clock.instant());
	}

	private JsonNode send(HttpRequest request, String action) {
		HttpResponse<String> response;
		try {
			response = http.send(request, HttpResponse.BodyHandlers.ofString());
		} catch (IOException e) {
			throw failed("Could not " + action + ": " + e);
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			throw failed("Interrupted while trying to " + action + ".");
		}
		JsonNode body;
		try {
			body = json.readTree(response.body());
		} catch (JacksonException e) {
			body = null;
		}
		if (response.statusCode() != 200 || body == null || !body.isObject()) {
			// Error responses carry an error code and description, never a token.
			String error = body == null ? "" : body.path("error").stringValue("") + " " + body.path("error_description").stringValue("");
			throw failed("Could not " + action + ": HTTP " + response.statusCode() + " " + error.strip());
		}
		return body;
	}

	private static URI endpoint(JsonNode document, String name) {
		String value = document.path(name).stringValue("");
		URI uri;
		try {
			uri = URI.create(value);
		} catch (IllegalArgumentException e) {
			uri = null;
		}
		if (uri == null || !isAllowedUrl(uri)) throw failed("The OpenID configuration has no usable " + name + ": \"" + value + "\".");
		return uri;
	}

	private static String checkIssuer(String value) {
		URI uri;
		try {
			uri = URI.create(value);
		} catch (IllegalArgumentException e) {
			uri = null;
		}
		if (uri == null || !isAllowedUrl(uri)) {
			throw new IllegalStateException("ayipm.google.issuer (GOOGLE_ISSUER) must be an https address such as " + GOOGLE_ISSUER + ", not \""
					+ value + "\".");
		}
		return value;
	}

	// Plain http only for a provider on this machine, which is what the tests use.
	private static boolean isAllowedUrl(URI uri) {
		if (uri.getHost() == null) return false;
		if ("https".equals(uri.getScheme())) return true;
		return "http".equals(uri.getScheme()) && Set.of("localhost", "127.0.0.1", "[::1]").contains(uri.getHost());
	}

	private static String codeChallenge(String codeVerifier) {
		try {
			byte[] digest = MessageDigest.getInstance("SHA-256").digest(codeVerifier.getBytes(StandardCharsets.US_ASCII));
			return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException(e);
		}
	}

	private static String form(Map<String, String> params) {
		return params.entrySet().stream()
				.map(e -> URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8) + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
				.collect(Collectors.joining("&"));
	}

	private static boolean constantTimeEquals(String a, String b) {
		return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
	}

	private static GoogleSignInException failed(String reason) {
		log.warn("Sign-in with Google failed. {}", reason);
		return new GoogleSignInException(GoogleSignInException.Failure.FAILED);
	}

}
