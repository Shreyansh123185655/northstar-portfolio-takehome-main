-- Passwords are 'Password123!'
INSERT INTO tenants (id, name) VALUES (1, 'Alpha Capital') ON CONFLICT DO NOTHING;
INSERT INTO tenants (id, name) VALUES (2, 'Beacon Advisors') ON CONFLICT DO NOTHING;

INSERT INTO users (tenant_id, email, password_hash) VALUES
(1, 'tenant_a@example.com', '$2b$10$dU/NVdXnTsnG1W/gyrW9ze3NKUKqGzVt2EVmQTgrEo.8.b6IV64YK')
ON CONFLICT DO NOTHING;

INSERT INTO users (tenant_id, email, password_hash) VALUES
(2, 'tenant_b@example.com', '$2b$10$dU/NVdXnTsnG1W/gyrW9ze3NKUKqGzVt2EVmQTgrEo.8.b6IV64YK')
ON CONFLICT DO NOTHING;
