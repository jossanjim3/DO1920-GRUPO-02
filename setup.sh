# Create network
docker network create service-tier

# Start reverse proxy
docker run -d -p 80:80 --name nginx-proxy -v /var/run/docker.sock:/tmp/docker.sock:ro jwilder/nginx-proxy
docker network connect service-tier nginx-proxy
docker volume create --name=logsvol