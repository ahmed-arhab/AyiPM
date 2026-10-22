package com.ayitrix.ayipm.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.bouncycastle.util.encoders.Base32;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

import com.ayitrix.ayipm.IntegrationTest;

import tools.jackson.databind.JsonNode;

@TestPropertySource(properties = "ayipm.two-factor.encryption-key=" + TwoFactorApiTests.KEY)
class TwoFactorApiTests extends IntegrationTest {

	static final String KEY = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";
	private static final String OWNER_EMAIL = "owner@test.com";
	private static final String OWNER_PASSWORD = "Secret123!";

	@BeforeEach
	void stopTheClock() {
		// In the middle of a 30-second step, so a code doesn't expire while a test runs.
		clock.set(Instant.parse("2026-03-02T09:00:10Z"));
	}

	@Test
	void setupTakesEffectOnlyOnceACodeIsConfirmed() {
		Client owner = signedInOwner();
		JsonNode status = owner.get("/api/auth/two-factor").expectStatus(200).data();
		assertThat(status.path("enabled").asBoolean()).isFalse();
		assertThat(status.path("available").asBoolean()).isTrue();

		JsonNode setup = owner.post("/api/auth/two-factor/setup", Map.of()).expectStatus(200).data();
		String secret = setup.path("secret").asString();
		assertThat(secret).matches("[A-Z2-7]{32}");
		assertThat(setup.path("otpauthUri").asString())
				.isEqualTo("otpauth://totp/Test%20Co:owner%40test.com?secret=" + secret + "&issuer=Test%20Co&algorithm=SHA1&digits=6&period=30");

		Response wrong = owner.post("/api/auth/two-factor/confirm", Map.of("code", otherCode(secret)));
		assertThat(wrong.status()).isEqualTo(400);
		assertThat(wrong.error()).isEqualTo("That code didn't work. Enter the newest code from your authenticator app.");
		// Not confirmed yet, so the password is still enough.
		assertThat(login().data().path("user").isObject()).isTrue();

		JsonNode confirmed = owner.post("/api/auth/two-factor/confirm", Map.of("code", code(secret))).expectStatus(200).data();
		List<String> recoveryCodes = texts(confirmed.path("recoveryCodes"));
		assertThat(recoveryCodes).hasSize(10).doesNotHaveDuplicates().allMatch(c -> c.matches("[0-9a-hjkmnp-tv-z]{5}-[0-9a-hjkmnp-tv-z]{5}"));
		assertThat(confirmed.path("status").path("enabled").asBoolean()).isTrue();
		assertThat(confirmed.path("status").path("recoveryCodesLeft").asInt()).isEqualTo(10);
		assertThat(owner.get("/api/auth/session").data().path("twoFactor").path("enabled").asBoolean()).isTrue();
		assertThat(owner.post("/api/auth/two-factor/setup", Map.of()).status()).isEqualTo(409);

		// The secret is encrypted and the recovery codes are hashed.
		String stored = jdbc.queryForObject("select two_factor_secret from users where email = ?", String.class, OWNER_EMAIL);
		assertThat(stored).isNotBlank().doesNotContain(secret);
		assertThat(jdbc.queryForObject("select two_factor_pending_secret from users where email = ?", String.class, OWNER_EMAIL)).isNull();
		List<String> hashes = jdbc.queryForList("select code_hash from recovery_codes", String.class);
		assertThat(hashes).hasSize(10).noneMatch(h -> recoveryCodes.stream().anyMatch(c -> h.contains(c.replace("-", ""))));
	}

	@Test
	void anAccountWithTwoFactorCannotSignInWithItsPasswordAlone() {
		String secret = enableForOwner().secret();
		Client browser = client();
		JsonNode login = browser.post("/api/auth/login", Map.of("email", OWNER_EMAIL, "password", OWNER_PASSWORD, "remember", true))
				.expectStatus(200).data();
		assertThat(login.path("user").isMissingNode()).isTrue();
		JsonNode challenge = login.path("twoFactorChallenge");
		assertThat(challenge.path("setupRequired").asBoolean()).isFalse();
		assertThat(Instant.parse(challenge.path("expiresAt").asString())).isEqualTo(clock.instant().plus(Duration.ofMinutes(5)));
		assertThat(browser.get("/api/auth/session").data().path("user").isNull()).isTrue();
		assertThat(browser.get("/api/employees").status()).isEqualTo(401);

		clock.set(clock.instant().plusSeconds(30));
		Response signedIn = browser.post("/api/auth/login/two-factor", Map.of("challenge", challenge.path("token").asString(), "code", code(secret)))
				.expectStatus(200);
		assertThat(signedIn.data().path("user").path("email").asString()).isEqualTo(OWNER_EMAIL);
		// "Keep me signed in" carries over from the password step.
		assertThat(Instant.parse(signedIn.data().path("expiresAt").asString())).isAfter(Instant.now().plus(Duration.ofDays(29)));
		browser.get("/api/employees").expectStatus(200);

		// The challenge works only once.
		clock.set(clock.instant().plusSeconds(30));
		Response again = client().post("/api/auth/login/two-factor", Map.of("challenge", challenge.path("token").asString(), "code", code(secret)));
		assertThat(again.status()).isEqualTo(410);
		assertThat(again.error()).isEqualTo("This sign-in has expired. Enter your password again.");
	}

