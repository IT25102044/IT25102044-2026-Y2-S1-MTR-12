package com.event.snappro.SnapPro.repository;

import com.event.snappro.SnapPro.entity.PaymentMethodEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentMethodRepository extends JpaRepository<PaymentMethodEntity, Integer> {
    Optional<PaymentMethodEntity> findByPaymentMethodIgnoreCase(String paymentMethod);
}
