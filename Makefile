migrate:
	@for file in $$(ls apps/api/migrations/*.sql | sort); do \
		echo "Applying $$file"; \
		cat $$file | docker exec -i sentinel-postgres psql -U sentinel -d sentinel; \
	done


migrate-create:
	@read -p "Migration name: " name; \
	ts=$$(date +%Y%m%d%H%M%S); \
	touch apps/api/migrations/$$ts_$$name.sql; \
	echo "Created migration $$ts_$$name.sql"
