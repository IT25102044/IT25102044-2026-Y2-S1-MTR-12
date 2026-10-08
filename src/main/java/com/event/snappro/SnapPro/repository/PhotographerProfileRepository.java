package com.event.snappro.SnapPro.repository;

import com.event.snappro.SnapPro.entity.PhotographerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PhotographerProfileRepository
        extends JpaRepository<PhotographerProfile, Integer> {

    Optional<PhotographerProfile> findByUser_Id(Integer userId);
}