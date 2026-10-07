package com.event.snappro.SnapPro.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserDTO {
    private String firstName;
    private String lastName;
    private String email;
    private String mobile;
    private String role;
    private Integer roleId;
    private String status;
    private Integer statusId;
    private String password;
}
