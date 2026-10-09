package com.event.snappro.SnapPro.repository;

import com.event.snappro.SnapPro.entity.PackageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PackageRepository extends JpaRepository<PackageEntity, Integer> {
    List<PackageEntity> findByPackageStatus_StatusIgnoreCase(String status);
}
