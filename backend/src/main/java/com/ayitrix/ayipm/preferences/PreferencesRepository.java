package com.ayitrix.ayipm.preferences;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface PreferencesRepository extends JpaRepository<Preferences, UUID> {
}
