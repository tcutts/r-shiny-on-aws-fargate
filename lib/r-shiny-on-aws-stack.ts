import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class RShinyOnAwsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'RShinyVpc', {
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
      openListener: false,
    });

    const accessCIDR = new cdk.CfnParameter(this, 'AccessCIDR', {
      type: 'String',
      description: 'The CIDR block to allow access from',
      default: '0.0.0.0/0',
      allowedPattern: '((\\d{1,3})\\.){3}\\d{1,3}/\\d{1,2}',
    });

    service.loadBalancer.listeners.forEach(l => {
      l.connections.allowDefaultPortFrom(ec2.Peer.ipv4(accessCIDR.valueAsString));
    });

    const scaling = service.service.autoScaleTaskCount({ maxCapacity: 10, minCapacity: 1 });
    scaling.scaleOnCpuUtilization('autoscale_cpu', {
      targetUtilizationPercent: 50,
      scaleInCooldown: cdk.Duration.minutes(2),
      scaleOutCooldown: cdk.Duration.seconds(30)
    });
  }
}
