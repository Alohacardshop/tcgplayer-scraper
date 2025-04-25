# Dockerfile

FROM mcr.microsoft.com/playwright:v1.43.1-jammy

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 8080

CMD ["npm", "start"]
