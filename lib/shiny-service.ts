import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elasticloadbalancingv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";

/**
 * Represents a Shiny application task definition with routing configuration.
 */
export interface ShinyTaskDefinition {
  /**
   * The Fargate task definition for the Shiny application.
   */
  taskDefinition: ecs.FargateTaskDefinition;

  /**
   * The URL path pattern to route to this Shiny application (e.g., "/app1/*").
   */
  pathPattern: string;

  /**
   * The priority of this path pattern in the ALB listener rules.
   * Higher numbers indicate higher priority.
   */
  priority: number;
}

/**
 * Properties for configuring the ShinyService construct.
 */
export interface ShinyServiceProps {
  /**
   * The VPC where the Shiny services will be deployed.
   */
  vpc: ec2.Vpc;

  /**
   * The ECS cluster where the Fargate tasks will run.
   */
  cluster: ecs.Cluster;

  /**
   * List of Shiny application task definitions to deploy.
   */
  taskDefinitions: ShinyTaskDefinition[];

  /**
   * CIDR range that is allowed to access the load balancer.
   */
  accessCIDR: cdk.CfnParameter;
}

/**
 * A construct that deploys multiple R Shiny applications on AWS Fargate with an Application Load Balancer.
 *
 * This construct creates:
 * - An Application Load Balancer to route traffic to different Shiny applications
 * - Fargate services for each Shiny application
 * - Path-based routing rules to direct traffic to the appropriate application
 * - Auto-scaling configuration for each service based on CPU utilization
 *
 * Each Shiny application is deployed as a separate Fargate service and is accessible
 * via a unique path pattern on the load balancer.
 */
export class ShinyService extends Construct {
  /**
   * The Application Load Balancer that routes traffic to the Shiny applications.
   */
  public readonly loadBalancer: elasticloadbalancingv2.ApplicationLoadBalancer;

  /**
   * The list of Fargate services created for each Shiny application.
   */
  public readonly services: ecs.FargateService[] = [];

  /**
   * CloudFormation output containing the URL of the load balancer.
   */
  public readonly loadBalancerUrl: cdk.CfnOutput;

  /**
   * Creates a new ShinyService construct.
   *
   * @param scope The parent construct
   * @param id The construct ID
   * @param props Configuration properties for the ShinyService
   */
  constructor(scope: Construct, id: string, props: ShinyServiceProps) {
    super(scope, id);

    // Create the load balancer
    this.loadBalancer = new elasticloadbalancingv2.ApplicationLoadBalancer(
      this,
      "LoadBalancer",
      {
        vpc: props.vpc,
        internetFacing: true,
      }
    );

    // Create the listener
    const listener = this.loadBalancer.addListener("Listener", {
      port: 80,
      open: false,
    });

    // Allow access from the specified CIDR
    listener.connections.allowDefaultPortFrom(
      ec2.Peer.ipv4(props.accessCIDR.valueAsString)
    );

    // Add a default target group that returns a 404
    listener.addAction("Default", {
      action: elasticloadbalancingv2.ListenerAction.fixedResponse(404, {
        contentType: "text/plain",
        messageBody: "Application not found",
      }),
    });

    // Create a service for each task definition
    props.taskDefinitions.forEach((taskDef) => {
      // Create the Fargate service
      const service = new ecs.FargateService(
        this,
        `Service-${taskDef.pathPattern}`,
        {
          cluster: props.cluster,
          taskDefinition: taskDef.taskDefinition,
          desiredCount: 1,
          capacityProviderStrategies: [
            {
              capacityProvider: "FARGATE_SPOT",
              weight: 1,
            },
          ],
        }
      );

      // Add the service to the listener with the specified path pattern
      listener.addTargets(`Target-${taskDef.pathPattern}`, {
        port: 3838,
        protocol: elasticloadbalancingv2.ApplicationProtocol.HTTP,
        targets: [service],
        priority: taskDef.priority,
        conditions: [
          elasticloadbalancingv2.ListenerCondition.pathPatterns([
            taskDef.pathPattern,
          ]),
        ],
        healthCheck: {
          path: "/",
          interval: cdk.Duration.seconds(60),
          timeout: cdk.Duration.seconds(5),
        },
      });

      // Configure auto-scaling
      const scaling = service.autoScaleTaskCount({
        minCapacity: 1,
        maxCapacity: 5,
      });

      scaling.scaleOnCpuUtilization(`autoscale_cpu_${taskDef.pathPattern}`, {
        targetUtilizationPercent: 50,
        scaleInCooldown: cdk.Duration.minutes(2),
        scaleOutCooldown: cdk.Duration.seconds(30),
      });

      this.services.push(service);
    });

    // Create an output with the load balancer URL
    this.loadBalancerUrl = new cdk.CfnOutput(this, "LoadBalancerUrl", {
      value: `http://${this.loadBalancer.loadBalancerDnsName}/app1/`,
      description: "The URL of the load balancer",
      exportName: `${id}-LoadBalancerUrl`,
    });
  }
}
