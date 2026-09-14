package com.shopstock.controller;

import com.shopstock.dto.request.CreateUserRequest;
import com.shopstock.dto.request.SelfUpdateRequest;
import com.shopstock.dto.request.UpdateUserRequest;
import com.shopstock.dto.response.UserResponse;
import com.shopstock.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAll(@RequestParam UUID actorUserId) {
        return ResponseEntity.ok(userService.findAll(actorUserId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(@Valid @RequestBody CreateUserRequest request) {
        return userService.create(request);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> update(@PathVariable UUID id, @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.update(id, request));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateSelf(@Valid @RequestBody SelfUpdateRequest request) {
        return ResponseEntity.ok(userService.updateSelf(request));
    }
}
