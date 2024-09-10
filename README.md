# Auto Deploy

This project is a backend application to automate React project builds from GitHub URLs using ECS build servers, deploying static files to S3 and generating custom URLs with a reverse proxy for efficient serving.

## Components

### 1. API Server

The API server is the central component that manages requests, coordinates builds, and handles deployments.

**Key responsibilities:**

- Receive and validate GitHub URLs
- Trigger build processes on ECS
- Manage S3 deployments
- Generate and store custom URLs
- Communicate with the reverse proxy

**Setup steps:**

1. Set up an Express.js server for handling HTTP requests
2. Configure AWS SDK (ECS client) for interacting with ECS and create a task definition that will run in the specified cluster [(guide)](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/get-set-up-for-amazon-ecs.html)
3. Set up Redis for real-time logging and communication
4. Rename `.env_EXAMPLE` to `.env` and update with your credentials
5. Run the API server by running `npm run dev` the API server runs on PORT `3000`

### 2. Build Server (ECS)

The build server runs on Amazon ECS (Elastic Container Service) and is responsible for cloning repositories, building React projects, and preparing files for deployment.

**Key responsibilities:**

- Clone GitHub repositories
- Install dependencies
- Build React projects
- Optimize and package static files
- Upload built files to S3

**Setup steps:**

1. Setup a ECR repository on AWS console [(guide)](https://docs.aws.amazon.com/AmazonECR/latest/userguide/repository-create.html) and follow the steps mentioned in the AWS console to push the Docker image to the repository.
2. Setup a S3 bucket to store the code artefacts [(guide)](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html)
3. Rename .env_EXAMPLE with .env and update with your credentials.
4. The image URI of the docker image pushed to the repository in step 1 will be used while creating a task definition in the ECS cluste. (Task Definition guided mentioned in the API Server)

### 3. S3 Reverse Proxy Server

The S3 reverse proxy server efficiently serves static files from S3 buckets using custom URLs.

**Key responsibilities:**

- Resolve custom URLs to appropriate S3 bucket paths
- Reverse proxy static files from S3

**Setup steps:**

1. Rename .env_EXAMPLE with .env and update with your credentials.
2. Run the reverse proxy server by running the command `node index.js` the reverse proxy server runs on PORT `8000`

This setup provides a scalable and efficient solution for automating React project builds and deployments. The API server manages the process, ECS handles builds, S3 stores the static files, and the reverse proxy serves them quickly using custom URLs.
