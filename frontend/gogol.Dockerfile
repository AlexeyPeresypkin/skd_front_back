FROM node:lts-alpine as build-stage1
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV VITE_BASE_PORT 8002
RUN npm run build_atol

FROM node:lts-alpine as build-stage2
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV VITE_BASE_PORT 8002
RUN npm run build

FROM nginx:stable-alpine as production-stage
COPY --from=build-stage1 /app/dist /app
COPY --from=build-stage2 /app/dist /app1
CMD ["nginx", "-g", "daemon off;"]
