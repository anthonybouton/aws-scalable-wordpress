import { Duration, Tags } from "aws-cdk-lib";
import { Peer, Port, SecurityGroup, Vpc } from "aws-cdk-lib/lib/aws-ec2";;
import { ApplicationListener, ApplicationLoadBalancer, ApplicationProtocol, ApplicationProtocolVersion, ApplicationTargetGroup, IpAddressType, Protocol, TargetType } from "aws-cdk-lib/lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";

export class ApplicationLoadBalancerConstructParameters {
    vpc: Vpc;
}
export class ApplicationLoadBalancerConstruct extends Construct {

    public loadBalancerSecurityGroup: SecurityGroup;
    public loadBalancer: ApplicationLoadBalancer;
    public targetGroup: ApplicationTargetGroup;

    constructor(scope: Construct, id: string, private parameters: ApplicationLoadBalancerConstructParameters) {
        super(scope, id);

        this.createSecurityGroups();
        this.createLoadBalancer();
        this.createTargetGroups();
    }

    private createTargetGroups(): void {
        this.targetGroup = new ApplicationTargetGroup(this, 'AutoScalingTargetGroup', {
            healthCheck: {
                enabled: true,
                interval: Duration.seconds(30),
                healthyHttpCodes: '200',
                port: '80',
                protocol: Protocol.HTTP,
                timeout: Duration.seconds(10),
                path: '/',
                healthyThresholdCount: 2,
                unhealthyThresholdCount: 3
            },
            vpc: this.parameters.vpc,
            targetType: TargetType.INSTANCE,
            protocolVersion: ApplicationProtocolVersion.HTTP1,
            protocol: ApplicationProtocol.HTTP,
            port: 80,
            deregistrationDelay: Duration.seconds(30),
            stickinessCookieDuration: Duration.days(1)
        });
        Tags.of(this.targetGroup).add('Name', 'WordPress Target Group');

        new ApplicationListener(this, 'DefaultListener', {
            loadBalancer: this.loadBalancer,
            port: 80,
            protocol: ApplicationProtocol.HTTP,
            defaultTargetGroups: [this.targetGroup]
        });
    }
    private createSecurityGroups(): void {
        this.loadBalancerSecurityGroup = new SecurityGroup(this, 'ApplicationLoadBalancerSecurityGroup', {
            vpc: this.parameters.vpc,
            allowAllOutbound: false,
            description: 'Allows inbound from web on port 80'
        });
        this.loadBalancerSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80), 'Allow HTTP on Port 80');
        Tags.of(this.loadBalancerSecurityGroup).add('Name', 'WordPress Loadbalancer Security Group');
    }
    private createLoadBalancer(): void {
        this.loadBalancer = new ApplicationLoadBalancer(this, 'ApplicationLoadBalancer', {
            vpc: this.parameters.vpc,
            http2Enabled: true,
            ipAddressType: IpAddressType.IPV4,
            securityGroup: this.loadBalancerSecurityGroup,
            vpcSubnets: {
                onePerAz: false,
                availabilityZones: this.parameters.vpc.availabilityZones,
                subnets: this.parameters.vpc.publicSubnets,
            },
            internetFacing: true
        });
        Tags.of(this.loadBalancer).add('Name', 'WordPress Application Loadbalancer')
    }
}