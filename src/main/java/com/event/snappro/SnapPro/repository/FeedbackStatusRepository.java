package com.event.snappro.SnapPro.repository;

import com.event.snappro.SnapPro.entity.FeedbackStatusEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FeedbackStatusRepository extends JpaRepository<FeedbackStatusEntity, Integer> {

    Optional<FeedbackStatusEntity> findByStatus(String status);
}
