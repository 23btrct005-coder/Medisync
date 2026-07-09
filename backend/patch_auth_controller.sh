sed -i '' -e '/@PostMapping("\/reset-password")/i\
    @PostMapping("/update-password")\
    public ResponseEntity<?> updatePassword(@RequestBody Map<String, String> request, @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {\
        try {\
            String newPassword = request.get("newPassword");\
            if (newPassword == null || newPassword.trim().isEmpty()) {\
                return ResponseEntity.badRequest().body(Map.of("message", "New password cannot be empty."));\
            }\
            User user = userRepository.findByUsernameIgnoreCase(userDetails.getUsername())\
                    .orElseThrow(() -> new RuntimeException("User not found."));\
            user.setPassword(passwordEncoder.encode(newPassword));\
            userRepository.save(user);\
            return ResponseEntity.ok(Map.of("message", "Password updated successfully."));\
        } catch (Exception e) {\
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage()));\
        }\
    }\
\
' /Users/studies/medical/backend/src/main/java/com/health/medisync/controller/AuthController.java