	@Test
	void aWrongCodeIsRefusedAndAnExpiredChallengeIsGone() {
		String secret = enableForOwner().secret();
		String challenge = challenge();
		Response wrong = client().post("/api/auth/login/two-factor", Map.of("challenge", challenge, "code", otherCode(secret)));
		assertThat(wrong.status()).isEqualTo(401);
		assertThat(wrong.error()).isEqualTo("That code didn't work. Enter the newest code from your authenticator app.");
		assertThat(client().post("/api/auth/login/two-factor", Map.of("challenge", "made-up", "code", code(secret))).status()).isEqualTo(410);

		clock.set(clock.instant().plus(Duration.ofMinutes(6)));
		assertThat(client().post("/api/auth/login/two-factor", Map.of("challenge", challenge, "code", code(secret))).status()).isEqualTo(410);
	}

	@Test
	void wrongCodesCountTowardTheSameLockoutAsWrongPasswords() {
		String secret = enableForOwner().secret();
		String first = challenge();
		wrongCode(first, secret);
		wrongCode(first, secret);
		// A correct password doesn't reset the count, so the code can't be guessed by signing in again and again.
		String second = challenge();
		wrongCode(second, secret);
		wrongCode(second, secret);
		Response locked = client().post("/api/auth/login/two-factor", Map.of("challenge", second, "code", otherCode(secret)));
		assertThat(locked.status()).isEqualTo(429);
		assertThat(locked.error()).startsWith("Too many failed attempts. Try again in 15 minutes");

		assertThat(client().post("/api/auth/login/two-factor", Map.of("challenge", second, "code", code(secret))).status()).isEqualTo(429);
		assertThat(login().status()).isEqualTo(429);

		clock.set(clock.instant().plus(Duration.ofMinutes(16)));
		Client browser = client();
		String third = challenge(browser);
		browser.post("/api/auth/login/two-factor", Map.of("challenge", third, "code", code(secret))).expectStatus(200);
		assertThat(jdbc.queryForObject("select count(*) from login_attempts", Integer.class)).isZero();
	}

	@Test
	void aRecoveryCodeWorksExactlyOnce() {
		Enabled enabled = enableForOwner();
		String recoveryCode = enabled.recoveryCodes().get(3);
		Client browser = client();
		// Accepted however it is typed.
		browser.post("/api/auth/login/two-factor", Map.of("challenge", challenge(browser), "code", " " + recoveryCode.toUpperCase().replace("-", " ") + " "))
				.expectStatus(200);
		assertThat(jdbc.queryForObject("select details from activity_log where action = 'Signed In' order by created_at desc limit 1", String.class))
				.isEqualTo("Used a recovery code");
		assertThat(browser.get("/api/auth/two-factor").data().path("recoveryCodesLeft").asInt()).isEqualTo(9);

		Response reused = client().post("/api/auth/login/two-factor", Map.of("challenge", challenge(), "code", recoveryCode));
		assertThat(reused.status()).isEqualTo(401);
		assertThat(reused.error()).isEqualTo("That recovery code didn't work. Each code works only once.");
		client().post("/api/auth/login/two-factor", Map.of("challenge", challenge(), "code", enabled.recoveryCodes().get(4))).expectStatus(200);
	}

	@Test
	void anAuthenticatorCodeWorksOnlyOnce() {
		String secret = enableForOwner().secret();
		// Confirming setup used the current code.
		Response reused = client().post("/api/auth/login/two-factor", Map.of("challenge", challenge(), "code", code(secret)));
		assertThat(reused.status()).isEqualTo(401);
		assertThat(reused.error()).isEqualTo("That code has already been used. Wait for the next one in your authenticator app.");

		clock.set(clock.instant().plusSeconds(30));
		String fresh = code(secret);
		client().post("/api/auth/login/two-factor", Map.of("challenge", challenge(), "code", fresh)).expectStatus(200);
		assertThat(client().post("/api/auth/login/two-factor", Map.of("challenge", challenge(), "code", fresh)).status()).isEqualTo(401);

		// One step of clock drift is allowed, but never a step older than the last one used.
		clock.set(clock.instant().plusSeconds(60));
		long step = Totp.step(clock.instant());
		byte[] key = Base32.decode(secret);
		client().post("/api/auth/login/two-factor", Map.of("challenge", challenge(), "code", Totp.code(key, step - 1))).expectStatus(200);
		client().post("/api/auth/login/two-factor", Map.of("challenge", challenge(), "code", Totp.code(key, step + 1))).expectStatus(200);
		assertThat(client().post("/api/auth/login/two-factor", Map.of("challenge", challenge(), "code", Totp.code(key, step))).status()).isEqualTo(401);
	}

