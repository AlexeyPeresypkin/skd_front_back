FROM node:lts-alpine as build-stage1
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV VITE_BASE_PORT 8002
RUN npm run build

FROM nginx:stable-alpine as production-stage
COPY --from=build-stage1 /app/dist /app
CMD ["nginx", "-g", "daemon off;"]
