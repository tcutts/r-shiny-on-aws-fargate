import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { ShinyService, ShinyTaskDefinition } from "./shiny-service";

export class RShinyOnAwsStack extends cdk.Stack {
  private createShinyTask(id: string, path: string): ecs.FargateTaskDefinition {
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      `RShinyTask-${id}`
    );
    taskDefinition.addContainer("RShinyContainer", {
      image: ecs.ContainerImage.fromAsset(path),
      portMappings: [{ containerPort: 3838 }],
    });
    return taskDefinition;
  }

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "RShinyVpc", {
      maxAzs: 3,
      natGateways: 1,
    });

    const cluster = new ecs.Cluster(this, "RShinyCluster", { vpc });

    // Create multiple task definitions
    const taskDefinitions: ShinyTaskDefinition[] = [
      {
        taskDefinition: this.createShinyTask("App1", "containers/shinyapp1"),
        pathPattern: "/app1/*",
        priority: 10,
      },
      // Example of adding a second app
      {
        taskDefinition: this.createShinyTask("App2", "containers/shinyapp2"),
        pathPattern: "/app2/*",
        priority: 20,
      },
    ];

    const accessCIDR = new cdk.CfnParameter(this, "AccessCIDR", {
      type: "String",
      description: "The CIDR block to allow access from",
      default: "0.0.0.0/0",
      allowedPattern: "((\\d{1,3})\\.){3}\\d{1,3}/\\d{1,2}",
    });

    new ShinyService(this, "RShinyService", {
      vpc,
      cluster,
      taskDefinitions,
      accessCIDR,
    });
  }
}
