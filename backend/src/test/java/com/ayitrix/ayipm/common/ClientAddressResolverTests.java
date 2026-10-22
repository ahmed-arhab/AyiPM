package com.ayitrix.ayipm.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.net.InetAddress;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.filter.ForwardedHeaderFilter;

import jakarta.servlet.http.HttpServletRequest;

class ClientAddressResolverTests {

	@Test
	void usesTheConnectionWhenNoProxyIsTrusted() {
		ClientAddressResolver resolver = new ClientAddressResolver("");
		assertThat(resolve(resolver, "198.51.100.7", "203.0.113.9")).isEqualTo("198.51.100.7");
	}

	@Test
	void ignoresForwardedForFromAPeerThatIsNotTrusted() {
		ClientAddressResolver resolver = new ClientAddressResolver("10.0.0.1");
		assertThat(resolve(resolver, "198.51.100.7", "203.0.113.9")).isEqualTo("198.51.100.7");
	}

	@Test
	void takesTheRightMostAddressThatIsNotATrustedProxy() {
		ClientAddressResolver resolver = new ClientAddressResolver("10.0.0.0/8");
		// 6.6.6.6 was sent by the client; 203.0.113.9 was added by the first trusted proxy.
		assertThat(resolve(resolver, "10.0.0.2", "6.6.6.6, 203.0.113.9, 10.0.0.5")).isEqualTo("203.0.113.9");
		assertThat(resolve(resolver, "10.0.0.2", "6.6.6.6", "203.0.113.9")).isEqualTo("203.0.113.9");
	}

	@Test
	void fallsBackToTheProxyWhenItNamesNoClient() {
		ClientAddressResolver resolver = new ClientAddressResolver("10.0.0.0/8");
		assertThat(resolve(resolver, "10.0.0.2")).isEqualTo("10.0.0.2");
		assertThat(resolve(resolver, "10.0.0.2", "10.0.0.5")).isEqualTo("10.0.0.5");
		// A client can't skip past the proxy's entry by adding one that isn't an address.
		assertThat(resolve(resolver, "10.0.0.2", "203.0.113.9, unknown, 10.0.0.5")).isEqualTo("10.0.0.5");
	}

	@Test
	void understandsIpv6AndPorts() {
		ClientAddressResolver resolver = new ClientAddressResolver("::1, 127.0.0.1");
		// Tomcat writes the IPv6 loopback address in full.
		assertThat(resolve(resolver, "0:0:0:0:0:0:0:1", "[2001:db8::7]:4711")).isEqualTo("2001:db8:0:0:0:0:0:7");
		assertThat(resolve(resolver, "127.0.0.1", "203.0.113.9:5000")).isEqualTo("203.0.113.9");
		assertThat(resolve(resolver, "127.0.0.1", "::ffff:203.0.113.9")).isEqualTo("203.0.113.9");
	}

	@Test
	void matchesRanges() {
		ClientAddressResolver resolver = new ClientAddressResolver("172.16.0.0/12, 2001:db8::/32");
		assertThat(resolve(resolver, "172.31.255.254", "203.0.113.9")).isEqualTo("203.0.113.9");
		assertThat(resolve(resolver, "172.32.0.1", "203.0.113.9")).isEqualTo("172.32.0.1");
		assertThat(resolve(resolver, "2001:db8:ffff::1", "203.0.113.9")).isEqualTo("203.0.113.9");
		assertThat(resolve(resolver, "2001:db9::1", "203.0.113.9")).isEqualTo("2001:db9:0:0:0:0:0:1");
	}

	@Test
	void trustsHostnames() {
		ClientAddressResolver resolver = new ClientAddressResolver("localhost");
		assertThat(resolve(resolver, "127.0.0.1", "203.0.113.9")).isEqualTo("203.0.113.9");
		assertThat(resolve(resolver, "198.51.100.7", "203.0.113.9")).isEqualTo("198.51.100.7");
	}

	@Test
	void rejectsInvalidSettings() {
		for (String invalid : List.of("10.0.0.0/33", "10.0.0.0/x", "300.1.1.1", "10.0.0.1 10.0.0.2", "frontend:3000")) {
			assertThatThrownBy(() -> new ClientAddressResolver(invalid)).as(invalid).isInstanceOf(IllegalArgumentException.class);
		}
	}

	@Test
	void parsesOnlyAddressesAndNeverLooksUpNames() {
		for (String notAnAddress : List.of("", "unknown", "localhost", "example.com", "cafe", "1.2.3", "256.1.1.1", "1.2.3.4.5", ".:1", "::g")) {
			assertThat(ClientAddressResolver.parse(notAnAddress)).as(notAnAddress).isEmpty();
		}
		assertThat(ClientAddressResolver.parse(" 203.0.113.9 ")).map(InetAddress::getHostAddress).contains("203.0.113.9");
		assertThat(ClientAddressResolver.parse("fe80::1%en0")).map(InetAddress::getHostAddress).contains("fe80:0:0:0:0:0:0:1");
	}

	@Test
	void ignoresTheAddressThatForwardedHeaderFilterPutsInPlace() throws Exception {
		MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
		request.setRemoteAddr("198.51.100.7");
		request.addHeader("X-Forwarded-For", "6.6.6.6, 203.0.113.9");
		MockFilterChain chain = new MockFilterChain();
		new ForwardedHeaderFilter().doFilter(request, new MockHttpServletResponse(), chain);
		HttpServletRequest filtered = (HttpServletRequest) chain.getRequest();

		// The filter hands the controller the left-most entry, which the client chose.
		assertThat(filtered.getRemoteAddr()).isEqualTo("6.6.6.6");
		assertThat(new ClientAddressResolver("").resolve(filtered).getHostAddress()).isEqualTo("198.51.100.7");
		assertThat(new ClientAddressResolver("198.51.100.7").resolve(filtered).getHostAddress()).isEqualTo("203.0.113.9");
	}

	private static String resolve(ClientAddressResolver resolver, String remoteAddress, String... forwardedFor) {
		return resolver.resolve(remoteAddress, List.of(forwardedFor)).getHostAddress();
	}

}
