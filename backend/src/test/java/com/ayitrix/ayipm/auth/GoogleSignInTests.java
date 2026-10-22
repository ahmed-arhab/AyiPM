package com.ayitrix.ayipm.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

import org.bouncycastle.util.encoders.Base32;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;

import com.ayitrix.ayipm.IntegrationTest;
import com.nimbusds.jwt.JWTClaimsSet;

import tools.jackson.databind.JsonNode;

/** Sign-in with Google against {@link FakeGoogle}, which plays Google's endpoints. The test plays Google's sign-in page. */
@TestPropertySource(properties = {
		"ayipm.google.client-id=" + FakeGoogle.CLIENT_ID,
		"ayipm.google.client-secret=" + FakeGoogle.CLIENT_SECRET,
		"ayipm.two-factor.encryption-key=" + TwoFactorApiTests.KEY })
class GoogleSignInTests extends IntegrationTest {

	private static final FakeGoogle GOOGLE = FakeGoogle.start();
	// ayipm.public-url keeps its default, http://localhost:3000.
	private static final String REDIRECT_URI = "http://localhost:3000/api/auth/google/callback";
	private static final String START = "/api/auth/google/start";

	@DynamicPropertySource
	static void issuer(DynamicPropertyRegistry registry) {
		registry.add("ayipm.google.issuer", GOOGLE::issuer);
	}

	@AfterAll
	static void stopGoogle() {
		GOOGLE.close();
	}

	@Test
	void anExistingMemberSignsInWithGoogleAndLandsOnTheDashboard() {
		signedInOwner();
		Client browser = client();
		assertThat(browser.get("/api/auth/session").data().path("googleSignIn").asBoolean()).isTrue();

		GooglePage page = start(browser, START);
		assertThat(page.params())
				.containsEntry("response_type", "code")
				.containsEntry("client_id", FakeGoogle.CLIENT_ID)
				.containsEntry("redirect_uri", REDIRECT_URI)
				.containsEntry("scope", "openid email")
				.containsEntry("code_challenge_method", "S256")
				.containsEntry("prompt", "select_account")
				.doesNotContainKeys("hd", "login_hint");
		assertThat(page.param("state")).isNotEqualTo(page.param("nonce"));
		assertThat(page.setCookie()).contains("HttpOnly", "SameSite=Lax", "Path=/api/auth/google", "Max-Age=600");
		// The database has only the hash of the cookie's token, and none of the values derived from it.
		assertThat(jdbc.queryForList("select token_hash from google_sign_ins", String.class)).containsExactly(Tokens.hash(page.cookie()));

		Response back = comeBack(browser, page, idToken(page, "Owner@Test.com").build()).expectStatus(302);
		assertThat(back.header("Location")).isEqualTo("/dashboard");
		assertThat(back.headers().allValues("Set-Cookie")).anyMatch(c -> c.startsWith(GoogleSignInController.SIGN_IN_COOKIE + "=;"));
		JsonNode session = browser.get("/api/auth/session").data();
		assertThat(session.path("user").path("email").asString()).isEqualTo("owner@test.com");
		assertThat(Instant.parse(session.path("expiresAt").asString())).isBefore(Instant.now().plus(Duration.ofHours(13)));
		browser.get("/api/employees").expectStatus(200);

		assertThat(GOOGLE.tokenRequests().getLast()).containsEntry("redirect_uri", REDIRECT_URI).containsKey("code_verifier");
		assertThat(jdbc.queryForObject("select count(*) from google_sign_ins", Integer.class)).isZero();
		assertThat(jdbc.queryForObject("select google_subject from users where email = 'owner@test.com'", String.class))
				.isEqualTo(subjectOf("owner@test.com"));
		assertThat(activity(browser)).contains("Signed In (With Google)", "Linked Google Account");

		// The password keeps working, and so does Google.
		client().post("/api/auth/login", Map.of("email", "owner@test.com", "password", "Secret123!")).expectStatus(200);
		assertThat(signInWithGoogle(client(), "owner@test.com")).isEqualTo("/dashboard");
	}

	@Test
	void anUnknownGoogleAccountIsToldToAskForAnInvitation() {
		signedInOwner();
		Client browser = client();
		assertThat(signInWithGoogle(browser, "stranger@gmail.com")).isEqualTo("/login?google=not-invited");
		assertThat(browser.get("/api/auth/session").data().path("user").isNull()).isTrue();
		assertThat(jdbc.queryForObject("select count(*) from users", Integer.class)).isEqualTo(1);
	}

