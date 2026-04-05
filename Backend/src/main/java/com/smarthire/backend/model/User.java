package com.smarthire.backend.model;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String firstName;
    private String lastName;

    @Indexed(unique = true)
    private String email;

    private String password;

    private String role; // CANDIDATE or RECRUITER

    private String companyName; // only for RECRUITER
    private String phone;
    private String location;
    private String headline;
    private String bio;
    private String avatarImageData;
    private List<String> skills;
    private Integer experienceYears;

    private boolean enabled = true;
}
// ```

// ---

// **What this code means — super simple:**
// ```
// @Document        → this class maps to "users" collection in MongoDB
// @Id              → this is the unique ID for each user
// @Indexed(unique) → no two users can have same email
// @Data            → Lombok auto-creates getters, setters
// role             → either "CANDIDATE" or "RECRUITER"
