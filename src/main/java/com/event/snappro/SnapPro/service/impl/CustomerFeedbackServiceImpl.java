package com.event.snappro.SnapPro.service.impl;

import com.event.snappro.SnapPro.entity.CustomerFeedbackEntity;
import com.event.snappro.SnapPro.repository.CustomerFeedbackRepository;
import com.event.snappro.SnapPro.repository.FeedbackStatusRepository;
import com.event.snappro.SnapPro.service.CustomerFeedbackService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomerFeedbackServiceImpl implements CustomerFeedbackService {

    private final CustomerFeedbackRepository customerFeedbackRepository;
    private final FeedbackStatusRepository feedbackStatusRepository;

    public CustomerFeedbackServiceImpl(
            CustomerFeedbackRepository customerFeedbackRepository,
            FeedbackStatusRepository feedbackStatusRepository
    ) {
        this.customerFeedbackRepository = customerFeedbackRepository;
        this.feedbackStatusRepository = feedbackStatusRepository;
    }

    @Override
    public List<CustomerFeedbackEntity> getAllFeedback() {
        return customerFeedbackRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public CustomerFeedbackEntity getFeedbackById(Integer id) {
        return customerFeedbackRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Feedback not found with ID: " + id));
    }

    @Override
    public CustomerFeedbackEntity updateFeedback(
            Integer id,
            String croResponse,
            Integer feedbackStatusId,
            Integer handledBy
    ) {
        CustomerFeedbackEntity feedback = getFeedbackById(id);

        if (croResponse != null) {
            feedback.setCroResponse(croResponse);
        }

        if (feedbackStatusId != null) {
            feedbackStatusRepository.findById(feedbackStatusId)
                    .orElseThrow(() ->
                            new RuntimeException("Feedback status not found with ID: " + feedbackStatusId)
                    );

            feedback.setFeedbackStatusId(feedbackStatusId);
        }

        if (handledBy != null) {
            feedback.setHandledBy(handledBy);
        }

        return customerFeedbackRepository.save(feedback);
    }

    @Override
    public CustomerFeedbackEntity escalateFeedback(
            Integer id,
            String escalationRemarks,
            Integer handledBy
    ) {
        CustomerFeedbackEntity feedback = getFeedbackById(id);

        feedback.setEscalatedToManager(true);
        feedback.setEscalationRemarks(escalationRemarks);

        if (handledBy != null) {
            feedback.setHandledBy(handledBy);
        }

        return customerFeedbackRepository.save(feedback);
    }

    @Override
    public List<CustomerFeedbackEntity> getFeedbackByStatus(Integer feedbackStatusId) {
        return customerFeedbackRepository
                .findByFeedbackStatusIdOrderByCreatedAtDesc(feedbackStatusId);
    }

    @Override
    public List<CustomerFeedbackEntity> getEscalatedFeedback() {
        return customerFeedbackRepository
                .findByEscalatedToManagerTrueOrderByCreatedAtDesc();
    }

    @Override
    public List<CustomerFeedbackEntity> getFeedbackByCustomer(Integer customerId) {
        return customerFeedbackRepository
                .findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    @Override
    public List<CustomerFeedbackEntity> getFeedbackByBooking(Integer bookingId) {
        return customerFeedbackRepository.findByBookingId(bookingId);
    }
}
