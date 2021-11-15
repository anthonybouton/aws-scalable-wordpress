import { aws_autoscaling, Tags } from "aws-cdk-lib";
import { CfnAutoScalingGroup } from "aws-cdk-lib/lib/aws-autoscaling";
import { InstanceClass, InstanceSize, InstanceType, LaunchTemplate, MachineImage, Port, SecurityGroup, Vpc } from "aws-cdk-lib/lib/aws-ec2";;
import { Construct } from "constructs";

export class ApplicationAutoScalingGroupConstructParameters {
    vpc: Vpc;
    loadBalancerSecurityGroup: SecurityGroup;
    targetGroupArn: string;
}
export class ApplicationAutoScalingGroupConstruct extends Construct {

    public applicationSecurityGroup: SecurityGroup;
    public autoscalingGroup: CfnAutoScalingGroup;

    constructor(scope: Construct, id: string, private parameters: ApplicationAutoScalingGroupConstructParameters) {
        super(scope, id);

        this.createSecurityGroups();
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

       this.autoscalingGroup = new CfnAutoScalingGroup(this, 'AutoscalingGroup', {
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
            targetGroupArns: [this.parameters.targetGroupArn],
        });
    }

    private createSecurityGroups(): void {
        this.applicationSecurityGroup = new SecurityGroup(this, 'ApplicationSecurityGroup', {
            vpc: this.parameters.vpc,
            allowAllOutbound: false,
            description: 'Allows inbound from load balancer'
        });
        this.applicationSecurityGroup.addIngressRule(this.parameters.loadBalancerSecurityGroup, Port.tcp(80), 'Allow HTTP from Loadbalancer on port 80');
        Tags.of(this.applicationSecurityGroup).add('Name', 'WordPress Application Security Group');

        this.parameters.loadBalancerSecurityGroup.addEgressRule(this.applicationSecurityGroup, Port.tcp(80), 'Allow outbound to the application instances');

    }
}