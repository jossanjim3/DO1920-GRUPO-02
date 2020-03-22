BASE_SITE=do1920.com

#development
export NODE_ENV=development
export PORT=8001
export DBPORT=27017
export VIRTUAL_HOST=${NODE_ENV}.${BASE_SITE}
export MONGO_USER=userMongoExplorer
export MONGO_PWD=userMongoExplorerPass
docker-compose -p ${VIRTUAL_HOST} up -d 

#production
export NODE_ENV=production
export PORT=8003
export DBPORT=27018
export VIRTUAL_HOST=${BASE_SITE}
export MONGO_USER=userMongoExplorer
export MONGO_PWD=userMongoExplorerPass
docker-compose -p ${VIRTUAL_HOST} up -d 