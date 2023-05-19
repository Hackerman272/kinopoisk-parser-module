сначала надо сделать
npm i

затем (с точкой)
docker build -t kinopoisk-parser-module:0.1 .

потом docker-compose up

и потом запустить в него запрос с id фильма с кинопоиска любым и количеством фильмов на парсинг

curl --location 'http://localhost:5000/parser/parse' \
--header 'Content-Type: application/json' \
--header 'secret: 39f9i39i9d3j9fi9i9e3nvinvjv300dl3l03_3' \
--data '{
"entitiesAmount": 5,
"startFilmId": 276598,
"requestsDelay": 5000
}'
