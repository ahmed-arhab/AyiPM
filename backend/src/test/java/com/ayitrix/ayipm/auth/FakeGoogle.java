package com.ayitrix.ayipm.auth;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

/**
 * Stands in for Google's OpenID Connect endpoints: the discovery document, the signing keys and the token endpoint, with
 * an RSA key made for this test run. Google's sign-in page itself is played by the test, which reads the parameters the
 * app sends there and comes back to the callback with a code from {@link #code}.
 */
final class FakeGoogle implements AutoCloseable {

	static final String CLIENT_ID = "ayipm-test.apps.googleusercontent.com";
	static final String CLIENT_SECRET = "test-client-secret";
	static final String AUTHORIZATION_PATH = "/o/oauth2/v2/auth";

	private final HttpServer server;
	private final RSAKey key;
	private final Map<String, Grant> grants = new ConcurrentHashMap<>();
	private final List<Map<String, String>> tokenRequests = new CopyOnWriteArrayList<>();

	private record Grant(String idToken, String codeChallenge, String redirectUri) {
	}

	private FakeGoogle(HttpServer server, RSAKey key) {
		this.server = server;
		this.key = key;
	}

	static FakeGoogle start() {
		try {
			HttpServer server = HttpServer.create(new InetSocketAddress(InetAddress.getByName("127.0.0.1"), 0), 0);
			FakeGoogle google = new FakeGoogle(server, newKey("test-key"));
			server.createContext("/.well-known/openid-configuration", google::discovery);
			server.createContext("/oauth2/v3/certs", google::keys);
			server.createContext("/token", google::token);
			server.start();
			return google;
		} catch (IOException e) {
			throw new UncheckedIOException(e);
		}
	}

	String issuer() {
		return "http://127.0.0.1:" + server.getAddress().getPort();
	}

	/** Signs an ID token with these claims and returns a code that the token endpoint exchanges for it once. */
	String code(JWTClaimsSet claims, String codeChallenge, String redirectUri) {
		return code(sign(claims, key), codeChallenge, redirectUri);
	}

	/** Like {@link #code(JWTClaimsSet, String, String)}, for a token signed with a key that Google doesn't publish. */
	String codeSignedByAnotherKey(JWTClaimsSet claims, String codeChallenge, String redirectUri) {
		return code(sign(claims, newKey("test-key")), codeChallenge, redirectUri);
	}

	/** The form fields of each request the app sent to the token endpoint. */
	List<Map<String, String>> tokenRequests() {
		return tokenRequests;
	}

	@Override
	public void close() {
		server.stop(0);
	}

	private String code(String idToken, String codeChallenge, String redirectUri) {
		String code = "code-" + Tokens.create();
		grants.put(code, new Grant(idToken, codeChallenge, redirectUri));
		return code;
	}

	private void discovery(HttpExchange exchange) throws IOException {
		respond(exchange, 200, """
				{"issuer":"%1$s","authorization_endpoint":"%1$s%2$s","token_endpoint":"%1$s/token","jwks_uri":"%1$s/oauth2/v3/certs",
				"response_types_supported":["code"],"id_token_signing_alg_values_supported":["RS256"]}
				""".formatted(issuer(), AUTHORIZATION_PATH));
	}

	private void keys(HttpExchange exchange) throws IOException {
		respond(exchange, 200, new JWKSet(key).toPublicJWKSet().toString());
	}

	// Checks the request like Google does: the client's credentials, the redirect URI, and the PKCE verifier.
	private void token(HttpExchange exchange) throws IOException {
		Map<String, String> form = parseForm(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
		tokenRequests.add(form);
		Grant grant = grants.remove(form.getOrDefault("code", ""));
		boolean valid = "POST".equals(exchange.getRequestMethod())
				&& grant != null
				&& "authorization_code".equals(form.get("grant_type"))
				&& CLIENT_ID.equals(form.get("client_id"))
				&& CLIENT_SECRET.equals(form.get("client_secret"))
				&& grant.redirectUri().equals(form.get("redirect_uri"))
				&& grant.codeChallenge().equals(challenge(form.getOrDefault("code_verifier", "")));
		if (!valid) {
			respond(exchange, 400, "{\"error\":\"invalid_grant\",\"error_description\":\"Bad Request\"}");
			return;
		}
		respond(exchange, 200, "{\"access_token\":\"ya29.test\",\"expires_in\":3599,\"scope\":\"openid email\",\"token_type\":\"Bearer\",\"id_token\":\""
				+ grant.idToken() + "\"}");
	}

	static Map<String, String> parseForm(String body) {
		return Arrays.stream(body.split("&"))
				.filter(pair -> !pair.isEmpty())
				.map(pair -> pair.split("=", 2))
				.collect(Collectors.toMap(pair -> decode(pair[0]), pair -> pair.length > 1 ? decode(pair[1]) : ""));
	}

	private static String decode(String value) {
		return URLDecoder.decode(value, StandardCharsets.UTF_8);
	}

	private static String challenge(String verifier) {
		try {
			byte[] digest = MessageDigest.getInstance("SHA-256").digest(verifier.getBytes(StandardCharsets.US_ASCII));
			return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException(e);
		}
	}

	private static String sign(JWTClaimsSet claims, RSAKey signingKey) {
		try {
			SignedJWT jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(signingKey.getKeyID()).type(JOSEObjectType.JWT).build(), claims);
			jwt.sign(new RSASSASigner(signingKey));
			return jwt.serialize();
		} catch (JOSEException e) {
			throw new IllegalStateException(e);
		}
	}

	private static RSAKey newKey(String keyId) {
		try {
			return new RSAKeyGenerator(2048).keyID(keyId).generate();
		} catch (JOSEException e) {
			throw new IllegalStateException(e);
		}
	}

	private static void respond(HttpExchange exchange, int status, String json) throws IOException {
		byte[] body = json.getBytes(StandardCharsets.UTF_8);
		exchange.getResponseHeaders().add("Content-Type", "application/json");
		exchange.sendResponseHeaders(status, body.length);
		exchange.getResponseBody().write(body);
		exchange.close();
	}

}
