package com.event.snappro.SnapPro.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CatalogRequestDTO {

    @NotNull(message = "Booking ID is required.")
    private Integer bookingId;

    @NotBlank(message = "Catalog name is required.")
    private String catalogName;

    private String description;

    public CatalogRequestDTO() {
    }

    public Integer getBookingId() {
        return bookingId;
    }

    public void setBookingId(Integer bookingId) {
        this.bookingId = bookingId;
    }

    public String getCatalogName() {
        return catalogName;
    }

    public void setCatalogName(String catalogName) {
        this.catalogName = catalogName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

}
