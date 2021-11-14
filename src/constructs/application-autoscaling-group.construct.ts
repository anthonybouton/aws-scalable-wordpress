import { aws_autoscaling, Duration, Tags } from "aws-cdk-lib";
import { CfnAutoScalingGroup } from "aws-cdk-lib/lib/aws-autoscaling";
import { InstanceClass, InstanceSize, InstanceType, LaunchTemplate, MachineImage, Peer, Port, SecurityGroup, Vpc } from "aws-cdk-lib/lib/aws-ec2";;
import { ApplicationListener, ApplicationLoadBalancer, ApplicationProtocol, ApplicationProtocolVersion, ApplicationTargetGroup, CfnTargetGroup, IpAddressType, ListenerAction, Protocol, TargetType } from "aws-cdk-lib/lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";

export class ApplicationAutoScalingGroupConstructParameters {
    vpc: Vpc;
}
export class ApplicationAutoScalingGroupConstruct extends Construct {

    public applicationSecurityGroup: SecurityGroup;
    public loadBalancerSecurityGroup: SecurityGroup;
    public loadBalancer: ApplicationLoadBalancer;
    public targetGroup: ApplicationTargetGroup;
    constructor(scope: Construct, id: string, private parameters: ApplicationAutoScalingGroupConstructParameters) {
        super(scope, id);

        this.createSecurityGroups();

        this.createLoadBalancer();
        this.createTargetGroups();
        this.createAutoScalingGroup();
    }
    private createAutoScalingGroup() {
        var launchTemplate = new LaunchTemplate(this, 'AutoscalingLaunchTemplate', {
            instanceType: InstanceType.of(InstanceClass.T3A, InstanceSize.NANO),
            machineImage: MachineImage.latestAmazonLinux(),
            securityGroup: this.applicationSecurityGroup,
            detailedMonitoring: true,
            blockDevices: [{
                deviceName: '/dev/xvda',
                mappingEnabled: true,
                volume: aws_autoscaling.BlockDeviceVolume.ebs(8, {
                    encrypted: true,
                    volumeType: aws_autoscaling.EbsDeviceVolumeType.GP3,
                    deleteOnTermination: true
                })
            }]
        });


        var scalingGroup = new CfnAutoScalingGroup(this, 'AutoscalingGroup', {
            vpcZoneIdentifier: [...this.parameters.vpc.privateSubnets.map(x => x.subnetId)],
            minSize: '1',
            maxSize: '4',
            desiredCapacity: '2',
            cooldown: '60',
            capacityRebalance: true,
            launchTemplate: {
                launchTemplateId: launchTemplate.launchTemplateId,
                version: launchTemplate.versionNumber
            },
            availabilityZones: this.parameters.vpc.availabilityZones,
            tags: [{
                key: 'Name',
                value: 'WordPress Application Instance',
                propagateAtLaunch: true
            }],
            healthCheckGracePeriod: 10,
            healthCheckType: 'ELB',
            targetGroupArns: [this.targetGroup.targetGroupArn],
        });
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
            protocolVersion: ApplicationProtocolVersion.HTTP2,
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
        }).addTargetGroups('AutoScalingGroup', {
            priority: 1,
            targetGroups: [this.targetGroup]
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

        this.applicationSecurityGroup = new SecurityGroup(this, 'ApplicationSecurityGroup', {
            vpc: this.parameters.vpc,
            allowAllOutbound: false,
            description: 'Allows inbound from load balancer'
        });
        this.applicationSecurityGroup.addIngressRule(this.loadBalancerSecurityGroup, Port.tcp(80), 'Allow HTTP from Loadbalancer on port 80');
        Tags.of(this.applicationSecurityGroup).add('Name', 'WordPress Application Security Group');

        this.loadBalancerSecurityGroup.addEgressRule(this.applicationSecurityGroup, Port.tcp(80), 'Allow outbound to the application instances');

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