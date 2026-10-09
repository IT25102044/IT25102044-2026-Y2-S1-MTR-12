package com.event.snappro.SnapPro.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class PhotographerProfileUpdateDTO {

    @NotBlank
    @Size(max = 45)
    private String firstName;

    @NotBlank
    @Size(max = 45)
    private String lastName;

    @NotBlank
    @Size(max = 15)
    private String mobile;

    @NotNull
    @Min(0)
    private Integer experienceYears;

    private String bio;

    public PhotographerProfileUpdateDTO() {
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getMobile() {
        return mobile;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public String getBio() {
        return bio;
    }
}