	@Test
	void turningItOffNeedsACode() {
		Client owner = signedInOwner();
		Enabled enabled = enable(owner);
		Response wrong = owner.post("/api/auth/two-factor/disable", Map.of("code", otherCode(enabled.secret())));
		assertThat(wrong.status()).isEqualTo(400);
		assertThat(owner.get("/api/auth/two-factor").data().path("enabled").asBoolean()).isTrue();

		JsonNode status = owner.post("/api/auth/two-factor/disable", Map.of("code", enabled.recoveryCodes().get(0))).expectStatus(200).data();
		assertThat(status.path("enabled").asBoolean()).isFalse();
		assertThat(status.path("recoveryCodesLeft").asInt()).isZero();
		assertThat(jdbc.queryForObject("select count(*) from recovery_codes", Integer.class)).isZero();
		assertThat(login().data().path("user").path("email").asString()).isEqualTo(OWNER_EMAIL);
	}

	@Test
	void newRecoveryCodesReplaceTheOldOnes() {
		Client owner = signedInOwner();
		Enabled enabled = enable(owner);
		clock.set(clock.instant().plusSeconds(30));
		JsonNode fresh = owner.post("/api/auth/two-factor/recovery-codes", Map.of("code", code(enabled.secret()))).expectStatus(200).data();
		List<String> codes = texts(fresh.path("recoveryCodes"));
		assertThat(codes).hasSize(10).doesNotContainAnyElementsOf(enabled.recoveryCodes());

		assertThat(client().post("/api/auth/login/two-factor", Map.of("challenge", challenge(), "code", enabled.recoveryCodes().get(0))).status())
				.isEqualTo(401);
		client().post("/api/auth/login/two-factor", Map.of("challenge", challenge(), "code", codes.get(0))).expectStatus(200);
	}

	@Test
	void requiringTwoFactorForAdmins() {
		Client owner = signedInOwner();
		Client otherAdmin = signedInMember(owner, "admin2@test.com", "admin");
		Client employee = signedInMember(owner, "emp@test.com", "employee");

		// Only an admin who uses it can require it, so the workspace always keeps an admin who can sign in.
		Response tooEarly = owner.patch("/api/workspace", Map.of("requireAdminTwoFactor", true));
		assertThat(tooEarly.status()).isEqualTo(400);
		assertThat(tooEarly.error()).isEqualTo("Turn on two-factor authentication for your own account before requiring it for admins.");

		enable(owner);
		assertThat(owner.patch("/api/workspace", Map.of("requireAdminTwoFactor", true)).expectStatus(200).data().path("requireAdminTwoFactor").asBoolean())
				.isTrue();
		owner.get("/api/employees").expectStatus(200);
		employee.get("/api/employees").expectStatus(200);
		// Admins without it are signed out and set it up before they get a session.
		assertThat(otherAdmin.get("/api/employees").status()).isEqualTo(401);

		Client browser = client();
		JsonNode challenge = browser.post("/api/auth/login", Map.of("email", "admin2@test.com", "password", "MemberPass1!")).expectStatus(200)
				.data().path("twoFactorChallenge");
		assertThat(challenge.path("setupRequired").asBoolean()).isTrue();
		String token = challenge.path("token").asString();
		assertThat(browser.get("/api/employees").status()).isEqualTo(401);
		assertThat(browser.post("/api/auth/login/two-factor", Map.of("challenge", token, "code", "123456")).status()).isEqualTo(410);

		String secret = browser.post("/api/auth/login/two-factor/setup", Map.of("challenge", token)).expectStatus(200).data().path("secret").asString();
		assertThat(browser.post("/api/auth/login/two-factor/confirm", Map.of("challenge", token, "code", otherCode(secret))).status()).isEqualTo(400);
		JsonNode signedIn = browser.post("/api/auth/login/two-factor/confirm", Map.of("challenge", token, "code", code(secret))).expectStatus(200).data();
		assertThat(texts(signedIn.path("recoveryCodes"))).hasSize(10);
		assertThat(signedIn.path("bootstrap").path("user").path("email").asString()).isEqualTo("admin2@test.com");
		JsonNode status = signedIn.path("bootstrap").path("twoFactor");
		assertThat(status.path("enabled").asBoolean()).isTrue();
		assertThat(status.path("required").asBoolean()).isTrue();
		browser.get("/api/employees").expectStatus(200);

		// While it is required, admins can't turn it off.
		clock.set(clock.instant().plusSeconds(30));
		Response disable = browser.post("/api/auth/two-factor/disable", Map.of("code", code(secret)));
		assertThat(disable.status()).isEqualTo(400);
		assertThat(disable.error()).isEqualTo("Your workspace requires two-factor authentication for admins, so it can't be turned off.");

		// Other roles sign in as before.
		assertThat(client().post("/api/auth/login", Map.of("email", "emp@test.com", "password", "MemberPass1!")).expectStatus(200)
				.data().path("user").path("email").asString()).isEqualTo("emp@test.com");
		assertThat(employee.get("/api/auth/two-factor").data().path("required").asBoolean()).isFalse();

		// Someone who becomes an admin is signed out, and invited admins set it up before their first session.
		String employeeId = idOf(employee);
		owner.put("/api/employees/" + employeeId + "/role", Map.of("role", "admin")).expectStatus(200);
		assertThat(employee.get("/api/employees").status()).isEqualTo(401);
		Response invited = owner.post("/api/employees", Map.of(
				"name", "New Admin", "email", "new@test.com", "department", "Management", "designation", "Admin", "role", "admin"))
				.expectStatus(201);
		Client newAdmin = client();
		JsonNode accepted = newAdmin.post("/api/auth/invite", Map.of("token", invited.data().path("invite").path("token").asString(), "password", "NewAdmin1!"))
				.expectStatus(200).data();
		assertThat(accepted.path("twoFactorChallenge").path("setupRequired").asBoolean()).isTrue();
		assertThat(newAdmin.get("/api/employees").status()).isEqualTo(401);

		owner.patch("/api/workspace", Map.of("requireAdminTwoFactor", false)).expectStatus(200);
		browser.post("/api/auth/two-factor/disable", Map.of("code", texts(signedIn.path("recoveryCodes")).get(0))).expectStatus(200);
	}

