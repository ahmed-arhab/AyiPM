package com.ayitrix.ayipm.auth;

import java.net.Inet6Address;
import java.net.InetAddress;
import java.util.HexFormat;

import org.springframework.stereotype.Component;

import com.ayitrix.ayipm.common.ClientAddressResolver;
import com.ayitrix.ayipm.common.RateLimiter;
import com.ayitrix.ayipm.common.TooManyRequestsException;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Limits how often one client can call each public sign-in endpoint. The account lockout in {@link AuthService} stops
 * guessing one account's password; this stops one client from trying many accounts.
 */
@Component
public class SignInRateLimit {

	private final RateLimiter limiter;
	private final ClientAddressResolver addresses;

	public SignInRateLimit(RateLimiter limiter, ClientAddressResolver addresses) {
		this.limiter = limiter;
		this.addresses = addresses;
	}

	/** Counts a request to the endpoint, failing with 429 once the client is over the limit. */
	public void check(String endpoint, HttpServletRequest request) {
		limiter.tryAcquire(endpoint + " " + clientKey(addresses.resolve(request))).ifPresent(wait -> {
			long seconds = Math.max(1, (wait.toMillis() + 999) / 1000);
			throw new TooManyRequestsException("Too many attempts. Try again in " + describe(seconds) + ".", seconds);
		});
	}

	// An IPv6 subscriber usually gets a whole /64, so a client could otherwise pick a fresh address for every request.
	static String clientKey(InetAddress address) {
		if (!(address instanceof Inet6Address)) return address.getHostAddress();
		return HexFormat.of().formatHex(address.getAddress(), 0, 8) + "/64";
	}

	private static String describe(long seconds) {
		if (seconds < 60) return seconds + " second" + (seconds == 1 ? "" : "s");
		long minutes = (seconds + 59) / 60;
		return minutes + " minute" + (minutes == 1 ? "" : "s");
	}

}
