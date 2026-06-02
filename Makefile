.PHONY: setup prod dev stop logs backup restore update status clean

setup:
	@chmod +x scripts/*.sh
	@./scripts/setup.sh

prod:
	@chmod +x scripts/*.sh
	@./scripts/select-caddyfile.sh
	@./scripts/start-prod.sh

tunnel:
	@chmod +x scripts/*.sh
	@./scripts/setup-tunnel.sh

tunnel-logs:
	@docker compose -f docker-compose.prod.yml logs -f cloudflared

dev:
	@docker compose -f docker-compose.dev.yml up --build

stop:
	@./scripts/stop-prod.sh

stop-dev:
	@docker compose -f docker-compose.dev.yml down

logs:
	@docker compose -f docker-compose.prod.yml logs -f --tail=100

logs-backend:
	@docker compose -f docker-compose.prod.yml logs -f backend

maddy-setup:
	@chmod +x scripts/setup-maddy-email.sh scripts/generate-maddy-config.sh
	@./scripts/setup-maddy-email.sh

maddy-config:
	@chmod +x scripts/generate-maddy-config.sh
	@./scripts/generate-maddy-config.sh

backup:
	@chmod +x scripts/backup-db.sh
	@./scripts/backup-db.sh

restore:
	@chmod +x scripts/restore-db.sh
	@./scripts/restore-db.sh $(FILE)

update:
	@chmod +x scripts/update.sh
	@./scripts/update.sh

status:
	@docker compose -f docker-compose.prod.yml ps

health:
	@chmod +x scripts/healthcheck.sh
	@./scripts/healthcheck.sh

health-lan:
	@chmod +x scripts/healthcheck.sh
	@./scripts/healthcheck.sh http://192.168.18.142

health-domain:
	@chmod +x scripts/healthcheck.sh
	@./scripts/healthcheck.sh https://mygymcode.com

caddyfile:
	@chmod +x scripts/select-caddyfile.sh
	@./scripts/select-caddyfile.sh

test-ports:
	@chmod +x scripts/test-external-access.sh
	@./scripts/test-external-access.sh

clean:
	@docker compose -f docker-compose.prod.yml down -v
	@echo "⚠️  Volumes removidos (dados do banco apagados)"
