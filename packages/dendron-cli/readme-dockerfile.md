To use the docker image and generate a static site directory:

```
docker run -v ${vaultdir}:/workspace sxltd/dendron-cli:latest publish init --wsRoot /workspace
docker run -v ${vaultdir}:/workspace sxltd/dendron-cli:latest publish export --wsRoot /workspace
```

if you wish, you can then copy the output files to an `nginx` image for docker-based static hosting
```
FROM nginx:alpine
COPY .next/out /usr/share/nginx/html
```