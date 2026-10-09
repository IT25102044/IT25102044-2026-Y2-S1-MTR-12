package com.event.snappro.SnapPro.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Only album metadata is editable; the original booking stays linked. */
public class CatalogUpdateDTO {

    @NotBlank(message = "Album name is required.")
    @Size(max = 150, message = "Album name must be 150 characters or fewer.")
    private String catalogName;

    private String description;

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