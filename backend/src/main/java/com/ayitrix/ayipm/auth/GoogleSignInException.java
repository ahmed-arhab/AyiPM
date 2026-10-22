package com.ayitrix.ayipm.auth;

/**
 * Why a sign-in with Google didn't work. The browser is sent back to the login page with the failure's code, and the
 * frontend shows the matching message (GOOGLE_SIGN_IN_ERRORS in src/features/auth/utils.ts).
 */
class GoogleSignInException extends RuntimeException {

	enum Failure {
		/** The server has no Google credentials. */
		UNAVAILABLE("unavailable"),
		/** No sign-in was started in this browser, it is used up or too old, or the state doesn't match. */
		EXPIRED("expired"),
		/** The person cancelled on Google's page. The login page shows no message. */
		CANCELLED("cancelled"),
		/** Google couldn't be reached, or its answer didn't check out. The details are in the log. */
		FAILED("failed"),
		NOT_INVITED("not-invited"),
		WRONG_DOMAIN("wrong-domain"),
		DEACTIVATED("deactivated"),
		INVITE_EXPIRED("invite-expired"),
		/** The sign-in started from an invitation for another address. */
		INVITE_MISMATCH("invite-mismatch"),
		/** The account is linked to another Google account, or this Google account to another person. */
		LINKED_ELSEWHERE("linked-elsewhere"),
		TOO_MANY_ATTEMPTS("too-many-attempts");

		private final String code;

		Failure(String code) {
			this.code = code;
		}

		String code() {
			return code;
		}
	}

	private final Failure failure;

	GoogleSignInException(Failure failure) {
		super(failure.code());
		this.failure = failure;
	}

	Failure failure() {
		return failure;
	}

}
