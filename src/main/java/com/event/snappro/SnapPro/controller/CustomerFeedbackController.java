package com.event.snappro.SnapPro.controller;

import com.event.snappro.SnapPro.entity.CustomerFeedbackEntity;
import com.event.snappro.SnapPro.service.CustomerFeedbackService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cro/feedback")
@CrossOrigin(origins = "*")
public class CustomerFeedbackController {

    private final CustomerFeedbackService customerFeedbackService;

    public CustomerFeedbackController(CustomerFeedbackService customerFeedbackService) {
        this.customerFeedbackService = customerFeedbackService;
    }

    // 1. Get all customer feedback
    @GetMapping
    public ResponseEntity<List<CustomerFeedbackEntity>> getAllFeedback() {
        return ResponseEntity.ok(
                customerFeedbackService.getAllFeedback()
        );
    }

    // 2. Get one feedback record
    @GetMapping("/{id}")
    public ResponseEntity<CustomerFeedbackEntity> getFeedbackById(
            @PathVariable Integer id
    ) {
        return ResponseEntity.ok(
                customerFeedbackService.getFeedbackById(id)
        );
    }

    // 3. Get feedback by status
    @GetMapping("/status/{statusId}")
    public ResponseEntity<List<CustomerFeedbackEntity>> getFeedbackByStatus(
            @PathVariable Integer statusId
    ) {
        return ResponseEntity.ok(
                customerFeedbackService.getFeedbackByStatus(statusId)
        );
    }

    // 4. Get escalated feedback
    @GetMapping("/escalated")
    public ResponseEntity<List<CustomerFeedbackEntity>> getEscalatedFeedback() {
        return ResponseEntity.ok(
                customerFeedbackService.getEscalatedFeedback()
        );
    }

    // 5. Get feedback by customer
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<CustomerFeedbackEntity>> getFeedbackByCustomer(
            @PathVariable Integer customerId
    ) {
        return ResponseEntity.ok(
                customerFeedbackService.getFeedbackByCustomer(customerId)
        );
    }

    // 6. Get feedback by booking
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<CustomerFeedbackEntity>> getFeedbackByBooking(
            @PathVariable Integer bookingId
    ) {
        return ResponseEntity.ok(
                customerFeedbackService.getFeedbackByBooking(bookingId)
        );
    }

    // 7. CRO responds / updates feedback
    @PutMapping("/{id}")
    public ResponseEntity<CustomerFeedbackEntity> updateFeedback(
            @PathVariable Integer id,
            @RequestParam(required = false) String croResponse,
            @RequestParam(required = false) Integer feedbackStatusId,
            @RequestParam(required = false) Integer handledBy
    ) {
        return ResponseEntity.ok(
                customerFeedbackService.updateFeedback(
                        id,
                        croResponse,
                        feedbackStatusId,
                        handledBy
                )
        );
    }

    // 8. Escalate serious complaint
    @PutMapping("/{id}/escalate")
    public ResponseEntity<CustomerFeedbackEntity> escalateFeedback(
            @PathVariable Integer id,
            @RequestParam String escalationRemarks,
            @RequestParam(required = false) Integer handledBy
    ) {
        return ResponseEntity.ok(
                customerFeedbackService.escalateFeedback(
                        id,
                        escalationRemarks,
                        handledBy
                )
        );
    }
}