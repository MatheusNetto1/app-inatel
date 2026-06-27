SHELL := /bin/sh

.PHONY: help install dev preview test test-unit test-unit-watch test-unit-cov test-e2e test-e2e-ui test-e2e-debug playwright-install clean clean-reports ci

help: ## Lista os comandos disponiveis
	@awk 'BEGIN {FS = ":.*##"; printf "Comandos disponiveis:\n"} /^[a-zA-Z0-9_-]+:.*##/ {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Instala as dependencias do projeto
	npm install

dev: ## Inicia o servidor local do Vite
	npm run dev

preview: ## Serve uma build local para conferencia
	npx vite preview

test: ## Roda testes unitarios e E2E
	npm test

test-unit: ## Roda os testes unitarios uma vez
	npm run test:unit

test-unit-watch: ## Roda os testes unitarios em modo observacao
	npm run test:unit:watch

test-unit-cov: ## Roda testes unitarios com cobertura
	npm run test:unit:cov

test-e2e: ## Roda os testes E2E com Playwright
	npm run test:e2e

test-e2e-ui: ## Abre a interface do Playwright
	npm run test:e2e:ui

test-e2e-debug: ## Roda Playwright em modo debug
	npm run test:e2e:debug

playwright-install: ## Instala os navegadores usados pelo Playwright
	npx playwright install

ci: ## Simula a checagem principal do CI localmente
	npm ci
	npm run test:unit:cov
	npm run test:e2e

clean: clean-reports ## Remove artefatos locais gerados por testes/builds
	rm -rf dist

clean-reports: ## Remove relatorios e resultados de teste
	rm -rf coverage test-results playwright-report