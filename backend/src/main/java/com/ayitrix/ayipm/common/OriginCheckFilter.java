package com.ayitrix.ayipm.common;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import tools.jackson.databind.json.JsonMapper;

/**
 * Refuses requests that change data when the browser says they come from another site, so a page elsewhere can't use
 * a signed-in user's session cookie. A request is allowed when its {@code Origin} (or {@code Referer}, if there is no
 * {@code Origin}) is the backend's own address or one of {@code ayipm.allowed-origins}.
 */
@Component
public class OriginCheckFilter extends OncePerRequestFilter {

	private static final Logger log = LoggerFactory.getLogger(OriginCheckFilter.class);
	private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS", "TRACE");

	private final Set<String> allowedOrigins;
	private final byte[] blockedBody;

	public OriginCheckFilter(@Value("${ayipm.allowed-origins}") String allowedOrigins, JsonMapper json) {
		this.allowedOrigins = Arrays.stream(StringUtils.tokenizeToStringArray(allowedOrigins, ","))
				.map(OriginCheckFilter::requireOrigin)
				.collect(Collectors.toUnmodifiableSet());
		this.blockedBody = json.writeValueAsBytes(new ApiResponse.Error("Requests from other sites are not allowed."));
	}

	// Every path is checked, not just /api, so no other spelling of a path (encoded letters, extra slashes) can skip it.
	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		return SAFE_METHODS.contains(request.getMethod());
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		String source = request.getHeader(HttpHeaders.ORIGIN);
		if (source == null) source = request.getHeader(HttpHeaders.REFERER);
		// Browsers always send Origin with these methods, so a request with neither header comes from curl, a script or
		// another server. Those only carry cookies they signed in for themselves, so there is no one else's session to misuse.
		if (source == null) {
			chain.doFilter(request, response);
			return;
		}

		// "null" (sandboxed frames, local files, some redirects) has no origin and is never allowed.
		String origin = originOf(source);
		// Scheme, host and port already reflect X-Forwarded-* (server.forward-headers-strategy), so behind the Next.js
		// proxy this is the address in the browser's address bar. It also allows pages the backend serves itself.
		String own = origin(request.getScheme(), request.getServerName(), request.getServerPort());
		if (origin != null && (origin.equals(own) || allowedOrigins.contains(origin))) {
			chain.doFilter(request, response);
			return;
		}

		log.warn("Blocked {} {} from {}. Allowed are {} and ayipm.allowed-origins {}.", request.getMethod(), request.getRequestURI(), origin, own,
				allowedOrigins);
		response.setStatus(HttpStatus.FORBIDDEN.value());
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.getOutputStream().write(blockedBody);
	}

	private static String requireOrigin(String configured) {
		String origin = originOf(configured);
		if (origin == null) {
			throw new IllegalArgumentException("ayipm.allowed-origins: \"" + configured + "\" is not an origin like https://pm.example.com");
		}
		return origin;
	}

	/** The scheme, host and port of a URL, such as {@code http://localhost:3000}, or null if it isn't one. */
	private static String originOf(String url) {
		try {
			URI uri = new URI(url);
			if (uri.getScheme() == null || uri.getHost() == null) return null;
			return origin(uri.getScheme(), uri.getHost(), uri.getPort());
		} catch (URISyntaxException e) {
			return null;
		}
	}

	private static String origin(String scheme, String host, int port) {
		scheme = scheme.toLowerCase(Locale.ROOT);
		boolean defaultPort = port == -1 || (scheme.equals("http") && port == 80) || (scheme.equals("https") && port == 443);
		return scheme + "://" + host.toLowerCase(Locale.ROOT) + (defaultPort ? "" : ":" + port);
	}

}
