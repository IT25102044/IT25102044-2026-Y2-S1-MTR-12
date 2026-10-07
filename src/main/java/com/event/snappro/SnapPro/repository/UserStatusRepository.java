package com.event.snappro.SnapPro.repository;

import com.event.snappro.SnapPro.entity.UserStatusEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserStatusRepository extends JpaRepository<UserStatusEntity, Integer> {
    Optional<UserStatusEntity> findByUserStatusIgnoreCase(String userStatus);
}
