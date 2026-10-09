package com.event.snappro.SnapPro.service;

import com.event.snappro.SnapPro.entity.CustomerFeedbackEntity;

import java.util.List;

public interface CustomerFeedbackService {

    List<CustomerFeedbackEntity> getAllFeedback();

    CustomerFeedbackEntity getFeedbackById(Integer id);

    CustomerFeedbackEntity updateFeedback(
            Integer id,
            String croResponse,
            Integer feedbackStatusId,
            Integer handledBy
    );

    CustomerFeedbackEntity escalateFeedback(
            Integer id,
            String escalationRemarks,
            Integer handledBy
    );

    List<CustomerFeedbackEntity> getFeedbackByStatus(Integer feedbackStatusId);

    List<CustomerFeedbackEntity> getEscalatedFeedback();

    List<CustomerFeedbackEntity> getFeedbackByCustomer(Integer customerId);

    List<CustomerFeedbackEntity> getFeedbackByBooking(Integer bookingId);
}