package com.ayitrix.ayipm.employee;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class EmployeeStatusTests {

	@Test
	void fromValueFindsEveryStatusByItsApiName() {
		assertThat(EmployeeStatus.fromValue("active")).contains(EmployeeStatus.ACTIVE);
		assertThat(EmployeeStatus.fromValue("inactive")).contains(EmployeeStatus.INACTIVE);
		for (EmployeeStatus status : EmployeeStatus.values()) {
			assertThat(EmployeeStatus.fromValue(status.value())).contains(status);
		}
	}

	@Test
	void fromValueIsEmptyForUnknownValues() {
		assertThat(EmployeeStatus.fromValue("Active")).isEmpty();
		assertThat(EmployeeStatus.fromValue("deleted")).isEmpty();
		assertThat(EmployeeStatus.fromValue(" active ")).isEmpty();
		assertThat(EmployeeStatus.fromValue("")).isEmpty();
		assertThat(EmployeeStatus.fromValue(null)).isEmpty();
	}

}