	@Test
	void aDeactivatedMemberIsRefused() {
		Client owner = signedInOwner();
		Client member = signedInMember(owner, "member@test.com", "employee");
		owner.put("/api/employees/" + idOf(member) + "/status", Map.of("status", "inactive")).expectStatus(200);
		assertThat(signInWithGoogle(client(), "member@test.com")).isEqualTo("/login?google=deactivated");
	}

	@Test
	void theWorkspaceCanLimitGoogleSignInToItsDomain() {
		Client owner = signedInOwner();
		owner.patch("/api/workspace", Map.of("allowedGoogleDomain", "@Test.com")).expectStatus(200);

		Client browser = client();
		GooglePage page = start(browser, START);
		assertThat(page.param("hd")).isEqualTo("test.com");
		// A personal Google account has no hosted domain, even when its address matches.
		assertThat(comeBack(browser, page, idToken(page, "owner@test.com").build()).header("Location")).isEqualTo("/login?google=wrong-domain");
		page = start(browser, START);
		assertThat(comeBack(browser, page, idToken(page, "owner@test.com").claim("hd", "other.com").build()).header("Location"))
				.isEqualTo("/login?google=wrong-domain");
		assertThat(browser.get("/api/auth/session").data().path("user").isNull()).isTrue();

		page = start(browser, START);
		assertThat(comeBack(browser, page, idToken(page, "owner@test.com").claim("hd", "test.com").build()).header("Location")).isEqualTo("/dashboard");

		owner.patch("/api/workspace", Map.of("allowedGoogleDomain", "")).expectStatus(200);
		assertThat(start(client(), START).params()).doesNotContainKey("hd");
	}

	@Test
	void googlesAnswerOnlyCountsInTheBrowserThatStartedTheSignIn() {
		signedInOwner();
		// Someone starts a sign-in with their own Google account and has another person's browser finish it.
		GooglePage page = start(client(), START);
		Client victim = client();
		int tokenRequests = GOOGLE.tokenRequests().size();
		assertThat(comeBack(victim, page, idToken(page, "owner@test.com").build()).header("Location")).isEqualTo("/login?google=expired");
		assertThat(victim.get("/api/auth/session").data().path("user").isNull()).isTrue();
		assertThat(GOOGLE.tokenRequests()).hasSize(tokenRequests);
	}

	@Test
	void aWrongStateIsRefusedAndUsesUpTheSignIn() {
		signedInOwner();
		Client browser = client();
		GooglePage page = start(browser, START);
		String code = GOOGLE.code(idToken(page, "owner@test.com").build(), page.param("code_challenge"), REDIRECT_URI);
		assertThat(browser.get(callback("0".repeat(64), code)).header("Location")).isEqualTo("/login?google=expired");

		// Coming back with the right state doesn't help now, not even with the original cookie.
		assertThat(browser.get(callback(page.param("state"), code)).header("Location")).isEqualTo("/login?google=expired");
		Client sameCookie = client().withHeader("Cookie", GoogleSignInController.SIGN_IN_COOKIE + "=" + page.cookie());
		assertThat(sameCookie.get(callback(page.param("state"), code)).header("Location")).isEqualTo("/login?google=expired");
		assertThat(browser.get("/api/auth/session").data().path("user").isNull()).isTrue();
	}

	@Test
	void googlesAnswerWorksOnlyOnce() {
		signedInOwner();
		Client browser = client();
		GooglePage page = start(browser, START);
		JWTClaimsSet claims = idToken(page, "owner@test.com").build();
		assertThat(comeBack(browser, page, claims).header("Location")).isEqualTo("/dashboard");

		Client replay = client().withHeader("Cookie", GoogleSignInController.SIGN_IN_COOKIE + "=" + page.cookie());
		assertThat(comeBack(replay, page, claims).header("Location")).isEqualTo("/login?google=expired");
		assertThat(replay.get("/api/auth/session").data().path("user").isNull()).isTrue();
	}

	@Test
	void aSignInExpiresAfterTenMinutes() {
		signedInOwner();
		Client browser = client();
		GooglePage page = start(browser, START);
		clock.set(Instant.now().plus(Duration.ofMinutes(11)));
		assertThat(comeBack(browser, page, idToken(page, "owner@test.com").build()).header("Location")).isEqualTo("/login?google=expired");
	}

