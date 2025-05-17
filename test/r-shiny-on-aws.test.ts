import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as RShinyOnAws from '../lib/r-shiny-on-aws-stack';

describe('RShinyOnAwsStack', () => {
  let app: cdk.App;
  let stack: RShinyOnAws.RShinyOnAwsStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new RShinyOnAws.RShinyOnAwsStack(app, 'MyTestStack');
    template = Template.fromStack(stack);
  });

  test('VPC Created', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('ECS Cluster Created', () => {
    template.resourceCountIs('AWS::ECS::Cluster', 1);
  });

  test('Application Load Balancer Created', () => {
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Scheme: 'internet-facing',
    });
  });

  test('Fargate Task Definitions Created', () => {
    template.resourceCountIs('AWS::ECS::TaskDefinition', 2);
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      RequiresCompatibilities: ['FARGATE'],
      NetworkMode: 'awsvpc',
    });
  });

  test('Fargate Services Created', () => {
    template.resourceCountIs('AWS::ECS::Service', 2);
    template.hasResourceProperties('AWS::ECS::Service', {
      LaunchType: 'FARGATE',
    });
  });

  test('Listener Rules Created', () => {
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::ListenerRule', 2);
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule', {
      Conditions: [
        {
          Field: 'path-pattern',
          PathPatternConfig: {
            Values: ['/app1/*'],
          },
        },
      ],
    });
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule', {
      Conditions: [
        {
          Field: 'path-pattern',
          PathPatternConfig: {
            Values: ['/app2/*'],
          },
        },
      ],
    });
  });

  test('Auto Scaling Configuration Created', () => {
    template.resourceCountIs('AWS::ApplicationAutoScaling::ScalableTarget', 2);
    template.resourceCountIs('AWS::ApplicationAutoScaling::ScalingPolicy', 2);
  });

  test('Access CIDR Parameter Created', () => {
    template.hasParameter('AccessCIDR', {
      Type: 'String',
      Default: '0.0.0.0/0',
    });
  });
});