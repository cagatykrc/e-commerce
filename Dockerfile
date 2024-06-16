# you can find your node version with: node --version
FROM node:slim
# Create app directory
WORKDIR /dergi-sitesi

# Install app dependencies
COPY package*.json ./

# Install dependecies
RUN npm install --production

# Bundle app
COPY . .

# Define your port
EXPOSE 3000

# Tell Docker how to run your app
CMD [ "node", "app.js" ]
