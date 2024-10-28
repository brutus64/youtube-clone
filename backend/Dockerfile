FROM node:latest
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run generate
# RUN npm run migrate can't migrate if postgres isnt running
EXPOSE 5000
CMD ["npm", "start"]