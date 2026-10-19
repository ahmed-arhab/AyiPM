package com.ayitrix.ayipm.employee;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ayitrix.ayipm.auth.SessionService;
import com.ayitrix.ayipm.common.ApiException;
import com.ayitrix.ayipm.common.Text;
import com.ayitrix.ayipm.workspace.WorkspaceService;

@Service
public class EmployeeService {

	private static final List<String> SELF_EDITABLE = List.of("name", "email", "phone", "location", "bio", "avatar");
	private static final List<String> ADMIN_ONLY_EDITABLE = List.of("employeeId", "department", "designation", "joinDate");
	private static final Set<String> REQUIRED = Set.of("name", "email", "employeeId", "department", "designation", "joinDate");
	private static final int MAX_AVATAR_LENGTH = 400_000;
	private static final Pattern LEADING_DIGITS = Pattern.compile("^\\d+");

	private final UserRepository users;
	private final WorkspaceService workspace;
	private final SessionService sessions;

	public EmployeeService(UserRepository users, WorkspaceService workspace, SessionService sessions) {
		this.users = users;
		this.workspace = workspace;
		this.sessions = sessions;
	}

	@Transactional(readOnly = true)
	public List<User> listAll() {
		return users.findAllByOrderByCreatedAtAsc();
	}

	@Transactional(readOnly = true)
	public User get(String id) {
		return findById(id).orElseThrow(() -> ApiException.notFound("Employee not found."));
	}

	@Transactional
	public User create(CreateEmployeeRequest input) {
		String name = Text.trimToNull(input.name());
		String designation = Text.trimToNull(input.designation());
		String email = Text.normalizeEmail(input.email());
		String requestedId = Text.trimToNull(input.employeeId());
		if (requestedId != null) requestedId = requestedId.toUpperCase();
		if (name == null) throw ApiException.badRequest("Full name is required.");
		if (designation == null) throw ApiException.badRequest("Designation is required.");
		if (Text.trimToNull(input.department()) == null) throw ApiException.badRequest("Department is required.");
		Role role = parseRole(input.role());
		assertUniqueIdentity(email, requestedId, null);

		User user = new User();
		user.setName(name);
		user.setEmail(email);
		user.setEmployeeId(requestedId != null ? requestedId : nextEmployeeId());
		user.setDepartment(input.department().trim());
		user.setDesignation(designation);
		user.setRole(role);
		user.setJoinDate(input.joinDate() == null || input.joinDate().isBlank() ? LocalDate.now() : parseDate(input.joinDate()));
		user.setPhone(Text.trimToNull(input.phone()));
		user.setLocation(Text.trimToNull(input.location()));
		return users.saveAndFlush(user);
	}

	/** Applies the fields present in {@code update}. Admins can edit more fields, and anyone's profile. */
	@Transactional
	public User updateProfile(User actor, String id, Map<String, Object> update) {
		boolean isAdmin = actor.getRole() == Role.ADMIN;
		if (!isAdmin && !actor.getId().toString().equals(id)) throw new ApiException(HttpStatus.FORBIDDEN, "You can only edit your own profile.");
		User target = get(id);

		// Validate everything before touching the entity, so a failed request changes nothing.
		Map<String, String> changes = new LinkedHashMap<>();
		for (String key : editableFields(isAdmin)) {
			if (!update.containsKey(key)) continue;
			String value = stringValue(key, update.get(key));
			if (value == null && REQUIRED.contains(key)) throw ApiException.badRequest(requiredMessage(key));
			if (key.equals("email")) value = value.toLowerCase();
			if (key.equals("employeeId")) value = value.toUpperCase();
			if (key.equals("avatar") && value != null && value.length() > MAX_AVATAR_LENGTH) {
				throw new ApiException(HttpStatus.CONTENT_TOO_LARGE, "Profile photo is too large.");
			}
			changes.put(key, value);
		}
		LocalDate joinDate = changes.containsKey("joinDate") ? parseDate(changes.get("joinDate")) : target.getJoinDate();
		if (changes.containsKey("email") || changes.containsKey("employeeId")) {
			assertUniqueIdentity(
					changes.getOrDefault("email", target.getEmail()),
					changes.getOrDefault("employeeId", target.getEmployeeId()),
					target.getId());
		}

		changes.forEach((key, value) -> {
			switch (key) {
				case "name" -> target.setName(value);
				case "email" -> target.setEmail(value);
				case "employeeId" -> target.setEmployeeId(value);
				case "department" -> target.setDepartment(value);
				case "designation" -> target.setDesignation(value);
				case "joinDate" -> target.setJoinDate(joinDate);
				case "phone" -> target.setPhone(value);
				case "location" -> target.setLocation(value);
				case "bio" -> target.setBio(value);
				case "avatar" -> target.setAvatar(value);
				default -> throw new IllegalStateException("Unhandled field " + key);
			}
		});
		return users.saveAndFlush(target);
	}

