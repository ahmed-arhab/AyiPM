package com.ayitrix.ayipm.common;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletRequestWrapper;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Works out which client sent a request, for rate limiting.
 *
 * <p>The address of the connection is the client unless it is one of {@code ayipm.trusted-proxies}. Then the
 * X-Forwarded-For entries are read from right to left, skipping trusted proxies, and the first other address is the
 * client. Entries further left came from the client or from hops that aren't trusted, so a client can't choose its own
 * address. The frontend's production server adds the address it saw (frontend/scripts/client-address.cjs), so it can be
 * trusted. {@code next dev} passes the header through unchanged, so a development frontend must not be.
 */
@Component
public class ClientAddressResolver {

	private static final String FORWARDED_FOR = "X-Forwarded-For";
	private static final Pattern IPV4 = Pattern.compile("(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})");
	private static final Pattern IPV6 = Pattern.compile("[0-9A-Fa-f:][0-9A-Fa-f:.]*");
	private static final Pattern HOSTNAME = Pattern.compile("(?=.*[A-Za-z])[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?");

	private final List<Range> trustedRanges = new ArrayList<>();
	private final List<String> trustedHosts = new ArrayList<>();

	/** Takes a comma-separated list of IP addresses, CIDR ranges and hostnames. */
	public ClientAddressResolver(@Value("${ayipm.trusted-proxies}") String trustedProxies) {
		for (String entry : trustedProxies.split(",")) {
			String value = entry.trim();
			if (value.isEmpty()) continue;
			if (value.contains("/")) {
				trustedRanges.add(Range.parse(value));
			} else {
				Optional<InetAddress> address = parse(value);
				if (address.isPresent()) trustedRanges.add(Range.of(address.get()));
				else if (HOSTNAME.matcher(value).matches()) trustedHosts.add(value);
				else throw new IllegalArgumentException("Invalid entry in ayipm.trusted-proxies: " + value);
			}
		}
	}

	public InetAddress resolve(HttpServletRequest request) {
		// With server.forward-headers-strategy=framework, ForwardedHeaderFilter wraps the request so that getRemoteAddr()
		// returns the left-most X-Forwarded-For entry, which any client can set, and hides the header. The servlet
		// container's own request still has the connection's address and the original headers.
		ServletRequest original = request;
		while (original instanceof ServletRequestWrapper wrapper) original = wrapper.getRequest();
		HttpServletRequest container = original instanceof HttpServletRequest http ? http : request;
		return resolve(container.getRemoteAddr(), Collections.list(container.getHeaders(FORWARDED_FOR)));
	}

	InetAddress resolve(String remoteAddress, List<String> forwardedFor) {
		InetAddress client = parse(remoteAddress)
				.orElseThrow(() -> new IllegalStateException("Unexpected remote address: " + remoteAddress));
		if (!isTrusted(client)) return client;
		List<String> hops = forwardedFor.stream().flatMap(value -> Arrays.stream(value.split(","))).toList();
		for (int i = hops.size() - 1; i >= 0; i--) {
			Optional<InetAddress> hop = parse(hops.get(i));
			// Stop at anything that isn't an address and keep the last trusted proxy.
			if (hop.isEmpty()) break;
			client = hop.get();
			if (!isTrusted(client)) break;
		}
		return client;
	}

	private boolean isTrusted(InetAddress address) {
		for (Range range : trustedRanges) {
			if (range.contains(address)) return true;
		}
		// Looked up on each check, so a container that restarts with a new address is still recognised. The JVM caches
		// lookups for 30 seconds by default.
		for (String host : trustedHosts) {
			try {
				for (InetAddress resolved : InetAddress.getAllByName(host)) {
					if (Range.of(resolved).contains(address)) return true;
				}
			} catch (UnknownHostException e) {
				// Not resolvable right now, so not trusted.
			}
		}
		return false;
	}

	/**
	 * Parses an IP address, without ever looking up a hostname. Accepts the forms proxies write into X-Forwarded-For:
	 * {@code 203.0.113.7}, {@code 203.0.113.7:5000}, {@code 2001:db8::1} and {@code [2001:db8::1]:5000}.
	 */
	static Optional<InetAddress> parse(String text) {
		if (text == null) return Optional.empty();
		String value = text.strip();
		if (value.startsWith("[")) {
			int end = value.indexOf(']');
			if (end < 0) return Optional.empty();
			value = value.substring(1, end);
		} else if (value.indexOf(':') > 0 && value.indexOf(':') == value.lastIndexOf(':')) {
			value = value.substring(0, value.indexOf(':'));
		}
		int zone = value.indexOf('%');
		if (zone >= 0) value = value.substring(0, zone);

		Matcher ipv4 = IPV4.matcher(value);
		if (ipv4.matches()) {
			byte[] bytes = new byte[4];
			for (int i = 0; i < 4; i++) {
				int octet = Integer.parseInt(ipv4.group(i + 1));
				if (octet > 255) return Optional.empty();
				bytes[i] = (byte) octet;
			}
			return Optional.of(byAddress(bytes));
		}
		// getByName treats a value that starts with a hex digit or colon and contains a colon as an IPv6 literal, and
		// fails instead of looking it up when it isn't one.
		if (value.indexOf(':') < 0 || !IPV6.matcher(value).matches()) return Optional.empty();
		try {
			return Optional.of(InetAddress.getByName(value));
		} catch (UnknownHostException e) {
			return Optional.empty();
		}
	}

	private static InetAddress byAddress(byte[] bytes) {
		try {
			return InetAddress.getByAddress(bytes);
		} catch (UnknownHostException e) {
			throw new IllegalArgumentException(e);
		}
	}

	private record Range(byte[] network, int prefixLength) {

		static Range of(InetAddress address) {
			return new Range(address.getAddress(), address.getAddress().length * 8);
		}

		static Range parse(String cidr) {
			int slash = cidr.indexOf('/');
			InetAddress address = ClientAddressResolver.parse(cidr.substring(0, slash)).orElse(null);
			int prefixLength;
			try {
				prefixLength = Integer.parseInt(cidr.substring(slash + 1));
			} catch (NumberFormatException e) {
				prefixLength = -1;
			}
			if (address == null || prefixLength < 0 || prefixLength > address.getAddress().length * 8) {
				throw new IllegalArgumentException("Invalid range in ayipm.trusted-proxies: " + cidr);
			}
			return new Range(address.getAddress(), prefixLength);
		}

		boolean contains(InetAddress address) {
			byte[] bytes = address.getAddress();
			if (bytes.length != network.length) return false;
			int whole = prefixLength / 8;
			for (int i = 0; i < whole; i++) {
				if (bytes[i] != network[i]) return false;
			}
			int rest = prefixLength % 8;
			if (rest == 0) return true;
			int mask = (0xFF << (8 - rest)) & 0xFF;
			return (bytes[whole] & mask) == (network[whole] & mask);
		}

	}

}
