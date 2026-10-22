package com.ayitrix.ayipm.mail;

import java.util.List;

import org.springframework.web.util.HtmlUtils;

/**
 * A formatted email with company branding, sent as plain text with an HTML alternative.
 * Build it with {@link #builder}, which escapes every value in the HTML version.
 */
public record Email(String to, String subject, String text, String html) {

	public static Builder builder(String to, String subject) {
		return new Builder(to, subject);
	}

	public record DetailRow(String label, String value) {}

	public record TaskItem(String title, String priority, String status, String dueDate) {}

	public static final class Builder {

		private static final String PARAGRAPH = "margin:0 0 16px;line-height:1.6;";
		private static final String SMALL_PRINT = "margin:0 0 12px;font-size:13px;color:#52525b;line-height:1.5;";
		private static final String BUTTON = "display:inline-block;padding:12px 24px;border-radius:6px;background:#18181b;"
				+ "color:#ffffff;font-weight:600;text-decoration:none;font-size:14px;";

		private final String to;
		private final String subject;
		private final StringBuilder text = new StringBuilder();
		private final StringBuilder html = new StringBuilder();
		private boolean withHeadline = true;

		private Builder(String to, String subject) {
			this.to = to;
			// A header must stay on one line, whatever the names in it contain.
			this.subject = subject.replaceAll("\\s+", " ").strip();
		}

		public Builder headline(boolean show) {
			this.withHeadline = show;
			return this;
		}

		public Builder heading(String title) {
			text.append(title.toUpperCase()).append("\n").append("=".repeat(Math.max(4, title.length()))).append("\n\n");
			html.append("<h2 style=\"margin:0 0 16px;font-size:20px;font-weight:700;color:#18181b;letter-spacing:-0.02em;\">")
					.append(escape(title)).append("</h2>\n");
			return this;
		}

		public Builder paragraph(String content) {
			text.append(content).append("\n\n");
			html.append("<p style=\"").append(PARAGRAPH).append("\">").append(escape(content)).append("</p>\n");
			return this;
		}

		public Builder detailsCard(String title, List<DetailRow> rows) {
			if (rows == null || rows.isEmpty()) return this;
			if (title != null && !title.isBlank()) {
				text.append(title.toUpperCase()).append(":\n");
			}
			html.append("<div style=\"margin:20px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;\">\n");
			if (title != null && !title.isBlank()) {
				html.append("<div style=\"font-weight:700;font-size:14px;color:#0f172a;margin-bottom:12px;border-bottom:1px solid #e2e8f0;padding-bottom:8px;\">")
						.append(escape(title)).append("</div>\n");
			}
			html.append("<table style=\"width:100%;border-collapse:collapse;font-size:14px;\">\n<tbody>\n");
			for (DetailRow row : rows) {
				text.append("• ").append(row.label()).append(": ").append(row.value()).append("\n");
				html.append("<tr>\n")
						.append("<td style=\"padding:6px 0;color:#64748b;font-weight:600;width:130px;vertical-align:top;\">")
						.append(escape(row.label())).append("</td>\n")
						.append("<td style=\"padding:6px 0;color:#0f172a;vertical-align:top;\">")
						.append(escape(row.value())).append("</td>\n")
						.append("</tr>\n");
			}
			text.append("\n");
			html.append("</tbody>\n</table>\n</div>\n");
			return this;
		}

		public Builder taskSection(List<TaskItem> tasks) {
			if (tasks == null || tasks.isEmpty()) return this;
			text.append("ASSIGNED TASKS (").append(tasks.size()).append("):\n");
			html.append("<div style=\"margin:20px 0;\">\n")
					.append("<div style=\"font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin-bottom:10px;\">")
					.append("Assigned Tasks (").append(tasks.size()).append(")</div>\n");
			for (TaskItem task : tasks) {
				text.append("- ").append(task.title())
						.append(" [").append(task.priority()).append(" priority")
						.append(task.dueDate() != null ? ", Due: " + task.dueDate() : "")
						.append("]\n");

				String priorityColor = priorityBadge(task.priority());
				html.append("<div style=\"background:#ffffff;border:1px solid #e2e8f0;border-radius:6px;padding:12px 14px;margin-bottom:8px;\">\n")
						.append("<div style=\"font-weight:600;color:#0f172a;font-size:14px;\">").append(escape(task.title())).append("</div>\n")
						.append("<div style=\"margin-top:6px;font-size:12px;color:#64748b;\">\n")
						.append("<span style=\"display:inline-block;padding:2px 8px;border-radius:9999px;font-weight:600;font-size:11px;")
						.append(priorityColor).append("\">").append(escape(task.priority())).append("</span>\n");
				if (task.status() != null && !task.status().isBlank()) {
					html.append("&nbsp;·&nbsp;<span>").append(escape(task.status())).append("</span>\n");
				}
				if (task.dueDate() != null && !task.dueDate().isBlank()) {
					html.append("&nbsp;·&nbsp;<span>Due: ").append(escape(task.dueDate())).append("</span>\n");
				}
				html.append("</div>\n</div>\n");
			}
			text.append("\n");
			html.append("</div>\n");
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
			StringBuilder bannerHtml = new StringBuilder();
			if (withHeadline) {
				bannerHtml.append("<div style=\"background-color:#050814;text-align:center;padding:0;line-height:0;border-top-left-radius:8px;border-top-right-radius:8px;overflow:hidden;\">\n")
						.append("<img src=\"cid:company-headline\" alt=\"AYITRIX\" style=\"width:100%;max-width:540px;height:auto;display:block;margin:0 auto;border:0;\" />\n")
						.append("</div>\n");
			}

			String page = "<!DOCTYPE html>\n<html lang=\"en\">\n<head><meta charset=\"utf-8\">"
					+ "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>" + escape(subject) + "</title></head>\n"
					+ "<body style=\"margin:0;padding:24px 12px;background:#f4f4f5;\">\n"
					+ "<div style=\"max-width:540px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04);"
					+ "font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#18181b;\">\n"
					+ bannerHtml
					+ "<div style=\"padding:28px 32px;\">\n"
					+ html
					+ "</div>\n"
					+ "<div style=\"padding:16px 32px;background:#fafafa;border-top:1px solid #f4f4f5;font-size:12px;color:#71717a;text-align:center;\">\n"
					+ "Sent by AyiPM · © 2026 AYITRIX\n"
					+ "</div>\n"
					+ "</div>\n</body>\n</html>\n";
			return new Email(to, subject, text.toString().strip() + "\n", page);
		}

		private static String priorityBadge(String priority) {
			if (priority == null) return "background:#f1f5f9;color:#475569;border:1px solid #cbd5e1;";
			return switch (priority.toLowerCase()) {
				case "urgent" -> "background:#fef2f2;color:#991b1b;border:1px solid #fecaca;";
				case "high" -> "background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;";
				case "medium" -> "background:#fefce8;color:#a16207;border:1px solid #fef08a;";
				default -> "background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;";
			};
		}

		private static String escape(String value) {
			return HtmlUtils.htmlEscape(value);
		}

	}

}
