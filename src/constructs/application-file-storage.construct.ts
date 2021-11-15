import { aws_cloudwatch, aws_events_targets, Tags } from "aws-cdk-lib";
import { CfnAutoScalingGroup } from "aws-cdk-lib/lib/aws-autoscaling";
import { Port, SecurityGroup, Vpc } from "aws-cdk-lib/lib/aws-ec2";
import { FileSystem, PerformanceMode, ThroughputMode } from "aws-cdk-lib/lib/aws-efs";
import { Rule } from "aws-cdk-lib/lib/aws-events";
import { Construct } from "constructs";

export class ApplicationFileStorageConstructParameters {
    vpc: Vpc;
    applicationSecurityGroup: SecurityGroup;
    autoScalingGroup: CfnAutoScalingGroup;
}
export class ApplicationFileStorageConstruct extends Construct {

    public fileSystemSecurityGroup: SecurityGroup;

    constructor(scope: Construct, id: string, private parameters: ApplicationFileStorageConstructParameters) {
        super(scope, id);

        this.createSecurityGroups();
        this.createFileSystem();
      //  this.createLifeCycleEventToAttachEfs();
    }
    private createLifeCycleEventToAttachEfs(): void {
        var cloudWatchEvent = new Rule(this, 'AutoscalingLaunchRule', {
            description: `Fired when an instance is launching in the autoscaling group ${this.parameters.autoScalingGroup.autoScalingGroupName}`,
            enabled: true,
            eventPattern: {
                source: ['aws.autoscaling'],
                detailType: ['EC2 Instance-launch Lifecycle Action'],
                detail: {
                    'AutoScalingGroupName': [this.parameters.autoScalingGroup.autoScalingGroupName]
                }
            }
        });
    }
    private createFileSystem(): void {
        var fileSystem = new FileSystem(this, 'WordPressFileSystem', {
            encrypted: true,
            throughputMode: ThroughputMode.BURSTING,
            vpc: this.parameters.vpc,
            performanceMode: PerformanceMode.GENERAL_PURPOSE,
            enableAutomaticBackups: true,
            vpcSubnets: {
                availabilityZones: this.parameters.vpc.availabilityZones,
                subnets: this.parameters.vpc.privateSubnets
            }
        });
        Tags.of(fileSystem).add('Name', 'WordPress FileSystem');
    }

    private createSecurityGroups(): void {
        this.fileSystemSecurityGroup = new SecurityGroup(this, 'FileSystemSecurityGroup', {
            vpc: this.parameters.vpc,
            allowAllOutbound: false,
            description: 'Allows inbound from application servers'
        });

        this.fileSystemSecurityGroup.addIngressRule(this.parameters.applicationSecurityGroup, Port.tcp(2049), 'Allow traffic from application servers');
        Tags.of(this.fileSystemSecurityGroup).add('Name', 'WordPress FileSystem Security Group');

        this.parameters.applicationSecurityGroup.addEgressRule(this.fileSystemSecurityGroup, Port.tcp(2049), 'Allow outbound to the file system');
    }
}