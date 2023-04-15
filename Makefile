start-01:
	docker-compose -f examples/01-proxy-to-all-lambda-functions/docker-compose.yml up -d

start-02:
	docker-compose -f examples/02-proxy-to-each-lambda-function/docker-compose.yml up -d

ps:
	docker ps --format "table {{.ID}}\t{{.Image}}\t{{.Ports}}\t{{.Names}}"

watch:
	watch 'docker ps --format "table {{.ID}}\t{{.Image}}\t{{.Ports}}\t{{.Names}}"'

down-01:
	docker-compose -f examples/01-proxy-to-all-lambda-functions/docker-compose.yml down

down-02:
	docker-compose -f examples/02-proxy-to-each-lambda-function/docker-compose.yml down

clean: 
	docker kill $$(docker ps -q) 2> /dev/null || true
	docker system prune -a
	docker volume rm $(docker volume ls -qf dangling=true)
