# R Shiny Apps on Fargate

This stack demonstrates using CDK to deploy an R Shiny app behind an autoscaling application load balancer.

The approach is slightly naive, in that a separate loadbalancer is created for the single app.  This is not particularly cost-effective, and in reality you would place several apps behind a single application load balancer.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
