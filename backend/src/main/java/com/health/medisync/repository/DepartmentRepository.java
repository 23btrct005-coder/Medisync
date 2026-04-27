package com.health.medisync.repository;

import com.health.medisync.model.Department;
import com.health.medisync.model.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    List<Department> findByHospital(Hospital hospital);
}