	enum BadToken {
		WRONG_NONCE, NO_NONCE, OTHER_AUDIENCE, OTHER_AUTHORIZED_PARTY, OTHER_ISSUER, EXPIRED, SIGNED_BY_ANOTHER_KEY, UNVERIFIED_EMAIL
	}

	@ParameterizedTest
	@EnumSource(BadToken.class)
	void anIdTokenThatDoesNotCheckOutIsRefused(BadToken bad) {
		signedInOwner();
		Client browser = client();
		GooglePage page = start(browser, START);
		Instant now = clock.instant();
		JWTClaimsSet.Builder claims = idToken(page, "owner@test.com");
		switch (bad) {
			case WRONG_NONCE -> claims.claim("nonce", "from-another-sign-in");
			case NO_NONCE -> claims.claim("nonce", null);
			case OTHER_AUDIENCE -> claims.audience("another-app.apps.googleusercontent.com").claim("azp", "another-app.apps.googleusercontent.com");
			case OTHER_AUTHORIZED_PARTY -> claims.audience(List.of(FakeGoogle.CLIENT_ID, "another-app")).claim("azp", "another-app");
			case OTHER_ISSUER -> claims.issuer("https://accounts.example.com");
			case EXPIRED -> claims.issueTime(Date.from(now.minus(Duration.ofHours(1)))).expirationTime(Date.from(now.minus(Duration.ofMinutes(2))));
			case UNVERIFIED_EMAIL -> claims.claim("email_verified", false);
			case SIGNED_BY_ANOTHER_KEY -> {
			}
		}
		String code = bad == BadToken.SIGNED_BY_ANOTHER_KEY
				? GOOGLE.codeSignedByAnotherKey(claims.build(), page.param("code_challenge"), REDIRECT_URI)
				: GOOGLE.code(claims.build(), page.param("code_challenge"), REDIRECT_URI);
		assertThat(browser.get(callback(page.param("state"), code)).header("Location")).isEqualTo("/login?google=failed");
		assertThat(browser.get("/api/auth/session").data().path("user").isNull()).isTrue();
		assertThat(jdbc.queryForObject("select google_subject from users", String.class)).isNull();
	}

	@Test
	void aLinkedAccountOnlyAcceptsItsOwnGoogleAccount() {
		signedInOwner();
		assertThat(signInWithGoogle(client(), "owner@test.com")).isEqualTo("/dashboard");
		// A different Google account that has the same address now.
		Client browser = client();
		GooglePage page = start(browser, START);
		assertThat(comeBack(browser, page, idToken(page, "owner@test.com").subject("someone-else").build()).header("Location"))
				.isEqualTo("/login?google=linked-elsewhere");
	}

	@Test
	void anAccountWithTwoFactorAuthenticationStillNeedsACode() {
		// In the middle of a 30-second step, so a code doesn't expire while the test runs.
		clock.set(Instant.parse("2026-03-02T09:00:10Z"));
		Client owner = signedInOwner();
		String secret = owner.post("/api/auth/two-factor/setup", Map.of()).expectStatus(200).data().path("secret").asString();
		owner.post("/api/auth/two-factor/confirm", Map.of("code", totp(secret))).expectStatus(200);

		Client browser = client();
		GooglePage page = start(browser, START);
		Response back = comeBack(browser, page, idToken(page, "owner@test.com").build());
		assertThat(back.header("Location")).isEqualTo("/login?google=two-factor");
		assertThat(back.headers().allValues("Set-Cookie"))
				.anyMatch(c -> c.startsWith(GoogleSignInController.TWO_FACTOR_COOKIE + "=") && c.contains("HttpOnly") && c.contains("Max-Age=300"));
		assertThat(browser.get("/api/auth/session").data().path("user").isNull()).isTrue();

		JsonNode step = browser.post("/api/auth/google/two-factor", Map.of()).expectStatus(200).data();
		assertThat(step.path("email").asString()).isEqualTo("owner@test.com");
		assertThat(step.path("twoFactorChallenge").path("setupRequired").asBoolean()).isFalse();
		Response again = browser.post("/api/auth/google/two-factor", Map.of());
		assertThat(again.status()).isEqualTo(410);
		assertThat(again.error()).isEqualTo("This sign-in has expired. Continue with Google again.");

		clock.set(clock.instant().plusSeconds(30));
		browser.post("/api/auth/login/two-factor", Map.of("challenge", step.path("twoFactorChallenge").path("token").asString(), "code", totp(secret)))
				.expectStatus(200);
		assertThat(browser.get("/api/auth/session").data().path("user").path("email").asString()).isEqualTo("owner@test.com");
	}

