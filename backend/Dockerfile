FROM node:latest
WORKDIR /app
RUN apt-get update && apt-get install -y ffmpeg
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm run generate
# RUN npm run look
# RUN npm run migrate can't migrate if postgres isnt running
EXPOSE 5000
# CMD ["npm", "start"]
CMD ["npm", "run", "prod"]