	@Test
	void accountsWithoutTwoFactorSignInAsBefore() {
		signedInOwner();
		JsonNode login = login().expectStatus(200).data();
		assertThat(login.path("twoFactor").path("enabled").asBoolean()).isFalse();
		assertThat(login.path("twoFactor").path("available").asBoolean()).isTrue();
		assertThat(login.path("user").path("email").asString()).isEqualTo(OWNER_EMAIL);
		assertThat(jdbc.queryForObject("select count(*) from login_challenges", Integer.class)).isZero();
	}

	private record Enabled(String secret, List<String> recoveryCodes) {
	}

	private Enabled enableForOwner() {
		return enable(signedInOwner());
	}

	private Enabled enable(Client client) {
		String secret = client.post("/api/auth/two-factor/setup", Map.of()).expectStatus(200).data().path("secret").asString();
		JsonNode confirmed = client.post("/api/auth/two-factor/confirm", Map.of("code", code(secret))).expectStatus(200).data();
		return new Enabled(secret, texts(confirmed.path("recoveryCodes")));
	}

	private Response login() {
		return client().post("/api/auth/login", Map.of("email", OWNER_EMAIL, "password", OWNER_PASSWORD));
	}

	private String challenge() {
		return challenge(client());
	}

	private static String challenge(Client browser) {
		return browser.post("/api/auth/login", Map.of("email", OWNER_EMAIL, "password", OWNER_PASSWORD)).expectStatus(200)
				.data().path("twoFactorChallenge").path("token").asString();
	}

	private void wrongCode(String challenge, String secret) {
		Response response = client().post("/api/auth/login/two-factor", Map.of("challenge", challenge, "code", otherCode(secret)));
		assertThat(response.status()).isEqualTo(401);
	}

	/** The code an authenticator app shows right now, computed from the secret and the test clock. */
	private String code(String secret) {
		return Totp.code(Base32.decode(secret), Totp.step(clock.instant()));
	}

	/** A 6-digit code that is wrong for the current and neighbouring steps. */
	private String otherCode(String secret) {
		long step = Totp.step(clock.instant());
		List<String> valid = List.of(-1, 0, 1).stream().map(d -> Totp.code(Base32.decode(secret), step + d)).toList();
		for (int candidate = 0;; candidate++) {
			String code = String.format("%06d", candidate);
			if (!valid.contains(code)) return code;
		}
	}

	private static List<String> texts(JsonNode array) {
		List<String> values = new ArrayList<>();
		array.forEach(node -> values.add(node.asString()));
		return values;
	}

}
