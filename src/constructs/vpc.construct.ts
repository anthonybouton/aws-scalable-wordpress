import { Tags } from "aws-cdk-lib";
import { SubnetType, Vpc } from "aws-cdk-lib/lib/aws-ec2";
import { Construct } from "constructs";

export class VpcConstruct extends Construct {

    public vpc: Vpc;
    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.createVpc();
        this.applySubnetTags();
    }


    private createVpc() {
        this.vpc = new Vpc(this, 'VPC', {
            enableDnsSupport: true,
            enableDnsHostnames: true,
            maxAzs: 2,
            cidr: '100.0.0.0/16',
            subnetConfiguration: [{
                cidrMask: 24,
                name: 'public-subnet',
                subnetType: SubnetType.PUBLIC
            },
            {
                cidrMask: 24,
                name: 'private-subnet-application',
                subnetType: SubnetType.PRIVATE_WITH_NAT
            },
            {
                cidrMask: 28,
                name: 'private-subnet-database',
                subnetType: SubnetType.PRIVATE_ISOLATED
            }
            ]
        });
        Tags.of(this.vpc).add('Name', 'WordPress VPC');
    }

    private applySubnetTags(): void {
        for (let index = 0; index < this.vpc.publicSubnets.length; index++) {
            const element = this.vpc.publicSubnets[index];
            Tags.of(element).add('Name', `WordPress Public Subnet ${index + 1}`);
        }
        for (let index = 0; index < this.vpc.privateSubnets.length; index++) {
            const element = this.vpc.privateSubnets[index];
            Tags.of(element).add('Name', `WordPress Private Application Subnet ${index + 1}`);
        }
        for (let index = 0; index < this.vpc.isolatedSubnets.length; index++) {
            const element = this.vpc.isolatedSubnets[index];
            Tags.of(element).add('Name', `WordPress Private RDS Subnet ${index + 1}`);
        }
    }
}