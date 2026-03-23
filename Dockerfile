FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install --loglevel=error
COPY . .
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN node ./node_modules/vite/bin/vite.js build

FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
