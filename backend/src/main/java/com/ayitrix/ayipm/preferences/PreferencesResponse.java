package com.ayitrix.ayipm.preferences;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Matches UserPreferences in the frontend's src/types/settings.ts. Also used as the PATCH body, where a null field
 * means "leave unchanged".
 */
public record PreferencesResponse(
		String language,
		String dateFormat,
		String timeFormat,
		String weekStart,
		Map<String, Boolean> notificationCategories) {

	static PreferencesResponse from(Preferences p) {
		Map<String, Boolean> categories = new LinkedHashMap<>();
		for (String category : PreferencesService.CATEGORIES) categories.put(category, p.wants(category));
		return new PreferencesResponse(p.getLanguage(), p.getDateFormat(), p.getTimeFormat(), p.getWeekStart(), categories);
	}

}
