package com.ayitrix.ayipm.preferences;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Consumer;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ayitrix.ayipm.common.ApiException;

/** Keep the allowed values in sync with src/types/settings.ts and LANGUAGES in src/constants/defaults.ts. */
@Service
public class PreferencesService {

	static final String DEFAULT_LANGUAGE = "English (US)";
	static final List<String> CATEGORIES = List.of("task", "project", "leave", "attendance", "system");
	private static final List<String> LANGUAGES = List.of("English (US)", "English (UK)", "Sinhala", "Tamil");
	private static final List<String> DATE_FORMATS = List.of("YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY");
	private static final List<String> TIME_FORMATS = List.of("12h", "24h");
	private static final List<String> WEEK_STARTS = List.of("Monday", "Sunday");

	private final PreferencesRepository preferences;

	public PreferencesService(PreferencesRepository preferences) {
		this.preferences = preferences;
	}

	@Transactional(readOnly = true)
	public PreferencesResponse get(UUID userId) {
		return PreferencesResponse.from(load(userId));
	}

	/** Whether this person wants notifications in this category. */
	@Transactional(readOnly = true)
	public boolean wants(UUID userId, String category) {
		return load(userId).wants(category);
	}

	@Transactional
	public PreferencesResponse update(UUID userId, PreferencesResponse update) {
		Preferences p = preferences.findById(userId).orElseGet(() -> new Preferences(userId));
		set(update.language(), LANGUAGES, "Choose a supported language.", p::setLanguage);
		set(update.dateFormat(), DATE_FORMATS, "Choose a valid date format.", p::setDateFormat);
		set(update.timeFormat(), TIME_FORMATS, "Choose a valid time format.", p::setTimeFormat);
		set(update.weekStart(), WEEK_STARTS, "Choose Monday or Sunday.", p::setWeekStart);
		Map<String, Boolean> categories = update.notificationCategories();
		if (categories != null) {
			categories.forEach((category, value) -> {
				if (!CATEGORIES.contains(category)) throw ApiException.badRequest("Unknown notification category: " + category + ".");
				if (value != null) p.setWants(category, value);
			});
		}
		return PreferencesResponse.from(preferences.save(p));
	}

	@Transactional
	public PreferencesResponse reset(UUID userId) {
		preferences.deleteById(userId);
		return PreferencesResponse.from(Preferences.defaults());
	}

	private Preferences load(UUID userId) {
		return preferences.findById(userId).orElseGet(Preferences::defaults);
	}

	private static void set(String value, List<String> allowed, String message, Consumer<String> setter) {
		if (value == null) return;
		if (!allowed.contains(value)) throw ApiException.badRequest(message);
		setter.accept(value);
	}

}
