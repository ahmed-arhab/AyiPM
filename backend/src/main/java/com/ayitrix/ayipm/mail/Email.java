package com.ayitrix.ayipm.mail;

import org.springframework.web.util.HtmlUtils;

/**
 * A short email, sent as plain text with an HTML alternative. Build it with {@link #builder}, which escapes every
 * value in the HTML version, so names can be passed in as they are.
 */
public record Email(String to, String subject, String text, String html) {

	public static Builder builder(String to, String subject) {
		return new Builder(to, subject);
	}

	public static final class Builder {

		private static final String PARAGRAPH = "margin:0 0 16px;";
		private static final String SMALL_PRINT = "margin:0 0 12px;font-size:13px;color:#52525b;";
		private static final String BUTTON = "display:inline-block;padding:10px 20px;border-radius:6px;background:#18181b;"
				+ "color:#ffffff;font-weight:600;text-decoration:none;";

		private final String to;
		private final String subject;
		private final StringBuilder text = new StringBuilder();
		private final StringBuilder html = new StringBuilder();

		private Builder(String to, String subject) {
			this.to = to;
			// A header must stay on one line, whatever the names in it contain.
			this.subject = subject.replaceAll("\\s+", " ").strip();
		}

		public Builder paragraph(String content) {
			text.append(content).append("\n\n");
			html.append("<p style=\"").append(PARAGRAPH).append("\">").append(escape(content)).append("</p>\n");
			return this;
		}

		/** A button in the HTML version, with the link spelled out for clients that hide it; the link in the text version. */
		public Builder button(String label, String url) {
			text.append(label).append(":\n").append(url).append("\n\n");
			html.append("<p style=\"margin:24px 0;\"><a href=\"").append(escape(url)).append("\" style=\"").append(BUTTON).append("\">")
					.append(escape(label)).append("</a></p>\n")
					.append("<p style=\"").append(SMALL_PRINT).append("\">If the button doesn't work, open this link:<br>")
					.append("<a href=\"").append(escape(url)).append("\" style=\"color:#18181b;word-break:break-all;\">").append(escape(url))
					.append("</a></p>\n");
			return this;
		}

		public Builder smallPrint(String content) {
			text.append(content).append("\n\n");
			html.append("<p style=\"").append(SMALL_PRINT).append("\">").append(escape(content)).append("</p>\n");
			return this;
		}

		public Email build() {
			String page = "<!DOCTYPE html>\n<html lang=\"en\">\n<head><meta charset=\"utf-8\">"
					+ "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>" + escape(subject) + "</title></head>\n"
					+ "<body style=\"margin:0;padding:24px 12px;background:#f4f4f5;\">\n"
					+ "<div style=\"max-width:520px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #e4e4e7;border-radius:8px;"
					+ "font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#18181b;\">\n"
					+ html
					+ "</div>\n</body>\n</html>\n";
			return new Email(to, subject, text.toString().strip() + "\n", page);
		}

		private static String escape(String value) {
			return HtmlUtils.htmlEscape(value);
		}

	}

}
