package com.event.snappro.SnapPro.dto;

public class PhotographerProfileResponseDTO {

    private String firstName;
    private String lastName;
    private String mobile;
    private String email;
    private Integer experienceYears;
    private String bio;

    public PhotographerProfileResponseDTO() {
    }

    public PhotographerProfileResponseDTO(
            String firstName,
            String lastName,
            String mobile,
            String email,
            Integer experienceYears,
            String bio) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.mobile = mobile;
        this.email = email;
        this.experienceYears = experienceYears;
        this.bio = bio;
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

    public String getEmail() {
        return email;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public String getBio() {
        return bio;
    }
}