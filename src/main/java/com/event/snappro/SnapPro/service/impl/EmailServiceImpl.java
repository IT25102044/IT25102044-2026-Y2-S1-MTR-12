package com.event.snappro.SnapPro.service.impl;

import com.event.snappro.SnapPro.entity.EventBookingEntity;
import com.event.snappro.SnapPro.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:snappro.events@gmail.com}")
    private String fromEmail;

    @Async
    @Override
    public void sendBookingConfirmationEmail(String toEmail, String customerName, EventBookingEntity booking) {
        if (toEmail == null || toEmail.trim().isEmpty()) {
            log.warn("Cannot send booking confirmation email: Customer email is missing.");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("SnapPro Studio <" + fromEmail + ">");
            helper.setTo(toEmail.trim());

            String bookingRef = "#EVT-" + (booking.getId() != null ? booking.getId() : "PENDING");
            String eventTitle = booking.getEventTitle() != null ? booking.getEventTitle() : "Event Photography";

            helper.setSubject("Booking Request Received - " + bookingRef + " (" + eventTitle + ")");

            String htmlBody = buildBookingConfirmationHtml(customerName, booking);
            helper.setText(htmlBody, true);

            mailSender.send(message);
            log.info("Booking confirmation email successfully dispatched to {} for booking {}", toEmail, bookingRef);

        } catch (Exception e) {
            log.error("Failed to send booking confirmation email to {}: {}. Note: Check SMTP credentials in application.properties if testing live delivery.",
                    toEmail, e.getMessage());
        }
    }

    private String buildBookingConfirmationHtml(String customerName, EventBookingEntity booking) {
        String displayName = (customerName != null && !customerName.trim().isEmpty()) ? customerName.trim() : "Valued Customer";
        String bookingRef = "#EVT-" + (booking.getId() != null ? booking.getId() : "PENDING");
        String eventTitle = booking.getEventTitle() != null ? booking.getEventTitle() : "Event Photography";
        String eventLocation = booking.getEventLocation() != null ? booking.getEventLocation() : "Venue location to be confirmed";

        String dateFormatted = "TBD";
        if (booking.getEventDate() != null) {
            try {
                dateFormatted = booking.getEventDate().format(DateTimeFormatter.ofPattern("dd MMMM yyyy"));
            } catch (Exception e) {
                dateFormatted = booking.getEventDate().toString();
            }
        }

        String startTimeStr = booking.getStartTime() != null ? booking.getStartTime().toString().substring(0, 5) : "";
        String endTimeStr = booking.getEndTime() != null ? booking.getEndTime().toString().substring(0, 5) : "";
        String timeWindow = (!startTimeStr.isEmpty() && !endTimeStr.isEmpty()) ? (startTimeStr + " - " + endTimeStr) : "Time TBD";

        String packageTitle = (booking.getPackageEntity() != null && booking.getPackageEntity().getTitle() != null)
                ? booking.getPackageEntity().getTitle()
                : "Custom Requirement Event";

        String statusStr = (booking.getBookingStatus() != null && booking.getBookingStatus().getBookingStatus() != null)
                ? booking.getBookingStatus().getBookingStatus()
                : "Pending";

        double totalAmount = booking.getTotalAmount() != null ? booking.getTotalAmount() : 0.0;
        double balanceAmount = booking.getBalanceAmount() != null ? booking.getBalanceAmount() : 0.0;
        double overallEstimated = totalAmount + balanceAmount;

        String formattedAdvance = String.format("%,.2f", totalAmount);
        String formattedOverall = String.format("%,.2f", overallEstimated);

        String customNotes = (booking.getCustomRequirements() != null && !booking.getCustomRequirements().trim().isEmpty())
                ? booking.getCustomRequirements().trim()
                : "None specified.";

        String template = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>SnapPro Booking Confirmation</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                  background-color: #f1f5f9;
                  margin: 0;
                  padding: 24px;
                  color: #0f172a;
                }
                .email-card {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  border-radius: 16px;
                  overflow: hidden;
                  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
                  border: 1px solid #e2e8f0;
                }
                .header {
                  background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
                  padding: 32px 28px;
                  color: #ffffff;
                  text-align: center;
                }
                .header h1 {
                  margin: 0 0 6px 0;
                  font-size: 24px;
                  font-weight: 800;
                  letter-spacing: -0.5px;
                }
                .header p {
                  margin: 0;
                  font-size: 13px;
                  opacity: 0.85;
                  letter-spacing: 0.5px;
                  text-transform: uppercase;
                }
                .content {
                  padding: 32px 28px;
                }
                .greeting {
                  font-size: 17px;
                  font-weight: 700;
                  margin-bottom: 12px;
                  color: #1e293b;
                }
                .lead-text {
                  font-size: 14px;
                  line-height: 1.6;
                  color: #475569;
                  margin-bottom: 24px;
                }
                .status-badge {
                  display: inline-block;
                  padding: 6px 14px;
                  border-radius: 20px;
                  font-size: 12px;
                  font-weight: 700;
                  background-color: #fef3c7;
                  color: #92400e;
                  border: 1px solid #fde68a;
                  margin-bottom: 20px;
                }
                .summary-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 24px;
                  border-radius: 10px;
                  overflow: hidden;
                  border: 1px solid #e2e8f0;
                }
                .summary-table tr:nth-child(even) {
                  background-color: #f8fafc;
                }
                .summary-table td {
                  padding: 12px 16px;
                  font-size: 13px;
                  border-bottom: 1px solid #e2e8f0;
                }
                .summary-table td.label {
                  width: 35%;
                  font-weight: 600;
                  color: #64748b;
                }
                .summary-table td.val {
                  font-weight: 600;
                  color: #1e293b;
                }
                .notes-box {
                  background-color: #f8fafc;
                  border: 1px solid #e2e8f0;
                  border-left: 4px solid #2563eb;
                  padding: 14px 16px;
                  border-radius: 8px;
                  font-size: 13px;
                  color: #334155;
                  margin-bottom: 24px;
                }
                .footer {
                  background-color: #f8fafc;
                  padding: 24px;
                  text-align: center;
                  font-size: 12px;
                  color: #64748b;
                  border-top: 1px solid #e2e8f0;
                }
                .footer p {
                  margin: 4px 0;
                }
              </style>
            </head>
            <body>
              <div class="email-card">
                <div class="header">
                  <h1>SnapPro Studio & Events</h1>
                  <p>Event Photography Booking Confirmation</p>
                </div>
                <div class="content">
                  <div class="greeting">Hello {{CUSTOMER_NAME}},</div>
                  <p class="lead-text">
                    Thank you for choosing <strong>SnapPro Studio</strong>! We have received your event photography booking request and our team is reviewing your schedule to assign your lead photographer.
                  </p>

                  <div style="text-align: center;">
                    <span class="status-badge">&#9200; Booking Status: {{BOOKING_STATUS}}</span>
                  </div>

                  <table class="summary-table">
                    <tr>
                      <td class="label">Booking Ref:</td>
                      <td class="val" style="color: #2563eb;">{{BOOKING_REF}}</td>
                    </tr>
                    <tr>
                      <td class="label">Event Title:</td>
                      <td class="val">{{EVENT_TITLE}}</td>
                    </tr>
                    <tr>
                      <td class="label">Event Date:</td>
                      <td class="val">{{EVENT_DATE}}</td>
                    </tr>
                    <tr>
                      <td class="label">Time Window:</td>
                      <td class="val">{{TIME_WINDOW}}</td>
                    </tr>
                    <tr>
                      <td class="label">Venue Location:</td>
                      <td class="val">{{EVENT_LOCATION}}</td>
                    </tr>
                    <tr>
                      <td class="label">Service Package:</td>
                      <td class="val">{{PACKAGE_TITLE}}</td>
                    </tr>
                    <tr>
                      <td class="label">Advance / Base Fee:</td>
                      <td class="val" style="color: #059669;">LKR {{ADVANCE_FEE}}</td>
                    </tr>
                    <tr>
                      <td class="label">Total Estimated Cost:</td>
                      <td class="val">LKR {{TOTAL_FEE}}</td>
                    </tr>
                  </table>

                  <div class="notes-box">
                    <strong>Special Requirements / Shoot Notes:</strong><br />
                    {{CUSTOM_NOTES}}
                  </div>

                  <p class="lead-text" style="font-size: 13px; margin-bottom: 0;">
                    You can track your booking progress anytime by logging into your <a href="http://localhost:8080/customer-dashboard.html" style="color: #2563eb; text-decoration: none; font-weight: 600;">Customer Dashboard</a>.
                  </p>
                </div>
                <div class="footer">
                  <p><strong>SnapPro Event Photography & Studio</strong></p>
                  <p>Need support or adjustments? Contact us at support@snappro.com</p>
                  <p style="color: #94a3b8; font-size: 11px;">This is an automated notification. Please do not reply directly to this email.</p>
                </div>
              </div>
            </body>
            </html>
            """;

        return template
                .replace("{{CUSTOMER_NAME}}", displayName)
                .replace("{{BOOKING_STATUS}}", statusStr)
                .replace("{{BOOKING_REF}}", bookingRef)
                .replace("{{EVENT_TITLE}}", eventTitle)
                .replace("{{EVENT_DATE}}", dateFormatted)
                .replace("{{TIME_WINDOW}}", timeWindow)
                .replace("{{EVENT_LOCATION}}", eventLocation)
                .replace("{{PACKAGE_TITLE}}", packageTitle)
                .replace("{{ADVANCE_FEE}}", formattedAdvance)
                .replace("{{TOTAL_FEE}}", formattedOverall)
                .replace("{{CUSTOM_NOTES}}", customNotes);
    }
}

