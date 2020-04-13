BASE_SITE=ec2-54-234-164-248.compute-1.amazonaws.com
echo ${BASE_SITE}

#development
export NODE_ENV=development
export PORT=8001
export DBPORT=27020
export VIRTUAL_HOST=${NODE_ENV}.${BASE_SITE}
export MONGO_USER=userMongoExplorer
export MONGO_PWD=userMongoExplorerPass
docker-compose -p ${VIRTUAL_HOST} up -d --build

#production
export NODE_ENV=production
export PORT=8003
export DBPORT=27025
export VIRTUAL_HOST=${BASE_SITE}
export MONGO_USER=userMongoExplorer
export MONGO_PWD=userMongoExplorerPass
docker-compose -p ${VIRTUAL_HOST} up -d 
