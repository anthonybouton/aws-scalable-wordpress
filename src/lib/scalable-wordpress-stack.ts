import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { ApplicationAutoScalingGroupConstruct } from "../constructs/application-auto-scaling-group.construct";
import { ApplicationFileStorageConstruct } from "../constructs/application-file-storage.construct";
import { ApplicationLoadBalancerConstruct } from "../constructs/application-load-balancer.construct";
import { VpcConstruct } from "../constructs/vpc.construct";

export class ScalableWordPressStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);


    // creates the VPC and the subnets
    var vpcConstruct = new VpcConstruct(this, 'Vpc');
    var applicationLoadBalancerConstruct = new ApplicationLoadBalancerConstruct(this, 'ApplicationLoadBalancer', {
      vpc: vpcConstruct.vpc
    });
    var autoScalingGroupConstruct = new ApplicationAutoScalingGroupConstruct(this, 'ApplicationAutoScalingGroup', {
      loadBalancerSecurityGroup: applicationLoadBalancerConstruct.loadBalancerSecurityGroup,
      targetGroupArn: applicationLoadBalancerConstruct.targetGroup.targetGroupArn,
      vpc: vpcConstruct.vpc
    });
    var fileSystemConstruct = new ApplicationFileStorageConstruct(this, 'ApplicationFileStorage', {
      applicationSecurityGroup: autoScalingGroupConstruct.applicationSecurityGroup,
      vpc: vpcConstruct.vpc,
      autoScalingGroup: autoScalingGroupConstruct.autoscalingGroup
    });
  }
}
