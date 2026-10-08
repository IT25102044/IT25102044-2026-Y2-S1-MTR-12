package com.event.snappro.SnapPro.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "customer_feedback")
public class CustomerFeedbackEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "customer_id", nullable = false)
    private Integer customerId;

    @Column(name = "booking_id", nullable = false, unique = true)
    private Integer bookingId;

    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Column(name = "review_text", nullable = false, columnDefinition = "TEXT")
    private String reviewText;

    @Column(name = "feedback_status_id", nullable = false)
    private Integer feedbackStatusId;

    @Column(name = "cro_response", columnDefinition = "TEXT")
    private String croResponse;

    @Column(name = "escalated_to_manager", nullable = false)
    private Boolean escalatedToManager = false;

    @Column(name = "escalation_remarks", columnDefinition = "TEXT")
    private String escalationRemarks;

    @Column(name = "handled_by")
    private Integer handledBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