	@Test
	void aNewAdminSetsUpTwoFactorAuthenticationFirstWhenTheWorkspaceRequiresIt() {
		clock.set(Instant.parse("2026-03-02T09:00:10Z"));
		Client owner = signedInOwner();
		String secret = owner.post("/api/auth/two-factor/setup", Map.of()).expectStatus(200).data().path("secret").asString();
		owner.post("/api/auth/two-factor/confirm", Map.of("code", totp(secret))).expectStatus(200);
		owner.patch("/api/workspace", Map.of("requireAdminTwoFactor", true)).expectStatus(200);
		String token = invite(owner, "admin2@test.com", "admin");

		Client browser = client();
		GooglePage page = start(browser, START + "?invite=" + encode(token));
		assertThat(comeBack(browser, page, idToken(page, "admin2@test.com").build()).header("Location")).isEqualTo("/login?google=two-factor");
		JsonNode step = browser.post("/api/auth/google/two-factor", Map.of()).expectStatus(200).data();
		assertThat(step.path("twoFactorChallenge").path("setupRequired").asBoolean()).isTrue();
		browser.post("/api/auth/login/two-factor/setup", Map.of("challenge", step.path("twoFactorChallenge").path("token").asString())).expectStatus(200);
		assertThat(browser.get("/api/auth/session").data().path("user").isNull()).isTrue();
	}

	@Test
	void anInvitationIsAcceptedWithGoogleWithoutChoosingAPassword() {
		Client owner = signedInOwner();
		String token = invite(owner, "dana@test.com", "employee");

		Client dana = client();
		GooglePage page = start(dana, START + "?invite=" + encode(token));
		assertThat(page.param("login_hint")).isEqualTo("dana@test.com");
		assertThat(comeBack(dana, page, idToken(page, "dana@test.com").build()).header("Location")).isEqualTo("/dashboard");

		JsonNode user = dana.get("/api/auth/session").data().path("user");
		assertThat(user.path("email").asString()).isEqualTo("dana@test.com");
		assertThat(user.path("invited").asBoolean()).isFalse();
		assertThat(jdbc.queryForObject("select password_hash from users where email = 'dana@test.com'", String.class)).isNull();
		assertThat(client().get("/api/auth/invite?token=" + token).status()).isEqualTo(410);
		assertThat(activity(dana)).contains("Accepted Invitation (With Google)", "Signed In (With Google)");

		// Without a password, there is none to sign in with or to change, until an admin sends a reset link.
		assertThat(client().post("/api/auth/login", Map.of("email", "dana@test.com", "password", "Whatever123")).status()).isEqualTo(401);
		Response change = dana.post("/api/auth/password", Map.of("currentPassword", "Whatever123", "newPassword", "BrandNew123"));
		assertThat(change.status()).isEqualTo(400);
		assertThat(change.error()).startsWith("There is no current password for this account, because you joined with Google.");
		String reset = owner.post("/api/employees/" + idOf(dana) + "/reset-link", Map.of()).expectStatus(200).data().path("token").asString();
		client().post("/api/auth/reset", Map.of("token", reset, "password", "BrandNew123")).expectStatus(200);
		client().post("/api/auth/login", Map.of("email", "dana@test.com", "password", "BrandNew123")).expectStatus(200);
		assertThat(signInWithGoogle(client(), "dana@test.com")).isEqualTo("/dashboard");
	}

	@Test
	void anInvitationOnlyAcceptsTheGoogleAccountOfTheInvitedAddress() {
		Client owner = signedInOwner();
		String token = invite(owner, "dana@test.com", "employee");
		Client browser = client();
		GooglePage page = start(browser, START + "?invite=" + encode(token));
		// Not even one that has an account of its own.
		assertThat(comeBack(browser, page, idToken(page, "owner@test.com").build()).header("Location")).isEqualTo("/login?google=invite-mismatch");
		assertThat(browser.get("/api/auth/session").data().path("user").isNull()).isTrue();
		client().get("/api/auth/invite?token=" + token).expectStatus(200);

		assertThat(client().get(START + "?invite=made-up").header("Location")).isEqualTo("/login?google=invite-expired");
	}

