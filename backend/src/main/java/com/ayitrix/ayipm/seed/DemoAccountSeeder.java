package com.ayitrix.ayipm.seed;

import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.ayitrix.ayipm.auth.PasswordHasher;
import com.ayitrix.ayipm.employee.Role;
import com.ayitrix.ayipm.employee.User;
import com.ayitrix.ayipm.employee.UserRepository;
import com.ayitrix.ayipm.workspace.Workspace;
import com.ayitrix.ayipm.workspace.WorkspaceRepository;

/**
 * Creates one demo account per role for local development. Runs only with the "demo" profile, only on an empty
 * database, and never together with the "prod" profile.
 */
@Component
@Profile("demo")
public class DemoAccountSeeder implements ApplicationRunner {

	public static final String PASSWORD = "ChangeMe@123";

	private static final Logger log = LoggerFactory.getLogger(DemoAccountSeeder.class);

	private record Account(String employeeId, String email, String name, Role role, String department, String designation) {
	}

	private static final List<Account> ACCOUNTS = List.of(
			new Account("AX001", "admin@example.com", "Demo Admin", Role.ADMIN, "Management", "Workspace Owner"),
			new Account("AX002", "pm@example.com", "Demo Project Manager", Role.PROJECT_MANAGER, "Product", "Project Manager"),
			new Account("AX003", "employee@example.com", "Demo Employee", Role.EMPLOYEE, "Engineering", "Software Engineer"));

	private final UserRepository users;
	private final WorkspaceRepository workspaces;
	private final PasswordHasher hasher;
	private final Environment environment;

	public DemoAccountSeeder(UserRepository users, WorkspaceRepository workspaces, PasswordHasher hasher, Environment environment) {
		this.users = users;
		this.workspaces = workspaces;
		this.hasher = hasher;
		this.environment = environment;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		if (environment.matchesProfiles("prod")) {
			throw new IllegalStateException("Refusing to create demo accounts with a known password in production.");
		}
		if (users.count() > 0) {
			log.info("The database already has accounts, so no demo accounts were created.");
			return;
		}

		if (!workspaces.existsById(Workspace.DEFAULT_ID)) workspaces.save(new Workspace("Demo Workspace"));
		String passwordHash = hasher.hash(PASSWORD);
		for (Account account : ACCOUNTS) {
			User user = new User();
			user.setEmployeeId(account.employeeId());
			user.setEmail(account.email());
			user.setName(account.name());
			user.setRole(account.role());
			user.setDepartment(account.department());
			user.setDesignation(account.designation());
			user.setJoinDate(LocalDate.now());
			user.setPasswordHash(passwordHash);
			users.save(user);
		}
		log.info("Created {} demo accounts (admin@example.com, pm@example.com, employee@example.com). Password: {}", ACCOUNTS.size(), PASSWORD);
	}

}
