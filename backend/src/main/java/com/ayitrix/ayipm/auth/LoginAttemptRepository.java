package com.ayitrix.ayipm.auth;

import org.springframework.data.jpa.repository.JpaRepository;

interface LoginAttemptRepository extends JpaRepository<LoginAttempt, String> {
}
