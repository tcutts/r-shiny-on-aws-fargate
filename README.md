# R Shiny Apps on AWS Fargate

This project demonstrates how to deploy multiple R Shiny applications on AWS Fargate using the AWS CDK. The infrastructure includes:

- Multiple containerized R Shiny applications
- AWS Fargate for serverless container management
- Application Load Balancer with path-based routing
- Auto-scaling based on CPU utilization
- Network infrastructure with a VPC and security groups

## Architecture Overview

The stack creates a VPC with public and private subnets, an ECS cluster, and deploys multiple R Shiny applications as Fargate services. An Application Load Balancer routes traffic to the appropriate application based on URL path patterns:

- `/app1/*` routes to the first Shiny application
- `/app2/*` routes to the second Shiny application

Each application can scale independently based on CPU utilization.

## Adding New Shiny Applications

To add a new Shiny application to the stack:

1. **Create a new container directory**:
   ```
   mkdir -p containers/shinyapp3
   ```

2. **Add your Shiny application files**:
   - Create a `Dockerfile` in the new directory
   - Add your R scripts (e.g., `app.R`)
   - Add a `shiny-server.conf` if needed

3. **Update the stack definition** in `lib/r-shiny-on-aws-stack.ts`:
   ```typescript
   // Add to the taskDefinitions array
   const taskDefinitions: ShinyTaskDefinition[] = [
     // Existing apps...
     {
       taskDefinition: this.createShinyTask("App3", "containers/shinyapp3"),
       pathPattern: "/app3/*",
       priority: 30, // Use a unique priority number
     },
   ];
   ```

4. **Deploy the updated stack**:
   ```
   cdk deploy
   ```

## Container Structure

Each Shiny application container should include:

- A `Dockerfile` that installs R, Shiny Server, and any required R packages
- Your Shiny application code (R scripts)
- A `shiny-server.conf` file to configure Shiny Server

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template