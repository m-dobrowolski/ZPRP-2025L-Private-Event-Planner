.PHONY: up down test build clean

# Running

up:
	@echo "Starting services..."
	docker-compose up -d reverse-proxy backend worker frontend

down:
	@echo "Stopping services..."
	docker-compose stop reverse-proxy backend worker frontend

# Testing

test: build test-setup run-test-runner test-teardown

build:
	@echo "Building Docker images..."
	docker-compose build

test-setup:
	@echo "Setting up test environment (starting test worker)..."
	docker-compose up -d rabbitmq test_worker

run-test-runner:
	@echo "Running tests in test_runner container..."
	docker-compose run --rm test_runner

test-teardown:
	@echo "Tearing down test environment (stopping test worker)..."
	docker-compose stop test_worker

# Utility

clean: down test-teardown
	@echo "Cleaning up..."