	@Transactional
	public User changeRole(User actor, String id, String roleValue) {
		Role role = parseRole(roleValue);
		User target = get(id);
		if (target.getRole() == role) return target;
		if (target.getRole() == Role.ADMIN && countOtherActiveAdmins(target.getId()) == 0) {
			throw ApiException.badRequest("The workspace needs at least one active admin.");
		}
		if (actor.getId().equals(target.getId())) throw ApiException.badRequest("You cannot change your own role.");
		target.setRole(role);
		return users.saveAndFlush(target);
	}

	@Transactional
	public User changeStatus(User actor, String id, String statusValue) {
		EmployeeStatus status = EmployeeStatus.fromValue(statusValue).orElseThrow(() -> ApiException.badRequest("Choose a valid status."));
		if (actor.getId().toString().equals(id)) throw ApiException.badRequest("You cannot change your own account status.");
		User target = get(id);
		if (target.getStatus() == status) return target;
		if (status == EmployeeStatus.INACTIVE && target.getRole() == Role.ADMIN && countOtherActiveAdmins(target.getId()) == 0) {
			throw ApiException.badRequest("The workspace needs at least one active admin.");
		}
		target.setStatus(status);
		User updated = users.saveAndFlush(target);
		if (status == EmployeeStatus.INACTIVE) sessions.revokeAll(target.getId());
		return updated;
	}

	public String nextEmployeeId() {
		String prefix = workspace.getEmployeeIdPrefix();
		int max = 0;
		for (User user : users.findAllByEmployeeIdStartingWith(prefix)) {
			Matcher digits = LEADING_DIGITS.matcher(user.getEmployeeId().substring(prefix.length()));
			if (digits.find()) max = Math.max(max, Integer.parseInt(digits.group()));
		}
		return prefix + String.format("%03d", max + 1);
	}

	public static Role parseRole(String value) {
		return Role.fromValue(value).orElseThrow(() -> ApiException.badRequest("Choose a valid role."));
	}

	private Optional<User> findById(String id) {
		try {
			return users.findById(UUID.fromString(id));
		} catch (IllegalArgumentException e) {
			return Optional.empty();
		}
	}

	private long countOtherActiveAdmins(UUID excludedId) {
		return users.countByRoleAndStatusAndIdNot(Role.ADMIN, EmployeeStatus.ACTIVE, excludedId);
	}

	private void assertUniqueIdentity(String email, String employeeId, UUID excludedId) {
		if (!Text.isValidEmail(email)) throw ApiException.badRequest("Enter a valid email address.");
		Optional<User> conflict = users.findAllByEmailOrEmployeeId(email, employeeId).stream()
				.filter(u -> !u.getId().equals(excludedId))
				.findFirst();
		if (conflict.isEmpty()) return;
		if (conflict.get().getEmail().equals(email)) throw ApiException.conflict("An account with this email address already exists.");
		throw ApiException.conflict("Employee ID \"" + employeeId + "\" is already in use.");
	}

	private static List<String> editableFields(boolean isAdmin) {
		if (!isAdmin) return SELF_EDITABLE;
		return Stream.concat(SELF_EDITABLE.stream(), ADMIN_ONLY_EDITABLE.stream()).toList();
	}

	private static String stringValue(String key, Object raw) {
		if (raw == null) return null;
		if (!(raw instanceof String s)) throw ApiException.badRequest("Invalid value for " + key + ".");
		return Text.trimToNull(s);
	}

	private static LocalDate parseDate(String value) {
		try {
			return LocalDate.parse(value.trim());
		} catch (DateTimeParseException e) {
			throw ApiException.badRequest("Join date must be a date like 2026-01-31.");
		}
	}

	private static String requiredMessage(String key) {
		return switch (key) {
			case "name" -> "Name is required.";
			case "email" -> "Enter a valid email address.";
			case "employeeId" -> "Employee ID is required.";
			case "department" -> "Department is required.";
			case "designation" -> "Designation is required.";
			default -> "Join date is required.";
		};
	}

}