	@Test
	void invitedPeopleCanAlsoJoinFromTheLoginPageUntilTheInvitationExpires() {
		Client owner = signedInOwner();
		invite(owner, "dana@test.com", "employee");
		invite(owner, "lee@test.com", "employee");
		jdbc.update("update invites set expires_at = now() - interval '1 minute' where user_id = (select id from users where email = 'lee@test.com')");
		assertThat(signInWithGoogle(client(), "lee@test.com")).isEqualTo("/login?google=invite-expired");
		assertThat(signInWithGoogle(client(), "dana@test.com")).isEqualTo("/dashboard");
	}

	@Test
	void cancellingOnGooglesPageGoesBackToTheLoginPage() {
		Client browser = client();
		GooglePage page = start(browser, START);
		assertThat(browser.get("/api/auth/google/callback?error=access_denied&state=" + encode(page.param("state"))).header("Location"))
				.isEqualTo("/login");
	}

	@Test
	void startingIsRateLimitedLikeTheOtherSignInEndpoints() {
		for (int i = 1; i <= 10; i++) start(client(), START);
		Response limited = client().get(START).expectStatus(302);
		assertThat(limited.header("Location")).isEqualTo("/login?google=too-many-attempts");
		assertThat(limited.headers().allValues("Set-Cookie")).isEmpty();
	}

	/** What the app sent the browser to Google with, and the cookie it set. */
	private record GooglePage(Map<String, String> params, String setCookie) {

		String param(String name) {
			return params.get(name);
		}

		String cookie() {
			return setCookie.substring(setCookie.indexOf('=') + 1, setCookie.indexOf(';'));
		}

	}

	private static GooglePage start(Client browser, String path) {
		Response started = browser.get(path).expectStatus(302);
		URI location = URI.create(started.header("Location"));
		assertThat(location.getScheme() + "://" + location.getAuthority() + location.getPath()).isEqualTo(GOOGLE.issuer() + FakeGoogle.AUTHORIZATION_PATH);
		String setCookie = started.headers().allValues("Set-Cookie").stream()
				.filter(c -> c.startsWith(GoogleSignInController.SIGN_IN_COOKIE + "="))
				.findFirst()
				.orElseThrow();
		return new GooglePage(FakeGoogle.parseForm(location.getRawQuery()), setCookie);
	}

	/** An ID token like Google's for the Google account with this address. */
	private JWTClaimsSet.Builder idToken(GooglePage page, String email) {
		Instant now = clock.instant();
		return new JWTClaimsSet.Builder()
				.issuer(GOOGLE.issuer())
				.audience(FakeGoogle.CLIENT_ID)
				.claim("azp", FakeGoogle.CLIENT_ID)
				.subject(subjectOf(email))
				.claim("email", email)
				.claim("email_verified", true)
				.claim("nonce", page.param("nonce"))
				.issueTime(Date.from(now))
				.expirationTime(Date.from(now.plus(Duration.ofHours(1))));
	}

	/** Comes back from Google's page, as Google redirects the browser after the person picked their account. */
	private static Response comeBack(Client browser, GooglePage page, JWTClaimsSet claims) {
		String code = GOOGLE.code(claims, page.param("code_challenge"), page.param("redirect_uri"));
		return browser.get(callback(page.param("state"), code));
	}

	/** Signs in with the Google account for this address, and returns where the app sent the browser. */
	private String signInWithGoogle(Client browser, String email) {
		GooglePage page = start(browser, START);
		return comeBack(browser, page, idToken(page, email).build()).expectStatus(302).header("Location");
	}

	private static String callback(String state, String code) {
		return GoogleOidcClient.CALLBACK_PATH + "?state=" + encode(state) + "&code=" + encode(code) + "&scope=email+openid&authuser=0&prompt=consent";
	}

	private static String invite(Client admin, String email, String role) {
		return admin.post("/api/employees", Map.of("name", "Invited " + email, "email", email, "department", "Engineering", "designation", "Developer",
				"role", role)).expectStatus(201).data().path("invite").path("token").asString();
	}

	// Google's subject is a number that never changes; any stable value will do here.
	private static String subjectOf(String email) {
		return "1000" + Math.abs(email.toLowerCase().hashCode());
	}

	private String totp(String secret) {
		return Totp.code(Base32.decode(secret), Totp.step(clock.instant()));
	}

	private static List<String> activity(Client client) {
		List<String> entries = new ArrayList<>();
		client.get("/api/activity").expectStatus(200).data()
				.forEach(e -> entries.add(e.path("action").asString() + (e.has("details") ? " (" + e.path("details").asString() + ")" : "")));
		return entries;
	}

	private static String encode(String value) {
		return URLEncoder.encode(value, StandardCharsets.UTF_8);
	}

}
