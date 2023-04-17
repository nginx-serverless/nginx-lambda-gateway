start:
	docker-compose up -d

start-01:
	docker-compose -f examples/01-all-lambda-function-arns/docker-compose.yml up -d

start-02:
	docker-compose -f examples/02-one-lambda-function-arn/docker-compose.yml up -d

start-03:
	docker-compose -f examples/03-one-lambda-function-url/docker-compose.yml up -d

start-04:
	docker-compose -f examples/04-lambda-function-arn-url/docker-compose.yml up -d

ps:
	docker ps --format "table {{.ID}}\t{{.Image}}\t{{.Ports}}\t{{.Names}}"

watch:
	watch 'docker ps --format "table {{.ID}}\t{{.Image}}\t{{.Ports}}\t{{.Names}}"'

down:
	docker-compose down

down-01:
	docker-compose -f examples/01-all-lambda-function-arns/docker-compose.yml down

down-02:
	docker-compose -f examples/02-one-lambda-function-arn/docker-compose.yml down

down-03:
	docker-compose -f examples/03-one-lambda-function-url/docker-compose.yml down

down-04:
	docker-compose -f examples/04-lambda-function-arn-url/docker-compose.yml down

clean: 
	docker kill $$(docker ps -q) 2> /dev/null || true
	docker system prune -a
	docker volume rm $(docker volume ls -qf dangling=true)
