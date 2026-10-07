package com.event.snappro.SnapPro.repository;

import com.event.snappro.SnapPro.entity.UserTypeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserTypeRepository extends JpaRepository<UserTypeEntity, Integer> {
    Optional<UserTypeEntity> findByRoleNameIgnoreCase(String roleName);
}
