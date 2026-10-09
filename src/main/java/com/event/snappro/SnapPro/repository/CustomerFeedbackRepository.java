package com.event.snappro.SnapPro.repository;

import com.event.snappro.SnapPro.entity.CustomerFeedbackEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerFeedbackRepository
        extends JpaRepository<CustomerFeedbackEntity, Integer> {

    List<CustomerFeedbackEntity> findAllByOrderByCreatedAtDesc();

    List<CustomerFeedbackEntity> findByFeedbackStatusIdOrderByCreatedAtDesc(
            Integer feedbackStatusId
    );

    List<CustomerFeedbackEntity> findByEscalatedToManagerTrueOrderByCreatedAtDesc();

    List<CustomerFeedbackEntity> findByCustomerIdOrderByCreatedAtDesc(
            Integer customerId
    );

    List<CustomerFeedbackEntity> findByBookingId(Integer bookingId);
}