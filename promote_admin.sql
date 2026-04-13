-- Promote a user to ROLE_ADMIN
-- Replace 'admin@medisync.com' with the email of the user you want to become admin.
-- Note: The user must already be registered as either a Patient or Doctor first.

UPDATE users 
SET role = 'ROLE_ADMIN', enabled = true 
WHERE username = 'admin@medisync.com';

-- Verify the change
SELECT id, username, role, enabled FROM users WHERE username = 'admin@medisync.com';
