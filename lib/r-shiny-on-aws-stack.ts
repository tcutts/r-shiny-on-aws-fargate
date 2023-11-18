import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';

export class RShinyOnAwsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.templateOptions.description = 'R Shiny on AWS';

    const vpc = new cdk.aws_ec2.Vpc(this, 'RShinyVpc', {
      maxAzs: 3,
      natGateways: 1,
    });

    const cluster = new ecs.Cluster(this, 'RShinyCluster', { vpc });

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'RShinyTask');
    taskDefinition.addContainer('RShinyContainer', {
      image: ecs.ContainerImage.fromAsset('containers/shinyapp'),
      portMappings: [{ containerPort: 3838 }]
    });

    const service = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'RShinyService', {
      cluster,
      taskDefinition,
      publicLoadBalancer: true,
    });

    const scaling = service.service.autoScaleTaskCount({ maxCapacity: 10, minCapacity: 1 });
    scaling.scaleOnCpuUtilization('autoscale_cpu', {
      targetUtilizationPercent: 50,
      scaleInCooldown: cdk.Duration.minutes(2),
      scaleOutCooldown: cdk.Duration.seconds(30)
    });
  }
}
