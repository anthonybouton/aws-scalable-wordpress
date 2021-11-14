import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { ApplicationAutoScalingGroupConstruct } from "../constructs/application-autoscaling-group.construct";
import { VpcConstruct } from "../constructs/vpc.construct";

export class ScalableWordPressStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);


    // creates the VPC and the subnets
    var vpcConstruct = new VpcConstruct(this, 'Vpc');
    var applicationLoadBalancerAutoScalingGroup = new ApplicationAutoScalingGroupConstruct(this, 'ApplicationAutoScaling', {
      vpc: vpcConstruct.vpc
    });
  }
}
