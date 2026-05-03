package com.health.medisync.repository;

import com.health.medisync.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameIgnoreCase(String username);
    List<User> findAllByUsernameIgnoreCase(String username);
    Optional<User> findFirstByUsernameIgnoreCase(String username);
}
